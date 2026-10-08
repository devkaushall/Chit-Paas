# CHIT-PAAS — Design Spec (DRAFT)

> **Status:** Draft — extracted from the user's mockup boards (8 images).
> **Pending:** `HANDOVER.md` (user is sharing) — may refine/override game-flow details.
> Source boards: UI Components Breakdown · Logo · Classroom art (3 variants) ·
> Log-in page (desktop) · Mobile responsive (3 screens) · Tablet · Desktop.

---

## 1. Brand

| Item | Value |
|---|---|
| Name | **CHIT-PAAS** |
| Tagline | *The Backbencher's Word Game* |
| Hero headline | "Slip it in. **Don't get caught.**" |
| Vibe | Warm golden-hour classroom, chalkboard, paper planes, wooden desks, plants |
| Logo | Full logo: chalkboard + paper plane + chunky CHIT-PAAS wordmark + tagline on torn-paper strip. Simplified: text-only wordmark. |

### Color palette (from board #11)

| Token | Hex | Use |
|---|---|---|
| Primary Orange | `#F05400` | CTAs, accents, timer chip |
| Light Orange / Amber | `#FFBA3D` | Highlights, medium risk |
| Dark Green | `#0F302E` | Role card, chalkboard, top bar text |
| Light Cream | `#FFF8EF` | Page background |
| Text Dark | `#1F2527` | Headings / body |
| Text Gray | `#687780` | Secondary text |
| Border | `#E5E7E8` | Card borders, dividers |
| Error / High risk | `#FF6B6B` | High-risk pill, danger |
| Success | `#22CC55` | Online dot, low risk, success |
| Warning | `#FFCE50` | Medium risk pill, warnings |

### Typography
- UI text: rounded, bold, friendly sans (Nunito / Baloo-class).
- Blackboard text: handwritten "chalk" style (e.g. Segoe Print / Comic-style).
- Headings: heavy weight, tight letter-spacing.

---

## 2. Layout system

### Desktop (3-column dashboard)
```
┌ Top bar: ☰ | LOGO | Round 2/5 · Free Period | ⏱ 18s "Your Turn / Choose a prank" | 🔊 ? ⚙ | Leave Game ┐
├──────────────┬────────────────────────────────────────────┬──────────────────────┤
│ Players (6)  │  CLASSROOM STAGE (illustrated scene)       │ Your Role card       │
│ Mr.Aryan 👑  │  teacher at blackboard + seated students   │  (Student/Aman,      │
│ Aman (You)   │  floating name tags over seats             │   mission, 1/3 bar)  │
│ Priya …      │  (Priya🎀 Aman🟢(You) Rohan🟡 Neha🟣 Karan🔵)│ Round Info card      │
│              ├────────────────────────────────────────────┤ Recent Events card   │
│              │ Choose a Prank — action cards (2 or 4)     │  time + dot + text   │
└──────────────┴────────────────────────────────────────────┴──────────────────────┘
```

### Tablet
Same 3-column dashboard, slightly tighter (hamburger ☰ for players drawer).

### Mobile (3 screens designed)
1. **Home / Join** — full logo, classroom bg, "Start a class" card, "or", "Join a class" card.
2. **Student Turn** — compact top bar (← CHIT-PAAS ⚙), Round pill + timer, classroom stage with tags, "Choose a Prank" 2×2 action grid.
3. **Teacher View** — tabs **Actions | Class Info**; action list rows.

---

## 3. Screens & flows (from boards)

### 3.1 Landing / Log-in (desktop)
- Top nav: LOGO · How to Play · Features · About · **Sign In** button.
- Left: hero headline + lede, **Create a Class** card (Your name, rounds dropdown `5 rounds · Classic`, Make Room →), **Join a Class** card (Your name, `# ROOM CODE`, Join Room →).
- "or" divider → **Learn How to Play** row (chevron).
- Feature row: 2–8 Players · Play from any device · Quick rounds (2–4 mins) · Fun with friends.
- Right: classroom artwork.

### 3.2 Lobby — room code display, players joining, start.

### 3.3 Game — Student turn
- Top bar: Round pill (`Round 2/5 · Free Period`), **timer chip** (`18s`) + "Your Turn / Choose a prank".
- **Choose a Prank** panel — pick ONE action this turn:

| Action | Icon | Risk |
|---|---|---|
| Pass a Note | paper plane | Low |
| Hide Notebook | notebook | Medium |
| Make a Noise | paper ball | Medium |
| Whisper | speaking head | High |

### 3.4 Game — Teacher view
- Tabs: **Actions** / Class Info.
- Rows: Observe · Question a Student · Check a Desk · Give a Warning · **Catch a Student** (locked 🔒 `0/3`, "Requires strong suspicion").
- Teacher shown in players rail with 👑 crown + "Teacher"; class stage shows the teacher at the board.

### 3.5 Side panels
- **Your Role** (dark green card): avatar, role + name, "Your Mission: Complete 3 pranks without getting caught", progress bar (`1/3`), flame icon.
- **Round Info**: `Round 2/5`, period name + flavour.
- **Recent Events**: timestamped feed with colored dots (`01:12 · Priya changed her seat.`).

### 3.6 Components inventory
- Buttons: Leave Game (primary w/ icon), Cancel (secondary), Join Room → (action + hover), disabled states.
- Risk pills: Low (green), Medium (yellow), High (red).
- Inputs: room-code field (`#` prefix), rounds select, text fields.
- Player entry: avatar + name + state (Teacher crown / You chip / online dot / offline).
- Name tags on stage: 5 color-coded chips — pink, green(You), yellow, purple, blue.
- Avatar styles: Teacher (Mr. Aryan), Student male, Student female.
- Icon set: round, timer, sound, help, settings, leave, teacher, prank mask, plane, notebook, paper-ball, whisper, online dot, color dots.

---

## 4. Game-flow implications (DRAFT — to confirm vs HANDOVER.md)

The mockups show a **turn-based action game**, not just free chat:
- Each turn a student picks a **prank action** with a **risk level**.
- The teacher has a toolkit: Observe / Question / Check Desk / Warn / **Catch** (meter `0/3`).
- Missions with progress ("complete 3 pranks without getting caught").
- Rounds & periods ("Free Period") still exist.

**Open question:** does the existing *secret-word-in-chat* mechanic stay (as chat) alongside pranks, or is the new action system the core? → confirm with HANDOVER.md.

---

## 5. Assets needed as files (for build)

- [ ] Full logo (transparent PNG) + simplified wordmark
- [ ] Classroom art — wide (desktop/tablet) + portrait (mobile) variants
- [ ] Avatar set: teacher, student male, student female (transparent)
- [ ] Any icon sheet exports (optional — can rebuild as inline SVG)
