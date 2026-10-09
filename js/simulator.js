// RF1 — High-Fidelity F1 Race Telemetry Simulator Engine
// Supports dynamic circuit selection, single-driver HUD telemetry, and dual-driver Teammate Split

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
  // Sort ALL_DRIVERS strictly by basePos so index 0 is P1, index 1 is P2, etc.
  ALL_DRIVERS.sort((a, b) => a.basePos - b.basePos);

  class SimulatorEngine {
    constructor() {
      this.startTime = Date.now();
      this.currentTrackId = 'singapore';
      this.currentTrackName = 'Marina Bay Street Circuit';
      this.currentGrandPrix = 'SINGAPORE GP';
      this.currentFlag = '🇸🇬';
      this.totalLaps = 62;
      this.lapDurationMs = 85000;
      this.currentLap = 1; // Always start at Lap 1 from the beginning!
      this.topSpeedRef = 310;
    }

    restart() {
      this.currentLap = 1;
      this.startTime = Date.now();
    }

    setLap(lapNumber) {
      this.currentLap = Math.max(1, Math.min(this.totalLaps, parseInt(lapNumber, 10) || 1));
      this.startTime = Date.now();
    }

    setTrack(trackId) {
      this.currentTrackId = trackId;
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
          this.currentLap = 1; // Start cleanly from Lap 1!
          this.startTime = Date.now();
        }
      }
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

      // Speed profile scaled to circuit top speed
      const maxSpd = this.topSpeedRef;
      const cornerSpd = Math.round(maxSpd * 0.28);

      if (cycleProgress < 0.22) {
        // Main Straight (DRS Active)
        const p = cycleProgress / 0.22;
        speed = Math.floor(cornerSpd * 2.2 + p * (maxSpd - cornerSpd * 2.2));
        gear = speed > 300 ? 8 : (speed > 260 ? 7 : 6);
        rpm = 10500 + Math.floor(p * 2200);
        throttle = 100;
        brake = 0;
        drs = speed > 250 ? 1 : 0;
      } else if (cycleProgress < 0.29) {
        // Turn 1 Heavy Braking Zone
        const p = (cycleProgress - 0.22) / 0.07;
        speed = Math.floor(maxSpd - p * (maxSpd - cornerSpd));
        gear = speed > 220 ? 6 : (speed > 160 ? 4 : (speed > 115 ? 3 : 2));
        rpm = 7500 + Math.floor((1 - p) * 4500);
        throttle = 0;
        brake = Math.floor(95 - p * 40);
        drs = 0;
      } else if (cycleProgress < 0.48) {
        // Technical curves
        const p = (cycleProgress - 0.29) / 0.19;
        speed = Math.floor(cornerSpd + Math.sin(p * Math.PI * 3) * 45 + p * 90);
        gear = speed > 180 ? 5 : (speed > 140 ? 4 : 3);
        rpm = 8200 + Math.floor(Math.sin(p * Math.PI * 4) * 2800);
        throttle = Math.floor(45 + Math.sin(p * Math.PI * 2) * 40);
        brake = throttle < 40 ? Math.floor(30 + Math.random() * 20) : 0;
        drs = 0;
      } else if (cycleProgress < 0.68) {
        // Back Straight (DRS Zone 2)
        const p = (cycleProgress - 0.48) / 0.20;
        speed = Math.floor(200 + p * (maxSpd - 200));
        gear = speed > 305 ? 8 : (speed > 265 ? 7 : (speed > 225 ? 6 : 5));
        rpm = 10000 + Math.floor(p * 2600);
        throttle = 100;
        brake = 0;
        drs = speed > 260 ? 1 : 0;
      } else if (cycleProgress < 0.77) {
        // Hairpin Braking
        const p = (cycleProgress - 0.68) / 0.09;
        speed = Math.floor(maxSpd - p * (maxSpd - cornerSpd));
        gear = speed > 210 ? 5 : (speed > 150 ? 4 : 2);
        rpm = 7000 + Math.floor((1 - p) * 4000);
        throttle = 0;
        brake = Math.floor(90 - p * 30);
        drs = 0;
      } else {
        // Final sweeps
        const p = (cycleProgress - 0.77) / 0.23;
        speed = Math.floor(cornerSpd + p * 120);
        gear = speed > 200 ? 6 : (speed > 160 ? 5 : 4);
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

      return {
        driver: driver.code,
        number: driver.number,
        fullName: driver.name,
        team: driver.teamName || driver.team,
        teamShort: driver.teamShort || driver.team,
        teamColor: driver.teamColor || driver.color,
        pos: driver.basePos,
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
        mode: 'REPLAY',
        trackId: this.currentTrackId,
        trackName: this.currentTrackName,
        grandPrix: this.currentGrandPrix,
        flag: this.currentFlag
      };
    }

    getDriverTelemetry(driverNumber) {
      const num = parseInt(driverNumber, 10) || 4;
      const driver = ALL_DRIVERS.find(d => d.number === num) || ALL_DRIVERS[0];
      const globalIdx = driver.basePos - 1;
      return this.computeTelemetry(driver, globalIdx);
    }

    getTeamTelemetry(teamIdx) {
      const idx = Math.max(0, Math.min(TEAMS.length - 1, parseInt(teamIdx, 10) || 0));
      const team = TEAMS[idx];
      const d1 = ALL_DRIVERS.find(d => d.number === team.drivers[0].number);
      const d2 = ALL_DRIVERS.find(d => d.number === team.drivers[1].number);

      const t1 = this.computeTelemetry(d1, d1.basePos - 1);
      const t2 = this.computeTelemetry(d2, d2.basePos - 1);
      const deltaSec = Math.abs(t1.pos - t2.pos) * 1.45 + (Math.sin(Date.now() / 12000) * 0.2);

      return {
        teamName: team.name,
        teamShort: team.shortName,
        teamColor: team.color,
        delta: `+${deltaSec.toFixed(2)}s`,
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

      return ALL_DRIVERS.map((d) => {
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
      const elapsedSec = Math.floor((Date.now() - this.startTime) / 1000);
      const cycle = elapsedSec % 160;
      if (cycle >= 50 && cycle <= 65) {
        return {
          type: 'YELLOW',
          title: 'YELLOW FLAG',
          msg: 'SECTOR 2 CAUTION',
          sectors: [2],
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

    setFlag(type, msg) {
      if (!type || type === 'CLEAR' || type === 'GREEN') {
        this.customFlag = { type: 'GREEN', title: 'GREEN FLAG', msg: 'TRACK CLEAR', isCaution: false };
      } else {
        this.customFlag = {
          type: type.toUpperCase(),
          title: type.toUpperCase().includes('RED') ? 'RED FLAG' : 'YELLOW FLAG',
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
