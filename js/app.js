// RF1 — Rabbit R1 Formula 1 Telemetry Companion
// Full support for Cockpit HUD, Teammate Split, Standings Selection, and Hardware Events

(function() {
  'use strict';

  // State
  let drivers = [];
  let teams = [];
  let currentDriverIndex = 0;
  let currentTeamIndex = 0;
  let activeView = 'hud'; // 'hud', 'split', 'tower'
  let activeMode = 'SIM'; // 'SIM' or 'LIVE'
  let pollTimer = null;
  let isFetching = false;

  // Views & Tabs
  const views = {
    hud: document.getElementById('view-hud'),
    split: document.getElementById('view-split'),
    tower: document.getElementById('view-tower')
  };

  const navTabs = {
    hud: document.getElementById('nav-btn-hud'),
    split: document.getElementById('nav-btn-split'),
    tower: document.getElementById('nav-btn-tower')
  };

  // Mode buttons across headers
  const modeButtons = [
    document.getElementById('btn-mode-hud'),
    document.getElementById('btn-mode-split'),
    document.getElementById('btn-mode-tower')
  ];

  // HUD Elements
  const teamStripe = document.getElementById('team-stripe');
  const driverCodeEl = document.getElementById('driver-code');
  const driverNumEl = document.getElementById('driver-num');
  const driverPosEl = document.getElementById('driver-pos');
  const driverGapEl = document.getElementById('driver-gap');
  const gearValEl = document.getElementById('gear-val');
  const speedValEl = document.getElementById('speed-val');
  const drsPillEl = document.getElementById('drs-pill');
  const brakeFillEl = document.getElementById('brake-fill');
  const throttleFillEl = document.getElementById('throttle-fill');
  const brakePctEl = document.getElementById('brake-pct');
  const throttlePctEl = document.getElementById('throttle-pct');
  const tireCompoundEl = document.getElementById('tire-compound');
  const tireAgeEl = document.getElementById('tire-age');
  const lapCounterEl = document.getElementById('lap-counter');
  const leds = document.querySelectorAll('.led');

  // Split View Elements
  const splitTeamStripe = document.getElementById('split-team-stripe');
  const splitTeamName = document.getElementById('split-team-name');
  const splitDeltaBadge = document.getElementById('split-delta-badge');
  const splitCol1 = document.getElementById('split-col-1');
  const splitCol2 = document.getElementById('split-col-2');

  const s1Code = document.getElementById('s1-code');
  const s1Pos = document.getElementById('s1-pos');
  const s1Gear = document.getElementById('s1-gear');
  const s1Speed = document.getElementById('s1-speed');
  const s1Drs = document.getElementById('s1-drs');
  const s1BrkBar = document.getElementById('s1-brk-bar');
  const s1ThrBar = document.getElementById('s1-thr-bar');
  const s1Compound = document.getElementById('s1-compound');
  const s1TireAge = document.getElementById('s1-tire-age');

  const s2Code = document.getElementById('s2-code');
  const s2Pos = document.getElementById('s2-pos');
  const s2Gear = document.getElementById('s2-gear');
  const s2Speed = document.getElementById('s2-speed');
  const s2Drs = document.getElementById('s2-drs');
  const s2BrkBar = document.getElementById('s2-brk-bar');
  const s2ThrBar = document.getElementById('s2-thr-bar');
  const s2Compound = document.getElementById('s2-compound');
  const s2TireAge = document.getElementById('s2-tire-age');

  // Tower Elements
  const towerSessionEl = document.getElementById('tower-session');
  const leaderboardListEl = document.getElementById('leaderboard-list');

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

  // Request Screen Wake Lock
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

  // Load Driver & Team Rosters
  async function initData() {
    try {
      if (window.F1Simulator) {
        drivers = window.F1Simulator.getDrivers();
        teams = window.F1Simulator.getTeams();
      } else {
        const res = await fetch('/api/drivers');
        drivers = await res.json();
      }
      connErrorEl.classList.add('hidden');
      updateHUDDriverHeader();
      refreshActiveView();
    } catch (err) {
      console.warn('[RF1] Init data error:', err);
      if (window.F1Simulator) {
        drivers = window.F1Simulator.getDrivers();
        teams = window.F1Simulator.getTeams();
        updateHUDDriverHeader();
        refreshActiveView();
      } else {
        connErrorEl.classList.remove('hidden');
        setTimeout(initData, 3000);
      }
    }
  }

  function getSelectedDriver() {
    if (!drivers || drivers.length === 0) {
      return { number: 4, code: 'NOR', color: '#FF8000', name: 'Lando Norris', teamIndex: 0 };
    }
    return drivers[currentDriverIndex];
  }

  function updateHUDDriverHeader() {
    const d = getSelectedDriver();
    driverCodeEl.textContent = d.code;
    driverNumEl.textContent = d.number;
    teamStripe.style.backgroundColor = d.color || '#FF8000';
    currentTeamIndex = d.teamIndex !== undefined ? d.teamIndex : 0;
  }

  // Select Driver explicitly (e.g. from Standings list)
  function selectDriver(driverNumber) {
    const idx = drivers.findIndex(d => d.number === parseInt(driverNumber, 10));
    if (idx !== -1) {
      currentDriverIndex = idx;
      updateHUDDriverHeader();
      showToast(`${drivers[idx].code} #${drivers[idx].number}`);
      switchView('hud');
    }
  }

  // Cycle Drivers (Scroll Wheel up/down in HUD)
  function cycleDriver(delta) {
    if (drivers.length === 0) return;
    currentDriverIndex = (currentDriverIndex + delta + drivers.length) % drivers.length;
    updateHUDDriverHeader();
    showToast(`${drivers[currentDriverIndex].code} #${drivers[currentDriverIndex].number}`);
    fetchHUDTelemetry();
  }

  // Cycle Teams (Scroll Wheel up/down in Split View)
  function cycleTeam(delta) {
    if (!teams || teams.length === 0) return;
    currentTeamIndex = (currentTeamIndex + delta + teams.length) % teams.length;
    const team = teams[currentTeamIndex];
    // Also sync current driver to 1st driver of this team
    const dIdx = drivers.findIndex(d => d.number === team.drivers[0].number);
    if (dIdx !== -1) currentDriverIndex = dIdx;
    updateHUDDriverHeader();
    showToast(`${team.shortName}`);
    fetchSplitTelemetry();
  }

  // Switch View Tab ('hud', 'split', 'tower')
  function switchView(targetView) {
    if (targetView === activeView) return;
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
    const sequence = ['hud', 'split', 'tower'];
    const nextIdx = (sequence.indexOf(activeView) + 1) % sequence.length;
    switchView(sequence[nextIdx]);
  }

  // Toggle Mode (SIM vs LIVE)
  function toggleMode() {
    activeMode = activeMode === 'SIM' ? 'LIVE' : 'SIM';
    modeButtons.forEach(btn => {
      btn.textContent = activeMode;
      if (activeMode === 'LIVE') btn.classList.add('live');
      else btn.classList.remove('live');
    });
    showToast(`MODE: ${activeMode}`);
    refreshActiveView();
  }

  // Update Shift Lights
  function updateShiftLights(rpmPct) {
    const activeCount = Math.round((rpmPct / 100) * 12);
    leds.forEach((led, idx) => {
      led.classList.remove('flash-purple');
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
    tireAgeEl.textContent = `${data.tireAge || 12} LAPS`;
    lapCounterEl.textContent = `L ${data.lap || 42}/${data.totalLaps || 52}`;
  }

  // Render Teammate Split
  function renderSplit(teamData) {
    if (!teamData) return;

    splitTeamName.textContent = teamData.teamShort;
    splitTeamStripe.style.backgroundColor = teamData.teamColor || '#FF8000';
    splitDeltaBadge.textContent = `Δ ${teamData.delta}`;

    // Driver 1
    const d1 = teamData.d1;
    s1Code.textContent = d1.driver;
    s1Pos.textContent = `P${d1.pos}`;
    s1Gear.textContent = d1.gear;
    s1Speed.textContent = d1.speed;
    s1Drs.className = `split-drs-badge ${d1.drs === 1 ? 'active' : ''}`;
    s1BrkBar.style.height = `${d1.brake}%`;
    s1ThrBar.style.height = `${d1.throttle}%`;
    s1Compound.textContent = d1.tire;
    s1Compound.className = `compound-badge compound-${d1.tire.toLowerCase()}`;
    s1TireAge.textContent = `${d1.tireAge}L`;

    // Driver 2
    const d2 = teamData.d2;
    s2Code.textContent = d2.driver;
    s2Pos.textContent = `P${d2.pos}`;
    s2Gear.textContent = d2.gear;
    s2Speed.textContent = d2.speed;
    s2Drs.className = `split-drs-badge ${d2.drs === 1 ? 'active' : ''}`;
    s2BrkBar.style.height = `${d2.brake}%`;
    s2ThrBar.style.height = `${d2.throttle}%`;
    s2Compound.textContent = d2.tire;
    s2Compound.className = `compound-badge compound-${d2.tire.toLowerCase()}`;
    s2TireAge.textContent = `${d2.tireAge}L`;
  }

  // Render Leaderboard & Driver Selection List
  function renderLeaderboard(list) {
    if (!list || !Array.isArray(list)) return;
    const currentNum = getSelectedDriver().number;

    leaderboardListEl.innerHTML = '';
    list.forEach(item => {
      const li = document.createElement('li');
      li.className = `tower-row ${item.number === currentNum ? 'selected' : ''}`;
      li.dataset.driverNumber = item.number;
      li.innerHTML = `
        <div class="tower-driver-info">
          <span class="tower-pos">P${item.pos}</span>
          <span class="tower-color-pill" style="background-color: ${item.teamColor || '#FFF'}"></span>
          <span class="tower-code">${item.code}</span>
        </div>
        <div class="tower-timing">
          <span class="compound-badge compound-${(item.tire || 'm').toLowerCase()}">${item.tire || 'M'}</span>
          <span class="tower-gap">${item.gap}</span>
        </div>
      `;

      // Tap driver row to select!
      li.addEventListener('click', (e) => {
        e.stopPropagation();
        selectDriver(item.number);
      });

      leaderboardListEl.appendChild(li);
    });
  }

  // Fetch Telemetry for Current View
  async function fetchHUDTelemetry() {
    if (isFetching || activeView !== 'hud') return;
    isFetching = true;
    try {
      const current = getSelectedDriver();
      let data = null;
      if (activeMode === 'SIM' && window.F1Simulator) {
        data = window.F1Simulator.getDriverTelemetry(current.number);
      } else if (activeMode === 'LIVE' && window.OpenF1) {
        data = await window.OpenF1.getTelemetry(current.number);
      } else {
        const res = await fetch(`/api/telemetry?driver=${current.number}`);
        data = await res.json();
      }
      connErrorEl.classList.add('hidden');
      renderHUD(data);
    } catch (err) {
      console.warn('[RF1] HUD fetch error:', err);
      if (window.F1Simulator) {
        renderHUD(window.F1Simulator.getDriverTelemetry(getSelectedDriver().number));
      } else {
        connErrorEl.classList.remove('hidden');
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
      if (window.F1Simulator) {
        teamData = window.F1Simulator.getTeamTelemetry(currentTeamIndex);
      } else {
        const d1 = getSelectedDriver();
        teamData = {
          teamShort: d1.team || 'MCLAREN',
          teamColor: d1.color || '#FF8000',
          delta: '+2.14s',
          d1: d1,
          d2: d1
        };
      }
      connErrorEl.classList.add('hidden');
      renderSplit(teamData);
    } catch (err) {
      console.warn('[RF1] Split fetch error:', err);
      connErrorEl.classList.remove('hidden');
    } finally {
      isFetching = false;
    }
  }

  async function fetchTowerData() {
    if (isFetching || activeView !== 'tower') return;
    isFetching = true;
    try {
      let list = null;
      if (window.F1Simulator) {
        list = window.F1Simulator.getLeaderboard();
      } else {
        const res = await fetch('/api/leaderboard');
        list = await res.json();
      }
      connErrorEl.classList.add('hidden');
      renderLeaderboard(list);
    } catch (err) {
      console.warn('[RF1] Tower fetch error:', err);
      connErrorEl.classList.remove('hidden');
    } finally {
      isFetching = false;
    }
  }

  function refreshActiveView() {
    if (activeView === 'hud') fetchHUDTelemetry();
    else if (activeView === 'split') fetchSplitTelemetry();
    else if (activeView === 'tower') fetchTowerData();
  }

  // Setup Polling
  function startPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(refreshActiveView, 850);
  }

  // Setup Hardware & Touch Listeners
  function setupEvents() {
    // 1. Initialize Rabbit R1 Hardware Adapter
    if (window.RF1Hardware) {
      window.RF1Hardware.init();

      // Mechanical Scroll Wheel
      window.RF1Hardware.on('scrollUp', () => {
        if (activeView === 'hud') cycleDriver(-1);
        else if (activeView === 'split') cycleTeam(-1);
        else if (activeView === 'tower') cycleDriver(-1);
      });

      window.RF1Hardware.on('scrollDown', () => {
        if (activeView === 'hud') cycleDriver(1);
        else if (activeView === 'split') cycleTeam(1);
        else if (activeView === 'tower') cycleDriver(1);
      });

      // Side PTT Button (sideClick) -> Cycle Views!
      window.RF1Hardware.on('sideClick', () => {
        cycleView();
      });

      // PTT Long Press -> Toggle Mode (SIM ⟷ LIVE)
      window.RF1Hardware.on('longPressStart', () => {
        toggleMode();
      });
    }

    // 2. Navigation Tab Clicks
    navTabs.hud.addEventListener('click', () => switchView('hud'));
    navTabs.split.addEventListener('click', () => switchView('split'));
    navTabs.tower.addEventListener('click', () => switchView('tower'));

    // 3. Mode Toggle Buttons
    modeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMode();
      });
    });

    // 4. Teammate Split Columns: tap either teammate to focus them on HUD!
    splitCol1.addEventListener('click', () => {
      const team = teams[currentTeamIndex];
      if (team) selectDriver(team.drivers[0].number);
    });
    splitCol2.addEventListener('click', () => {
      const team = teams[currentTeamIndex];
      if (team) selectDriver(team.drivers[1].number);
    });

    // 5. Visibility Change (Device Sleep / Wake)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        console.log('[RF1] Display woke, resuming telemetry');
        requestWakeLock();
        refreshActiveView();
        startPolling();
      }
    });
  }

  // Startup
  requestWakeLock();
  setupEvents();
  initData();
  startPolling();
})();
