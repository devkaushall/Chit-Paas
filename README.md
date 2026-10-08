# CHIT-PAAS — The Backbencher's Word Game

Multiplayer classroom party game for 2–8 players on separate devices. Students slip a secret word into class chat; the Teacher gets one accusation per round.

**Docs:** start at [`docs/README.md`](docs/README.md) (PRD, TRD, app flow, UI/UX brief, backend schema, implementation plan).

## Status
- Engine tests: `node test/run.mjs` → 14/14 pass (local, in-memory Blobs stub).
- Live site: needs redeploy of `netlify-ready-game.zip` (current live bundle returns 502).
- v1.1 hardening in progress — see `docs/06-IMPLEMENTATION-PLAN.md`.

## Publish (no terminal)
1. Go to https://app.netlify.com/drop, or open your existing site → **Deploys**.
2. Drag `netlify-ready-game.zip` onto the page.
3. Open the URL, create a room, share the 6-character code.

## Develop and test
```
npm install
npm i -D esbuild
npx esbuild netlify/functions/game.ts --bundle --format=esm --platform=node \
  --outfile=test/game.test.mjs "--alias:@netlify/blobs=./test/blobs-stub.mjs"
node test/run.mjs
node test/serve-local.mjs          # optional: http://localhost:8888 with the function
```

## Rules in short
Students slip a secret word into class chat. The Teacher gets one accusation per round. Periods (Exam Day, Free Period, …) change the rules each round. Highest score wins; ties break on slips, then Teacher points, then fewest times caught.
