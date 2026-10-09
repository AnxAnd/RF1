// RF1 — High-Fidelity F1 Race Telemetry Simulator Engine
// Supports dynamic circuit selection, single-driver HUD telemetry, dual-driver Teammate Split,
// authentic 2026 World Championship grid, track-specific race outcomes, and live session ingestion.

(function(root) {
  'use strict';

  // Official 2026 World Championship Grid & Constructor Rosters
  const DEFAULT_TEAMS = [
    {
      name: 'McLaren',
      shortName: 'MCLAREN',
      color: '#FF8000',
      drivers: [
        { number: 1, code: 'NOR', name: 'Lando Norris', compound: 'M', baseTireAge: 1 },
        { number: 81, code: 'PIA', name: 'Oscar Piastri', compound: 'M', baseTireAge: 1 }
      ]
    },
    {
      name: 'Red Bull Racing',
      shortName: 'RED BULL',
      color: '#3671C6',
      drivers: [
        { number: 3, code: 'VER', name: 'Max Verstappen', compound: 'M', baseTireAge: 1 },
        { number: 6, code: 'HAD', name: 'Isack Hadjar', compound: 'H', baseTireAge: 1 }
      ]
    },
    {
      name: 'Ferrari',
      shortName: 'FERRARI',
      color: '#E8002D',
      drivers: [
        { number: 16, code: 'LEC', name: 'Charles Leclerc', compound: 'M', baseTireAge: 1 },
        { number: 44, code: 'HAM', name: 'Lewis Hamilton', compound: 'H', baseTireAge: 1 }
      ]
    },
    {
      name: 'Mercedes',
      shortName: 'MERCEDES',
      color: '#27F4D2',
      drivers: [
        { number: 63, code: 'RUS', name: 'George Russell', compound: 'M', baseTireAge: 1 },
        { number: 12, code: 'ANT', name: 'Kimi Antonelli', compound: 'M', baseTireAge: 1 }
      ]
    },
    {
      name: 'Aston Martin',
      shortName: 'ASTON MARTIN',
      color: '#229971',
      drivers: [
        { number: 14, code: 'ALO', name: 'Fernando Alonso', compound: 'M', baseTireAge: 1 },
        { number: 18, code: 'STR', name: 'Lance Stroll', compound: 'H', baseTireAge: 1 }
      ]
    },
    {
      name: 'Racing Bulls',
      shortName: 'RACING BULLS',
      color: '#6692FF',
      drivers: [
        { number: 30, code: 'LAW', name: 'Liam Lawson', compound: 'M', baseTireAge: 1 },
        { number: 22, code: 'TSU', name: 'Yuki Tsunoda', compound: 'H', baseTireAge: 1 }
      ]
    },
    {
      name: 'Alpine',
      shortName: 'ALPINE',
      color: '#FF87BC',
      drivers: [
        { number: 10, code: 'GAS', name: 'Pierre Gasly', compound: 'M', baseTireAge: 1 },
        { number: 61, code: 'DOO', name: 'Jack Doohan', compound: 'H', baseTireAge: 1 }
      ]
    },
    {
      name: 'Williams',
      shortName: 'WILLIAMS',
      color: '#64C4FF',
      drivers: [
        { number: 23, code: 'ALB', name: 'Alexander Albon', compound: 'M', baseTireAge: 1 },
        { number: 55, code: 'SAI', name: 'Carlos Sainz', compound: 'H', baseTireAge: 1 }
      ]
    },
    {
      name: 'Haas',
      shortName: 'HAAS F1',
      color: '#B6BABD',
      drivers: [
        { number: 31, code: 'OCO', name: 'Esteban Ocon', compound: 'M', baseTireAge: 1 },
        { number: 87, code: 'BEA', name: 'Oliver Bearman', compound: 'H', baseTireAge: 1 }
      ]
    },
    {
      name: 'Sauber',
      shortName: 'SAUBER / AUDI',
      color: '#52E252',
      drivers: [
        { number: 27, code: 'HUL', name: 'Nico Hulkenberg', compound: 'M', baseTireAge: 1 },
        { number: 5, code: 'BOR', name: 'Gabriel Bortoleto', compound: 'H', baseTireAge: 1 }
      ]
    },
    {
      name: 'Cadillac F1 Team',
      shortName: 'CADILLAC',
      color: '#909090',
      drivers: [
        { number: 11, code: 'PER', name: 'Sergio Perez', compound: 'M', baseTireAge: 1 },
        { number: 77, code: 'BOT', name: 'Valtteri Bottas', compound: 'H', baseTireAge: 1 }
      ]
    }
  ];

  // Circuit-Specific Authentic Finishing Orders
  const TRACK_FINISH_ORDERS = {
    // Singapore 2026 (matches actual live session from today!)
    singapore: ['VER', 'RUS', 'LEC', 'PIA', 'NOR', 'HAM', 'ANT', 'LAW', 'HAD', 'GAS', 'HUL', 'ALB', 'ALO', 'TSU', 'OCO', 'BEA', 'BOR', 'STR', 'DOO', 'PER', 'BOT', 'SAI'],
    // Silverstone (British GP historic home win)
    silverstone: ['HAM', 'VER', 'NOR', 'PIA', 'SAI', 'HUL', 'STR', 'ALO', 'ALB', 'TSU', 'RUS', 'LEC', 'GAS', 'OCO', 'PER', 'ANT', 'LAW', 'DOO', 'BEA', 'BOR'],
    // Monaco (Leclerc home triumph)
    monaco: ['LEC', 'PIA', 'SAI', 'NOR', 'RUS', 'VER', 'HAM', 'TSU', 'ALB', 'GAS', 'OCO', 'ALO', 'HUL', 'PER', 'STR', 'ANT', 'LAW', 'BEA', 'DOO', 'BOR'],
    // Spa-Francorchamps (Belgian GP thriller)
    spa: ['HAM', 'PIA', 'LEC', 'VER', 'NOR', 'SAI', 'PER', 'ALO', 'OCO', 'ALB', 'RUS', 'GAS', 'TSU', 'HUL', 'STR', 'ANT', 'LAW', 'BEA', 'DOO', 'BOR'],
    // Monza (Ferrari home victory)
    monza: ['LEC', 'PIA', 'NOR', 'SAI', 'HAM', 'RUS', 'VER', 'PER', 'ALB', 'HUL', 'ALO', 'GAS', 'OCO', 'TSU', 'STR', 'ANT', 'LAW', 'BEA', 'DOO', 'BOR'],
    // Red Bull Ring (Austrian GP victory)
    austria: ['RUS', 'PIA', 'SAI', 'HAM', 'VER', 'HUL', 'PER', 'GAS', 'ALB', 'TSU', 'NOR', 'LEC', 'ALO', 'OCO', 'STR', 'ANT', 'LAW', 'BEA', 'DOO', 'BOR'],
    // Suzuka (Japanese GP masterclass)
    suzuka: ['VER', 'PER', 'SAI', 'LEC', 'NOR', 'ALO', 'RUS', 'HAM', 'TSU', 'HUL', 'ALB', 'GAS', 'OCO', 'STR', 'ANT', 'LAW', 'BEA', 'DOO', 'BOR'],
    // Interlagos (São Paulo GP rain masterclass)
    interlagos: ['VER', 'OCO', 'GAS', 'RUS', 'LEC', 'NOR', 'TSU', 'LAW', 'HAM', 'PER', 'SAI', 'ALB', 'HUL', 'ALO', 'STR', 'BEA', 'BOR', 'ANT', 'DOO'],
    // Yas Marina (Abu Dhabi finale)
    abudhabi: ['NOR', 'SAI', 'LEC', 'HAM', 'RUS', 'VER', 'GAS', 'HUL', 'ALO', 'TSU', 'ALB', 'PER', 'OCO', 'STR', 'ANT', 'LAW', 'BEA', 'DOO', 'BOR'],
    // Bahrain (Sakhir desert opener)
    bahrain: ['VER', 'PER', 'SAI', 'LEC', 'RUS', 'NOR', 'HAM', 'PIA', 'ALO', 'STR', 'TSU', 'HUL', 'ALB', 'GAS', 'OCO', 'ANT', 'LAW', 'BEA', 'DOO', 'BOR'],
    // Miami (Norris maiden victory)
    miami: ['NOR', 'VER', 'LEC', 'SAI', 'PER', 'HAM', 'TSU', 'RUS', 'ALO', 'OCO', 'HUL', 'ALB', 'GAS', 'STR', 'ANT', 'LAW', 'BEA', 'DOO', 'BOR', 'PIA'],
    // Barcelona-Catalunya (Spanish GP)
    catalunya: ['VER', 'NOR', 'HAM', 'RUS', 'LEC', 'SAI', 'PIA', 'PER', 'GAS', 'OCO', 'HUL', 'ALO', 'TSU', 'ALB', 'STR', 'ANT', 'LAW', 'BEA', 'DOO', 'BOR'],
    // Hungaroring (Piastri maiden victory)
    hungaroring: ['PIA', 'NOR', 'HAM', 'LEC', 'VER', 'SAI', 'PER', 'RUS', 'TSU', 'STR', 'ALO', 'HUL', 'ALB', 'GAS', 'OCO', 'ANT', 'LAW', 'BEA', 'DOO', 'BOR'],
    // Zandvoort (Dutch GP)
    zandvoort: ['NOR', 'VER', 'LEC', 'PIA', 'SAI', 'PER', 'RUS', 'HAM', 'GAS', 'ALO', 'HUL', 'TSU', 'ALB', 'STR', 'OCO', 'ANT', 'LAW', 'BEA', 'DOO', 'BOR'],
    // Baku (Azerbaijan street race)
    baku: ['PIA', 'LEC', 'RUS', 'NOR', 'VER', 'ALO', 'ALB', 'HAM', 'BEA', 'HUL', 'GAS', 'TSU', 'STR', 'OCO', 'SAI', 'PER', 'ANT', 'LAW', 'DOO', 'BOR'],
    // Las Vegas Strip Circuit
    vegas: ['RUS', 'HAM', 'SAI', 'LEC', 'VER', 'NOR', 'PIA', 'HUL', 'TSU', 'PER', 'ALO', 'ALB', 'STR', 'GAS', 'OCO', 'BEA', 'ANT', 'LAW', 'DOO', 'BOR']
  };

  class SimulatorEngine {
    constructor() {
      this.startTime = Date.now();
      this.currentTrackId = 'singapore';
      this.currentTrackName = 'Marina Bay Street Circuit';
      this.currentGrandPrix = 'SINGAPORE GP';
      this.currentFlag = '🇸🇬';
      this.totalLaps = 62;
      this.lapDurationMs = 85000;
      this.currentLap = 1;
      this.topSpeedRef = 310;
      this.isLiveReplay = false;
      this.isRace = true;
      this.sessionType = 'Race';
      this.sessionName = 'Grand Prix';
      this.sessionPart = 'RACE';
      this.flagTimeline = null;
      this.customFlag = null;

      this.initTrackGrid('singapore');
    }

    // Initialize driver base positions for a specific circuit
    initTrackGrid(trackId) {
      const order = TRACK_FINISH_ORDERS[trackId] || TRACK_FINISH_ORDERS.singapore;
      const driversList = [];

      this.teams = DEFAULT_TEAMS.map((team, teamIdx) => {
        const teamDrivers = team.drivers.map(d => {
          let posIdx = order.indexOf(d.code);
          if (posIdx === -1) posIdx = driversList.length;
          const pos = posIdx + 1;

          const driverObj = {
            ...d,
            teamName: team.name,
            teamShort: team.shortName,
            teamColor: team.color,
            teamIndex: teamIdx,
            basePos: pos
          };
          driversList.push(driverObj);
          return driverObj;
        });

        return {
          ...team,
          index: teamIdx,
          drivers: teamDrivers
        };
      });

      // Sort strictly by track finish position: P1, P2, P3...
      this.activeDrivers = driversList.sort((a, b) => a.basePos - b.basePos);
    }

    buildFlagTimeline(rcData) {
      if (!rcData || !rcData.RaceControl || !Array.isArray(rcData.RaceControl)) {
        if (!this.isRace) {
          const durationSec = (this.sessionPart === 'SQ3' || this.sessionPart === 'Q3') ? 480 : 600;
          return [
            { offsetSec: 0, state: { type: 'GREEN', title: 'GREEN FLAG', msg: 'TRACK CLEAR', isCaution: false } },
            { offsetSec: durationSec, state: { type: 'CHEQUERED', title: 'CHEQUERED FLAG', msg: 'SESSION FINISHED', isCaution: false } }
          ];
        }
        return null;
      }

      const rcList = rcData.RaceControl;
      const stages = [];
      let cur = null;
      rcList.forEach(item => {
        const flag = (item.Flag || '').toUpperCase();
        const scope = (item.Scope || '').toUpperCase();
        const utc = new Date(item.Utc + 'Z').getTime();
        if (scope === 'TRACK' && flag === 'GREEN') {
          cur = { startTime: utc, endTime: null, events: [] };
          stages.push(cur);
        }
        if (cur) {
          cur.events.push(item);
          if (scope === 'TRACK' && flag === 'CHEQUERED') {
            cur.endTime = utc;
          }
        }
      });

      // Default to the last active stage (e.g. SQ3 in Sprint Qualifying)
      const stage = stages.length > 0 ? stages[stages.length - 1] : null;
      if (!stage) {
        return [
          { offsetSec: 0, state: { type: 'GREEN', title: 'GREEN FLAG', msg: 'TRACK CLEAR', isCaution: false } }
        ];
      }

      const stageStart = stage.startTime;
      const timeline = [];
      timeline.push({
        offsetSec: 0,
        state: { type: 'GREEN', title: 'GREEN FLAG', msg: 'TRACK CLEAR', isCaution: false }
      });

      const activeSectorFlags = {};
      stage.events.forEach(item => {
        const utc = new Date(item.Utc + 'Z').getTime();
        const offsetSec = Math.max(0, Math.round((utc - stageStart) / 1000));
        const flag = (item.Flag || '').toUpperCase();
        const scope = (item.Scope || '').toUpperCase();
        const sector = item.Sector;
        const msg = (item.Message || '').toUpperCase();

        let state = null;
        if (scope === 'TRACK') {
          if (flag === 'CHEQUERED') {
            state = { type: 'CHEQUERED', title: 'CHEQUERED FLAG', msg: 'SESSION FINISHED', isCaution: false };
          } else if (flag === 'RED') {
            state = { type: 'RED', title: 'RED FLAG', msg: item.Message || 'SESSION SUSPENDED', isCaution: true };
          } else if (msg.includes('SAFETY CAR') || msg.includes('VSC')) {
            state = {
              type: msg.includes('VSC') ? 'VSC' : 'SC',
              title: msg.includes('VSC') ? 'VSC' : 'SAFETY CAR',
              msg: item.Message || 'CAUTION',
              isCaution: true
            };
          }
        } else if (scope === 'SECTOR' && sector !== undefined) {
          if (flag === 'CLEAR') {
            delete activeSectorFlags[sector];
          } else if (flag.includes('YELLOW')) {
            activeSectorFlags[sector] = flag;
          }
          const activeSectors = Object.keys(activeSectorFlags).map(Number).sort((a, b) => a - b);
          if (activeSectors.length > 0) {
            const isDouble = Object.values(activeSectorFlags).some(f => f.includes('DOUBLE'));
            state = {
              type: isDouble ? 'DOUBLE_YELLOW' : 'YELLOW',
              title: isDouble ? 'DOUBLE YELLOW' : 'YELLOW FLAG',
              msg: `SECTOR ${activeSectors.join(', ')}`,
              sectors: activeSectors,
              isCaution: true
            };
          } else {
            state = { type: 'GREEN', title: 'GREEN FLAG', msg: 'TRACK CLEAR', isCaution: false };
          }
        }

        if (state) {
          timeline.push({ offsetSec, state });
        }
      });

      return timeline;
    }

    // Ingest real completed live session data from live timing feed
    loadSessionFromLive(rawData, rcData) {
      if (!rawData || !rawData.Lines) return false;
      const lines = rawData.Lines;
      const order = rawData.Leaderboard || Object.keys(lines);

      const parsedDrivers = [];
      order.forEach((numStr, idx) => {
        if (numStr === '_kf' || !lines[numStr]) return;
        const line = lines[numStr];
        const num = parseInt(numStr, 10);
        const pos = line.Position ? parseInt(line.Position, 10) : idx + 1;

        // Tyre compound & stint age
        let compound = 'M';
        let tyreLaps = 1;
        const stints = line.Stints ? (Array.isArray(line.Stints) ? line.Stints : Object.values(line.Stints)) : [];
        if (stints.length > 0) {
          const lastStint = stints[stints.length - 1];
          if (lastStint.Compound) compound = lastStint.Compound.charAt(0).toUpperCase();
          if (lastStint.TotalLaps !== undefined) tyreLaps = Math.max(1, parseInt(lastStint.TotalLaps, 10) || 1);
        }

        // Best lap
        const bestLap = line.BestLapTime && line.BestLapTime.Value ? line.BestLapTime.Value : '';

        // Sectors
        const sectors = [];
        const rawSectors = line.Sectors ? (Array.isArray(line.Sectors) ? line.Sectors : Object.values(line.Sectors)) : [];
        for (let i = 0; i < 3; i++) {
          const sec = rawSectors[i] || {};
          const val = sec.Value || '';
          let colorClass = 'sector-none';
          if (val) {
            if (sec.OverallFastest) colorClass = 'sector-purple';
            else if (sec.PersonalFastest) colorClass = 'sector-green';
            else colorClass = 'sector-yellow';
          }
          sectors.push({
            number: i + 1,
            val: val ? parseFloat(val).toFixed(2) : '--.--',
            colorClass: colorClass
          });
        }

        const teamName = line.TeamName || 'Formula 1';
        const teamColor = line.TeamColour ? `#${line.TeamColour}` : '#FE5000';
        const tla = line.Tla || (line.BroadcastName ? line.BroadcastName.slice(0, 3) : `D${num}`);

        const numLaps = line.NumberOfLaps !== undefined ? parseInt(line.NumberOfLaps, 10) : tyreLaps;

        parsedDrivers.push({
          number: num,
          code: tla,
          name: line.FullName || line.BroadcastName || `Driver ${num}`,
          teamName: teamName,
          teamShort: teamName.replace(' Racing', '').replace(' F1 Team', '').toUpperCase(),
          teamColor: teamColor,
          basePos: pos,
          compound: compound,
          baseTireAge: tyreLaps,
          laps: numLaps,
          bestLap: bestLap,
          sectors: sectors
        });
      });

      if (parsedDrivers.length === 0) return false;

      // Group drivers into teams
      const teamMap = new Map();
      parsedDrivers.forEach(d => {
        if (!teamMap.has(d.teamName)) {
          teamMap.set(d.teamName, {
            name: d.teamName,
            shortName: d.teamShort,
            color: d.teamColor,
            drivers: []
          });
        }
        teamMap.get(d.teamName).drivers.push(d);
      });

      const extractedTeams = Array.from(teamMap.values()).filter(t => t.drivers.length >= 2);
      extractedTeams.forEach((t, tIdx) => {
        t.index = tIdx;
        t.drivers.forEach(d => {
          d.teamIndex = tIdx;
        });
      });

      this.teams = extractedTeams.length > 0 ? extractedTeams : DEFAULT_TEAMS;
      this.activeDrivers = parsedDrivers.sort((a, b) => a.basePos - b.basePos);
      this.currentLap = 1;
      this.startTime = Date.now();

      const sess = rawData.Session;
      if (sess) {
        if (sess.Meeting && sess.Meeting.Name) {
          this.currentGrandPrix = (sess.Meeting.Name + (sess.Name ? ` - ${sess.Name}` : '')).toUpperCase();
        }
        this.currentTrackName = sess.Meeting?.Name || 'Marina Bay Street Circuit';

        const sType = (sess.Type || '').toUpperCase();
        const sName = (sess.Name || '').toUpperCase();
        if (sName.includes('SPRINT QUALI') || sName.includes('SHOOTOUT')) {
          this.isRace = false;
          this.sessionType = 'Qualifying';
          this.sessionName = 'Sprint Qualifying';
          this.sessionPart = 'SQ3';
        } else if (sType.includes('QUALI') || sName.includes('QUALI')) {
          this.isRace = false;
          this.sessionType = 'Qualifying';
          this.sessionName = 'Qualifying';
          this.sessionPart = 'Q3';
        } else if (sName.includes('PRACTICE')) {
          this.isRace = false;
          this.sessionType = 'Practice';
          this.sessionName = sess.Name || 'Practice';
          this.sessionPart = sName.includes('2') ? 'FP2' : (sName.includes('3') ? 'FP3' : 'FP1');
        } else if (sName.includes('SPRINT')) {
          this.isRace = true;
          this.sessionType = 'Sprint';
          this.sessionName = 'Sprint';
          this.sessionPart = 'SPRINT';
        } else {
          this.isRace = true;
          this.sessionType = 'Race';
          this.sessionName = 'Grand Prix';
          this.sessionPart = 'RACE';
        }
      }
      this.isLiveReplay = true;
      this.customFlag = null;
      this.flagTimeline = this.buildFlagTimeline(rcData);
      return true;
    }

    restart() {
      this.currentLap = 1;
      this.startTime = Date.now();
      this.customFlag = null;
    }

    setLap(lapNumber) {
      this.currentLap = Math.max(1, Math.min(this.totalLaps, parseInt(lapNumber, 10) || 1));
      this.startTime = Date.now();
    }

    setTrack(trackId) {
      this.currentTrackId = trackId;
      this.isLiveReplay = false;
      this.flagTimeline = null;
      this.customFlag = null;
      const tm = (typeof window !== 'undefined' && window.TrackManager) ? window.TrackManager : null;
      if (tm) {
        const t = tm.getTrackById(trackId);
        if (t) {
          this.currentTrackName = t.name;
          this.currentGrandPrix = t.gp;
          this.currentFlag = t.flag;
          this.totalLaps = t.laps;
          this.lapDurationMs = (t.lapTimeSec || 85) * 1000;
          this.topSpeedRef = t.topSpeed || 330;
          this.currentLap = 1;
          this.startTime = Date.now();
        }
      }
      this.initTrackGrid(trackId);
      this.isRace = true;
      this.sessionType = 'Race';
      this.sessionName = 'Grand Prix';
      this.sessionPart = 'RACE';
    }

    getTrackInfo() {
      return {
        id: this.currentTrackId,
        name: this.currentTrackName,
        gp: this.currentGrandPrix,
        flag: this.currentFlag,
        laps: this.totalLaps,
        lap: this.currentLap
      };
    }

    getTeams() {
      return this.teams.map((t, idx) => ({
        index: idx,
        name: t.name,
        shortName: t.shortName,
        color: t.color,
        drivers: t.drivers.map(d => ({
          number: d.number,
          code: d.code,
          name: d.name,
          pos: d.basePos,
          bestLap: d.bestLap,
          sectors: d.sectors,
          compound: d.compound
        }))
      }));
    }

    getDrivers() {
      return this.activeDrivers.map(d => ({
        number: d.number,
        code: d.code,
        name: d.name,
        team: d.teamName,
        color: d.teamColor,
        teamIndex: d.teamIndex,
        pos: d.basePos,
        bestLap: d.bestLap,
        sectors: d.sectors
      }));
    }

    computeTelemetry(driver, globalIndex) {
      if (!driver) driver = (this.activeDrivers && this.activeDrivers[0]) || { basePos: 1, code: 'NOR', number: 1, compound: 'M' };
      if (globalIndex === undefined) globalIndex = (driver.basePos || 1) - 1;
      const now = Date.now();
      const driverOffsetMs = (globalIndex * 1500);
      const elapsed = Math.max(0, now - this.startTime);
      const driverElapsed = elapsed + driverOffsetMs;
      const cycleProgress = (driverElapsed % this.lapDurationMs) / this.lapDurationMs;

      const lapsPassed = Math.floor(elapsed / this.lapDurationMs);
      const currentCompletedLaps = Math.min(this.totalLaps, this.currentLap + lapsPassed);
      const tireAge = Math.max(1, currentCompletedLaps);

      let speed = 0;
      let gear = 1;
      let rpm = 4000;
      let throttle = 0;
      let brake = 0;
      let drs = 0;

      // Realistic Circuit Profile:
      // Straight 1 (0.00-0.20), Hairpin (0.20-0.30), Technical (0.30-0.55), Straight 2/DRS (0.55-0.78), Chicanes (0.78-1.00)
      if (cycleProgress < 0.20) {
        // High speed straight with DRS
        const p = cycleProgress / 0.20;
        speed = Math.floor(220 + p * (this.topSpeedRef - 220));
        gear = speed > 300 ? 8 : (speed > 260 ? 7 : 6);
        rpm = 10500 + Math.floor(p * 2500);
        throttle = 100;
        brake = 0;
        drs = cycleProgress > 0.05 ? 1 : 0;
      } else if (cycleProgress < 0.30) {
        // Heavy braking zone into Hairpin
        const p = (cycleProgress - 0.20) / 0.10;
        speed = Math.floor((this.topSpeedRef - 20) - p * ((this.topSpeedRef - 20) - 78));
        gear = speed < 90 ? 2 : (speed < 140 ? 3 : 5);
        rpm = 12000 - Math.floor(p * 5000);
        throttle = Math.floor(Math.max(0, (1 - p * 3) * 100));
        brake = Math.floor(Math.min(100, p * 120));
        drs = 0;
      } else if (cycleProgress < 0.55) {
        // Technical middle sector: acceleration, short shifts, medium corners
        const p = (cycleProgress - 0.30) / 0.25;
        speed = Math.floor(85 + Math.sin(p * Math.PI) * 135);
        gear = speed > 180 ? 5 : (speed > 130 ? 4 : 3);
        rpm = 8500 + Math.floor(Math.sin(p * Math.PI * 2) * 2500);
        throttle = Math.floor(50 + Math.sin(p * Math.PI) * 45);
        brake = Math.floor(Math.max(0, -Math.sin(p * Math.PI * 2) * 35));
        drs = 0;
      } else if (cycleProgress < 0.78) {
        // Back straight with active DRS
        const p = (cycleProgress - 0.55) / 0.23;
        speed = Math.floor(190 + p * (this.topSpeedRef - 10 - 190));
        gear = speed > 290 ? 8 : (speed > 250 ? 7 : 6);
        rpm = 10200 + Math.floor(p * 2600);
        throttle = 100;
        brake = 0;
        drs = cycleProgress > 0.60 ? 1 : 0;
      } else {
        // Final complex & start/finish straight
        const p = (cycleProgress - 0.78) / 0.22;
        speed = Math.floor(140 + p * 110);
        gear = speed > 210 ? 6 : (speed > 160 ? 5 : 4);
        rpm = 8800 + Math.floor(p * 2800);
        throttle = Math.floor(65 + p * 35);
        brake = 0;
        drs = 0;
      }

      speed = Math.max(0, Math.min(365, speed));
      rpm = Math.max(3000, Math.min(13500, rpm));
      throttle = Math.max(0, Math.min(100, throttle));
      brake = Math.max(0, Math.min(100, brake));
      const rpmPct = Math.min(100, Math.max(0, Math.round(((rpm - 4000) / 9000) * 100)));

      let gap = 'LEADER';
      if (driver.basePos > 1) {
        const baseGap = (driver.basePos - 1) * 1.45;
        const lapSpread = Math.min(25, (currentCompletedLaps - 1) * 0.35);
        const gapSec = (baseGap + lapSpread + Math.sin(now / 15000 + driver.basePos) * 0.2).toFixed(3);
        gap = `+${gapSec}s`;
      }

      // Best Lap & Sectors
      const baseLapSec = 91.2 + (driver.basePos - 1) * 0.24;
      const min = Math.floor(baseLapSec / 60);
      const secRem = (baseLapSec % 60).toFixed(3);
      const computedBestLap = `${min}:${secRem < 10 ? '0' : ''}${secRem}`;
      const bestLap = driver.bestLap || computedBestLap;

      const s1Time = (33.2 + driver.basePos * 0.08).toFixed(2);
      const s2Time = (44.8 + driver.basePos * 0.09).toFixed(2);
      const s3Time = (36.1 + driver.basePos * 0.06).toFixed(2);

      let s1Color = 'sector-yellow';
      let s2Color = 'sector-yellow';
      let s3Color = 'sector-yellow';

      if (driver.basePos === 1) {
        s1Color = 'sector-purple';
        s2Color = 'sector-green';
        s3Color = 'sector-purple';
      } else if (driver.basePos === 2) {
        s1Color = 'sector-green';
        s2Color = 'sector-purple';
        s3Color = 'sector-green';
      } else if (driver.basePos <= 5) {
        s1Color = 'sector-green';
        s2Color = 'sector-green';
        s3Color = 'sector-yellow';
      }

      const sectors = (driver.sectors && driver.sectors.length === 3) ? driver.sectors : [
        { number: 1, val: s1Time, colorClass: s1Color },
        { number: 2, val: s2Time, colorClass: s2Color },
        { number: 3, val: s3Time, colorClass: s3Color }
      ];

      return {
        driver: driver.code,
        number: driver.number,
        fullName: driver.name,
        team: driver.teamName || driver.team,
        teamShort: driver.teamShort || driver.team,
        teamColor: driver.teamColor || driver.color,
        pos: driver.basePos,
        gap: gap,
        bestLap: bestLap,
        sectors: sectors,
        lap: currentCompletedLaps,
        totalLaps: this.isRace ? this.totalLaps : null,
        driverLaps: driver.laps || driver.NumberOfLaps || currentCompletedLaps,
        isRace: this.isRace,
        sessionType: this.sessionType,
        sessionName: this.sessionName,
        sessionPart: this.sessionPart,
        speed: speed,
        gear: gear === 0 ? 'N' : gear,
        rpm: rpm,
        rpmPct: rpmPct,
        throttle: throttle,
        brake: brake,
        drs: drs,
        tire: driver.compound,
        tireAge: tireAge,
        mode: 'REPLAY',
        trackId: this.currentTrackId,
        trackName: this.currentTrackName,
        grandPrix: this.currentGrandPrix,
        flag: this.currentFlag
      };
    }

    getDriverTelemetry(driverNumber) {
      const num = parseInt(driverNumber, 10) || 1;
      const driver = this.activeDrivers.find(d => d.number === num) || this.activeDrivers[0];
      const globalIdx = driver.basePos - 1;
      return this.computeTelemetry(driver, globalIdx);
    }

    getTeamTelemetry(teamIdx) {
      const idx = Math.max(0, Math.min(this.teams.length - 1, parseInt(teamIdx, 10) || 0));
      const team = this.teams[idx] || this.teams[0];
      const d1 = this.activeDrivers.find(d => d.number === team.drivers[0].number) || team.drivers[0];
      const d2 = this.activeDrivers.find(d => d.number === team.drivers[1].number) || team.drivers[1];

      const t1 = this.computeTelemetry(d1, d1.basePos - 1);
      const t2 = this.computeTelemetry(d2, d2.basePos - 1);

      const parseLapMs = (str) => {
        if (!str) return 0;
        const parts = str.split(':');
        if (parts.length === 2) {
          return parseFloat(parts[0]) * 60000 + parseFloat(parts[1]) * 1000;
        }
        return parseFloat(str) * 1000;
      };
      const ms1 = parseLapMs(t1.bestLap);
      const ms2 = parseLapMs(t2.bestLap);
      const diffSec = Math.abs((ms2 - ms1) / 1000).toFixed(3);

      return {
        teamName: team.name,
        teamShort: team.shortName,
        teamColor: team.color,
        delta: `Δ +${diffSec}s`,
        d1: t1,
        d2: t2,
        mode: 'REPLAY',
        trackId: this.currentTrackId,
        trackName: this.currentTrackName,
        grandPrix: this.currentGrandPrix,
        flag: this.currentFlag
      };
    }

    getLeaderboard() {
      const now = Date.now();
      const lapsPassed = Math.floor(Math.max(0, now - this.startTime) / this.lapDurationMs);
      const currentCompletedLaps = Math.min(this.totalLaps, this.currentLap + lapsPassed);

      return this.activeDrivers.map((d) => {
        let gap = 'LEADER';
        if (d.basePos > 1) {
          const baseGap = (d.basePos - 1) * 1.45;
          const lapSpread = Math.min(25, (currentCompletedLaps - 1) * 0.35);
          const gapSec = (baseGap + lapSpread + Math.sin(now / 15000 + d.basePos) * 0.2).toFixed(3);
          gap = `+${gapSec}s`;
        }
        return {
          pos: d.basePos,
          code: d.code,
          number: d.number,
          team: d.teamName,
          teamColor: d.teamColor,
          gap: gap,
          tire: d.compound,
          tireAge: Math.max(1, currentCompletedLaps)
        };
      });
    }

    getFlagState() {
      if (this.customFlag) return this.customFlag;

      // Real timeline flag state during session replay
      if (this.isLiveReplay && this.flagTimeline && this.flagTimeline.length > 0) {
        const elapsedSec = Math.floor((Date.now() - this.startTime) / 1000);
        let active = this.flagTimeline[0];
        for (let i = 0; i < this.flagTimeline.length; i++) {
          if (elapsedSec >= this.flagTimeline[i].offsetSec) {
            active = this.flagTimeline[i];
          } else {
            break;
          }
        }
        return active.state;
      }

      // Check if simulated race is finished
      const now = Date.now();
      const elapsed = Math.max(0, now - this.startTime);
      const lapsPassed = Math.floor(elapsed / this.lapDurationMs);
      const currentCompletedLaps = Math.min(this.totalLaps, this.currentLap + lapsPassed);
      if (currentCompletedLaps >= this.totalLaps && this.isRace) {
        return {
          type: 'CHEQUERED',
          title: 'CHEQUERED FLAG',
          msg: 'SESSION FINISHED',
          isCaution: false
        };
      }

      return {
        type: 'GREEN',
        title: 'GREEN FLAG',
        msg: 'TRACK CLEAR',
        isCaution: false
      };
    }

    setFlag(type, msg) {
      const t = (type || '').toUpperCase();
      if (!t || t === 'CLEAR' || t === 'GREEN') {
        this.customFlag = { type: 'GREEN', title: 'GREEN FLAG', msg: 'TRACK CLEAR', isCaution: false };
      } else if (t === 'CHEQUERED') {
        this.customFlag = { type: 'CHEQUERED', title: 'CHEQUERED FLAG', msg: msg || 'CHEQUERED FLAG', isCaution: false };
      } else {
        this.customFlag = {
          type: t,
          title: t.includes('RED') ? 'RED FLAG' : 'YELLOW FLAG',
          msg: msg || 'CAUTION ON TRACK',
          isCaution: true
        };
      }
    }
  }

  const instance = new SimulatorEngine();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = instance;
  } else {
    root.F1Simulator = instance;
  }
})(typeof window !== 'undefined' ? window : globalThis);
