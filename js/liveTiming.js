// RF1 — Formula 1 SignalR Live Timing Client (via f1-livetiming-api backend)
(function(root) {
  'use strict';

  const DEFAULT_LIVE_API_URL = 'https://f1-livetiming-api-z44n.onrender.com';

  class LiveTimingClient {
    constructor() {
      this.baseUrl = this.getStoredUrl();
      this.isConnected = false;
      this.lastSession = null;
      this.cache = {
        leaderboard: null,
        lastFetch: 0
      };
    }

    getStoredUrl() {
      try {
        if (typeof window !== 'undefined') {
          const urlParam = new URLSearchParams(window.location.search).get('liveApi');
          if (urlParam) {
            localStorage.setItem('f1_live_api_url', urlParam);
            return urlParam.replace(/\/$/, '');
          }
          return (localStorage.getItem('f1_live_api_url') || DEFAULT_LIVE_API_URL).replace(/\/$/, '');
        }
      } catch (e) {}
      return DEFAULT_LIVE_API_URL;
    }

    setServerUrl(url) {
      const clean = (url || DEFAULT_LIVE_API_URL).trim().replace(/\/$/, '');
      this.baseUrl = clean;
      try {
        if (typeof localStorage !== 'undefined') {
          if (clean === DEFAULT_LIVE_API_URL) {
            localStorage.removeItem('f1_live_api_url');
          } else {
            localStorage.setItem('f1_live_api_url', clean);
          }
        }
      } catch (e) {}
    }

    async getStatus() {
      try {
        const res = await fetch(`${this.baseUrl}/api/status`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        this.isConnected = Boolean(data.isConnected);
        return data;
      } catch (err) {
        this.isConnected = false;
        return { isConnected: false, error: err.message };
      }
    }

    async getLeaderboard() {
      const now = Date.now();
      // Throttle cache to 500ms
      if (this.cache.leaderboard && (now - this.cache.lastFetch < 500)) {
        return this.cache.leaderboard;
      }
      const res = await fetch(`${this.baseUrl}/api/leaderboard`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.cache.leaderboard = data;
      this.cache.lastFetch = now;
      if (data.Session) this.lastSession = data.Session;
      return data;
    }

    // Convert Live Timing leaderboard into RF1 unified format
    parseLeaderboard(data) {
      if (!data || !data.Lines) return null;
      const lines = data.Lines;
      const leaderboardOrder = data.Leaderboard || Object.keys(lines);

      const drivers = [];
      leaderboardOrder.forEach((numStr) => {
        if (numStr === '_kf' || !lines[numStr]) return;
        const line = lines[numStr];
        const num = parseInt(numStr, 10);
        const pos = line.Position ? parseInt(line.Position, 10) : drivers.length + 1;

        // Extract latest tyre stint
        let currentCompound = 'M';
        let tyreLaps = 1;
        const stintList = line.Stints ? (Array.isArray(line.Stints) ? line.Stints : Object.values(line.Stints)) : [];
        if (stintList.length > 0) {
          const lastStint = stintList[stintList.length - 1];
          if (lastStint.Compound) {
            currentCompound = lastStint.Compound.charAt(0).toUpperCase(); // S, M, H, I, W
          }
          if (lastStint.TotalLaps !== undefined) {
            tyreLaps = Math.max(0, parseInt(lastStint.TotalLaps, 10) || 0);
          }
        }

        // Calculate gap string
        let gap = 'LEADER';
        const statsDiff = (line.Stats && line.Stats[0] && line.Stats[0].TimeDiffToFastest) ? line.Stats[0].TimeDiffToFastest : '';
        const rawDiff = line.TimeDiffToFastest || statsDiff || '';
        if (pos > 1) {
          if (rawDiff) {
            gap = rawDiff.startsWith('+') ? rawDiff : `+${rawDiff}`;
          } else if (line.InPit) {
            gap = 'IN PIT';
          } else if (line.PitOut) {
            gap = 'OUT LAP';
          } else if (line.BestLapTime && line.BestLapTime.Value) {
            gap = line.BestLapTime.Value;
          } else {
            gap = 'NO TIME';
          }
        } else {
          if (line.BestLapTime && line.BestLapTime.Value) {
            gap = line.BestLapTime.Value;
          } else if (line.InPit) {
            gap = 'IN PIT';
          } else if (line.PitOut) {
            gap = 'OUT LAP';
          } else {
            gap = 'P1';
          }
        }

        // Extract Best Lap
        const bestLap = line.BestLapTime && line.BestLapTime.Value ? line.BestLapTime.Value : '';

        // Extract Sectors (S1, S2, S3) with F1 Broadcast Colors
        const sectors = [];
        const rawSectors = line.Sectors ? (Array.isArray(line.Sectors) ? line.Sectors : Object.values(line.Sectors)) : [];
        for (let i = 0; i < 3; i++) {
          const sec = rawSectors[i] || {};
          const val = sec.Value || '';
          let colorClass = 'sector-none';
          if (val) {
            if (sec.OverallFastest) {
              colorClass = 'sector-purple';
            } else if (sec.PersonalFastest) {
              colorClass = 'sector-green';
            } else {
              colorClass = 'sector-yellow';
            }
          }
          sectors.push({
            number: i + 1,
            val: val ? parseFloat(val).toFixed(1) : '--.-',
            fullVal: val,
            colorClass: colorClass
          });
        }

        const numLaps = line.NumberOfLaps !== undefined ? parseInt(line.NumberOfLaps, 10) : tyreLaps;

        drivers.push({
          number: num,
          code: line.Tla || (line.BroadcastName ? line.BroadcastName.slice(0, 3) : `D${num}`),
          name: line.FullName || line.BroadcastName || `Driver ${num}`,
          team: line.TeamName || 'Formula 1',
          color: line.TeamColour ? `#${line.TeamColour}` : '#FE5000',
          pos: pos,
          gap: gap,
          bestLap: bestLap,
          sectors: sectors,
          tire: currentCompound,
          tireAge: tyreLaps,
          laps: numLaps,
          inPit: Boolean(line.InPit),
          retired: Boolean(line.Retired)
        });
      });

      // Sort by position
      drivers.sort((a, b) => a.pos - b.pos);
      return drivers;
    }

    // Group drivers into teams for Teammate Split view
    extractTeams(drivers) {
      if (!drivers || !drivers.length) return [];
      const teamMap = new Map();
      drivers.forEach(d => {
        const teamKey = d.team || 'Unknown';
        if (!teamMap.has(teamKey)) {
          teamMap.set(teamKey, {
            name: teamKey,
            shortName: teamKey.toUpperCase(),
            color: d.color,
            drivers: []
          });
        }
        teamMap.get(teamKey).drivers.push(d);
      });
      const result = Array.from(teamMap.values()).filter(t => t.drivers.length >= 2);
      result.forEach((t, tIdx) => {
        t.drivers.forEach(d => {
          d.teamIndex = tIdx;
        });
      });
      return result;
    }

    isSessionLive(sessionData) {
      if (!sessionData) return false;
      const sess = sessionData.Session || sessionData;
      const status = (sess.SessionStatus || '').toLowerCase();
      const archive = (sess.ArchiveStatus && sess.ArchiveStatus.Status ? sess.ArchiveStatus.Status : '').toLowerCase();

      // If status is finalized or completed, cars are not running live
      if (status === 'finalised' || status === 'finished' || status === 'ended' || archive === 'complete') {
        return false;
      }

      // If status is started or active, session is live on track
      if (status === 'started' || status === 'active' || status === 'running' || status === 'green') {
        return true;
      }

      return false;
    }

    getSessionSummary(sessionData) {
      if (!sessionData) return { isLive: false, label: 'Track Inactive', desc: 'No live broadcast' };
      const sess = sessionData.Session || sessionData;
      const status = sess.SessionStatus || 'Inactive';
      const name = sess.Name || 'Session';
      const meeting = sess.Meeting ? (sess.Meeting.Name || 'Singapore GP') : 'Grand Prix';
      const isLive = this.isSessionLive(sessionData);

      let desc = '';
      if (isLive) {
        desc = `🟢 Track Green Flag • ${name} Live`;
      } else if (status.toLowerCase() === 'finalised') {
        desc = `${name} Finalised • Next Session 13:30 BST`;
      } else {
        desc = `${name} Scheduled • Starts 13:30 BST`;
      }

      return {
        isLive,
        status,
        name,
        meeting,
        desc
      };
    }

    getSessionDetails(leaderboardData, raceControlData) {
      const session = (leaderboardData && leaderboardData.Session) || this.lastSession || {};
      const sType = (session.Type || '').toUpperCase();
      const sName = (session.Name || '').toUpperCase();
      const mName = (session.Meeting?.Name || 'Grand Prix').toUpperCase();
      const shortCircuit = (session.Meeting?.Circuit?.ShortName || session.Meeting?.Location || 'F1').toUpperCase();
      const status = (session.SessionStatus || '').toUpperCase();
      const isFinalised = status === 'FINALISED' || (session.ArchiveStatus?.Status || '').toLowerCase() === 'complete';

      let part = 'RACE';
      let isRace = true;
      let friendlyName = 'Grand Prix';

      if (sName.includes('SPRINT QUALI') || sName.includes('SHOOTOUT')) {
        isRace = false;
        friendlyName = 'Sprint Quali';
        const lines = (leaderboardData && leaderboardData.Lines) || {};
        const maxStages = Math.max(0, ...Object.values(lines).map(l => (l.BestLapTimes || []).length || 0));
        part = maxStages === 3 ? 'SQ3' : (maxStages === 2 ? 'SQ2' : (maxStages === 1 ? 'SQ1' : 'SQ'));
      } else if (sType.includes('QUALI') || sName.includes('QUALI')) {
        isRace = false;
        friendlyName = 'Qualifying';
        const lines = (leaderboardData && leaderboardData.Lines) || {};
        const maxStages = Math.max(0, ...Object.values(lines).map(l => (l.BestLapTimes || []).length || 0));
        part = maxStages === 3 ? 'Q3' : (maxStages === 2 ? 'Q2' : (maxStages === 1 ? 'Q1' : 'Q'));
      } else if (sName.includes('PRACTICE 1') || sName.includes('FP1')) {
        isRace = false;
        part = 'FP1';
        friendlyName = 'Practice 1';
      } else if (sName.includes('PRACTICE 2') || sName.includes('FP2')) {
        isRace = false;
        part = 'FP2';
        friendlyName = 'Practice 2';
      } else if (sName.includes('PRACTICE 3') || sName.includes('FP3')) {
        isRace = false;
        part = 'FP3';
        friendlyName = 'Practice 3';
      } else if (sName.includes('PRACTICE')) {
        isRace = false;
        part = 'FP';
        friendlyName = 'Practice';
      } else if (sName.includes('SPRINT')) {
        isRace = true;
        part = 'SPRINT';
        friendlyName = 'Sprint';
      } else {
        isRace = true;
        part = 'RACE';
        friendlyName = 'Grand Prix';
      }

      if (raceControlData && Array.isArray(raceControlData.RaceControl)) {
        for (let i = raceControlData.RaceControl.length - 1; i >= 0; i--) {
          const msg = (raceControlData.RaceControl[i].Message || '').toUpperCase();
          if (msg.includes('SQ3')) { if (part.startsWith('SQ')) part = 'SQ3'; break; }
          if (msg.includes('SQ2')) { if (part.startsWith('SQ') && part !== 'SQ3') part = 'SQ2'; break; }
          if (msg.includes('Q3')) { if (part.startsWith('Q')) part = 'Q3'; break; }
          if (msg.includes('Q2')) { if (part.startsWith('Q') && part !== 'Q3') part = 'Q2'; break; }
        }
      }

      let timeLeftText = '';
      if (isFinalised) {
        timeLeftText = '🏁 FINALISED';
      } else if (session.EndDate && session.GmtOffset) {
        try {
          const offsetParts = session.GmtOffset.split(':').map(Number);
          const offsetMs = ((offsetParts[0] || 0) * 3600 + (offsetParts[1] || 0) * 60) * 1000;
          const localEndMs = new Date(session.EndDate).getTime();
          const utcEndMs = localEndMs - offsetMs;
          const diffMs = utcEndMs - Date.now();
          if (diffMs > 0) {
            const mm = Math.floor(diffMs / 60000);
            const ss = Math.floor((diffMs % 60000) / 1000);
            timeLeftText = `⏱️ ${mm}:${ss < 10 ? '0' : ''}${ss} LEFT`;
          } else {
            timeLeftText = '🏁 CHEQUERED';
          }
        } catch (e) {
          timeLeftText = 'LIVE';
        }
      } else {
        timeLeftText = 'LIVE';
      }

      const cCode = (session.Meeting?.Country?.Code || '').toUpperCase();
      let flag = '🏁';
      if (cCode === 'SGP' || shortCircuit.includes('SINGAPORE')) flag = '🇸🇬';
      else if (cCode === 'MON' || shortCircuit.includes('MONACO')) flag = '🇲🇨';
      else if (cCode === 'GBR' || shortCircuit.includes('SILVERSTONE')) flag = '🇬🇧';
      else if (cCode === 'BEL' || shortCircuit.includes('SPA')) flag = '🇧🇪';
      else if (cCode === 'ITA' || shortCircuit.includes('MONZA')) flag = '🇮🇹';
      else if (cCode === 'JPN' || shortCircuit.includes('SUZUKA')) flag = '🇯🇵';
      else if (cCode === 'BRA' || shortCircuit.includes('INTERLAGOS')) flag = '🇧🇷';
      else if (cCode === 'USA' || shortCircuit.includes('AUSTIN') || shortCircuit.includes('MIAMI') || shortCircuit.includes('LAS VEGAS')) flag = '🇺🇸';
      else if (cCode === 'NLD' || shortCircuit.includes('ZANDVOORT')) flag = '🇳🇱';
      else if (cCode === 'CAN' || shortCircuit.includes('MONTREAL') || shortCircuit.includes('CANADA')) flag = '🇨🇦';
      else if (cCode === 'AUT' || shortCircuit.includes('RED BULL RING') || shortCircuit.includes('SPIELBERG')) flag = '🇦🇹';

      const tickerBadge = `${part} ${friendlyName.toUpperCase()}`;
      return {
        circuitName: shortCircuit,
        meetingName: mName,
        sessionName: session.Name || friendlyName,
        sessionType: sType,
        friendlyName: friendlyName,
        part: part,
        isRace: isRace,
        isFinalised: isFinalised,
        timeLeftText: timeLeftText,
        flag: flag,
        tickerText: `${flag} ${shortCircuit} • ${tickerBadge} • ${timeLeftText}`
      };
    }

    async getRaceControl() {
      const now = Date.now();
      if (this.cache.raceControl && (now - (this.cache.lastRaceControlFetch || 0) < 1200)) {
        return this.cache.raceControl;
      }
      try {
        const res = await fetch(`${this.baseUrl}/api/race-control`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        this.cache.raceControl = data;
        this.cache.lastRaceControlFetch = now;
        return data;
      } catch (err) {
        return null;
      }
    }

    parseFlagState(raceControlData) {
      if (!raceControlData || !raceControlData.RaceControl || !Array.isArray(raceControlData.RaceControl)) {
        return { type: 'GREEN', title: 'GREEN FLAG', msg: 'TRACK CLEAR', isCaution: false };
      }

      const list = raceControlData.RaceControl;
      const activeSectorFlags = {};
      let trackFlag = 'GREEN';
      let latestSignificantItem = null;

      list.forEach(item => {
        const flag = (item.Flag || '').toUpperCase();
        const scope = (item.Scope || '').toUpperCase();
        const sector = item.Sector;
        const msg = (item.Message || '').toUpperCase();

        if (scope === 'TRACK') {
          if (flag === 'RED') {
            trackFlag = 'RED';
            latestSignificantItem = item;
          } else if (flag === 'CLEAR' || flag === 'GREEN') {
            trackFlag = 'GREEN';
            latestSignificantItem = item;
          } else if (flag === 'CHEQUERED') {
            trackFlag = 'CHEQUERED';
            latestSignificantItem = item;
          } else if (msg.includes('SAFETY CAR') || msg.includes('VSC')) {
            trackFlag = msg.includes('VSC') ? 'VSC' : 'SC';
            latestSignificantItem = item;
          }
        } else if (scope === 'SECTOR' && sector !== undefined) {
          if (flag === 'CLEAR') {
            delete activeSectorFlags[sector];
          } else if (flag === 'YELLOW' || flag === 'DOUBLE YELLOW') {
            activeSectorFlags[sector] = flag;
            latestSignificantItem = item;
          }
        }
      });

      const activeSectors = Object.keys(activeSectorFlags).map(Number).sort((a, b) => a - b);

      if (trackFlag === 'RED') {
        return {
          type: 'RED',
          title: 'RED FLAG',
          msg: (latestSignificantItem && latestSignificantItem.Message) || 'SESSION SUSPENDED',
          isCaution: true
        };
      }

      if (trackFlag === 'SC') {
        return {
          type: 'SC',
          title: 'SAFETY CAR',
          msg: (latestSignificantItem && latestSignificantItem.Message) || 'SAFETY CAR DEPLOYED',
          isCaution: true
        };
      }

      if (trackFlag === 'VSC') {
        return {
          type: 'VSC',
          title: 'VIRTUAL SAFETY CAR',
          msg: (latestSignificantItem && latestSignificantItem.Message) || 'VSC DEPLOYED',
          isCaution: true
        };
      }

      if (trackFlag === 'CHEQUERED') {
        return {
          type: 'CHEQUERED',
          title: 'CHEQUERED FLAG',
          msg: 'SESSION FINISHED',
          isCaution: false
        };
      }

      if (activeSectors.length > 0) {
        const isDouble = Object.values(activeSectorFlags).some(f => f.includes('DOUBLE'));
        const sectorListStr = activeSectors.join(', ');
        return {
          type: isDouble ? 'DOUBLE_YELLOW' : 'YELLOW',
          title: isDouble ? 'DOUBLE YELLOW' : 'YELLOW FLAG',
          msg: `SECTOR ${sectorListStr}`,
          sectors: activeSectors,
          isCaution: true
        };
      }

      return {
        type: 'GREEN',
        title: 'GREEN FLAG',
        msg: 'TRACK CLEAR',
        isCaution: false
      };
    }
  }

  root.F1LiveTiming = new LiveTimingClient();
})(typeof window !== 'undefined' ? window : global);
