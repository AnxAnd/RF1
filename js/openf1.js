// RF1 — OpenF1 API Client for Live Grand Prix Sessions
(function(root) {
  'use strict';

  class OpenF1Client {
    constructor() {
      this.baseUrl = 'https://api.openf1.org/v1';
      this.cache = {
        session: { data: null, expiresAt: 0 },
        drivers: { data: null, expiresAt: 0 },
        carData: new Map()
      };
    }

    async fetchJson(endpoint) {
      const res = await fetch(`${this.baseUrl}${endpoint}`);
      if (!res.ok) {
        throw new Error(`OpenF1 HTTP ${res.status}`);
      }
      return await res.json();
    }

    async getLatestSession() {
      const now = Date.now();
      if (this.cache.session.data && this.cache.session.expiresAt > now) {
        return this.cache.session.data;
      }
      try {
        const sessions = await this.fetchJson('/sessions?session_name=Race&year=2024');
        if (sessions && sessions.length > 0) {
          const latest = sessions[sessions.length - 1];
          this.cache.session = { data: latest, expiresAt: now + 300000 };
          return latest;
        }
      } catch (err) {
        console.warn('[OpenF1] Session fetch failed:', err.message);
      }
      return null;
    }

    async getTelemetry(driverNumber, sessionKey = 9662) {
      const num = parseInt(driverNumber, 10);
      const now = Date.now();
      const cached = this.cache.carData.get(num);

      if (cached && cached.expiresAt > now) {
        return cached.data;
      }

      try {
        const data = await this.fetchJson(`/car_data?session_key=${sessionKey}&driver_number=${num}`);
        if (data && data.length > 0) {
          const latest = data[data.length - 1];
          const rpm = latest.rpm || 0;
          const rpmPct = Math.min(100, Math.max(0, Math.round(((rpm - 4000) / 9000) * 100)));
          const drsActive = (latest.drs >= 10) ? 1 : 0;

          const result = {
            driver: `D${num}`,
            number: num,
            team: 'F1 Live',
            teamColor: '#FF8000',
            pos: 1,
            gap: 'LIVE',
            lap: 45,
            totalLaps: 52,
            speed: Math.round(latest.speed || 0),
            gear: latest.n_gear === 0 ? 'N' : latest.n_gear,
            rpm: rpm,
            rpmPct: rpmPct,
            throttle: Math.min(100, Math.round(latest.throttle || 0)),
            brake: Math.min(100, Math.round(latest.brake || 0)),
            drs: drsActive,
            tire: 'M',
            tireAge: 14,
            mode: 'LIVE'
          };

          this.cache.carData.set(num, { data: result, expiresAt: now + 1000 });
          return result;
        }
      } catch (err) {
        console.warn(`[OpenF1] Live query failed for #${num}:`, err.message);
      }

      // Fallback to simulator
      if (root.F1Simulator) {
        return root.F1Simulator.getDriverTelemetry(num);
      }
      return null;
    }
  }

  const instance = new OpenF1Client();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = instance;
  } else {
    root.OpenF1 = instance;
  }
})(typeof window !== 'undefined' ? window : globalThis);
