// RF1 — High-Fidelity F1 Race Telemetry Simulator Engine
// Supports single-driver HUD telemetry and dual-driver Teammate Split views

(function(root) {
  'use strict';

  const TEAMS = [
    {
      name: 'McLaren',
      shortName: 'MCLAREN',
      color: '#FF8000',
      drivers: [
        { number: 4, code: 'NOR', name: 'Lando Norris', compound: 'H', baseTireAge: 18, basePos: 1 },
        { number: 81, code: 'PIA', name: 'Oscar Piastri', compound: 'M', baseTireAge: 11, basePos: 4 }
      ]
    },
    {
      name: 'Red Bull Racing',
      shortName: 'RED BULL',
      color: '#3671C6',
      drivers: [
        { number: 1, code: 'VER', name: 'Max Verstappen', compound: 'M', baseTireAge: 12, basePos: 2 },
        { number: 11, code: 'PER', name: 'Sergio Perez', compound: 'H', baseTireAge: 19, basePos: 9 }
      ]
    },
    {
      name: 'Ferrari',
      shortName: 'FERRARI',
      color: '#E8002D',
      drivers: [
        { number: 16, code: 'LEC', name: 'Charles Leclerc', compound: 'H', baseTireAge: 20, basePos: 3 },
        { number: 55, code: 'SAI', name: 'Carlos Sainz', compound: 'H', baseTireAge: 21, basePos: 7 }
      ]
    },
    {
      name: 'Mercedes',
      shortName: 'MERCEDES',
      color: '#27F4D2',
      drivers: [
        { number: 44, code: 'HAM', name: 'Lewis Hamilton', compound: 'H', baseTireAge: 22, basePos: 5 },
        { number: 63, code: 'RUS', name: 'George Russell', compound: 'M', baseTireAge: 14, basePos: 6 }
      ]
    },
    {
      name: 'Aston Martin',
      shortName: 'ASTON MARTIN',
      color: '#229971',
      drivers: [
        { number: 14, code: 'ALO', name: 'Fernando Alonso', compound: 'M', baseTireAge: 15, basePos: 8 },
        { number: 18, code: 'STR', name: 'Lance Stroll', compound: 'H', baseTireAge: 16, basePos: 10 }
      ]
    },
    {
      name: 'RB',
      shortName: 'RB HONDA',
      color: '#6692FF',
      drivers: [
        { number: 22, code: 'TSU', name: 'Yuki Tsunoda', compound: 'M', baseTireAge: 13, basePos: 11 },
        { number: 30, code: 'LAW', name: 'Liam Lawson', compound: 'H', baseTireAge: 20, basePos: 18 }
      ]
    },
    {
      name: 'Haas',
      shortName: 'HAAS F1',
      color: '#B6BABD',
      drivers: [
        { number: 27, code: 'HUL', name: 'Nico Hulkenberg', compound: 'H', baseTireAge: 24, basePos: 12 },
        { number: 20, code: 'MAG', name: 'Kevin Magnussen', compound: 'H', baseTireAge: 23, basePos: 16 }
      ]
    },
    {
      name: 'Williams',
      shortName: 'WILLIAMS',
      color: '#64C4FF',
      drivers: [
        { number: 23, code: 'ALB', name: 'Alexander Albon', compound: 'M', baseTireAge: 10, basePos: 13 },
        { number: 43, code: 'COL', name: 'Franco Colapinto', compound: 'M', baseTireAge: 9, basePos: 17 }
      ]
    },
    {
      name: 'Alpine',
      shortName: 'ALPINE',
      color: '#FF87BC',
      drivers: [
        { number: 10, code: 'GAS', name: 'Pierre Gasly', compound: 'H', baseTireAge: 17, basePos: 14 },
        { number: 31, code: 'OCO', name: 'Esteban Ocon', compound: 'M', baseTireAge: 16, basePos: 15 }
      ]
    },
    {
      name: 'Kick Sauber',
      shortName: 'KICK SAUBER',
      color: '#52E252',
      drivers: [
        { number: 77, code: 'BOT', name: 'Valtteri Bottas', compound: 'M', baseTireAge: 15, basePos: 19 },
        { number: 24, code: 'ZHO', name: 'Zhou Guanyu', compound: 'H', baseTireAge: 18, basePos: 20 }
      ]
    }
  ];

  // Flattened drivers array
  const ALL_DRIVERS = [];
  TEAMS.forEach((team, teamIdx) => {
    team.drivers.forEach(d => {
      ALL_DRIVERS.push({
        ...d,
        teamName: team.name,
        teamShort: team.shortName,
        teamColor: team.color,
        teamIndex: teamIdx
      });
    });
  });

  class SimulatorEngine {
    constructor() {
      this.startTime = Date.now();
      this.lapDurationMs = 85000; // 85 seconds per simulated lap
      this.currentLap = 42;
      this.totalLaps = 52;
    }

    getTeams() {
      return TEAMS.map((t, idx) => ({
        index: idx,
        name: t.name,
        shortName: t.shortName,
        color: t.color,
        drivers: t.drivers.map(d => ({ number: d.number, code: d.code, name: d.name }))
      }));
    }

    getDrivers() {
      return ALL_DRIVERS.map(d => ({
        number: d.number,
        code: d.code,
        name: d.name,
        team: d.teamName,
        color: d.teamColor,
        teamIndex: d.teamIndex
      }));
    }

    computeTelemetry(driver, globalIndex) {
      const now = Date.now();
      const driverOffsetMs = (globalIndex * 4200);
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
      if (globalIndex > 0) {
        const gapSec = (globalIndex * 1.34 + Math.sin(now / 15000 + globalIndex) * 0.4).toFixed(3);
        gap = `+${gapSec}s`;
      }

      return {
        driver: driver.code,
        number: driver.number,
        fullName: driver.name,
        team: driver.teamName || driver.team,
        teamShort: driver.teamShort || driver.team,
        teamColor: driver.teamColor || driver.color,
        pos: driver.basePos || (globalIndex + 1),
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

    getDriverTelemetry(driverNumber) {
      const num = parseInt(driverNumber, 10) || 4;
      const driver = ALL_DRIVERS.find(d => d.number === num) || ALL_DRIVERS[0];
      const globalIdx = ALL_DRIVERS.indexOf(driver);
      return this.computeTelemetry(driver, globalIdx);
    }

    getTeamTelemetry(teamIdx) {
      const idx = Math.max(0, Math.min(TEAMS.length - 1, parseInt(teamIdx, 10) || 0));
      const team = TEAMS[idx];
      const d1 = ALL_DRIVERS.find(d => d.number === team.drivers[0].number);
      const d2 = ALL_DRIVERS.find(d => d.number === team.drivers[1].number);

      const t1 = this.computeTelemetry(d1, ALL_DRIVERS.indexOf(d1));
      const t2 = this.computeTelemetry(d2, ALL_DRIVERS.indexOf(d2));

      // Compute teammate delta
      const deltaSec = Math.abs(t1.pos - t2.pos) * 1.45 + (Math.sin(Date.now() / 12000) * 0.3);

      return {
        teamName: team.name,
        teamShort: team.shortName,
        teamColor: team.color,
        delta: `+${deltaSec.toFixed(2)}s`,
        d1: t1,
        d2: t2,
        mode: 'SIM'
      };
    }

    getLeaderboard() {
      const now = Date.now();
      return ALL_DRIVERS.map((d, idx) => {
        let gap = 'LEADER';
        if (idx > 0) {
          const gapSec = (idx * 1.34 + Math.sin(now / 15000 + idx) * 0.4).toFixed(3);
          gap = `+${gapSec}s`;
        }
        return {
          pos: idx + 1,
          code: d.code,
          number: d.number,
          team: d.teamName,
          teamColor: d.teamColor,
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
