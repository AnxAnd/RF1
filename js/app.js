// RF1 — Rabbit R1 Formula 1 Telemetry Companion
// Optimized for Rabbit R1 240x282 viewport and notched mechanical scroll wheel

(function() {
  'use strict';

  // State
  let drivers = [];
  let currentDriverIndex = 0;
  let activeView = 'hud'; // 'hud' or 'tower'
  let activeMode = 'SIM'; // 'SIM' or 'LIVE'
  let pollTimer = null;
  let isFetching = false;
  let lastWheelTime = 0;

  // DOM Elements
  const appContainer = document.getElementById('app');
  const viewHud = document.getElementById('view-hud');
  const viewTower = document.getElementById('view-tower');
  
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
  const modeBadgeEl = document.getElementById('mode-badge');
  const leds = document.querySelectorAll('.led');
  
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

  // Load Driver Roster
  async function initDrivers() {
    try {
      if (window.F1Simulator) {
        drivers = window.F1Simulator.getDrivers();
      } else {
        const res = await fetch('/api/drivers');
        drivers = await res.json();
      }
      connErrorEl.classList.add('hidden');
      updateDriverInfo();
      fetchTelemetry();
    } catch (err) {
      console.warn('[RF1] Driver init failed:', err);
      if (window.F1Simulator) {
        drivers = window.F1Simulator.getDrivers();
        updateDriverInfo();
        fetchTelemetry();
      } else {
        connErrorEl.classList.remove('hidden');
        setTimeout(initDrivers, 3000);
      }
    }
  }

  function getSelectedDriver() {
    if (!drivers || drivers.length === 0) {
      return { number: 4, code: 'NOR', color: '#FF8000', name: 'Lando Norris' };
    }
    return drivers[currentDriverIndex];
  }

  function updateDriverInfo() {
    const d = getSelectedDriver();
    driverCodeEl.textContent = d.code;
    driverNumEl.textContent = d.number;
    teamStripe.style.backgroundColor = d.color || '#FF8000';
  }

  // Switch Active Driver (Wheel or Keys)
  function changeDriver(delta) {
    if (drivers.length === 0) return;
    currentDriverIndex = (currentDriverIndex + delta + drivers.length) % drivers.length;
    const d = getSelectedDriver();
    updateDriverInfo();
    showToast(`${d.code} #${d.number}`);
    fetchTelemetry();
  }

  // Toggle View Mode (Cockpit HUD <-> Timing Tower)
  function toggleView() {
    if (activeView === 'hud') {
      activeView = 'tower';
      viewHud.classList.remove('active');
      viewTower.classList.add('active');
      fetchLeaderboard();
      showToast('TIMING TOWER');
    } else {
      activeView = 'hud';
      viewTower.classList.remove('active');
      viewHud.classList.add('active');
      fetchTelemetry();
      showToast('COCKPIT HUD');
    }
  }

  // Toggle Simulation vs Live OpenF1 Mode
  function toggleMode() {
    activeMode = activeMode === 'SIM' ? 'LIVE' : 'SIM';
    modeBadgeEl.textContent = activeMode;
    showToast(`MODE: ${activeMode}`);
    fetchTelemetry();
  }

  // Update F1 Steering Wheel Shift Lights (12 LEDs)
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

  // Render Telemetry onto Cockpit HUD
  function renderTelemetry(data) {
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

    modeBadgeEl.textContent = data.mode || activeMode;
  }

  // Render Timing Tower Standings
  function renderLeaderboard(list) {
    if (!list || !Array.isArray(list)) return;
    const currentNum = getSelectedDriver().number;

    leaderboardListEl.innerHTML = '';
    list.slice(0, 10).forEach(item => {
      const li = document.createElement('li');
      li.className = `tower-row ${item.number === currentNum ? 'selected' : ''}`;
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
      leaderboardListEl.appendChild(li);
    });
  }

  // Fetch Telemetry (In-Browser Simulator or API)
  async function fetchTelemetry() {
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
        if (!res.ok) throw new Error('Telemetry fetch error');
        data = await res.json();
      }

      connErrorEl.classList.add('hidden');
      renderTelemetry(data);
    } catch (err) {
      console.warn('[RF1] Telemetry error:', err);
      // Fallback directly to simulator
      if (window.F1Simulator) {
        const current = getSelectedDriver();
        renderTelemetry(window.F1Simulator.getDriverTelemetry(current.number));
      } else {
        connErrorEl.classList.remove('hidden');
      }
    } finally {
      isFetching = false;
    }
  }

  // Fetch Leaderboard
  async function fetchLeaderboard() {
    if (isFetching || activeView !== 'tower') return;
    isFetching = true;
    try {
      let list = null;
      if (window.F1Simulator) {
        list = window.F1Simulator.getLeaderboard();
      } else {
        const res = await fetch('/api/leaderboard');
        if (!res.ok) throw new Error('Leaderboard fetch error');
        list = await res.json();
      }
      connErrorEl.classList.add('hidden');
      renderLeaderboard(list);
    } catch (err) {
      console.warn('[RF1] Leaderboard error:', err);
      if (window.F1Simulator) {
        renderLeaderboard(window.F1Simulator.getLeaderboard());
      } else {
        connErrorEl.classList.remove('hidden');
      }
    } finally {
      isFetching = false;
    }
  }

  // Polling loop (every 850ms)
  function startPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(() => {
      if (activeView === 'hud') {
        fetchTelemetry();
      } else {
        fetchLeaderboard();
      }
    }, 850);
  }

  // Rabbit R1 Hardware Wheel Harness
  window.addEventListener('wheel', (e) => {
    e.preventDefault();
    const now = Date.now();
    if (now - lastWheelTime < 180) return;
    lastWheelTime = now;

    if (e.deltaY > 0) {
      changeDriver(1);
    } else {
      changeDriver(-1);
    }
  }, { passive: false });

  // Keyboard Navigation (Arrow Keys / Space)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      changeDriver(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      changeDriver(-1);
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggleView();
    }
  });

  // Touch and Click Harness
  let touchStartTime = 0;
  appContainer.addEventListener('touchstart', () => {
    touchStartTime = Date.now();
  }, { passive: true });

  appContainer.addEventListener('touchend', () => {
    const duration = Date.now() - touchStartTime;
    if (duration > 850) {
      toggleMode(); // Long press toggles SIM <-> LIVE
    } else {
      toggleView(); // Quick tap toggles HUD <-> Tower
    }
  });

  appContainer.addEventListener('click', (e) => {
    if (Date.now() - touchStartTime > 300) {
      toggleView();
    }
  });

  appContainer.addEventListener('dblclick', () => {
    toggleMode();
  });

  // Handle Screen Sleep & Wake
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log('[RF1] Display woke up, resuming telemetry');
      requestWakeLock();
      fetchTelemetry();
      startPolling();
    }
  });

  // Start
  requestWakeLock();
  initDrivers();
  startPolling();
})();
