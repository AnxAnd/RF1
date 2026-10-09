# 🏎️ RF1
### Formula 1 Pit-Wall Telemetry Companion for Rabbit R1

[![rabbitOS Creations](https://img.shields.io/badge/rabbitOS-Creations%20SDK-FE5000?style=for-the-badge&logo=rabbit&logoColor=white)](https://github.com/rabbit-hmi-oss/creations-sdk)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-00E5FF?style=for-the-badge)](https://anxand.github.io/RF1/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

A dedicated Formula 1 pit-wall telemetry companion and real-time dashboard engineered specifically for the **Rabbit R1**'s tactile mechanical hardware: its notched physical scroll wheel (`scrollUp`/`scrollDown`), side push-to-talk button (`sideClick`), and 240×282 display.

Keep it propped on your desk or coffee table while watching a Grand Prix to track live telemetry, speed traces, pedal inputs, teammate splits, circuit vector outlines, and gap intervals in real time.

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

* **Race & Season Selection on Launch (`RACES`)**:
  * Filter races by category: **`ALL`**, **`2026`**, **`2024`**, and **`CLASSIC`**.
  * Choose between **Live Grand Prix** (current 2026 season) or the **Replay Catalogue** of 9 iconic circuits:
    * **2026**: Singapore GP (Marina Bay Street Circuit)
    * **2024**: British GP (Silverstone), Austrian GP (Red Bull Ring), Abu Dhabi GP (Yas Marina)
    * **Classic**: Monaco GP (Circuit de Monaco), Belgian GP (Spa-Francorchamps), Italian GP (Monza), Japanese GP (Suzuka), São Paulo GP (Interlagos)
  * If a Live Race is selected while no track session is active, RF1 presents an informative **"LIVE RACE STATUS"** screen with quick options to enter an API key or pick a replay race.
* **OpenF1 Live Session Authentication**:
  * Tap **`🔑 KEY`** in the header or provide `?key=YOUR_KEY` in the URL to store your OpenF1 API key in `localStorage`.
  * Allows live unblocked streaming during active F1 race sessions (which restrict unauthenticated global requests).
* **Dynamic Track Vector Watermark**:
  * Behind the Cockpit HUD gauges sits a subtle, glowing vector outline of the selected circuit layout.
  * Displays the flag and circuit title in the header (e.g. `🇸🇬 SINGAPORE • SINGAPORE GP`, `🇬🇧 SILVERSTONE • BRITISH GP`, `🇲🇨 MONACO • MONACO GP`).
  * Tap the circuit badge in the header anytime to open the Race Selector and change tracks.
* **Rabbit R1 Native Hardware Bridge**:
  * **Notched Scroll Wheel (`scrollUp` / `scrollDown`)**: Native rabbitOS event listener to cycle drivers in HUD/Standings, cycle teams in Split view, or scroll the race cards in the Race Selector.
  * **Side PTT Button (`sideClick`)**: One-touch view switcher cycling through `RACES` ➔ `HUD` ➔ `SPLIT` ➔ `TOWER`.
* **F1 Steering Wheel Cockpit HUD (`HUD`)**:
  * **12-LED Progressive Shift Lights**: 4 Green (0–55% revs), 4 Red (55–85% revs), 4 Blue/Purple (85–100% revs, flashing at rev limiter).
  * **Prominent Gear Display**: Bold numerical gear indicator (`1`–`8`, `N`) with white glow.
  * **Large Digital Speedometer**: Real-time speed readout in `KM/H`.
  * **Dynamic DRS Indicator**: Inactive grey pill transitions to glowing cyan/green (`#00F5D4`) when rear-wing DRS flap opens.
  * **Dual Responsive Pedal Gauges**: Neon red brake track (`BRK 0-100%`) and electric green throttle track (`THR 0-100%`).
  * **Tire Status & Stint Age**: Compound badges (`S`, `M`, `H`, `I`, `W`) and current tire lap age.
* **Teammate Split View (`SPLIT`)**:
  * Head-to-head comparison of both drivers from the active constructor team (e.g. McLaren `NOR` vs `PIA`, Red Bull `VER` vs `PER`, Ferrari `LEC` vs `SAI`, Mercedes `HAM` vs `RUS`).
  * Displays real-time delta between teammates, side-by-side speed/gear, comparative throttle/brake bars, and tire compounds.
  * Tapping either driver immediately jumps into their individual Cockpit HUD.
* **Interactive Standings & Driver Selection (`TOWER`)**:
  * Live race order with gaps, team color accents, and tire compounds.
  * **Direct Selection**: Tapping any driver row selects that driver and returns to their Cockpit HUD.

---

## ⚡ The Four Display Views

Switch views anytime with the **Side PTT Button**, or tap the persistent bottom navigation bar:

```
[RACES] ◀────── (Side Button / Nav Tab) ──────▶ [HUD] ◀──────▶ [SPLIT] ◀──────▶ [TOWER]
```

### 1. Race Selector (`RACES`)
* **Launch Screen**: Choose between **Live Grand Prix** or a curated catalogue of past classic races.
* Displays mini track layouts, lap counts, and track characteristics.
* Accessible anytime by tapping the circuit name in the HUD header.

### 2. Cockpit HUD (`HUD`)
* **Circuit Watermark**: Glowing vector outline of the selected track behind the instruments.
* **Header**: Driver badge (e.g. `[NOR 4]`), team color accent, current position (`P1`), gap to car ahead (`LEADER` or `+1.4s`), and circuit badge.
* **Shift Lights**: 12-segment RPM LED cluster.
* **Center Cluster**: Massive Gear readout, digital Speedometer, and active DRS indicator.
* **Footer**: Twin vertical pedal bars (Brake / Throttle), tire compound badge, and lap counter.

### 3. Teammate Split (`SPLIT`)
* **Header**: Team name, track name, and real-time gap delta between teammates (`Δ +4.47s`).
* **Columns**: Side-by-side telemetry for Driver 1 vs Driver 2.
* **Scroll Wheel**: Rolls through all 10 constructor teams.
* **Touch**: Tapping either teammate's side focuses them on the Cockpit HUD.

### 4. Timing Tower / Standings (`TOWER`)
* Displays the race classification.
* Highlights the currently focused driver with team color stripe and active position.
* **Tappable Rows**: Tap any driver in the list to select them and switch to their HUD!

---

## 🕹️ Rabbit R1 Hardware Controls

| Control | Hardware Event | Action in Races | Action in HUD | Action in Split | Action in Tower |
|---|---|---|---|---|---|
| **Scroll Wheel Down** | `scrollDown` | Scroll race list | Next driver | Next team | Next driver |
| **Scroll Wheel Up** | `scrollUp` | Scroll race list | Previous driver | Previous team | Previous driver |
| **Side Button (PTT)** | `sideClick` | Switch to **HUD** | Switch to **SPLIT** | Switch to **TOWER** | Switch to **RACES** |
| **Tap Race Card** | Touch `click` | Load circuit & HUD | — | — | — |
| **Tap Driver Row** | Touch `click` | — | — | Focus driver | Select driver & jump to HUD |
| **Tap Circuit Badge** | Touch `click` | — | Open Race Selector | Open Race Selector | Open Race Selector |
| **Bottom Nav Tabs** | Touch `click` | Jump directly to `RACES`, `HUD`, `SPLIT`, or `TOWER` | Jump directly | Jump directly | Jump directly |

---

## 🛠️ Local Development & Preview

Run the smart local preview server:

```bash
git clone https://github.com/AnxAnd/RF1.git
cd RF1

# Option 1: Quick launcher with automatic port selection
./launch-preview.sh

# Option 2: Full Node.js HTTP server
npm start
```

* Use mouse wheel or `↑`/`↓` arrow keys to simulate the Rabbit R1 hardware scroll wheel.
* Press `Space` or `P` key to simulate the Rabbit R1 side PTT button (`sideClick`).

---

## 📄 License

MIT License — Copyright (c) 2026 [AnxAnd](https://github.com/AnxAnd).
