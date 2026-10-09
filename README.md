# 🏎️ RF1
### Formula 1 Pit-Wall Telemetry Companion for Rabbit R1

[![rabbitOS Creations](https://img.shields.io/badge/rabbitOS-Creations%20SDK-FE5000?style=for-the-badge&logo=rabbit&logoColor=white)](https://github.com/rabbit-hmi-oss/creations-sdk)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-00E5FF?style=for-the-badge)](https://anxand.github.io/RF1/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

A dedicated Formula 1 pit-wall telemetry companion and live dashboard engineered specifically for the **Rabbit R1**'s tactile mechanical hardware: its notched physical scroll wheel, side push-to-talk (PTT) button, and 240×282 display.

Keep it propped on your desk or coffee table while watching a Grand Prix to track live telemetry, speed traces, pedal inputs, and gap intervals in real time.

---

## 📲 Install on Rabbit R1 (Instant Scan)

Point your Rabbit R1 camera at the QR code below to launch **RF1**:

<div align="center">
  <img src="r1_pairing_qr.png" alt="Rabbit R1 Pairing QR Code" width="260" height="260" />
  <p><b>Scan with Rabbit R1 to install</b></p>
  <p>Live URL: <code>https://anxand.github.io/RF1/</code></p>
</div>

---

## ✨ Key Features & Architecture

* **F1 Steering Wheel Cockpit HUD**:
  * **12-LED Progressive Shift Lights**: 4 Green (0–55% revs), 4 Red (55–85% revs), 4 Blue/Purple (85–100% revs, flashing at rev limiter).
  * **Prominent Gear Display**: Bold numerical gear indicator (`1`–`8`, `N`) with white glow.
  * **Large Digital Speedometer**: Real-time speed readout in `KM/H`.
  * **Dynamic DRS Indicator**: Inactive grey pill transitions to glowing cyan/green (`#00F5D4`) when rear-wing DRS flap opens.
  * **Dual Responsive Pedal Gauges**: Neon red brake track (`BRK 0-100%`) and electric green throttle track (`THR 0-100%`).
  * **Tire Status & Stint Age**: Compound badges (`S`, `M`, `H`, `I`, `W`) and current tire lap age.
* **Timing Tower Leaderboard**:
  * Clean, compact top 10 standings with driver short code, team color pill, gap to leader, and tire compound.
* **Zero-Lag Hardware Scroll Wheel Driver Switching**:
  * Roll the Rabbit R1's notched physical scroll wheel to instantly cycle through all 20 drivers (`NOR` ➔ `PIA` ➔ `VER` ➔ `LEC`...).
* **Dual Operating Modes (`SIM` vs. `LIVE`)**:
  * **Replay Simulator Engine (`SIM`)**: Built-in 60 FPS physics engine that models a full dynamic lap around the Silverstone Grand Prix circuit (Turn 1 heavy braking, apex throttle modulation, DRS back straights, and gear shifts). Works 100% offline anytime with zero dependencies.
  * **OpenF1 Live Bridge (`LIVE`)**: Connects directly to the public [OpenF1 API](https://openf1.org) during active Grand Prix sessions.
* **Power & Lifecycle Management**:
  * Uses the Screen Wake Lock API to prevent rabbitOS display timeout.
  * Implements automatic reconnection and telemetry catch-up when the device wakes from sleep.

---

## ⚡ The Two Display Views

Switch views anytime with a single tap on the screen (or spacebar):

```
[COCKPIT HUD] ◀──── (Screen Tap / Click) ────▶ [TIMING TOWER]
```

### 1. Cockpit HUD (`HUD`)
* **Header**: Driver badge (e.g. `[NOR 4]`), team color accent, current position (`P1`), and gap to car ahead (`LEADER` or `+1.4s`).
* **Shift Lights**: 12-segment RPM LED cluster.
* **Center Cluster**: Massive Gear readout, digital Speedometer, and active DRS indicator.
* **Footer**: Twin vertical pedal bars (Brake / Throttle), tire compound badge, and lap counter.

### 2. Timing Tower (`TOWER`)
* Displays the live race classification.
* Highlights the currently focused driver with team color stripe and active position.
* Displays gap intervals and tire compounds across the field.

---

## 🕹️ Rabbit R1 Hardware Controls

| Control | Gesture | Action in Cockpit HUD | Action in Timing Tower |
|---|---|---|---|
| **Scroll Wheel Down** | Rotate wheel forward | Next driver (e.g. NOR ➔ PIA) | Next driver |
| **Scroll Wheel Up** | Rotate wheel backward | Previous driver (e.g. PIA ➔ NOR) | Previous driver |
| **Screen Tap** | Short touch on screen | Toggle to Timing Tower | Toggle to Cockpit HUD |
| **Long Press / PTT** | Hold screen (> 850ms) | Toggle `SIM` ⟷ `LIVE` Mode | Toggle `SIM` ⟷ `LIVE` Mode |
| **Double Tap** | Double click screen | Toggle `SIM` ⟷ `LIVE` Mode | Toggle `SIM` ⟷ `LIVE` Mode |

---

## 🛠️ Local Development & Preview

Run the smart local preview server:

```bash
cd RF1

# Option 1: Quick launcher with automatic port selection
./launch-preview.sh

# Option 2: Full Node.js HTTP server
npm start
```

Open [http://localhost:3000](http://localhost:3000) (or the port displayed by `./launch-preview.sh`).

* **Desktop Emulation**: The interface is centered in a high-contrast Rabbit R1 bezel frame matching the `240×282` viewport.
* Use mouse wheel or `↑`/`↓` arrow keys to change drivers.
* Press `Space` or click to toggle between HUD and Timing Tower.

---

## 📄 License

MIT License — Copyright (c) 2026 [AnxAnd](https://github.com/AnxAnd).
