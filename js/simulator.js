// RF1 — High-Fidelity F1 Race Telemetry Simulator Engine
// Runs 100% in-browser on Rabbit R1 WebView or Node.js

(function(root) {
  'use strict';

  const DRIVERS = [
    { number: 4, code: 'NOR', name: 'Lando Norris', team: 'McLaren', color: '#FF8000', compound: 'H', baseTireAge: 18, basePos: 1 },
    { number: 1, code: 'VER', name: 'Max Verstappen', team: 'Red Bull Racing', color: '#3671C6', compound: 'M', baseTireAge: 12, basePos: 2 },
    { number: 16, code: 'LEC', name: 'Charles Leclerc', team: 'Ferrari', color: '#E8002D', compound: 'H', baseTireAge: 20, basePos: 3 },
    { number: 81, code: 'PIA', name: 'Oscar Piastri', team: 'McLaren', color: '#FF8000', compound: 'M', baseTireAge: 11, basePos: 4 },
    { number: 44, code: 'HAM', name: 'Lewis Hamilton', team: 'Mercedes', color: '#27F4D2', compound: 'H', baseTireAge: 22, basePos: 5 },
    { number: 63, code: 'RUS', name: 'George Russell', team: 'Mercedes', color: '#27F4D2', compound: 'M', baseTireAge: 14, basePos: 6 },
    { number: 55, code: 'SAI', name: 'Carlos Sainz', team: 'Ferrari', color: '#E8002D', compound: 'H', baseTireAge: 21, basePos: 7 },
    { number: 14, code: 'ALO', name: 'Fernando Alonso', team: 'Aston Martin', color: '#229971', compound: 'M', baseTireAge: 15, basePos: 8 },
    { number: 11, code: 'PER', name: 'Sergio Perez', team: 'Red Bull Racing', color: '#3671C6', compound: 'H', baseTireAge: 19, basePos: 9 },
    { number: 18, code: 'STR', name: 'Lance Stroll', team: 'Aston Martin', color: '#229971', compound: 'H', baseTireAge: 16, basePos: 10 },
    { number: 22, code: 'TSU', name: 'Yuki Tsunoda', team: 'RB', color: '#6692FF', compound: 'M', baseTireAge: 13, basePos: 11 },
    { number: 27, code: 'HUL', name: 'Nico Hulkenberg', team: 'Haas', color: '#B6BABD', compound: 'H', baseTireAge: 24, basePos: 12 },
    { number: 23, code: 'ALB', name: 'Alexander Albon', team: 'Williams', color: '#64C4FF', compound: 'M', baseTireAge: 10, basePos: 13 },
    { number: 10, code: 'GAS', name: 'Pierre Gasly', team: 'Alpine', color: '#FF87BC', compound: 'H', baseTireAge: 17, basePos: 14 },
    { number: 31, code: 'OCO', name: 'Esteban Ocon', team: 'Alpine', color: '#FF87BC', compound: 'M', baseTireAge: 16, basePos: 15 },
    { number: 20, code: 'MAG', name: 'Kevin Magnussen', team: 'Haas', color: '#B6BABD', compound: 'H', baseTireAge: 23, basePos: 16 },
    { number: 43, code: 'COL', name: 'Franco Colapinto', team: 'Williams', color: '#64C4FF', compound: 'M', baseTireAge: 9, basePos: 17 },
    { number: 30, code: 'LAW', name: 'Liam Lawson', team: 'RB', color: '#6692FF', compound: 'H', baseTireAge: 20, basePos: 18 },
    { number: 77, code: 'BOT', name: 'Valtteri Bottas', team: 'Kick Sauber', color: '#52E252', compound: 'M', baseTireAge: 15, basePos: 19 },
    { number: 24, code: 'ZHO', name: 'Zhou Guanyu', team: 'Kick Sauber', color: '#52E252', compound: 'H', baseTireAge: 18, basePos: 20 }
  ];

  class SimulatorEngine {
    constructor() {
      this.startTime = Date.now();
      this.lapDurationMs = 85000; // 85 seconds per simulated lap
      this.currentLap = 42;
      this.totalLaps = 52;
    }

    getDrivers() {
      return DRIVERS.map(d => ({
        number: d.number,
        code: d.code,
        name: d.name,
        team: d.team,
        color: d.color
      }));
    }

    getDriverTelemetry(driverNumber) {
      const num = parseInt(driverNumber, 10) || 4;
      const driver = DRIVERS.find(d => d.number === num) || DRIVERS[0];
      const driverIdx = DRIVERS.indexOf(driver);

      const now = Date.now();
      const driverOffsetMs = (driverIdx * 4200);
      const elapsed = (now - this.startTime + driverOffsetMs);
      const cycleProgress = (elapsed % this.lapDurationMs) / this.lapDurationMs;

      const currentCompletedLaps = this.currentLap + Math.floor(elapsed / this.lapDurationMs);
      const tireAge = driver.baseTireAge + Math.floor((currentCompletedLaps - 42) / 2);

      let speed = 0;
      let gear = 1;
      let rpm = 4000;
      let throttle = 0;
      let brake = 0;
      let drs = 0;

      if (cycleProgress < 0.22) {
        // Main Straight (DRS Active, up to 338 km/h)
        const p = cycleProgress / 0.22;
        speed = Math.floor(220 + p * 118);
        gear = speed > 300 ? 8 : (speed > 260 ? 7 : 6);
        rpm = 10500 + Math.floor(p * 2200);
        throttle = 100;
        brake = 0;
        drs = speed > 250 ? 1 : 0;
      } else if (cycleProgress < 0.29) {
        // Turn 1 Heavy Braking Zone
        const p = (cycleProgress - 0.22) / 0.07;
        speed = Math.floor(338 - p * 242);
        gear = speed > 220 ? 6 : (speed > 160 ? 4 : (speed > 115 ? 3 : 2));
        rpm = 7500 + Math.floor((1 - p) * 4500);
        throttle = 0;
        brake = Math.floor(95 - p * 40);
        drs = 0;
      } else if (cycleProgress < 0.48) {
        // Medium speed curves (Turns 2 - 5)
        const p = (cycleProgress - 0.29) / 0.19;
        speed = Math.floor(100 + Math.sin(p * Math.PI * 3) * 45 + p * 90);
        gear = speed > 180 ? 5 : (speed > 140 ? 4 : 3);
        rpm = 8200 + Math.floor(Math.sin(p * Math.PI * 4) * 2800);
        throttle = Math.floor(45 + Math.sin(p * Math.PI * 2) * 40);
        brake = throttle < 40 ? Math.floor(30 + Math.random() * 20) : 0;
        drs = 0;
      } else if (cycleProgress < 0.68) {
        // Wellington / Back Straight (DRS Zone 2)
        const p = (cycleProgress - 0.48) / 0.20;
        speed = Math.floor(200 + p * 125);
        gear = speed > 305 ? 8 : (speed > 265 ? 7 : (speed > 225 ? 6 : 5));
        rpm = 10000 + Math.floor(p * 2600);
        throttle = 100;
        brake = 0;
        drs = speed > 260 ? 1 : 0;
      } else if (cycleProgress < 0.77) {
        // Chicane / Hairpin Braking
        const p = (cycleProgress - 0.68) / 0.09;
        speed = Math.floor(325 - p * 230);
        gear = speed > 210 ? 5 : (speed > 150 ? 4 : 2);
        rpm = 7000 + Math.floor((1 - p) * 4000);
        throttle = 0;
        brake = Math.floor(90 - p * 30);
        drs = 0;
      } else {
        // Final sweeping corners into main straight
        const p = (cycleProgress - 0.77) / 0.23;
        speed = Math.floor(110 + p * 120);
        gear = speed > 200 ? 6 : (speed > 160 ? 5 : 4);
        rpm = 8800 + Math.floor(p * 2800);
        throttle = Math.floor(65 + p * 35);
        brake = 0;
        drs = 0;
      }

      speed = Math.max(0, Math.min(360, speed));
      rpm = Math.max(3000, Math.min(13500, rpm));
      throttle = Math.max(0, Math.min(100, throttle));
      brake = Math.max(0, Math.min(100, brake));
      const rpmPct = Math.min(100, Math.max(0, Math.round(((rpm - 4000) / 9000) * 100)));

      let gap = 'LEADER';
      if (driverIdx > 0) {
        const gapSec = (driverIdx * 1.34 + Math.sin(now / 15000 + driverIdx) * 0.4).toFixed(3);
        gap = `+${gapSec}s`;
      }

      return {
        driver: driver.code,
        number: driver.number,
        fullName: driver.name,
        team: driver.team,
        teamColor: driver.color,
        pos: driverIdx + 1,
        gap: gap,
        lap: currentCompletedLaps,
        totalLaps: this.totalLaps,
        speed: speed,
        gear: gear === 0 ? 'N' : gear,
        rpm: rpm,
        rpmPct: rpmPct,
        throttle: throttle,
        brake: brake,
        drs: drs,
        tire: driver.compound,
        tireAge: tireAge,
        mode: 'SIM'
      };
    }

    getLeaderboard() {
      const now = Date.now();
      return DRIVERS.map((d, idx) => {
        let gap = 'LEADER';
        if (idx > 0) {
          const gapSec = (idx * 1.34 + Math.sin(now / 15000 + idx) * 0.4).toFixed(3);
          gap = `+${gapSec}s`;
        }
        return {
          pos: idx + 1,
          code: d.code,
          number: d.number,
          teamColor: d.color,
          gap: gap,
          tire: d.compound,
          tireAge: d.baseTireAge + Math.floor((this.currentLap - 40) / 2)
        };
      });
    }
  }

  const instance = new SimulatorEngine();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = instance;
  } else {
    root.F1Simulator = instance;
  }
})(typeof window !== 'undefined' ? window : globalThis);
