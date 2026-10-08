const guide=`<div class="masala-guide" style="margin-top:10px"><b>Possible periods</b><br>Normal Period — no change.<br>Exam Day — 4 messages; clean slip +2.<br>Free Period — 70 seconds; 8 messages.<br>Substitute Teacher — wrong accusation gives +3.<br>Principal Inspection — 60 characters; correct catch +4.</div>`;
let lastTarget="";
function masala(){const s=window.chitState,m=window.chitMe;
const hb=document.querySelector("#howto-body");if(hb&&!hb.querySelector(".masala-guide"))hb.insertAdjacentHTML("beforeend",guide);
const og=document.querySelector("#ov-guide");if(og&&!og.querySelector(".masala-guide"))og.insertAdjacentHTML("beforeend",guide);
if(!s)return;
const r=s.round;if(!r||!r.scenario)return;
const input=document.querySelector("#chattext");
const silenced=r.silenced?.playerId===m&&r.silenced.until>Date.now();
if(input){input.maxLength=r.scenario.max;input.disabled=silenced;if(silenced)input.placeholder=`Silenced · ${Math.ceil((r.silenced.until-Date.now())/1000)}s`;}
const box=document.querySelector("#verdict");if(!box)return;
if(s.phase==="chat"&&r.teacherId===m&&!box.querySelector(".silence")){
box.insertAdjacentHTML("beforeend",`<div class="panel silence"><h4>Silence card</h4><select class="field" id="silence-target"><option value="">Pick a suspicious student</option>${s.players.filter(p=>p.id!==m&&p.connected).map(p=>`<option value="${p.id}">${p.name}</option>`).join("")}</select><button class="btn secondary" id="silence-btn" ${r.silenceUsed?"disabled":""}>Silence for 10s</button></div>`);
const sel=document.querySelector("#silence-target");if(lastTarget)sel.value=lastTarget;sel.onchange=()=>{lastTarget=sel.value};
document.querySelector("#silence-btn").onclick=()=>window.chitSocket.emit("silence",{studentId:sel.value},x=>{if(!x.ok)alert(x.error)});}
if(s.phase==="results"&&!box.querySelector(".taunts")){
box.insertAdjacentHTML("beforeend",`<div class="panel taunts"><h4>Class commentary</h4><div class="row">${["Pakda gaya!","Clean slip!","Sus.","Why me?"].map(l=>`<button class="tbtn">${l}</button>`).join("")}</div></div>`);
box.querySelectorAll(".tbtn").forEach(b=>b.onclick=()=>window.chitSocket.emit("taunt",b.textContent));}}
setInterval(masala,300);masala();
