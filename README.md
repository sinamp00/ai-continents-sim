# 🌍 AI Continents — Civilization Simulator

A **mobile-first, autonomous civilization simulation** where seven AI-powered continent agents
(Asia, Europe, Africa, North America, South America, Oceania, Antarctica) live, trade, ally,
betray, and wage war — entirely driven by a **real large language model**, with an offline
fallback brain so the world never stops turning.

**Live demo:** `https://sinamp00.github.io/ai-continents-sim/`

> 100% client-side. No backend, no accounts, no tracking. Your games are saved in your browser's localStorage.

---

## ✨ Features

### 🧠 Real AI decision-making
- Every turn, **one batched LLM call** asks a language model to decide for all 7 continents at once:
  each continent picks an action (trade, ally, declare war, make peace, treaty, share technology,
  found/join an organization, change government…), writes a **short public reasoning summary**,
  and issues an in-character **diplomatic statement**.
- Strict output validation + sanitization (e.g. peace is impossible without an active war),
  automatic timeout handling, and a graceful fallback to the built-in **offline heuristic brain**.
- Toggle at any time: **🧠 Real AI** / **🔌 Offline**. A status badge always shows which brain is steering.

### 🌍🇮🇷 Bilingual: Persian + English
- Full **Persian (فارسی)** UI with RTL layout and Vazirmatn typography — toggle **فا | EN** anytime.
- Every narrative line the engine writes (feed, timeline, reasoning, statements, world events) is
  generated natively in the active language; in Persian mode the LLM itself writes Persian
  reasoning and communiqués. Numbers render with native digits (۱۲۳ / 123).

### 🎭 Personified continent characters
- Each continent is a character (ادمک) with its own avatar, title and personality:
  🐉 Asia *the Ancient Dragon*, 🦉 Europe *the Old Diplomat*, 🦁 Africa *the Lion of the Savannah*,
  🦅 North America *the Eagle*, 🐆 South America *the Jaguar*, 🌊 Oceania *the Wave Rider*,
  ❄️ Antarctica *the Ice Guardian* — each with a Persian/English bio in its profile.

### 🌐 Living world
- **Stats per continent:** population, economy, resources, technology, military, happiness,
  government type, active wars, alliance network.
- **Diplomacy:** bilateral relations matrix (−100…100), alliances, wars (with ally support and
  capitulation/reparations), treaties, international organizations, tech sharing, sanctions.
- **World events:** economic crises, pandemics, climate shifts, tech breakthroughs, resource
  booms/busts, mass migrations, space programs…
- **Diplomatic incidents:** border clashes, spy scandals, trade disputes, state visits —
  45% chance per turn to stir the pot.
- Power index ranking with a live leaderboard.

### 📱 Mobile-first UI
- **🗺️ Map** — a real dark dotted world map with each continent as a tappable character marker;
  markers glow with power and pulse red when at war.
- **📰 Feed** — real-time event stream (filter to major events only).
- **📊 Dashboard** — pick any continent: stat bars, government, relations, wars & allies.
- **🏆 Rankings** — power leaderboard + full stat comparison table.
- **📜 Timeline** — turn-by-turn history of everything that happened.
- **🤝 Diplomacy** — agent communiqués (their in-character statements), 7×7 relations matrix,
  treaties, organizations, active wars.
- **🎮 Controls** — play/pause, step one turn, speed 1×/2×/4×, AI-mode toggle, named save slots + autosave.

### 💾 Save / Load
Named save slots + automatic autosave every 5 turns, all in `localStorage`.

---

## 🚀 Run locally

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

---

## 🏗️ Architecture

```
src/
├── engine/
│   ├── types.ts        # Continent stats, actions, turn logs, relations
│   ├── data.ts         # The 7 continents: stats, personalities, traits, starting relations
│   ├── llm.ts          # Prompt builder + LLM call (pollinations.ai, free/keyless),
│   │                   # JSON extraction, validation & sanitization, 45s timeout
│   ├── localBrain.ts   # Offline heuristic brain (utility scoring + variety bonus)
│   ├── events.ts       # 10 random world events (crises, booms, pandemics…)
│   ├── simulation.ts   # runTurn(): decisions → wars → world tick → incidents → events
│   └── persistence.ts  # localStorage save slots + autosave
├── components/         # WorldMap, EventFeed, Dashboard, Rankings,
│                        # Timeline, DiplomacyPanel, Controls, BottomNav
└── App.tsx             # Game state, setTimeout-chain loop, async turn runner
```

### How a turn works (`runTurn`)
1. **Decide** — the LLM (or local brain) returns 7 decisions, each with
   `{ action, target?, details?, reasoning, statement }`.
2. **Apply** — validated/sanitized actions mutate stats, relations, alliances, wars,
   treaties, orgs, governments.
3. **Resolve wars** — attacker vs defender power × military × ally support; defender
   capitulates at −100 relations difference → becomes a puppet, pays reparations.
4. **World tick** — population growth, economic drift, tech progress, happiness drift
   toward peace, war weariness, relation normalization.
5. **Diplomatic incident** (45%) and **world event** (18%) add chaos.
6. Everything is appended to the feed (capped at 300) and the per-turn timeline.

### Why Pollinations?
The agents must use *a real AI*, not hardcoded logic. Pollinations' free text API
(`https://text.pollinations.ai/{prompt}?model=openai`) needs no key and returns clean JSON,
so one batched call per turn keeps it fast and free. If the network fails, the local
heuristic brain takes over seamlessly — the world never freezes.

---

## 🎮 How to play

1. Open the live URL (or `npm run dev`).
2. Press **▶ Start** — the world begins advancing one turn (= 1 year) per tick.
3. Tap continents on the **map** or open the **dashboard** to inspect any power.
4. Read the **feed** for wars, treaties and betrayals; check **Diplomacy** for what the
   agents themselves say about it.
5. Use **⏭ Step** to advance exactly one year, **1×/2×/4×** to change speed.
6. Flip **🧠 Real AI / 🔌 Offline** to compare LLM-driven vs heuristic behavior.
7. Save interesting timelines in named slots — they persist in your browser.

---

## 📦 Deployment (GitHub Pages)

This repo is deployed via the `gh-pages` branch (no GitHub Actions — the account is billing-locked):

```bash
npm run build
# push ./dist to the gh-pages branch
git subtree push --prefix dist origin gh-pages
```

The site is served from `https://sinamp00.github.io/ai-continents-sim/` (Vite `base: '/ai-continents-sim/'`).

---

## 🛠️ Tech stack

React 18 · TypeScript · Vite · Tailwind CSS v4 · Lucide icons · zero backend

---

*Built with کریتوس ⚡ — a world that thinks for itself.*
