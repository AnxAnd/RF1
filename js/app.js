// RF1 — Rabbit R1 Formula 1 Telemetry Companion
// Full support for Race Selection (Live vs Past), Circuit Outlines, HUD, Teammate Split, and Hardware Events

(function() {
  'use strict';

  // State
  let drivers = [];
  let teams = [];
  let currentDriverIndex = 0;
  let currentTeamIndex = 0;
  let activeView = 'races'; // Start with 'races' selection screen
  let activeMode = 'REPLAY'; // 'REPLAY' or 'LIVE'
  let currentTrackId = 'singapore';
  let currentSeasonFilter = 'ALL';
  let pollTimer = null;
  let isFetching = false;
  let lastFinalisedLiveRawData = null;

  // Views & Tabs
  const views = {
    races: document.getElementById('view-races'),
    hud: document.getElementById('view-hud'),
    split: document.getElementById('view-split'),
    tower: document.getElementById('view-tower'),
    noLive: document.getElementById('view-no-live')
  };

  const navTabs = {
    races: document.getElementById('nav-btn-races'),
    hud: document.getElementById('nav-btn-hud'),
    split: document.getElementById('nav-btn-split'),
    tower: document.getElementById('nav-btn-tower')
  };

  // Header Circuit Badges
  const raceHeaderBadges = {
    hud: document.getElementById('btn-race-hud'),
    split: document.getElementById('btn-race-split'),
    tower: document.getElementById('btn-race-tower')
  };

  // HUD Elements
  const teamStripe = document.getElementById('team-stripe');
  const driverCodeEl = document.getElementById('driver-code');
  const driverNumEl = document.getElementById('driver-num');
  const driverLastNameEl = document.getElementById('driver-last-name');
  const driverPosEl = document.getElementById('driver-pos');
  const driverGapEl = document.getElementById('driver-gap');
  const hudFlagBadge = document.getElementById('hud-flag-badge');
  const hudTrackFlag = document.getElementById('hud-track-flag');
  const hudTrackName = document.getElementById('hud-track-name');
  const hudTickerText1 = document.getElementById('hud-ticker-text-1');
  const hudTickerText2 = document.getElementById('hud-ticker-text-2');
  const trackWatermarkSvg = document.getElementById('track-watermark-svg');
  const trackWatermarkPath = document.getElementById('track-watermark-path');

  const gearValEl = document.getElementById('gear-val');
  const speedValEl = document.getElementById('speed-val');
  const drsPillEl = document.getElementById('drs-pill');
  const brakeFillEl = document.getElementById('brake-fill');
  const throttleFillEl = document.getElementById('throttle-fill');
  const brakePctEl = document.getElementById('brake-pct');
  const throttlePctEl = document.getElementById('throttle-pct');
  const tireCompoundEl = document.getElementById('tire-compound');
  const tireAgeEl = document.getElementById('tire-age');
  const hudPitBadge = document.getElementById('hud-pit-badge');
  const lapCounterEl = document.getElementById('lap-counter');
  const hudSessionSub = document.getElementById('hud-session-sub');
  const leds = document.querySelectorAll('.led');

  // Split View Elements
  const splitTeamStripe = document.getElementById('split-team-stripe');
  const splitTeamName = document.getElementById('split-team-name');
  const splitDeltaBadge = document.getElementById('split-delta-badge');
  const splitTrackName = document.getElementById('split-track-name');
  const splitTickerText1 = document.getElementById('split-ticker-text-1');
  const splitTickerText2 = document.getElementById('split-ticker-text-2');
  const splitCol1 = document.getElementById('split-col-1');
  const splitCol2 = document.getElementById('split-col-2');

  const s1Code = document.getElementById('s1-code');
  const s1Pos = document.getElementById('s1-pos');
  const s1BestLap = document.getElementById('s1-best-lap');
  const s1SecBoxes = [
    document.getElementById('s1-sec-1'),
    document.getElementById('s1-sec-2'),
    document.getElementById('s1-sec-3')
  ];
  const s1SecVals = [
    document.getElementById('s1-s1-val'),
    document.getElementById('s1-s2-val'),
    document.getElementById('s1-s3-val')
  ];
  const s1Gear = document.getElementById('s1-gear');
  const s1Speed = document.getElementById('s1-speed');
  const s1Drs = document.getElementById('s1-drs');
  const s1BrkBar = document.getElementById('s1-brk-bar');
  const s1ThrBar = document.getElementById('s1-thr-bar');
  const s1Compound = document.getElementById('s1-compound');
  const s1TireAge = document.getElementById('s1-tire-age');
  const s1PitBadge = document.getElementById('s1-pit-badge');
  const s1PitTime = document.getElementById('s1-pit-time');

  const s2Code = document.getElementById('s2-code');
  const s2Pos = document.getElementById('s2-pos');
  const s2BestLap = document.getElementById('s2-best-lap');
  const s2SecBoxes = [
    document.getElementById('s2-sec-1'),
    document.getElementById('s2-sec-2'),
    document.getElementById('s2-sec-3')
  ];
  const s2SecVals = [
    document.getElementById('s2-s1-val'),
    document.getElementById('s2-s2-val'),
    document.getElementById('s2-s3-val')
  ];
  const s2Gear = document.getElementById('s2-gear');
  const s2Speed = document.getElementById('s2-speed');
  const s2Drs = document.getElementById('s2-drs');
  const s2BrkBar = document.getElementById('s2-brk-bar');
  const s2ThrBar = document.getElementById('s2-thr-bar');
  const s2Compound = document.getElementById('s2-compound');
  const s2TireAge = document.getElementById('s2-tire-age');
  const s2PitBadge = document.getElementById('s2-pit-badge');
  const s2PitTime = document.getElementById('s2-pit-time');

  // Tower Elements
  const towerSessionEl = document.getElementById('tower-session');
  const towerTrackName = document.getElementById('tower-track-name');
  const towerTickerText1 = document.getElementById('tower-ticker-text-1');
  const towerTickerText2 = document.getElementById('tower-ticker-text-2');
  const leaderboardListEl = document.getElementById('leaderboard-list');

  // Race Selector Elements
  const raceOptionLive = document.getElementById('race-option-live');
  const pastRacesListEl = document.getElementById('past-races-list');
  const btnBrowsePast = document.getElementById('btn-browse-past-races');
  const btnRetryLive = document.getElementById('btn-retry-live');
  const btnOpenF1Key = document.getElementById('btn-openf1-key');
  const btnEnterKey = document.getElementById('btn-enter-key');
  const liveKeyIndicator = document.getElementById('live-key-indicator');
  const liveCardSub = document.getElementById('live-card-sub');
  const seasonPills = document.querySelectorAll('.season-pill');
  const btnRestartLap = document.getElementById('btn-restart-lap');
  const btnRestartTower = document.getElementById('btn-restart-tower');
  const btnStartReplayLap1 = document.getElementById('btn-start-replay-lap1');

  // Flag Alert & Viewport Elements
  const appViewport = document.getElementById('app');
  const flagBannerEl = document.getElementById('flag-alert-banner');
  const flagBadgePill = document.getElementById('flag-badge-pill');
  const flagMsgText = document.getElementById('flag-msg-text');
  const btnCloseFlag = document.getElementById('btn-close-flag');
  const btnSplitPrevTeam = document.getElementById('btn-split-prev-team');
  const btnSplitNextTeam = document.getElementById('btn-split-next-team');

  let currentFlagState = null;
  let flagDismissedUntilChange = false;
  let lastFlagType = 'GREEN';
  let greenBannerTimer = null;

  // Notifications
  const toastEl = document.getElementById('toast');
  const connErrorEl = document.getElementById('connection-error');

  let toastTimer = null;
  function showToast(text) {
    toastEl.textContent = text;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 1200);
  }

  // Lap Time & Fastest Lap Helpers
  function parseLapTimeMs(str) {
    if (!str || typeof str !== 'string') return NaN;
    const clean = str.trim();
    if (!clean || clean.includes('--')) return NaN;
    const parts = clean.split(':');
    if (parts.length === 2) {
      const min = parseFloat(parts[0]);
      const sec = parseFloat(parts[1]);
      if (isNaN(min) || isNaN(sec)) return NaN;
      return min * 60000 + sec * 1000;
    }
    const sec = parseFloat(clean);
    return isNaN(sec) ? NaN : sec * 1000;
  }

  function getStopwatchSvg(size = 11) {
    return `<svg class="purple-stopwatch-icon" viewBox="0 0 16 16" width="${size}" height="${size}" fill="none" stroke="#B138DD" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-label="Fastest Lap"><circle cx="8" cy="9" r="6"/><path d="M8 6v3l2 1"/><path d="M8 1v2"/><path d="M6 1h4"/></svg>`;
  }

  function getFastestLapDriverNumber(driverList) {
    if (!driverList || !driverList.length) return null;
    let minMs = Infinity;
    let fastestNum = null;
    driverList.forEach(d => {
      const bl = d.bestLap;
      if (bl) {
        const ms = parseLapTimeMs(bl);
        if (!isNaN(ms) && ms > 0 && ms < minMs) {
          minMs = ms;
          fastestNum = d.number;
        }
      }
    });
    return fastestNum;
  }

  // Wake Lock
  async function requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        await navigator.wakeLock.request('screen');
        console.log('[RF1] Screen WakeLock active');
      } catch (err) {
        console.warn('[RF1] WakeLock unavailable:', err.message);
      }
    }
  }

  // Populate Past Races List in Race Selector
  function renderPastRacesList(filter = currentSeasonFilter) {
    if (!window.TrackManager) return;
    const tracks = window.TrackManager.getTracksBySeason(filter);
    pastRacesListEl.innerHTML = '';

    if (!tracks || tracks.length === 0) {
      pastRacesListEl.innerHTML = '<div style="font-size: 8px; color: #666; text-align: center; padding: 12px 0;">NO RACES FOUND</div>';
      return;
    }

    tracks.forEach(track => {
      const card = document.createElement('div');
      card.className = `race-card ${track.id === currentTrackId && activeMode === 'REPLAY' ? 'active' : ''}`;
      card.dataset.trackId = track.id;
      const roundTag = track.round ? `${track.round} • ` : '';
      const winnerTag = track.winner ? ` • 🏆 ${track.winner}` : '';
      card.innerHTML = `
        <div class="race-card-info">
          <div class="race-card-title">${track.flag} ${roundTag}${track.name}</div>
          <div class="race-card-sub">${track.gp} • ${track.season} • ${track.laps} LAPS${winnerTag}</div>
        </div>
        <svg viewBox="${track.viewBox || '0 0 500 500'}" class="race-card-mini-svg">
          <path d="${track.svgPath}" fill="none" stroke="#FE5000" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      `;

      card.addEventListener('click', () => {
        selectTrack(track.id);
      });

      pastRacesListEl.appendChild(card);
    });
  }

  function restartRace() {
    if (activeMode === 'LIVE') {
      showToast('🔄 REFRESHING LIVE TRACK...');
      refreshActiveView();
      return;
    }
    if (window.F1Simulator) {
      window.F1Simulator.restart();
    }
    refreshActiveView();
    showToast('↺ RESTARTED FROM LAP 1');
  }

  async function updateKeyIndicators() {
    const liveClient = window.F1LiveTiming;
    if (!liveClient) return;

    try {
      const leaderboard = await liveClient.getLeaderboard();
      const isLive = liveClient.isSessionLive(leaderboard);
      const summary = liveClient.getSessionSummary(leaderboard);

      if (liveKeyIndicator) {
        if (isLive) {
          liveKeyIndicator.textContent = 'LIVE NOW';
          liveKeyIndicator.className = 'live-key-tag live-active';
        } else {
          liveKeyIndicator.textContent = 'STANDBY';
          liveKeyIndicator.className = 'live-key-tag standby';
        }
      }

      if (liveCardSub) {
        if (isLive) {
          liveCardSub.textContent = `🟢 Track Active • ${leaderboard.Session?.Name || 'Live'}`;
        } else {
          lastFinalisedLiveRawData = leaderboard;
          const sName = leaderboard.Session?.Name || 'Session';
          liveCardSub.textContent = `🏁 ${sName} Finalised • Tap to Replay`;
        }
      }
    } catch (err) {
      if (liveKeyIndicator) {
        liveKeyIndicator.textContent = 'STANDBY';
        liveKeyIndicator.className = 'live-key-tag standby';
      }
      if (liveCardSub) {
        liveCardSub.textContent = 'Track Inactive • Session Starts 13:30 BST';
      }
    }
  }

  function promptForApiKey() {
    const currentUrl = (window.F1LiveTiming && window.F1LiveTiming.baseUrl) || 'https://f1-livetiming-api-z44n.onrender.com';
    const input = prompt('Live Timing Feed URL (or custom server):', currentUrl);
    if (input !== null) {
      const clean = input.trim() || 'https://f1-livetiming-api-z44n.onrender.com';
      if (window.F1LiveTiming) {
        window.F1LiveTiming.setServerUrl(clean);
      }
      updateKeyIndicators();
      showToast('LIVE FEED SET');
    }
  }

  // Replay the session that just concluded on the live timing feed
  async function replayCompletedLiveSession() {
    showToast('LOADING RECENT SESSION...');
    try {
      let rawData = lastFinalisedLiveRawData;
      if (!rawData && window.F1LiveTiming) {
        rawData = await window.F1LiveTiming.getLeaderboard();
      }
      let rcData = null;
      if (window.F1LiveTiming) {
        rcData = await window.F1LiveTiming.getRaceControl();
      }
      if (rawData && rawData.Lines && window.F1Simulator) {
        const ok = window.F1Simulator.loadSessionFromLive(rawData, rcData);
        if (ok) {
          activeMode = 'REPLAY';
          drivers = window.F1Simulator.getDrivers();
          teams = window.F1Simulator.getTeams();
          currentDriverIndex = 0;
          currentTeamIndex = 0;
          currentTrackId = 'singapore';

          const track = window.TrackManager ? window.TrackManager.getTrackById('singapore') : null;
          if (track) {
            if (trackWatermarkSvg && track.viewBox) {
              trackWatermarkSvg.setAttribute('viewBox', track.viewBox);
            }
            trackWatermarkPath.setAttribute('d', track.svgPath);
          }
          if (hudTrackFlag) hudTrackFlag.textContent = '🇸🇬';
          const gpName = (rawData.Session?.Meeting?.Name || 'SINGAPORE GP').toUpperCase();
          if (hudTrackName) hudTrackName.textContent = 'SINGAPORE GP';
          if (splitTrackName) splitTrackName.textContent = gpName;
          if (towerTrackName) towerTrackName.textContent = gpName;

          const sDetails = window.F1LiveTiming ? window.F1LiveTiming.getSessionDetails(rawData) : null;
          const sPart = sDetails ? sDetails.part : (window.F1Simulator.sessionPart || 'SQ3');
          const sType = sDetails ? sDetails.sessionType : (window.F1Simulator.sessionType || 'QUALIFYING');
          const sFriendly = sDetails ? sDetails.friendlyName.toUpperCase() : 'SPRINT QUALI';

          if (towerSessionEl) {
            towerSessionEl.textContent = window.F1Simulator.isRace ? `L 1/${window.F1Simulator.totalLaps}` : sPart;
          }
          if (hudSessionSub) {
            if (window.F1Simulator.isRace) {
              hudSessionSub.textContent = window.F1Simulator.sessionPart === 'SPRINT' ? 'SPRINT' : 'GRAND PRIX';
            } else {
              hudSessionSub.textContent = `${sPart} ${sType}`.toUpperCase();
            }
          }
          updateTowerTicker(`🇸🇬 SINGAPORE GRAND PRIX • ${sPart} ${sFriendly} • 🏁 REPLAY`);

          updateHUDDriverHeader();
          restartRace();
          switchView('hud');
          const sName = rawData.Session?.Name ? rawData.Session.Name.toUpperCase() : 'SESSION';
          showToast(`▶ REPLAYING ${sName} (LAP 1)`);
          return;
        }
      }
    } catch (err) {
      console.warn('[RF1] Error loading finalised live session:', err);
    }
    selectTrack('singapore');
    restartRace();
  }

  // Select a Circuit
  function selectTrack(trackId) {
    currentTrackId = trackId;
    activeMode = 'REPLAY';
    if (window.F1Simulator) {
      window.F1Simulator.setTrack(trackId);
      drivers = window.F1Simulator.getDrivers();
      teams = window.F1Simulator.getTeams();
      currentDriverIndex = 0;
      currentTeamIndex = 0;
      updateHUDDriverHeader();
    }

    const track = window.TrackManager ? window.TrackManager.getTrackById(trackId) : null;
    if (track) {
      // Update background track watermark
      if (trackWatermarkSvg && track.viewBox) {
        trackWatermarkSvg.setAttribute('viewBox', track.viewBox);
      }
      trackWatermarkPath.setAttribute('d', track.svgPath);
      // Update header badges
      if (hudTrackFlag) hudTrackFlag.textContent = track.flag;
      if (hudTrackName) hudTrackName.textContent = (track.shortName || track.gp || track.name).replace(' GP', '').replace(' GRAND PRIX', '').toUpperCase();
      if (splitTrackName) splitTrackName.textContent = track.gp;
      if (towerTrackName) towerTrackName.textContent = track.gp;

      if (towerSessionEl) {
        towerSessionEl.textContent = `L 1/${track.laps || 62}`;
      }
      if (hudSessionSub) {
        hudSessionSub.textContent = track.round ? `${track.round} GRAND PRIX` : 'GRAND PRIX';
      }
      const gpTitle = (track.gp ? track.gp.replace(' GP', ' GRAND PRIX') : (track.name || track.shortName)).toUpperCase();
      const roundPrefix = track.round ? `${track.round} • ` : '';
      updateTowerTicker(`${track.flag} ${roundPrefix}${gpTitle} • 🏁 REPLAY`);

      showToast(`${track.flag} ${track.round ? `${track.round} ` : ''}${track.gp}`);
    }

    renderPastRacesList(currentSeasonFilter);

    // Switch to Cockpit HUD
    switchView('hud');
  }

  // Handle Live Race Selection
  async function selectLiveRace() {
    showToast('CHECKING TRACK STATUS...');
    try {
      if (window.F1LiveTiming) {
        const rawData = await window.F1LiveTiming.getLeaderboard();
        const isLive = window.F1LiveTiming.isSessionLive(rawData);

        if (isLive) {
          lastFinalisedLiveRawData = null; // Clear finalised session cache
          const liveDrivers = window.F1LiveTiming.parseLeaderboard(rawData);
          if (liveDrivers && liveDrivers.length > 0) {
            activeMode = 'LIVE';
            drivers = liveDrivers;
            const extractedTeams = window.F1LiveTiming.extractTeams(liveDrivers);
            if (extractedTeams.length > 0) teams = extractedTeams;
            currentDriverIndex = 0;
            currentTeamIndex = 0;

            const session = rawData.Session;
            let trackName = 'SINGAPORE GP';
            let trackFlag = '🇸🇬';
            if (session && session.Meeting) {
              const mName = session.Meeting.Name || 'Singapore Grand Prix';
              trackName = mName.toUpperCase();
              if (session.Meeting.Country && session.Meeting.Country.Code === 'SGP') {
                trackFlag = '🇸🇬';
                if (window.TrackManager) {
                  const t = window.TrackManager.getTrackById('singapore');
                  if (t) {
                    if (trackWatermarkSvg && t.viewBox) {
                      trackWatermarkSvg.setAttribute('viewBox', t.viewBox);
                    }
                    trackWatermarkPath.setAttribute('d', t.svgPath);
                  }
                }
              }
            }

            if (hudTrackFlag) hudTrackFlag.textContent = trackFlag;
            if (hudTrackName) hudTrackName.textContent = trackName.replace(' GRAND PRIX', '').replace(' GP', '');
            if (splitTrackName) splitTrackName.textContent = trackName;
            if (towerTrackName) towerTrackName.textContent = trackName;

            const sDetails = window.F1LiveTiming.getSessionDetails(rawData);
            const lapCount = rawData.LapCount || {};
            const liveLap = lapCount.CurrentLap || (drivers[0] && (drivers[0].laps || drivers[0].tireAge)) || 1;
            const liveTotal = lapCount.TotalLaps || 62;

            if (towerSessionEl) {
              towerSessionEl.textContent = sDetails.isRace ? `L ${liveLap}/${liveTotal}` : sDetails.part;
            }
            if (lapCounterEl) {
              lapCounterEl.textContent = sDetails.isRace ? `L ${liveLap}/${liveTotal}` : (sDetails.timeLeftText || sDetails.part);
            }
            if (hudSessionSub) {
              if (sDetails.isRace) {
                hudSessionSub.textContent = sDetails.part === 'SPRINT' ? 'SPRINT' : 'GRAND PRIX';
              } else {
                hudSessionSub.textContent = `${sDetails.part} ${sDetails.sessionType || 'QUALI'}`.toUpperCase();
              }
            }
            updateTowerTicker(sDetails.tickerText);

            updateHUDDriverHeader();
            showToast(`🔴 LIVE: ${trackName}`);
            switchView('hud');
            return;
          }
        } else {
          // Track is not actively running cars right now
          lastFinalisedLiveRawData = rawData;
          const summary = window.F1LiveTiming.getSessionSummary(rawData);
          const sDetails = window.F1LiveTiming.getSessionDetails(rawData);
          updateTowerTicker(sDetails.tickerText);
          if (towerSessionEl) {
            towerSessionEl.textContent = sDetails.isRace ? 'LIVE' : sDetails.part;
          }

          const titleEl = document.getElementById('no-live-title-el');
          const descEl = document.getElementById('no-live-desc-text');
          const btnReplay = document.getElementById('btn-start-replay-lap1');
          const sessTitle = summary.name ? summary.name.toUpperCase() : 'SESSION';
          if (titleEl) titleEl.textContent = `${sessTitle} FINALISED`;
          if (descEl) descEl.textContent = `The ${summary.meeting || 'Singapore GP'} session has completed. Replay this race from Lap 1 with the official standings and sector timings, or select a classic circuit.`;
          if (btnReplay) btnReplay.textContent = `▶ REPLAY ${sessTitle} (LAP 1)`;
          switchView('noLive');
          return;
        }
      }
    } catch (liveErr) {
      console.warn('[RF1] LiveTiming fetch error, checking OpenF1 fallback:', liveErr);
    }

    try {
      if (window.OpenF1) {
        const session = await window.OpenF1.getLatestSession();
        // If an active session is in progress
        if (session && session.session_type === 'Race') {
          activeMode = 'LIVE';
          if (hudTrackFlag) hudTrackFlag.textContent = '🔴';
          if (hudTrackName) hudTrackName.textContent = (session.circuit_short_name || 'LIVE RACE').toUpperCase();
          showToast('🔴 CONNECTED TO LIVE RACE');
          switchView('hud');
          return;
        }
      }
    } catch (err) {
      console.warn('[RF1] Live session check error:', err);
    }

    const descEl = document.getElementById('no-live-desc-text');
    if (descEl) descEl.textContent = 'No active session is currently running on track. Next session is scheduled for 13:30 BST.';

    // No live session found -> Show NO LIVE DATA state
    switchView('noLive');
  }

  // Load Driver & Team Rosters
  async function initData() {
    try {
      if (window.F1Simulator) {
        drivers = window.F1Simulator.getDrivers();
        teams = window.F1Simulator.getTeams();
      }
      connErrorEl.classList.add('hidden');
      updateHUDDriverHeader();
      renderPastRacesList(currentSeasonFilter);
      selectTrack('singapore'); // Initial track setup

      // Auto-connect if live race session is currently running on track!
      if (window.F1LiveTiming) {
        try {
          const rawData = await window.F1LiveTiming.getLeaderboard();
          const isLive = window.F1LiveTiming.isSessionLive(rawData);
          if (isLive) {
            lastFinalisedLiveRawData = null;
            const liveDrivers = window.F1LiveTiming.parseLeaderboard(rawData);
            if (liveDrivers && liveDrivers.length > 0) {
              activeMode = 'LIVE';
              drivers = liveDrivers;
              const extractedTeams = window.F1LiveTiming.extractTeams(liveDrivers);
              if (extractedTeams.length > 0) teams = extractedTeams;
              currentDriverIndex = 0;
              currentTeamIndex = 0;

              const session = rawData.Session;
              let trackName = 'SINGAPORE GP';
              let trackFlag = '🇸🇬';
              if (session && session.Meeting) {
                const mName = session.Meeting.Name || 'Singapore Grand Prix';
                trackName = mName.toUpperCase();
                if (session.Meeting.Country && session.Meeting.Country.Code === 'SGP') {
                  trackFlag = '🇸🇬';
                }
              }

              if (hudTrackFlag) hudTrackFlag.textContent = trackFlag;
              if (hudTrackName) hudTrackName.textContent = trackName.replace(' GRAND PRIX', '').replace(' GP', '');
              if (splitTrackName) splitTrackName.textContent = trackName;
              if (towerTrackName) towerTrackName.textContent = trackName;

              const sDetails = window.F1LiveTiming.getSessionDetails(rawData);
              const lapCount = rawData.LapCount || {};
              const liveLap = lapCount.CurrentLap || (drivers[0] && (drivers[0].laps || drivers[0].tireAge)) || 1;
              const liveTotal = lapCount.TotalLaps || 62;

              if (towerSessionEl) {
                towerSessionEl.textContent = sDetails.isRace ? `L ${liveLap}/${liveTotal}` : sDetails.part;
              }
              if (lapCounterEl) {
                lapCounterEl.textContent = sDetails.isRace ? `L ${liveLap}/${liveTotal}` : (sDetails.timeLeftText || sDetails.part);
              }
              if (hudSessionSub) {
                if (sDetails.isRace) {
                  hudSessionSub.textContent = sDetails.part === 'SPRINT' ? 'SPRINT' : 'GRAND PRIX';
                } else {
                  hudSessionSub.textContent = `${sDetails.part} ${sDetails.sessionType || 'QUALI'}`.toUpperCase();
                }
              }
              updateTowerTicker(sDetails.tickerText);
              updateHUDDriverHeader();
              updateKeyIndicators();
              showToast(`🔴 LIVE: ${trackName}`);
              switchView('hud');
              return;
            }
          }
        } catch (e) {
          console.warn('[RF1] Live check error during init:', e);
        }
      }

      updateKeyIndicators();
      switchView('races');
    } catch (err) {
      console.warn('[RF1] Init data error:', err);
    }
  }

  function getSelectedDriver() {
    if (!drivers || drivers.length === 0) {
      return { number: 1, code: 'NOR', color: '#FF8000', name: 'Lando Norris', teamIndex: 0 };
    }
    return drivers[currentDriverIndex];
  }

  function updateSessionTicker(text) {
    if (!text) return;
    if (towerTickerText1 && towerTickerText1.textContent !== text) {
      towerTickerText1.textContent = text;
    }
    if (towerTickerText2 && towerTickerText2.textContent !== text) {
      towerTickerText2.textContent = text;
    }
    if (hudTickerText1 && hudTickerText1.textContent !== text) {
      hudTickerText1.textContent = text;
    }
    if (hudTickerText2 && hudTickerText2.textContent !== text) {
      hudTickerText2.textContent = text;
    }
    if (splitTickerText1 && splitTickerText1.textContent !== text) {
      splitTickerText1.textContent = text;
    }
    if (splitTickerText2 && splitTickerText2.textContent !== text) {
      splitTickerText2.textContent = text;
    }
  }

  function getReplayTickerText() {
    const track = window.TrackManager ? window.TrackManager.getTrackById(currentTrackId) : null;
    const flag = track ? track.flag : '🏁';
    const roundPrefix = (track && track.round) ? `${track.round} • ` : '';
    const gpTitle = (track ? (track.gp ? track.gp.replace(' GP', ' GRAND PRIX') : track.shortName) : 'SINGAPORE GRAND PRIX').toUpperCase();
    const sim = window.F1Simulator;
    let part = (sim && sim.sessionPart) || (sim && sim.isRace ? 'GRAND PRIX' : 'QUALI');
    if (part === 'RACE') part = 'GRAND PRIX';
    else if (part === 'SQ3' || part === 'SQ2' || part === 'SQ1') part = `${part} SPRINT QUALI`;
    else if (part === 'Q3' || part === 'Q2' || part === 'Q1') part = `${part} QUALIFYING`;
    else if (part === 'FP1' || part === 'FP2' || part === 'FP3') part = `${part} PRACTICE`;
    return `${flag} ${roundPrefix}${gpTitle} • ${part} • 🏁 REPLAY`;
  }

  function updateTowerTicker(text) {
    updateSessionTicker(text);
  }

  function updateHUDDriverHeader() {
    const d = getSelectedDriver();
    driverCodeEl.textContent = d.code;
    driverNumEl.textContent = d.number;
    if (driverLastNameEl) {
      const parts = (d.name || d.code).split(' ');
      driverLastNameEl.textContent = parts[parts.length - 1].toUpperCase();
    }
    teamStripe.style.backgroundColor = d.color || '#FF8000';
    if (d.teamIndex !== undefined) {
      currentTeamIndex = d.teamIndex;
    } else if (teams && teams.length > 0) {
      const foundIdx = teams.findIndex(t => t.drivers && t.drivers.some(td => td.number === d.number));
      if (foundIdx !== -1) currentTeamIndex = foundIdx;
    }

    const fastestNum = getFastestLapDriverNumber(drivers);
    const isFastest = Boolean(d.isFastestLap || (fastestNum && d.number === fastestNum));
    const hudFastestEl = document.getElementById('hud-fastest-lap');
    if (hudFastestEl) {
      if (isFastest) hudFastestEl.classList.remove('hidden');
      else hudFastestEl.classList.add('hidden');
    }
  }

  // Select Driver explicitly (from Standings list)
  function selectDriver(driverNumber) {
    const idx = drivers.findIndex(d => d.number === parseInt(driverNumber, 10));
    if (idx !== -1) {
      currentDriverIndex = idx;
      updateHUDDriverHeader();
      showToast(`${drivers[idx].code} #${drivers[idx].number}`);
      if (window.F1Simulator) {
        const d = drivers[idx];
        const telem = window.F1Simulator.getDriverTelemetry(d.number);
        telem.number = d.number;
        telem.code = d.code;
        telem.pos = d.pos;
        telem.gap = d.gap;
        telem.tire = d.tire;
        telem.tireAge = d.tireAge !== undefined ? d.tireAge : 1;
        telem.pitStops = d.pitStops !== undefined ? d.pitStops : 0;
        telem.inPit = Boolean(d.inPit);
        telem.lastStopTime = d.lastStopTime || null;
        telem.bestLap = d.bestLap || telem.bestLap;
        telem.isFastestLap = Boolean(d.isFastestLap);
        if (activeMode === 'LIVE') {
          const raw = (window.F1LiveTiming && window.F1LiveTiming.cache && window.F1LiveTiming.cache.leaderboard) || lastFinalisedLiveRawData;
          const liveLap = raw?.LapCount?.CurrentLap || (window.F1LiveTiming && window.F1LiveTiming.lastLapCount && window.F1LiveTiming.lastLapCount.CurrentLap);
          const liveTotal = raw?.LapCount?.TotalLaps || (window.F1LiveTiming && window.F1LiveTiming.lastLapCount && window.F1LiveTiming.lastLapCount.TotalLaps) || 62;
          if (liveLap) {
            telem.lap = liveLap;
            telem.totalLaps = liveTotal;
            telem.isRace = true;
          }
        }
        renderHUD(telem);
      }
      switchView('hud');
    }
  }

  // Cycle Drivers (Scroll Wheel in HUD/Tower)
  function cycleDriver(delta) {
    if (drivers.length === 0) return;
    currentDriverIndex = (currentDriverIndex + delta + drivers.length) % drivers.length;
    updateHUDDriverHeader();
    showToast(`${drivers[currentDriverIndex].code} #${drivers[currentDriverIndex].number}`);
    if (window.F1Simulator) {
      const d = drivers[currentDriverIndex];
      const telem = window.F1Simulator.getDriverTelemetry(d.number);
      telem.number = d.number;
      telem.code = d.code;
      telem.pos = d.pos;
      telem.gap = d.gap;
      telem.tire = d.tire;
      telem.tireAge = d.tireAge !== undefined ? d.tireAge : 1;
      telem.pitStops = d.pitStops !== undefined ? d.pitStops : 0;
      telem.inPit = Boolean(d.inPit);
      telem.lastStopTime = d.lastStopTime || null;
      telem.bestLap = d.bestLap || telem.bestLap;
      telem.isFastestLap = Boolean(d.isFastestLap);
      if (activeMode === 'LIVE') {
        const raw = (window.F1LiveTiming && window.F1LiveTiming.cache && window.F1LiveTiming.cache.leaderboard) || lastFinalisedLiveRawData;
        const liveLap = raw?.LapCount?.CurrentLap || (window.F1LiveTiming && window.F1LiveTiming.lastLapCount && window.F1LiveTiming.lastLapCount.CurrentLap);
        const liveTotal = raw?.LapCount?.TotalLaps || (window.F1LiveTiming && window.F1LiveTiming.lastLapCount && window.F1LiveTiming.lastLapCount.TotalLaps) || 62;
        if (liveLap) {
          telem.lap = liveLap;
          telem.totalLaps = liveTotal;
          telem.isRace = true;
        }
      }
      renderHUD(telem);
    }
    fetchHUDTelemetry();
  }

  // Cycle Teams (Scroll Wheel, Navigation Buttons, or Touch Swipe in Split View)
  function cycleTeam(delta) {
    if (!teams || teams.length === 0) return;
    currentTeamIndex = (currentTeamIndex + delta + teams.length) % teams.length;
    const team = teams[currentTeamIndex];
    if (team && team.drivers && team.drivers.length > 0) {
      const dIdx = drivers.findIndex(d => d.number === team.drivers[0].number);
      if (dIdx !== -1) {
        currentDriverIndex = dIdx;
        const d = drivers[dIdx];
        driverCodeEl.textContent = d.code;
        driverNumEl.textContent = d.number;
        if (driverLastNameEl) {
          const parts = (d.name || d.code).split(' ');
          driverLastNameEl.textContent = parts[parts.length - 1].toUpperCase();
        }
        teamStripe.style.backgroundColor = d.color || '#FF8000';
      }
    }
    const teamTitle = (team.shortName || team.name || 'TEAM').toUpperCase();
    showToast(`TEAM: ${teamTitle}`);
    fetchSplitTelemetry();
  }

  // Switch View Tab ('races', 'hud', 'split', 'tower', 'noLive')
  function switchView(targetView) {
    activeView = targetView;

    // Toggle views
    Object.keys(views).forEach(v => {
      if (v === activeView) views[v].classList.add('active');
      else views[v].classList.remove('active');
    });

    // Toggle nav tab buttons
    Object.keys(navTabs).forEach(v => {
      if (v === activeView) navTabs[v].classList.add('active');
      else navTabs[v].classList.remove('active');
    });

    refreshActiveView();
  }

  // Cycle View (PTT / Side Button)
  function cycleView() {
    const sequence = ['races', 'hud', 'split', 'tower'];
    let nextIdx = sequence.indexOf(activeView);
    if (nextIdx === -1) nextIdx = 0;
    nextIdx = (nextIdx + 1) % sequence.length;
    switchView(sequence[nextIdx]);
  }

  // Flag Alert & Cockpit Warning Controller
  function updateFlagDisplay(flagState) {
    if (!flagState || !flagBannerEl) return;
    currentFlagState = flagState;
    const currentType = flagState.type;

    if (flagDismissedUntilChange && currentType === lastFlagType) {
      return;
    }
    if (currentType !== lastFlagType) {
      flagDismissedUntilChange = false;
    }

    // Clean up animation classes
    flagBannerEl.classList.remove('flag-yellow', 'flag-red', 'flag-sc', 'flag-green', 'flag-chequered');
    if (appViewport) {
      appViewport.classList.remove('flash-yellow-border', 'flash-red-border', 'flash-green-border');
    }

    if (flagState.isCaution) {
      clearTimeout(greenBannerTimer);
      flagBannerEl.classList.remove('hidden');

      if (currentType === 'YELLOW' || currentType === 'DOUBLE_YELLOW') {
        flagBannerEl.classList.add('flag-yellow');
        if (appViewport) appViewport.classList.add('flash-yellow-border');
        flagBadgePill.textContent = currentType === 'DOUBLE_YELLOW' ? '⚠️ DBL YEL' : '🟡 YELLOW';
        flagMsgText.textContent = flagState.msg || 'CAUTION IN SECTOR';
      } else if (currentType === 'RED') {
        flagBannerEl.classList.add('flag-red');
        if (appViewport) appViewport.classList.add('flash-red-border');
        flagBadgePill.textContent = '🔴 RED FLAG';
        flagMsgText.textContent = flagState.msg || 'SESSION SUSPENDED';
      } else if (currentType === 'SC' || currentType === 'VSC') {
        flagBannerEl.classList.add('flag-sc');
        if (appViewport) appViewport.classList.add('flash-yellow-border');
        flagBadgePill.textContent = currentType === 'VSC' ? '🟡 VSC' : '🟡 SAFETY CAR';
        flagMsgText.textContent = flagState.msg || 'DEPLOYED';
      }
    } else if (currentType === 'CHEQUERED') {
      if (lastFlagType !== 'CHEQUERED') {
        clearTimeout(greenBannerTimer);
        flagBannerEl.classList.remove('hidden');
        flagBannerEl.classList.add('flag-chequered');
        flagBadgePill.textContent = '🏁 FINISH';
        flagMsgText.textContent = 'CHEQUERED FLAG';

        // Auto-dismiss large banner after 6 seconds so it never obstructs telemetry
        greenBannerTimer = setTimeout(() => {
          flagBannerEl.classList.add('hidden');
        }, 6000);
      }
      if (hudFlagBadge) {
        hudFlagBadge.textContent = '🏁';
        hudFlagBadge.classList.remove('hidden');
      }
    } else if (currentType === 'GREEN') {
      if (hudFlagBadge) {
        hudFlagBadge.classList.add('hidden');
      }
      if (lastFlagType && lastFlagType !== 'GREEN') {
        // Just transitioned from caution to green
        flagBannerEl.classList.remove('hidden');
        flagBannerEl.classList.add('flag-green');
        if (appViewport) appViewport.classList.add('flash-green-border');
        flagBadgePill.textContent = '🟢 GREEN';
        flagMsgText.textContent = 'TRACK CLEAR';

        clearTimeout(greenBannerTimer);
        greenBannerTimer = setTimeout(() => {
          flagBannerEl.classList.add('hidden');
          if (appViewport) appViewport.classList.remove('flash-green-border');
        }, 3500);
      } else if (!flagBannerEl.classList.contains('flag-green')) {
        flagBannerEl.classList.add('hidden');
      }
    } else {
      if (hudFlagBadge) {
        hudFlagBadge.classList.add('hidden');
      }
    }

    lastFlagType = currentType;
  }

  // Pit Stop Alert Controller
  let pitBannerTimer = null;
  function showPitAlert(event) {
    if (!event || !flagBannerEl) return;
    if (currentFlagState && currentFlagState.isCaution) return;

    flagBannerEl.classList.remove('flag-yellow', 'flag-red', 'flag-sc', 'flag-green', 'flag-chequered', 'flag-pit');
    if (appViewport) {
      appViewport.classList.remove('flash-yellow-border', 'flash-red-border', 'flash-green-border');
    }

    flagBannerEl.classList.add('flag-pit');
    if (appViewport) appViewport.classList.add('flash-pit-border');
    flagBannerEl.classList.remove('hidden');

    if (event.type === 'ENTRY') {
      flagBadgePill.textContent = '🛑 PIT LANE';
      flagMsgText.textContent = `${event.name || event.code} #${event.driverNum} IN PIT LANE`;
    } else {
      flagBadgePill.textContent = '🛑 PIT STOP';
      flagMsgText.textContent = `${event.name || event.code} #${event.driverNum} • ${event.stopTime || '2.4s'} STOP`;
    }

    clearTimeout(pitBannerTimer);
    pitBannerTimer = setTimeout(() => {
      if (!currentFlagState || !currentFlagState.isCaution) {
        flagBannerEl.classList.add('hidden');
        if (appViewport) appViewport.classList.remove('flash-pit-border');
      }
    }, 5500);
  }

  // Update Shift Lights (Including Marshalling Lights Override)
  function updateShiftLights(rpmPct) {
    if (currentFlagState && currentFlagState.isCaution) {
      const isYellow = currentFlagState.type === 'YELLOW' || currentFlagState.type === 'DOUBLE_YELLOW' || currentFlagState.type === 'SC' || currentFlagState.type === 'VSC';
      const isRed = currentFlagState.type === 'RED';
      leds.forEach(led => {
        led.classList.remove('active', 'flash-purple', 'flag-led-yellow', 'flag-led-red', 'flag-led-green');
        if (isYellow) led.classList.add('flag-led-yellow');
        else if (isRed) led.classList.add('flag-led-red');
      });
      return;
    }

    const activeCount = Math.round((rpmPct / 100) * 12);
    leds.forEach((led, idx) => {
      led.classList.remove('flash-purple', 'flag-led-yellow', 'flag-led-red', 'flag-led-green');
      if (idx < activeCount) {
        led.classList.add('active');
        if (rpmPct > 95 && idx >= 8) {
          led.classList.add('flash-purple');
        }
      } else {
        led.classList.remove('active');
      }
    });
  }

  // Render HUD
  function renderHUD(data) {
    if (!data) return;

    driverPosEl.textContent = `P${data.pos}`;
    driverGapEl.textContent = data.gap;

    gearValEl.textContent = data.gear;
    speedValEl.textContent = data.speed;

    if (data.drs === 1) {
      drsPillEl.classList.add('active');
    } else {
      drsPillEl.classList.remove('active');
    }

    brakeFillEl.style.height = `${data.brake}%`;
    brakePctEl.textContent = `${data.brake}%`;

    throttleFillEl.style.height = `${data.throttle}%`;
    throttlePctEl.textContent = `${data.throttle}%`;

    updateShiftLights(data.rpmPct);

    tireCompoundEl.textContent = data.tire || 'M';
    tireCompoundEl.className = `compound-badge compound-${(data.tire || 'm').toLowerCase()}`;
    const tireAgeVal = data.tireAge !== undefined ? data.tireAge : 1;
    tireAgeEl.textContent = `${tireAgeVal} ${tireAgeVal === 1 ? 'LAP' : 'LAPS'}`;

    if (hudPitBadge) {
      if (data.inPit) {
        hudPitBadge.textContent = '🛑 IN PIT';
        hudPitBadge.className = 'hud-pit-badge in-pit';
      } else {
        const stops = data.pitStops !== undefined ? data.pitStops : 0;
        const timePart = data.lastStopTime ? ` (${data.lastStopTime})` : '';
        hudPitBadge.textContent = `${stops} ${stops === 1 ? 'STOP' : 'STOPS'}${timePart}`;
        hudPitBadge.className = 'hud-pit-badge';
      }
    }

    const fastestNum = getFastestLapDriverNumber(drivers);
    const isFastest = Boolean(data.isFastestLap || (fastestNum && data.number === fastestNum));
    const hudFastestEl = document.getElementById('hud-fastest-lap');
    if (hudFastestEl) {
      if (isFastest) hudFastestEl.classList.remove('hidden');
      else hudFastestEl.classList.add('hidden');
    }

    const isRace = data.isRace !== false;
    if (isRace) {
      lapCounterEl.textContent = `L ${data.lap || 1}/${data.totalLaps || 62}`;
      if (hudSessionSub) {
        const isSprint = data.sessionPart === 'SPRINT' || (data.sessionName && data.sessionName.toUpperCase().includes('SPRINT'));
        hudSessionSub.textContent = isSprint ? 'SPRINT' : 'GRAND PRIX';
      }
    } else {
      lapCounterEl.textContent = data.sessionCountdown || (activeMode === 'LIVE' ? (data.timeLeftText || data.sessionPart || 'LIVE') : `${data.lap || 1} LAPS`);
      if (hudSessionSub) {
        const subText = data.sessionPart ? `${data.sessionPart} ${data.sessionType || 'QUALI'}` : (data.sessionType || 'QUALIFYING');
        hudSessionSub.textContent = subText.toUpperCase();
      }
    }
  }

  // Render Teammate Split
  function renderSplit(teamData) {
    if (!teamData) return;

    if (splitTeamName) splitTeamName.textContent = teamData.teamShort;
    if (splitTeamStripe) splitTeamStripe.style.backgroundColor = teamData.teamColor || '#FF8000';
    if (splitDeltaBadge) {
      const dStr = teamData.delta || '+0.000s';
      splitDeltaBadge.textContent = dStr.startsWith('Δ') ? dStr : `Δ ${dStr}`;
    }

    const fastestNum = getFastestLapDriverNumber(drivers);

    // Driver 1
    const d1 = teamData.d1;
    if (s1Code) s1Code.textContent = d1.driver;
    if (s1Pos) s1Pos.textContent = `P${d1.pos}`;
    if (s1BestLap) s1BestLap.textContent = d1.bestLap || '--:--.---';
    const isFastest1 = Boolean(d1.isFastestLap || (fastestNum && d1.number === fastestNum));
    const s1FastestEl = document.getElementById('s1-fastest-lap');
    if (s1FastestEl) {
      if (isFastest1) s1FastestEl.classList.remove('hidden');
      else s1FastestEl.classList.add('hidden');
    }
    if (s1BestLap) {
      if (isFastest1) s1BestLap.classList.add('fastest-purple');
      else s1BestLap.classList.remove('fastest-purple');
    }
    if (d1.sectors && Array.isArray(d1.sectors)) {
      d1.sectors.forEach((sec, idx) => {
        if (s1SecBoxes[idx] && s1SecVals[idx]) {
          s1SecVals[idx].textContent = sec.val || '--.-';
          s1SecBoxes[idx].className = `split-sector-box ${sec.colorClass || 'sector-none'}`;
        }
      });
    }
    if (s1Gear) s1Gear.textContent = d1.gear;
    if (s1Speed) s1Speed.textContent = d1.speed;
    if (s1Drs) s1Drs.className = `split-drs-badge ${d1.drs === 1 ? 'active' : ''}`;
    if (s1BrkBar) s1BrkBar.style.height = `${d1.brake}%`;
    if (s1ThrBar) s1ThrBar.style.height = `${d1.throttle}%`;
    if (s1Compound) {
      s1Compound.textContent = d1.tire;
      s1Compound.className = `compound-badge compound-${(d1.tire || 'm').toLowerCase()}`;
    }
    if (s1TireAge) s1TireAge.textContent = `${d1.tireAge}L`;
    if (s1PitBadge) {
      if (d1.inPit) {
        s1PitBadge.textContent = 'IN PIT';
        s1PitBadge.className = 'split-pit-badge in-pit';
      } else {
        s1PitBadge.textContent = `${d1.pitStops !== undefined ? d1.pitStops : 0}P`;
        s1PitBadge.className = 'split-pit-badge';
      }
    }
    if (s1PitTime) {
      s1PitTime.textContent = d1.lastStopTime || '';
    }

    // Driver 2
    const d2 = teamData.d2;
    if (s2Code) s2Code.textContent = d2.driver;
    if (s2Pos) s2Pos.textContent = `P${d2.pos}`;
    if (s2BestLap) s2BestLap.textContent = d2.bestLap || '--:--.---';
    const isFastest2 = Boolean(d2.isFastestLap || (fastestNum && d2.number === fastestNum));
    const s2FastestEl = document.getElementById('s2-fastest-lap');
    if (s2FastestEl) {
      if (isFastest2) s2FastestEl.classList.remove('hidden');
      else s2FastestEl.classList.add('hidden');
    }
    if (s2BestLap) {
      if (isFastest2) s2BestLap.classList.add('fastest-purple');
      else s2BestLap.classList.remove('fastest-purple');
    }
    if (d2.sectors && Array.isArray(d2.sectors)) {
      d2.sectors.forEach((sec, idx) => {
        if (s2SecBoxes[idx] && s2SecVals[idx]) {
          s2SecVals[idx].textContent = sec.val || '--.-';
          s2SecBoxes[idx].className = `split-sector-box ${sec.colorClass || 'sector-none'}`;
        }
      });
    }
    if (s2Gear) s2Gear.textContent = d2.gear;
    if (s2Speed) s2Speed.textContent = d2.speed;
    if (s2Drs) s2Drs.className = `split-drs-badge ${d2.drs === 1 ? 'active' : ''}`;
    if (s2BrkBar) s2BrkBar.style.height = `${d2.brake}%`;
    if (s2ThrBar) s2ThrBar.style.height = `${d2.throttle}%`;
    if (s2Compound) {
      s2Compound.textContent = d2.tire;
      s2Compound.className = `compound-badge compound-${(d2.tire || 'm').toLowerCase()}`;
    }
    if (s2TireAge) s2TireAge.textContent = `${d2.tireAge}L`;
    if (s2PitBadge) {
      if (d2.inPit) {
        s2PitBadge.textContent = 'IN PIT';
        s2PitBadge.className = 'split-pit-badge in-pit';
      } else {
        s2PitBadge.textContent = `${d2.pitStops !== undefined ? d2.pitStops : 0}P`;
        s2PitBadge.className = 'split-pit-badge';
      }
    }
    if (s2PitTime) {
      s2PitTime.textContent = d2.lastStopTime || '';
    }
  }

  // Render Standings List
  function renderLeaderboard(list) {
    if (!list || !Array.isArray(list)) return;
    const currentNum = getSelectedDriver().number;
    const fastestNum = getFastestLapDriverNumber(list);

    leaderboardListEl.innerHTML = '';
    list.forEach(item => {
      const isFastest = Boolean(item.isFastestLap || (fastestNum && item.number === fastestNum));
      const li = document.createElement('li');
      li.className = `tower-row ${item.number === currentNum ? 'selected' : ''}`;
      li.dataset.driverNumber = item.number;
      li.innerHTML = `
        <div class="tower-driver-info">
          <span class="tower-pos">P${item.pos}</span>
          <span class="tower-color-pill" style="background-color: ${item.teamColor || '#FFF'}"></span>
          <span class="tower-code">${item.code}</span>
          ${isFastest ? `
            <span class="purple-stopwatch-badge tower-fastest-badge" title="Fastest Lap">
              <svg class="purple-stopwatch-icon" viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="#B138DD" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="8" cy="9" r="6"/>
                <path d="M8 6v3l2 1"/>
                <path d="M8 1v2"/>
                <path d="M6 1h4"/>
              </svg>
            </span>
          ` : ''}
        </div>
        <div class="tower-timing">
          <span class="compound-badge compound-${(item.tire || 'm').toLowerCase()}">${item.tire || 'M'}</span>
          <span class="tower-pit-badge ${item.inPit ? 'in-pit' : ''}">${item.inPit ? 'PIT' : `${item.pitStops !== undefined ? item.pitStops : 0}P`}</span>
          <span class="tower-gap ${isFastest && !item.inPit ? 'fastest-purple' : ''}">${item.inPit ? '<span class="tower-in-pit-tag">IN PIT</span>' : item.gap}</span>
        </div>
      `;

      li.addEventListener('click', (e) => {
        e.stopPropagation();
        selectDriver(item.number);
      });

      leaderboardListEl.appendChild(li);
    });
  }

  // Telemetry Fetchers
  async function fetchHUDTelemetry() {
    if (isFetching || activeView !== 'hud') return;
    isFetching = true;
    try {
      let data = null;

      if (activeMode === 'LIVE' && window.F1LiveTiming) {
        let rawData = null;
        try {
          rawData = await window.F1LiveTiming.getLeaderboard();
          const liveDrivers = window.F1LiveTiming.parseLeaderboard(rawData);
          if (liveDrivers && liveDrivers.length) {
            drivers = liveDrivers;
          }
        } catch (e) {}

        const current = getSelectedDriver();
        const updated = drivers.find(d => d.number === current.number) || drivers[0];
        driverPosEl.textContent = `P${updated.pos}`;
        driverGapEl.textContent = updated.gap;

        if (window.F1Simulator) {
          data = window.F1Simulator.getDriverTelemetry(current.number);
          const liveD = drivers.find(d => d.number === current.number) || current;
          data.number = liveD.number;
          data.code = liveD.code;
          data.pos = liveD.pos;
          data.gap = liveD.gap;
          data.tire = liveD.tire;
          data.tireAge = liveD.tireAge !== undefined ? liveD.tireAge : 1;
          data.pitStops = liveD.pitStops !== undefined ? liveD.pitStops : 0;
          data.inPit = Boolean(liveD.inPit);
          data.lastStopTime = liveD.lastStopTime || null;
          data.bestLap = liveD.bestLap || data.bestLap;
          data.isFastestLap = Boolean(liveD.isFastestLap);

          const raw = rawData || (window.F1LiveTiming.cache && window.F1LiveTiming.cache.leaderboard) || lastFinalisedLiveRawData;
          if (raw) {
            const sDetails = window.F1LiveTiming.getSessionDetails(raw);
            data.isRace = sDetails.isRace;
            data.sessionType = sDetails.sessionType;
            data.sessionPart = sDetails.part;
            data.sessionName = sDetails.sessionName;
            data.timeLeftText = sDetails.timeLeftText;
            if (sDetails.currentLap) data.lap = sDetails.currentLap;
            if (sDetails.totalLaps) data.totalLaps = sDetails.totalLaps;
            updateSessionTicker(sDetails.tickerText);
          }
          const liveLap = (raw && raw.LapCount && raw.LapCount.CurrentLap) ||
                          (window.F1LiveTiming.lastLapCount && window.F1LiveTiming.lastLapCount.CurrentLap) ||
                          (data.isRace ? data.lap : null);
          const liveTotal = (raw && raw.LapCount && raw.LapCount.TotalLaps) ||
                            (window.F1LiveTiming.lastLapCount && window.F1LiveTiming.lastLapCount.TotalLaps) ||
                            data.totalLaps || 62;
          if (liveLap) {
            data.lap = liveLap;
            data.isRace = true;
          }
          if (liveTotal) {
            data.totalLaps = liveTotal;
          }
          data.driverLaps = liveD.laps || liveD.tireAge || 1;
        }
      } else if (activeMode === 'REPLAY' && window.F1Simulator) {
        const current = getSelectedDriver();
        data = window.F1Simulator.getDriverTelemetry(current.number);
        updateSessionTicker(getReplayTickerText());
      } else if (activeMode === 'LIVE' && window.OpenF1) {
        const current = getSelectedDriver();
        data = await window.OpenF1.getTelemetry(current.number);
      } else {
        const current = getSelectedDriver();
        const res = await fetch(`/api/telemetry?driver=${current.number}`);
        data = await res.json();
      }
      connErrorEl.classList.add('hidden');
      if (data) renderHUD(data);
    } catch (err) {
      console.warn('[RF1] HUD fetch error:', err);
      if (window.F1Simulator) {
        renderHUD(window.F1Simulator.getDriverTelemetry(getSelectedDriver().number));
      }
    } finally {
      isFetching = false;
    }
  }

  async function fetchSplitTelemetry() {
    if (isFetching || activeView !== 'split') return;
    isFetching = true;
    try {
      let teamData = null;
      if (activeMode === 'LIVE' && window.F1LiveTiming) {
        try {
          const rawData = await window.F1LiveTiming.getLeaderboard();
          const liveDrivers = window.F1LiveTiming.parseLeaderboard(rawData);
          if (liveDrivers && liveDrivers.length) {
            drivers = liveDrivers;
            const extractedTeams = window.F1LiveTiming.extractTeams(liveDrivers);
            if (extractedTeams.length > 0) teams = extractedTeams;
          }
        } catch (e) {}
      }

      if (activeMode === 'LIVE' && window.F1LiveTiming && teams.length > 0) {
        const team = teams[currentTeamIndex] || teams[0];
        const d1 = team.drivers[0];
        const d2 = team.drivers[1];

        const liveD1 = drivers.find(d => d.number === d1.number) || d1;
        const liveD2 = drivers.find(d => d.number === d2.number) || d2;

        const sim1 = window.F1Simulator ? window.F1Simulator.getDriverTelemetry(d1.number) : {};
        const sim2 = window.F1Simulator ? window.F1Simulator.getDriverTelemetry(d2.number) : {};

        let deltaStr = `${(Math.abs(liveD2.pos - liveD1.pos) * 0.35 + 0.12).toFixed(2)}s`;
        const parseLapMs = (str) => {
          if (!str) return NaN;
          const parts = str.split(':');
          if (parts.length === 2) {
            return parseFloat(parts[0]) * 60000 + parseFloat(parts[1]) * 1000;
          }
          return parseFloat(str) * 1000;
        };

        const b1 = liveD1.bestLap || sim1.bestLap;
        const b2 = liveD2.bestLap || sim2.bestLap;
        if (b1 && b2) {
          const ms1 = parseLapMs(b1);
          const ms2 = parseLapMs(b2);
          if (!isNaN(ms1) && !isNaN(ms2)) {
            const diff = Math.abs((ms2 - ms1) / 1000);
            deltaStr = `+${diff.toFixed(3)}s`;
          }
        }

        teamData = {
          teamShort: (team.shortName || team.name || 'TEAM').toUpperCase(),
          teamColor: team.color || '#FE5000',
          delta: deltaStr,
          d1: {
            driver: liveD1.code,
            number: liveD1.number,
            pos: liveD1.pos,
            bestLap: b1 || '--:--.---',
            isFastestLap: Boolean(liveD1.isFastestLap),
            sectors: (liveD1.sectors && liveD1.sectors.length) ? liveD1.sectors : (sim1.sectors || []),
            gear: sim1.gear || 7,
            speed: liveD1.inPit ? 80 : (sim1.speed || 310),
            drs: liveD1.inPit ? 0 : (sim1.drs || 0),
            brake: sim1.brake || 0,
            throttle: sim1.throttle || 100,
            tire: liveD1.tire || 'M',
            tireAge: liveD1.tireAge !== undefined ? liveD1.tireAge : 1,
            pitStops: liveD1.pitStops !== undefined ? liveD1.pitStops : 0,
            inPit: Boolean(liveD1.inPit),
            lastStopTime: liveD1.lastStopTime || null
          },
          d2: {
            driver: liveD2.code,
            number: liveD2.number,
            pos: liveD2.pos,
            bestLap: b2 || '--:--.---',
            isFastestLap: Boolean(liveD2.isFastestLap),
            sectors: (liveD2.sectors && liveD2.sectors.length) ? liveD2.sectors : (sim2.sectors || []),
            gear: sim2.gear || 7,
            speed: liveD2.inPit ? 80 : (sim2.speed || 306),
            drs: liveD2.inPit ? 0 : (sim2.drs || 0),
            brake: sim2.brake || 0,
            throttle: sim2.throttle || 95,
            tire: liveD2.tire || 'M',
            tireAge: liveD2.tireAge !== undefined ? liveD2.tireAge : 1,
            pitStops: liveD2.pitStops !== undefined ? liveD2.pitStops : 0,
            inPit: Boolean(liveD2.inPit),
            lastStopTime: liveD2.lastStopTime || null
          }
        };
      } else if (window.F1Simulator) {
        teamData = window.F1Simulator.getTeamTelemetry(currentTeamIndex);
        updateSessionTicker(getReplayTickerText());
      }
      connErrorEl.classList.add('hidden');
      if (teamData) renderSplit(teamData);
    } catch (err) {
      console.warn('[RF1] Split fetch error:', err ? (err.stack || err.message) : err);
    } finally {
      isFetching = false;
    }
  }

  async function fetchTowerData() {
    if (isFetching || activeView !== 'tower') return;
    isFetching = true;
    try {
      let list = null;
      if (activeMode === 'LIVE' && window.F1LiveTiming) {
        try {
          const rawData = await window.F1LiveTiming.getLeaderboard();
          const rcData = await window.F1LiveTiming.getRaceControl();
          const liveDrivers = window.F1LiveTiming.parseLeaderboard(rawData);
          if (liveDrivers && liveDrivers.length) {
            drivers = liveDrivers;
            list = liveDrivers.map(d => ({
              number: d.number,
              code: d.code,
              pos: d.pos,
              gap: d.gap,
              tire: d.tire,
              teamColor: d.color,
              bestLap: d.bestLap,
              isFastestLap: Boolean(d.isFastestLap),
              pitStops: d.pitStops !== undefined ? d.pitStops : 0,
              inPit: Boolean(d.inPit),
              lastStopTime: d.lastStopTime || null
            }));
          }
          const sessionDetails = window.F1LiveTiming.getSessionDetails(rawData, rcData);
          if (towerSessionEl) {
            if (sessionDetails.isRace && sessionDetails.currentLap) {
              towerSessionEl.textContent = `L ${sessionDetails.currentLap}/${sessionDetails.totalLaps || 62}`;
            } else {
              towerSessionEl.textContent = sessionDetails.isRace ? 'LIVE' : sessionDetails.part;
            }
          }
          updateTowerTicker(sessionDetails.tickerText);
        } catch (liveErr) {
          if (window.F1Simulator) {
            list = window.F1Simulator.getLeaderboard();
          }
        }
      } else if (window.F1Simulator) {
        list = window.F1Simulator.getLeaderboard();
        const telem = window.F1Simulator.computeTelemetry();
        if (towerSessionEl) {
          if (telem.isRace) {
            towerSessionEl.textContent = `L ${telem.lap}/${telem.totalLaps}`;
          } else {
            towerSessionEl.textContent = telem.sessionPart || 'QUALI';
          }
        }
        updateTowerTicker(getReplayTickerText());
      }
      connErrorEl.classList.add('hidden');
      if (list) renderLeaderboard(list);
    } catch (err) {
      console.warn('[RF1] Tower fetch error:', err);
    } finally {
      isFetching = false;
    }
  }

  async function checkFlagStatus() {
    try {
      let flagState = null;
      if (activeMode === 'LIVE' && window.F1LiveTiming) {
        const rcData = await window.F1LiveTiming.getRaceControl();
        flagState = window.F1LiveTiming.parseFlagState(rcData);
      } else if (window.F1Simulator) {
        flagState = window.F1Simulator.getFlagState();
      }
      if (flagState) {
        updateFlagDisplay(flagState);
      }
    } catch (e) {
      console.warn('[RF1] Flag check error:', e);
    }
  }

  function refreshActiveView() {
    checkFlagStatus();
    if (activeView === 'hud') fetchHUDTelemetry();
    else if (activeView === 'split') fetchSplitTelemetry();
    else if (activeView === 'tower') fetchTowerData();
  }

  // Polling Loop (850ms)
  function startPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(refreshActiveView, 850);
  }

  // Setup Hardware & Touch Handlers
  function setupEvents() {
    // 1. Hardware Bridge
    if (window.RF1Hardware) {
      window.RF1Hardware.init();

      // Mechanical Scroll Wheel
      window.RF1Hardware.on('scrollUp', () => {
        if (activeView === 'hud') cycleDriver(-1);
        else if (activeView === 'split') cycleTeam(-1);
        else if (activeView === 'tower') cycleDriver(-1);
        else if (activeView === 'races') {
          // Scroll up race selection
          const container = document.querySelector('.races-list-container');
          if (container) container.scrollTop -= 50;
        }
      });

      window.RF1Hardware.on('scrollDown', () => {
        if (activeView === 'hud') cycleDriver(1);
        else if (activeView === 'split') cycleTeam(1);
        else if (activeView === 'tower') cycleDriver(1);
        else if (activeView === 'races') {
          const container = document.querySelector('.races-list-container');
          if (container) container.scrollTop += 50;
        }
      });

      // Side Button (PTT)
      window.RF1Hardware.on('sideClick', () => {
        cycleView();
      });
    }

    // 2. Navigation Tab Clicks
    navTabs.races.addEventListener('click', () => switchView('races'));
    navTabs.hud.addEventListener('click', () => switchView('hud'));
    navTabs.split.addEventListener('click', () => switchView('split'));
    navTabs.tower.addEventListener('click', () => switchView('tower'));

    // 3. Header Race Badges (tap to open Race Selector)
    Object.values(raceHeaderBadges).forEach(btn => {
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          switchView('races');
        });
      }
    });

    // 4. Live Race Option Card
    raceOptionLive.addEventListener('click', () => {
      selectLiveRace();
    });

    // 5. Season Filter Pills
    seasonPills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        seasonPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentSeasonFilter = pill.dataset.season || 'ALL';
        renderPastRacesList(currentSeasonFilter);
      });
    });

    // 6. OpenF1 API Key Header Button
    if (btnOpenF1Key) {
      btnOpenF1Key.addEventListener('click', (e) => {
        e.stopPropagation();
        promptForApiKey();
      });
    }

    // 7. No Live Data Action Buttons
    btnBrowsePast.addEventListener('click', () => switchView('races'));
    btnRetryLive.addEventListener('click', () => selectLiveRace());
    if (btnEnterKey) {
      btnEnterKey.addEventListener('click', () => {
        promptForApiKey();
        selectLiveRace();
      });
    }
    if (btnStartReplayLap1) {
      btnStartReplayLap1.addEventListener('click', () => {
        replayCompletedLiveSession();
      });
    }

    // 8. Restart from Lap 1 Buttons
    if (btnRestartLap) {
      btnRestartLap.addEventListener('click', (e) => {
        e.stopPropagation();
        restartRace();
      });
    }
    if (btnRestartTower) {
      btnRestartTower.addEventListener('click', (e) => {
        e.stopPropagation();
        restartRace();
      });
    }

    // 6. Teammate Split Columns: tap either teammate to focus them on HUD
    splitCol1.addEventListener('click', () => {
      const team = teams[currentTeamIndex];
      if (team) selectDriver(team.drivers[0].number);
    });
    splitCol2.addEventListener('click', () => {
      const team = teams[currentTeamIndex];
      if (team) selectDriver(team.drivers[1].number);
    });

    // 7. Teammate Split Team Navigation Arrows & Title
    if (btnSplitPrevTeam) {
      btnSplitPrevTeam.addEventListener('click', (e) => {
        e.stopPropagation();
        cycleTeam(-1);
      });
    }
    if (btnSplitNextTeam) {
      btnSplitNextTeam.addEventListener('click', (e) => {
        e.stopPropagation();
        cycleTeam(1);
      });
    }
    if (splitTeamName) {
      splitTeamName.addEventListener('click', (e) => {
        e.stopPropagation();
        cycleTeam(1);
      });
    }

    // Touch Swipe Gestures for Split View
    const splitViewEl = document.getElementById('view-split');
    if (splitViewEl) {
      let touchStartX = 0;
      let touchStartY = 0;
      splitViewEl.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches.length > 0) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      }, { passive: true });

      splitViewEl.addEventListener('touchend', (e) => {
        if (e.changedTouches && e.changedTouches.length > 0) {
          const diffX = e.changedTouches[0].clientX - touchStartX;
          const diffY = e.changedTouches[0].clientY - touchStartY;
          if (Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX < -25) cycleTeam(1); // Swipe left -> Next team
            else if (diffX > 25) cycleTeam(-1); // Swipe right -> Prev team
          } else {
            if (diffY < -25) cycleTeam(1); // Swipe up -> Next team
            else if (diffY > 25) cycleTeam(-1); // Swipe down -> Prev team
          }
        }
      }, { passive: true });
    }

    // 8. Flag Banner Dismiss
    if (btnCloseFlag) {
      btnCloseFlag.addEventListener('click', (e) => {
        e.stopPropagation();
        flagDismissedUntilChange = true;
        if (flagBannerEl) flagBannerEl.classList.add('hidden');
        if (appViewport) {
          appViewport.classList.remove('flash-yellow-border', 'flash-red-border');
        }
      });
    }

    // 9. Device Sleep / Wake
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        console.log('[RF1] Display woke, resuming telemetry');
        requestWakeLock();
        refreshActiveView();
        startPolling();
      }
    });

    // 10. Pit Stop Event Subscriptions
    if (window.F1LiveTiming) {
      window.F1LiveTiming.onPitEvent(showPitAlert);
    }
    if (window.F1Simulator) {
      window.F1Simulator.onPitEvent(showPitAlert);
    }
  }

  // Startup
  requestWakeLock();
  setupEvents();
  initData();
  startPolling();
})();
