const socket=io(),app=document.querySelector("#app");let me,state,liveKey="",phaseKey="",alertText="",evts=[],prev=null;
const esc=x=>String(x).replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const AVC=["#e4570f","#49704d","#b0788c","#7a6bd6","#3d84c6","#d6a13d","#c2410c","#5b8c5a"];
const seat=()=>JSON.parse(sessionStorage.getItem("chit-seat")||"null"),save=r=>{me=r.id;sessionStorage.setItem("chit-seat",JSON.stringify({code:r.code,pid:r.id}))};
const ava=(p,i,sz="")=>`<span class="ava ${sz}" style="--c:${AVC[i%AVC.length]}">${esc((p.name[0]||"?").toUpperCase())}<i class="dot"></i></span>`;
const AR=`<svg class="ar" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
function logEv(txt,color="#d6a13d"){const t=new Date();evts.unshift({t:`${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`,txt,color});evts=evts.slice(0,8);}
function land(){liveKey="land";app.innerHTML=`<div class="landing"><div>
<div class="brand">CHIT-PAAS<small>THE BACKBENCHER’S WORD GAME</small></div>
<h1 class="hero">Slip it in.<br><em>Don’t get caught.</em></h1>
<p class="lede">A warm, quick classroom game for 2–8 people. Everyone joins from their own device; one player watches the chat like a hawk.</p>
<div class="forms">
<form class="card" id="create"><h2>Create a Class</h2><p class="sub">Make a new room and invite friends.</p><input class="field" name="name" maxlength="18" placeholder="Your name" required><select class="field" name="rounds"><option value="3">3 rounds · quick</option><option value="5" selected>5 rounds · classic</option><option value="7">7 rounds · proper bunks</option></select><button class="btn primary" style="width:100%">Make Room ${AR}</button></form>
<form class="card" id="join"><h2>Join a Class</h2><p class="sub">Enter a room code to join.</p><input class="field" name="name" maxlength="18" placeholder="Your name" required><input class="field" name="code" maxlength="6" placeholder="ROOM CODE" required style="text-transform:uppercase"><button class="btn secondary" style="width:100%">Join Room ${AR}</button></form>
</div>
<div class="or-row">or</div>
<button class="howto" id="howto"><span class="ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c2410c" stroke-width="2"><path d="M2 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2zM22 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z"/></svg></span><span><b>Learn How to Play</b><span>Quick guide, rules and example periods.</span></span><span class="chev">›</span></button>
<div class="card howto-body hidden" id="howto-body"><b>Students</b> get a secret chit word and slip it naturally into class chat. <b>The Teacher</b> reads closely and gets one accusation per round. Correct catch +3 · wrong catch gives the student +2 · clean slip +1. Periods like <i>Exam Day</i> or <i>Free Period</i> twist the rules each round.</div>
<div class="feat-row">
<span class="feat"><svg class="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="7" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20c0-4 3-6 7-6s7 2 7 6M15 14c3 0 6 1.6 6 5"/></svg>2–8 players</span>
<span class="feat"><svg class="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></svg>Any device</span>
<span class="feat"><svg class="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>Quick rounds</span>
<span class="feat"><svg class="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M8.5 14c1 1.4 2.2 2 3.5 2s2.5-.6 3.5-2M9 10h.01M15 10h.01"/></svg>Fun with friends</span>
</div></div>
<div class="board"><div class="chalk">Same Class.<br>New Chaos.</div>
<svg class="plane" viewBox="0 0 64 48" fill="none"><path d="M2 26 62 4 40 44 30 30z" fill="#fff" stroke="#e4570f" stroke-width="2"/><path d="M30 30 62 4" stroke="#e4570f" stroke-width="2"/></svg>
<svg class="doodle" style="left:10%;bottom:14%" width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M8.5 14c1 1.4 2.2 2 3.5 2s2.5-.6 3.5-2M9 10h.01M15 10h.01"/></svg>
<div class="note n1">Good Students Better Friends ☺</div>
<div class="note n2">Free Period = More Fun</div>
</div></div>`;
document.querySelector("#howto").onclick=()=>document.querySelector("#howto-body").classList.toggle("hidden");
document.querySelector("#create").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);socket.emit("create",{name:f.get("name"),rounds:+f.get("rounds")},save)};
document.querySelector("#join").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);socket.emit("join",{name:f.get("name"),code:f.get("code")},r=>r.ok?save(r):alert(r.error))};}
const time=x=>Math.max(0,Math.ceil((x-Date.now())/1000));
setInterval(()=>{const t=document.querySelector("#timer");if(t&&t.dataset.end)t.textContent=`${time(+t.dataset.end)}s`},300);
function live(){const r=state.round,t=r.teacherId===me;
const rail=state.players.map((p,i)=>`<div class="p-card ${p.connected?"":"offline"} ${p.id===me?"me":""}">${ava(p,i)}<span class="who">${esc(p.name)}${p.id===r.teacherId?'<small>👑 Teacher</small>':""}</span>${p.id===me?'<span class="you-chip">YOU</span>':""}<b>${p.score}</b></div>`).join("");
app.innerHTML=`<div class="topbar"><span class="brand-sm">CHIT-PAAS</span><span class="pill round"><b>Round ${state.roundNumber}/${state.settings.rounds}</b><span class="sc" id="scname"></span></span><span class="pill timer" id="timer">–</span><span class="grow"></span><button class="iconbtn" id="help" title="How to play">?</button><button class="btn ghost" id="leave">Leave</button><span class="pill round">${state.code}</span></div>
<div class="game"><div class="rail"><h3>Players (${state.players.length})</h3>${rail}</div>
<section class="card chat-card"><div class="chat-head"><div class="grow"><h2 style="margin:0">Class Chat</h2><div class="role-line" id="role"></div></div></div>
<div class="scenario-strip" id="strip"></div>
<div class="messages" id="messages"></div>
<form class="send ${t?"hidden":""}" id="send"><input class="field" id="chattext" maxlength="120" autocomplete="off" placeholder="Say it casually…"><button class="btn primary">Send ${AR}</button></form>
<div class="small-note" id="left"></div><div class="small-note" id="note"></div></section>
<aside class="side"><div class="role-card"><h3>Your Role</h3><div id="roletxt"></div><div class="mission" id="mission"></div></div>
<div class="card info-card"><h3>Period Info</h3><div id="periodinfo"></div></div>
<div class="card events-card"><h3>Recent Events</h3><div id="events"></div></div>
<section id="verdict"></section></aside></div><div class="overlay hidden" id="overlay"><div class="card"><h2>How to play</h2><p class="sub">Students slip a secret chit word into class chat. The Teacher reads closely and gets one accusation per round. Correct catch +3 · wrong catch +2 to the accused · clean slip +1. Periods twist the rules each round.</p><div id="ov-guide"></div><button class="btn primary">Got it</button></div></div>`;
document.querySelector("#send").onsubmit=e=>{e.preventDefault();const i=document.querySelector("#chattext");socket.emit("message",i.value,x=>{if(x.ok){i.value="";alertText=""}else alertText=x.error;paint()})};
document.querySelector("#help").onclick=()=>document.querySelector("#overlay").classList.toggle("hidden");
document.querySelector("#leave").onclick=()=>{socket.emit("leave",{});sessionStorage.removeItem("chit-seat");me=null;state=null;prev=null;evts=[];liveKey="";render();};
const ov=document.querySelector("#overlay");if(ov)ov.querySelector("button").onclick=()=>ov.classList.add("hidden");}
function paint(){if(!state)return;const r=state.round,t=r.teacherId===me,open=state.phase==="chat"&&!t&&r.myChit;
const role=document.querySelector("#role");if(role)role.innerHTML=t?"You’re the <b>Teacher</b>. Read closely — one accusation at the end.":r.myChit?`You’re a <b>Student</b>. Work your chit into the chat.`:"";
const strip=document.querySelector("#strip");if(strip&&r.scenario)strip.innerHTML=`<span><b>${esc(r.scenario.name)}</b> · ${esc(r.scenario.flavour)}</span><span>${r.scenario.limit} msgs · ${r.scenario.chat}s</span>`;
const sc=document.querySelector("#scname");if(sc)sc.textContent="· "+r.scenario.name;
const tm=document.querySelector("#timer");if(tm){tm.dataset.end=state.phase==="chat"?r.chatEndsAt:r.verdictEndsAt;tm.textContent=`${time(+tm.dataset.end)}s`}
const b=document.querySelector("#messages");if(b){const down=b.scrollTop+b.clientHeight>=b.scrollHeight-16;b.innerHTML=state.messages.length===0&&state.phase==="chat"?`<div class="empty">No bakbak yet… slip your chit casually.</div>`:state.messages.map((m)=>{const i=state.players.findIndex(p=>p.id===m.playerId||p.name===m.name);return `<div class="msg">${ava({name:m.name},i<0?0:i,"sm")}<div><div class="meta">${esc(m.name)}</div><span class="bubble">${esc(m.text)}</span></div></div>`}).join("");if(down)b.scrollTop=b.scrollHeight}
const send=document.querySelector("#send");if(send)send.classList.toggle("hidden",!open);
const left=document.querySelector("#left");if(left)left.textContent=open?`${r.messagesLeft} of ${r.scenario.limit} messages left this round.`:"";
const note=document.querySelector("#note");if(note)note.textContent=alertText;
const ro=document.querySelector("#roletxt");if(ro){const i=state.players.findIndex(p=>p.id===me);ro.innerHTML=`<div class="role-line2">${ava(state.players.find(p=>p.id===me)||{name:"?"},i)}<span class="rname ${t?"teacher":"student"}">${t?"Teacher":"Student"}</span></div>`}
const mis=document.querySelector("#mission");if(mis)mis.innerHTML=t?`<span class="lab">🎯 Your Mission</span><p>Catch the chits. One accusation this round.</p>`:`<span class="lab">🎯 Your Mission</span><p>Slip your chit in naturally:</p><span class="chit">${esc(r.myChit||"")}</span>`;
const pi=document.querySelector("#periodinfo");if(pi)pi.innerHTML=`<div class="ev"><span class="sw" style="background:#e4570f"></span>${esc(r.scenario.name)} — ${esc(r.scenario.flavour)}</div>`;
const ev=document.querySelector("#events");if(ev)ev.innerHTML=evts.map(e=>`<div class="ev"><time>${e.t}</time><span class="sw" style="background:${e.color}"></span>${esc(e.txt)}</div>`).join("")||`<div class="ev"><time>—</time>Class is settling down…</div>`;
const v=document.querySelector("#verdict");
if(state.phase!==phaseKey){ /* phase changed: rebuild verdict container */
 if(state.phase==="verdict")v.innerHTML=t?`<div class="panel"><h4>One accusation. Make it count.</h4><select class="field" id="suspect"><option value="">Choose student</option>${state.players.filter(p=>p.id!==me).map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("")}</select><input class="field" id="word" list="words" placeholder="Type any word from the full deck"><datalist id="words">${(state.deck||[]).map(w=>`<option value="${w}">`).join("")}</datalist><button class="btn primary" id="accuse">Submit ${AR}</button></div>`:`<div class="panel"><h4>Teacher is deciding…</h4><p class="sub">The class chat is now locked.</p></div>`;
 else if(state.phase==="results"){const z=r.results;const an=r.accusation?state.players.find(p=>p.id===r.accusation.studentId)?.name:null;v.innerHTML=`<div class="panel"><h4>${z.correct?"Caught!":"The verdict is in."}</h4>${r.accusation?`<div class="res-row head"><span>${esc(an||"?")} was accused of “${esc(r.accusation.word)}” — ${z.correct?"correct catch!":"wrong, they walk free."}</span></div>`:"<div class=\"res-row head\"><span>No accusation was made.</span></div>"}${state.players.map(p=>`<div class="res-row"><span>${esc(p.name)} · ${esc(z.words[p.id]||"—")}</span><b>+${z.deltas[p.id]||0}</b></div>`).join("")}</div>`;}
 else v.innerHTML="";
 phaseKey=state.phase;}
if(state.phase==="verdict"&&t){const a=document.querySelector("#accuse");if(a&&!a.dataset.bound){a.dataset.bound=1;a.onclick=()=>socket.emit("accuse",{studentId:document.querySelector("#suspect").value,word:document.querySelector("#word").value},x=>{if(!x.ok){alertText=x.error;paint()}})}}}
function render(){if(!state||!me)return land();if(state.phase==="lobby"){liveKey="lobby";app.innerHTML=`<div class="topbar"><span class="brand-sm">CHIT-PAAS</span><span class="grow"></span><span class="pill round">${state.code}</span></div><section class="card" style="max-width:520px;margin:4vh auto"><h2>Classroom waiting room</h2><p class="sub">Share this room code. Start once one more joins.</p><div class="pill timer" style="font-size:1.6rem;padding:10px 26px">${state.code}</div><p style="margin:14px 0">${state.players.filter(p=>p.connected).length}/8 students present.</p><button class="btn primary" id="start" ${state.players.filter(p=>p.connected).length<2?"disabled":""}>Start class ${AR}</button><p class="small-note">The room belongs to everyone — if the creator leaves, the class carries on.</p></section>`;document.querySelector("#start").onclick=()=>socket.emit("start");return}
if(state.phase==="gameover"){liveKey="over";const p=[...state.players].sort((a,b)=>b.score-a.score);app.innerHTML=`<section class="card over-card"><div class="brand">CHIT-PAAS<small>FINAL BELL</small></div><h1>${esc(p[0].name)} wins the class.</h1>${p.map((x,i)=>`<div class="res-row"><span>${i+1}. ${esc(x.name)}</span><b>${x.score} pts</b></div>`).join("")}<button class="btn primary" id="again" style="margin-top:14px">Play again ${AR}</button></section>`;document.querySelector("#again").onclick=()=>socket.emit("again",{});return}
if(liveKey!==`live-${state.roundNumber}`){liveKey=`live-${state.roundNumber}`;phaseKey="";live()}paint()}
function diff(s){if(!prev||!s.round)return;const q=s.round,p=prev.round||{};
if(s.roundNumber!==(prev.roundNumber||0))logEv(`Round ${s.roundNumber} · ${q.scenario?.name}`,"#e4570f");
if(q.silenced&&(!p.silenced||p.silenced.playerId!==q.silenced.playerId))logEv(`Teacher silenced ${s.players.find(x=>x.id===q.silenced.playerId)?.name||"?"}`,"#ef8f76");
if(s.phase==="verdict"&&prev.phase==="chat")logEv("Chat locked — verdict time","#d6a13d");
if(s.phase==="results"&&prev.phase!=="results")logEv(q.results?.correct?"Teacher caught someone!":"Everyone slipped through","#49704d");
}
socket.on("state",x=>{diff(x);prev=x;state=x;window.chitState=state;window.chitMe=me;window.chitSocket=socket;render()});
socket.on("taunt",t=>{logEv(`${t.name}: ${t.label}`,"#7a6bd6");const d=document.createElement("div");d.className="taunt-pop";d.textContent=`${t.name}: ${t.label}`;document.body.append(d);setTimeout(()=>d.remove(),2200);if(state)paint()});
socket.on("connect",()=>{const x=seat();if(x&&!me)socket.emit("resume",{code:x.code,pid:x.pid},r=>{if(r.ok)save(r);else sessionStorage.removeItem("chit-seat")})});
window.chitSocket=socket;land();
