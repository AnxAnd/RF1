// RF1 — OpenF1 API Client for Live Grand Prix Sessions
// Supports real-time session discovery, dynamic year lookup, and optional API key authentication

(function(root) {
  'use strict';

  class OpenF1Client {
    constructor() {
      this.baseUrl = 'https://api.openf1.org/v1';
      this.apiKey = null;
      this.lastStatus = null;
      this.cache = {
        session: { data: null, expiresAt: 0 },
        drivers: { data: null, expiresAt: 0 },
        carData: new Map()
      };
      this.initKey();
    }

    initKey() {
      // Check localStorage or URL query param for optional API key
      try {
        if (typeof window !== 'undefined') {
          const urlKey = new URLSearchParams(window.location.search).get('key');
          if (urlKey) {
            this.apiKey = urlKey;
            localStorage.setItem('openf1_key', urlKey);
          } else {
            this.apiKey = localStorage.getItem('openf1_key') || null;
          }
        }
      } catch (e) {}
    }

    setApiKey(key) {
      this.apiKey = key || null;
      if (typeof localStorage !== 'undefined') {
        if (key) {
          localStorage.setItem('openf1_key', key);
        } else {
          localStorage.removeItem('openf1_key');
        }
      }
    }

    async fetchJson(endpoint) {
      const headers = { 'User-Agent': 'RF1-Companion/1.0' };
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const res = await fetch(`${this.baseUrl}${endpoint}`, { headers });
      
      if (!res.ok) {
        if (res.status === 401) {
          const body = await res.json().catch(() => ({}));
          this.lastStatus = {
            code: 401,
            detail: body.detail || 'Live session in progress. API key required during active track hours.'
          };
          throw new Error(this.lastStatus.detail);
        }
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
        // First try session_key=latest (automatically returns current 2026/active session)
        const sessions = await this.fetchJson('/sessions?session_key=latest');
        if (sessions && sessions.length > 0) {
          const latest = sessions[sessions.length - 1];
          this.cache.session = { data: latest, expiresAt: now + 60000 };
          return latest;
        }
      } catch (err) {
        console.warn('[OpenF1] Query session_key=latest failed:', err.message);
        // Fallback: Query by current year
        try {
          const currentYear = new Date().getFullYear();
          const yrSessions = await this.fetchJson(`/sessions?year=${currentYear}`);
          if (yrSessions && yrSessions.length > 0) {
            const latest = yrSessions[yrSessions.length - 1];
            this.cache.session = { data: latest, expiresAt: now + 60000 };
            return latest;
          }
        } catch (e) {
          console.warn('[OpenF1] Fallback query failed:', e.message);
        }
      }
      return null;
    }

    async getTelemetry(driverNumber, sessionKey = 'latest') {
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
            totalLaps: 62,
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
