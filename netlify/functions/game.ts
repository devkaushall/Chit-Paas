import type { Handler } from "@netlify/functions";
import { connectLambda, getStore, type BlobStore } from "@netlify/blobs";
import { WORDS } from "../../lib/words";
import { SCENARIOS, type Scenario } from "../../lib/scenarios";

const key = (code: string) => `room:${code}`;
const id = () => Math.random().toString(36).slice(2, 10);
const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid misreads
const roomCode = () => Array.from({ length: 6 }, () => ROOM_ALPHABET[Math.floor(Math.random() * ROOM_ALPHABET.length)]).join("");
const norm = (x: unknown) => String(x || "").trim().toLowerCase();
const now = () => Date.now();
const json = (body: any, status = 200) => ({ statusCode: status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(body) });

type Stats = { slips: number; teacher: number; caught: number };
type Player = { id: string; name: string; score: number; connected: boolean; last: number; stats?: Stats };
const newStats = (): Stats => ({ slips: 0, teacher: 0, caught: 0 });
const st = (p: Player): Stats => p.stats || (p.stats = newStats());
// Final ranking: score, then more successful slips, then more points earned as teacher, then fewest times caught.
export const rankPlayers = (ps: Player[]) => ps.sort((a, b) => (b.score - a.score) || (st(b).slips - st(a).slips) || (st(b).teacher - st(a).teacher) || (st(a).caught - st(b).caught));
type Room = {
  code: string; players: Record<string, Player>; settings: { rounds: number }; phase: string;
  teacherIndex: number; roundNumber: number; messages: { id: string; playerId: string; name: string; text: string }[];
  used: string[]; hostId: string; hostless: boolean;
  round: null | {
    teacherId: string; scenario: Scenario; chits: Record<string, string>; slipped: Record<string, boolean>;
    count: Record<string, number>; accusation: null | { studentId: string; word: string };
    silenced: null | { playerId: string; until: number }; silenceUsed: boolean;
    chatEndsAt: number; verdictEndsAt?: number; resultsEndsAt?: number;
    results?: { deltas: Record<string, number>; words: Record<string, string>; correct: boolean };
  };
  taunts: { id: string; name: string; label: string }[];
};

const online = (r: Room) => Object.values(r.players).filter(p => p.connected);

function startRound(r: Room) {
  const ps = online(r);
  if (ps.length < 2) { r.phase = "lobby"; r.round = null; return; }
  r.roundNumber++;
  const t = ps[r.teacherIndex++ % ps.length];
  if (WORDS.filter(w => !r.used.includes(w)).length < ps.length - 1) r.used = [];
  const pool = WORDS.filter(w => !r.used.includes(w)).sort(() => Math.random() - .5);
  const chits: Record<string, string> = {};
  ps.filter(p => p.id !== t.id).forEach((p, i) => { chits[p.id] = pool[i]; r.used.push(pool[i]); });
  const scenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
  r.messages = []; r.phase = "chat";
  r.round = { teacherId: t.id, scenario, chits, slipped: {}, count: {}, accusation: null, silenced: null, silenceUsed: false, chatEndsAt: now() + scenario.chat * 1000 };
}
function resolve(r: Room) {
  const q = r.round!; const a = q.accusation; const d: Record<string, number> = {};
  const plus = (x: string, n: number) => d[x] = (d[x] || 0) + n;
  if (a && q.chits[a.studentId] === a.word) plus(q.teacherId, q.scenario.catch);
  else if (a) plus(a.studentId, q.scenario.wrong);
  for (const x in q.chits) if (q.slipped[x] && !(a && a.studentId === x && q.chits[x] === a.word)) plus(x, q.scenario.slip);
  for (const x in d) r.players[x].score += d[x];
  for (const x in q.chits) if (q.slipped[x]) st(r.players[x]).slips++;
  st(r.players[q.teacherId]).teacher += d[q.teacherId] || 0;
  if (a && q.chits[a.studentId] === a.word) st(r.players[a.studentId]).caught++;
  q.results = { deltas: d, words: q.chits, correct: !!(a && q.chits[a.studentId] === a.word) };
  r.phase = "results"; q.resultsEndsAt = now() + 10000;
}
function tick(r: Room) {
  const q = r.round; if (!q) return;
  if (r.phase === "chat" && now() >= q.chatEndsAt) { r.phase = "verdict"; q.verdictEndsAt = now() + 15000; }
  else if (r.phase === "verdict" && q.verdictEndsAt && now() >= q.verdictEndsAt) resolve(r);
  else if (r.phase === "results" && q.resultsEndsAt && now() >= q.resultsEndsAt) {
    if (r.roundNumber >= r.settings.rounds) r.phase = "gameover"; else startRound(r);
  }
}
function view(r: Room, pid: string) {
  const q = r.round;
  return {
    code: r.code, phase: r.phase, hostless: r.hostless, settings: r.settings, roundNumber: r.roundNumber,
    standings: rankPlayers(Object.values(r.players)).map(p => p.id),
    tied: (() => { const o = rankPlayers(Object.values(r.players)); if (o.length < 2) return false; const [a, b] = o; return a.score === b.score && st(a).slips === st(b).slips && st(a).teacher === st(b).teacher && st(a).caught === st(b).caught; })(),
    players: Object.values(r.players).map(p => ({ id: p.id, name: p.name, score: p.score, connected: p.connected })),
    messages: r.messages, taunts: r.taunts,
    round: q ? {
      teacherId: q.teacherId, scenario: q.scenario, myChit: q.chits[pid],
      messagesLeft: q.chits[pid] ? q.scenario.limit - (q.count[pid] || 0) : 0,
      silenced: q.silenced, silenceUsed: q.silenceUsed, chatEndsAt: q.chatEndsAt, verdictEndsAt: q.verdictEndsAt,
      accusation: q.accusation, results: q.results,
      deck: r.phase === "verdict" && q.teacherId === pid ? WORDS : undefined,
    } : null,
  };
}

async function withRoom(store: BlobStore, code: string, fn: (r: Room | null) => { ret: any }) {
  for (let i = 0; i < 6; i++) {
    // getWithMetadata returns null (not an object) when the room does not exist.
    const got = await store.getWithMetadata(key(code), { consistency: "strong" });
    const room: Room | null = got?.data ? JSON.parse(got.data) : null;
    const before = got?.data || "";
    if (room) tick(room); // advance timers on every request, not only on GET polls
    const { ret } = fn(room);
    if (!room) return json(ret);
    const after = JSON.stringify(room);
    if (after === before) return json(ret);
    // SDK v11 option is onlyIfMatch (not etag). A failed condition returns {modified:false} instead of throwing.
    const w = got?.etag
      ? await store.set(key(code), after, { onlyIfMatch: got.etag })
      : await store.set(key(code), after, { onlyIfNew: true });
    if (w.modified) return json(ret);
    /* another request wrote first — reload and retry */
  }
  return json({ ok: false, error: "Classroom is busy — try again." });
}

const TAUNTS = ["Pakda gaya!", "Clean slip!", "Sus.", "Why me?"];

export const handler: Handler = async (event) => {
  connectLambda(event);
  const store = getStore({ name: "chitpaas", consistency: "strong" });

  if (event.httpMethod === "GET") {
    const code = String(event.queryStringParameters?.code || "").toUpperCase();
    const pid = String(event.queryStringParameters?.pid || "");
    if (!code || !pid) return json({ view: null });
    return withRoom(store, code, (r) => { if (!r) return { ret: { view: null } }; tick(r); return { ret: { view: view(r, pid) } }; });
  }
  const body = JSON.parse(event.body || "{}");
  const code = String(body.code || "").toUpperCase();
  const pid = String(body.pid || "");

  switch (body.action) {
    case "create": {
      const c = roomCode();
      const p: Player = { id: id(), name: String(body.name || "Student").slice(0, 18), score: 0, connected: true, last: 0, stats: newStats() };
      const room: Room = { code: c, players: { [p.id]: p }, settings: { rounds: [3, 5, 7].includes(+body.rounds) ? +body.rounds : 5 }, phase: "lobby", teacherIndex: 0, roundNumber: 0, messages: [], used: [], hostId: p.id, hostless: false, taunts: [], round: null };
      const w = await store.set(key(c), JSON.stringify(room), { onlyIfNew: true });
      if (!w.modified) return json({ ok: false, error: "Try again." });
      return json({ ok: true, code: c, id: p.id, view: view(room, p.id) });
    }
    case "join":
      return withRoom(store, code, (r) => {
        if (!r) return { ret: { ok: false, error: "That classroom doesn’t exist." } };
        if (r.phase !== "lobby") return { ret: { ok: false, error: "This game has already started. Refresh to reclaim your seat." } };
        if (Object.keys(r.players).length >= 8) return { ret: { ok: false, error: "This classroom is full." } };
        const p: Player = { id: id(), name: String(body.name || "Student").slice(0, 18), score: 0, connected: true, last: 0, stats: newStats() };
        r.players[p.id] = p;
        return { ret: { ok: true, code: r.code, id: p.id, view: view(r, p.id) }, };
      });
    case "resume":
      return withRoom(store, code, (r) => {
        const p = r?.players[pid]; if (!p) return { ret: { ok: false } };
        p.connected = true;
        return { ret: { ok: true, code: r!.code, id: p.id, view: view(r!, p.id) } };
      });
    case "leave":
      return withRoom(store, code, (r) => {
        const p = r?.players[pid]; if (!p) return { ret: { ok: true } };
        p.connected = false; if (p.id === r!.hostId) r!.hostless = true;
        return { ret: { ok: true } };
      });
    case "again":
      return withRoom(store, code, (r) => {
        if (!r || r.phase !== "gameover") return { ret: { ok: false } };
        for (const p of Object.values(r.players)) { p.score = 0; p.stats = newStats(); }
        r.roundNumber = 0; r.teacherIndex = 0; r.used = []; r.taunts = []; r.messages = []; r.round = null; r.phase = "lobby";
        return { ret: { ok: true, view: view(r, pid) } };
      });
    case "start":
      return withRoom(store, code, (r) => {
        if (!r || r.phase !== "lobby" || online(r).length < 2) return { ret: { ok: false, error: "Need at least 2 players." } };
        startRound(r); return { ret: { ok: true, view: view(r, pid) } };
      });
    case "message":
      return withRoom(store, code, (r) => {
        const p = r?.players[pid], q = r?.round;
        if (!r || !p || r.phase !== "chat" || !q || q.teacherId === p.id) return { ret: { ok: false, error: "Chat is closed." } };
        if (!p.connected) return { ret: { ok: false, error: "You are disconnected — refresh to rejoin." } };
        if (q.silenced?.playerId === p.id && q.silenced.until > now()) return { ret: { ok: false, error: "Shhh. You are silenced." } };
        const x = String(body.text || "").trim().slice(0, q.scenario.max), n = q.count[p.id] || 0;
        if (n >= q.scenario.limit) return { ret: { ok: false, error: `You’ve used all ${q.scenario.limit} messages this round.` } };
        if (!x) return { ret: { ok: false, error: "Write something first." } };
        if (now() - p.last < 1500) return { ret: { ok: false, error: "Slow down — one message every 1.5 seconds." } };
        p.last = now(); q.count[p.id] = n + 1; r.messages.push({ id: id(), playerId: p.id, name: p.name, text: x });
        const w = q.chits[p.id];
        if (w && new RegExp(`(^|[^a-z])${w}(?=$|[^a-z])`, "i").test(x)) q.slipped[p.id] = true;
        return { ret: { ok: true, view: view(r, pid) } };
      });
    case "silence":
      return withRoom(store, code, (r) => {
        const q = r?.round;
        if (!r || r.phase !== "chat" || !q || q.teacherId !== pid || q.silenceUsed) return { ret: { ok: false, error: "Your silence card is already used." } };
        if (!q.chits[body.studentId]) return { ret: { ok: false, error: "Choose a current student." } };
        q.silenceUsed = true; q.silenced = { playerId: body.studentId, until: now() + 10000 };
        return { ret: { ok: true, view: view(r, pid) } };
      });
    case "accuse":
      return withRoom(store, code, (r) => {
        const q = r?.round, w = norm(body.word);
        if (!r || r.phase !== "verdict" || !q || q.teacherId !== pid || q.accusation) return { ret: { ok: false, error: "The verdict is already closed." } };
        if (!r.players[body.studentId] || body.studentId === pid) return { ret: { ok: false, error: "Choose a student." } };
        if (!WORDS.includes(w)) return { ret: { ok: false, error: "Not a valid chit word. Choose one from the full deck." } };
        q.accusation = { studentId: body.studentId, word: w }; resolve(r);
        return { ret: { ok: true, view: view(r, pid) } };
      });
    case "taunt":
      return withRoom(store, code, (r) => {
        const p = r?.players[pid];
        if (!r || r.phase !== "results" || !p || !TAUNTS.includes(body.label)) return { ret: { ok: false } };
        r.taunts = [...r.taunts, { id: id(), name: p.name, label: body.label }].slice(-20);
        return { ret: { ok: true, view: view(r, pid) } };
      });
    default: return json({ ok: false, error: "Unknown action." });
  }
};
