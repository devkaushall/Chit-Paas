function io() {
  const API = "/.netlify/functions/game";
  const L = {}; let code = "", pid = "", last = "", seenT = new Set(), timer = null;
  const S = {
    on: (e, f) => { (L[e] = L[e] || []).push(f); },
    close: () => { clearInterval(timer); timer = null; },
    emit: (e, payload, cb) => {
      let body = { action: e, code, pid };
      if (e === "message") body.text = payload;
      else if (e === "taunt") body.label = payload;
      else if (payload && typeof payload === "object") Object.assign(body, payload);
      fetch(API, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
        .then(r => r.json())
        .then(r => {
          if (r.ok && (e === "create" || e === "join" || e === "resume")) { code = r.code; pid = r.id; startPoll(); }
          cb && cb(r);
          if (r.view) push(r.view);
        })
        .catch(() => cb && cb({ ok: false, error: "Network problem — try again." }));
    }
  };
  let seeded = false;
  function push(view) {
    if (!seeded) { seeded = true; (view.taunts || []).forEach(t => seenT.add(t.id)); }
    for (const t of (view.taunts || [])) if (!seenT.has(t.id)) { seenT.add(t.id); (L.taunt || []).forEach(f => f(t)); }
    const j = JSON.stringify(view);
    if (j !== last) { last = j; (L.state || []).forEach(f => f(view)); }
  }
  function startPoll() {
    if (timer) return;
    timer = setInterval(() => {
      fetch(`${API}?code=${encodeURIComponent(code)}&pid=${encodeURIComponent(pid)}`)
        .then(r => r.json()).then(r => r.view && push(r.view)).catch(() => {});
    }, 1200);
  }
  try { const seat = JSON.parse(localStorage.getItem("chit-seat") || "null"); if (seat) { code = seat.code; pid = seat.pid; startPoll(); } } catch {}
  setTimeout(() => (L.connect || []).forEach(f => f()), 0);
  return S;
}
