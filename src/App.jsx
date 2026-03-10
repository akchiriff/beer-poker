import { useState, useRef, useCallback } from "react";
import Ably from "ably";

const BEERS = [
  { id: "quinto",  label: "Quinto",   emoji: "🍺",   points: 2,  desc: "Simple y rápido",          color: "#F59E0B", bg: "#2d2100" },
  { id: "cana",    label: "Caña",     emoji: "🍻",   points: 4,  desc: "Algo de análisis",          color: "#F97316", bg: "#2d1800" },
  { id: "tercio",  label: "Tercio",   emoji: "🍾",   points: 6,  desc: "Compleja, con partes",      color: "#EF4444", bg: "#2d0d0d" },
  { id: "jarra",   label: "Jarra",    emoji: "🪣",   points: 8,  desc: "Muy compleja, riesgo alto", color: "#8B5CF6", bg: "#1a0d2d" },
  { id: "litrona", label: "Litrona",  emoji: "🛢️",  points: 10, desc: "Épica, hay que dividirla",  color: "#3B82F6", bg: "#0d1a2d" },
];

const CAPACITY = [
  { val: 0,  label: "0 cañas",  emoji: "❌",         desc: "No contéis conmigo" },
  { val: 2,  label: "2 cañas",  emoji: "🍺",         desc: "Muy poca disponibilidad" },
  { val: 4,  label: "4 cañas",  emoji: "🍺🍺",       desc: "Puedo asumir poca carga" },
  { val: 6,  label: "6 cañas",  emoji: "🍺🍺🍺",     desc: "Mitad del Sprint" },
  { val: 8,  label: "8 cañas",  emoji: "🍺🍺🍺🍺",   desc: "1 semana menos" },
  { val: 10, label: "10 cañas", emoji: "🍺🍺🍺🍺🍺", desc: "A tope 🚀" },
];

const ABLY_KEY = "WmJ1Mw.fFg2Pw:cipRdirvvZ-RC9WVvfrtARistmTFTzvglM5ISPOASfQ";

function getRoomFromURL() { return new URLSearchParams(window.location.search).get("room"); }
function setRoomInURL(code) { const u = new URL(window.location.href); u.searchParams.set("room", code); window.history.replaceState({}, "", u.toString()); }
function generateCode() { const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; return Array.from({length:6},()=>c[Math.floor(Math.random()*c.length)]).join(""); }
function uid() { return Math.random().toString(36).slice(2,10); }

const S = { bg:"#0d0a06", card:"#1e1a16", card2:"#111", border:"#2d2418", gold:"#d4a853", muted:"#6b5a3e", text:"#c9b99a" };

function BeerCard({ beer, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      width:92, height:126, borderRadius:16,
      border:`3px solid ${selected ? beer.color : S.border}`,
      background: selected ? beer.bg : S.card2, cursor:"pointer",
      transition:"all 0.25s cubic-bezier(.34,1.56,.64,1)",
      transform: selected ? "translateY(-12px) scale(1.07)" : "scale(1)",
      boxShadow: selected ? `0 16px 40px ${beer.color}44` : "0 4px 12px rgba(0,0,0,0.5)",
      display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", gap:6, padding:"10px 6px",
      position:"relative", flexShrink:0, fontFamily:"Georgia,serif",
    }}>
      {selected && <div style={{position:"absolute",top:-10,right:-10,background:beer.color,borderRadius:"50%",width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#fff"}}>✓</div>}
      <span style={{fontSize:34,lineHeight:1}}>{beer.emoji}</span>
      <span style={{fontSize:12,fontWeight:800,color:selected?beer.color:S.gold}}>{beer.label}</span>
      <span style={{fontSize:9,color:selected?beer.color:S.muted,textAlign:"center",lineHeight:1.3}}>{beer.desc}</span>
    </button>
  );
}

function PlayerPill({ player, revealed, isMe, onKick, isObserver }) {
  const beer = player.vote ? BEERS.find(b=>b.id===player.vote) : null;
  return (
    <div style={{
      position:"relative", display:"flex", alignItems:"center", gap:12,
      background: isMe ? "#2d2418" : (isObserver ? "#0d1a2d" : S.card),
      border:`2px solid ${isMe ? S.gold : (isObserver ? "#1e3a5f" : S.border)}`,
      borderRadius:14, padding:"12px 16px", minWidth:190,
      opacity: isObserver ? 0.85 : 1,
    }}>
      {!isMe && onKick && (
        <button onClick={onKick} title="Expulsar de la sala" style={{
          position:"absolute", top:-8, right:-8, width:22, height:22, borderRadius:"50%",
          background:"#7f1d1d", border:"2px solid #ef4444", color:"#fca5a5",
          fontSize:11, cursor:"pointer", display:"flex", alignItems:"center",
          justifyContent:"center", lineHeight:1, padding:0, fontFamily:"Georgia,serif",
        }}>✕</button>
      )}
      <div style={{
        width:44, height:58, borderRadius:10, flexShrink:0,
        background: isObserver ? "#0a1520" : (player.vote ? (revealed ? (beer?.bg||S.border) : "#2d2418") : "#111"),
        border:`2px solid ${isObserver ? "#1e3a5f" : (player.vote ? (revealed&&beer ? beer.color : S.gold) : S.border)}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize: isObserver ? 20 : (revealed&&beer ? 22 : 16), transition:"all 0.5s",
      }}>
        {isObserver ? "👁️" : (player.vote ? (revealed ? (beer?.emoji||"?") : "🍺") : "·")}
      </div>
      <div>
        <div style={{fontWeight:700,fontSize:14,color:isMe?S.gold:(isObserver?"#60a5fa":S.text),fontFamily:"Georgia,serif"}}>
          {player.name}{isMe?" (tú)":""}
        </div>
        {isObserver
          ? <div style={{fontSize:11,color:"#3b82f6",marginTop:1}}>👁️ Observando</div>
          : revealed && beer
            ? <div style={{fontSize:12,color:beer.color,fontWeight:700,marginTop:1}}>{beer.label} · {beer.points}pts</div>
            : <div style={{fontSize:11,color:player.vote?"#6b9b47":S.muted,marginTop:1}}>{player.vote?"✓ Listo":"Pensando..."}</div>
        }
        {!isObserver && player.capacity != null && (
          <div style={{fontSize:10,color:S.muted,marginTop:1}}>{CAPACITY.find(c=>c.val===player.capacity)?.label??""}</div>
        )}
      </div>
    </div>
  );
}

function CopyBtn({ text, label="Copiar" }) {
  const [ok,setOk] = useState(false);
  return (
    <button onClick={()=>{navigator.clipboard.writeText(text);setOk(true);setTimeout(()=>setOk(false),2000);}} style={{
      background:ok?"#1a2d0d":S.card, border:`2px solid ${ok?"#6b9b47":S.border}`,
      borderRadius:8, padding:"8px 14px", color:ok?"#86efac":S.text,
      cursor:"pointer", fontSize:12, fontFamily:"Georgia,serif", flexShrink:0,
    }}>{ok?"✓ Copiado":label}</button>
  );
}

function Toggle({ checked, onChange, label, sub }) {
  return (
    <div onClick={()=>onChange(!checked)} style={{
      display:"flex", alignItems:"center", gap:14, cursor:"pointer",
      background: checked ? "#0d1a2d" : S.card2,
      border:`2px solid ${checked ? "#3b82f6" : S.border}`,
      borderRadius:14, padding:"14px 18px", transition:"all 0.2s",
    }}>
      <div style={{width:44,height:26,borderRadius:13,position:"relative",background:checked?"#3b82f6":S.border,transition:"background 0.2s",flexShrink:0}}>
        <div style={{position:"absolute",top:3,left:checked?21:3,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 2px 6px rgba(0,0,0,0.4)"}}/>
      </div>
      <div>
        <div style={{fontWeight:700,fontSize:14,color:checked?"#60a5fa":S.text,fontFamily:"Georgia,serif"}}>{label}</div>
        <div style={{fontSize:11,color:S.muted,marginTop:2}}>{sub}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [myId] = useState(uid);
  const [screen, setScreen] = useState("home");
  const [nameInput, setNameInput] = useState("");
  const [codeInput, setCodeInput] = useState(getRoomFromURL()||"");
  const [isObserverInput, setIsObserverInput] = useState(false);
  const [roomCode, setRoomCode] = useState(null);
  const [myName, setMyName] = useState("");
  const [players, setPlayers] = useState({});
  const [story, setStory] = useState("");
  const [storyInput, setStoryInput] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [tab, setTab] = useState("vote");
  const [showShare, setShowShare] = useState(false);
  const [connected, setConnected] = useState(false);
  const channelRef = useRef(null);
  const ablyRef = useRef(null);
  const stateRef = useRef({players:{},story:"",revealed:false});

  const applyState = useCallback((data) => {
    stateRef.current = data;
    setPlayers(data.players||{});
    setStory(data.story||"");
    setRevealed(data.revealed||false);
    if(data.revealed) setScreen("results");
    else setScreen(s => s === "home" ? s : "voting");
  },[]);

  const connectAbly = useCallback((code) => {
    if(ablyRef.current) ablyRef.current.close();
    const ably = new Ably.Realtime({ key: ABLY_KEY, clientId: myId });
    ablyRef.current = ably;
    ably.connection.on("connected", ()=>setConnected(true));
    ably.connection.on("disconnected", ()=>setConnected(false));
    const ch = ably.channels.get("beerpoker-" + code);
    channelRef.current = ch;
    ch.subscribe("state", msg => applyState(msg.data));
    ch.subscribe("req", msg => {
      if(msg.clientId !== myId) ch.publish("state", stateRef.current);
    });
    return ch;
  },[myId, applyState]);

  const pub = useCallback((updater) => {
    const next = updater({...stateRef.current, players:{...stateRef.current.players}});
    stateRef.current = next;
    setPlayers({...next.players});
    setStory(next.story);
    setRevealed(next.revealed);
    if(next.revealed) setScreen("results");
    channelRef.current?.publish("state", next);
  },[]);

  function createRoom() {
    if(!nameInput.trim()) return;
    const code = generateCode();
    const ch = connectAbly(code);
    const init = {players:{[myId]:{name:nameInput.trim(),vote:null,capacity:null,observer:isObserverInput}},story:"",revealed:false};
    stateRef.current = init;
    setPlayers(init.players); setStory(""); setRevealed(false);
    setTimeout(()=>ch.publish("state", init), 500);
    setRoomCode(code); setMyName(nameInput.trim());
    setRoomInURL(code); setScreen("voting"); setShowShare(true);
  }

  function joinRoom() {
    if(!nameInput.trim()||codeInput.length<4) return;
    const code = codeInput.trim().toUpperCase();
    const ch = connectAbly(code);
    setTimeout(()=>{
      ch.publish("req",{from:myId});
      setTimeout(()=>{
        pub(s=>({...s,players:{...s.players,[myId]:{name:nameInput.trim(),vote:null,capacity:null,observer:isObserverInput}}}));
      },600);
    },500);
    setRoomCode(code); setMyName(nameInput.trim());
    setRoomInURL(code); setScreen("voting");
  }

  function castVote(id) {
    pub(s=>({...s,players:{...s.players,[myId]:{...s.players[myId],vote:s.players[myId]?.vote===id?null:id}}}));
  }
  function saveCapacity(val) {
    pub(s=>({...s,players:{...s.players,[myId]:{...s.players[myId],capacity:val}}}));
  }
  function saveStory() { pub(s=>({...s,story:storyInput})); }
  function revealVotes() { pub(s=>({...s,revealed:true})); }
  function resetVotes() {
    const rp={};
    Object.entries(players).forEach(([id,p])=>{ rp[id]={...p,vote:null}; });
    pub(()=>({players:rp,story:storyInput,revealed:false}));
    setScreen("voting");
  }
  function kickPlayer(id) {
    if(id===myId) return;
    pub(s=>{ const next={...s.players}; delete next[id]; return {...s,players:next}; });
  }

  const playerList   = Object.entries(players).map(([id,p])=>({id,...p}));
  const voters       = playerList.filter(p=>!p.observer);
  const observers    = playerList.filter(p=>p.observer);
  const totalVoted   = voters.filter(p=>p.vote).length;
  const allVoted     = voters.length>0 && totalVoted===voters.length;
  const myVote       = players[myId]?.vote||null;
  const myCapacity   = players[myId]?.capacity??null;
  const amObserver   = players[myId]?.observer||false;

  const voteCounts = {};
  voters.forEach(p=>{ if(p.vote) voteCounts[p.vote]=(voteCounts[p.vote]||0)+1; });
  const totalVotes  = Object.values(voteCounts).reduce((s,v)=>s+v,0);
  const winnerVote  = Object.entries(voteCounts).sort((a,b)=>b[1]-a[1])[0]?.[0];
  const winner      = BEERS.find(b=>b.id===winnerVote);
  const avgPoints   = totalVotes>0
    ? (voters.filter(p=>p.vote).reduce((s,p)=>s+(BEERS.find(b=>b.id===p.vote)?.points||0),0)/totalVotes).toFixed(1)
    : null;
  const isConsensus = totalVotes>0 && Object.keys(voteCounts).length===1;
  const shareURL    = roomCode ? (()=>{ const u=new URL(window.location.href); u.search=""; u.searchParams.set("room",roomCode); return u.toString(); })() : "";

  const inputStyle = {width:"100%",background:S.card2,border:`2px solid ${S.border}`,borderRadius:10,padding:"12px 16px",color:S.text,fontSize:15,outline:"none",fontFamily:"Georgia,serif"};
  const ghostBtn   = {background:"transparent",border:`2px solid ${S.border}`,borderRadius:10,padding:"8px 16px",color:S.text,cursor:"pointer",fontSize:12,fontFamily:"Georgia,serif"};

  if(screen==="home") return (
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${S.bg} 0%,#1a1208 60%,${S.bg} 100%)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 20px"}}>
      <div style={{textAlign:"center",marginBottom:36}}>
        <div style={{fontSize:72}}>🍺</div>
        <h1 style={{fontSize:42,fontWeight:900,color:S.gold,letterSpacing:-1.5,margin:"0 0 6px",fontFamily:"Georgia,serif",textShadow:"0 4px 30px rgba(212,168,83,0.5)"}}>Beer Poker</h1>
        <p style={{color:S.muted,fontSize:15}}>Planning en cañas, no en puntos abstractos</p>
      </div>
      <div style={{background:S.card,border:`2px solid ${S.border}`,borderRadius:24,padding:"36px 40px",width:"100%",maxWidth:480,boxShadow:"0 32px 80px rgba(0,0,0,0.7)"}}>
        <div style={{marginBottom:20}}>
          <label style={{fontSize:11,fontWeight:700,color:S.muted,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:8}}>Tu nombre</label>
          <input value={nameInput} onChange={e=>setNameInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(codeInput.length>=4?joinRoom():createRoom())} placeholder="Ej: Jordi, María..." autoFocus style={inputStyle}/>
        </div>
        <div style={{marginBottom:20}}>
          <label style={{fontSize:11,fontWeight:700,color:S.muted,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:8}}>Código de sala <span style={{fontWeight:400,textTransform:"none"}}>(vacío = crear nueva)</span></label>
          <input value={codeInput} onChange={e=>setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6))} onKeyDown={e=>e.key==="Enter"&&(codeInput.length>=4?joinRoom():createRoom())} placeholder="Ej: BIRRA7" style={{...inputStyle,color:S.gold,fontSize:20,fontFamily:"monospace",letterSpacing:4}}/>
        </div>
        <div style={{marginBottom:24}}>
          <Toggle checked={isObserverInput} onChange={setIsObserverInput} label="👁️ Entrar como observador" sub="Verás la votación pero no votarás · ideal para SM y PO"/>
        </div>
        <button onClick={codeInput.length>=4?joinRoom:createRoom} disabled={!nameInput.trim()} style={{width:"100%",background:"linear-gradient(135deg,#d4a853,#b8831f)",border:"none",borderRadius:12,padding:"14px",color:"#0d0a06",fontWeight:800,cursor:nameInput.trim()?"pointer":"not-allowed",fontSize:15,fontFamily:"Georgia,serif",opacity:nameInput.trim()?1:0.4}}>
          {isObserverInput?"👁️ Entrar a observar":(codeInput.length>=4?"🍺 Unirse a la sala":"🎲 Crear sala nueva")}
        </button>
      </div>
      <div style={{display:"flex",gap:16,flexWrap:"wrap",justifyContent:"center",marginTop:32}}>
        {BEERS.map(b=>(
          <div key={b.id} style={{textAlign:"center"}}>
            <div style={{fontSize:24}}>{b.emoji}</div>
            <div style={{fontSize:10,color:b.color,fontWeight:700,marginTop:2}}>{b.label}</div>
            <div style={{fontSize:9,color:S.muted}}>{b.points}pts</div>
          </div>
        ))}
      </div>
    </div>
  );

  if(screen==="voting") return (
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${S.bg} 0%,#1a1208 60%,${S.bg} 100%)`,padding:"20px 16px"}}>
      <div style={{maxWidth:960,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:28}}>🍺</span>
            <div>
              <div style={{fontSize:17,fontWeight:900,color:S.gold,fontFamily:"Georgia,serif"}}>Beer Poker</div>
              <div style={{fontSize:11,color:S.muted}}>
                {myName}
                {amObserver && <span style={{color:"#60a5fa",marginLeft:6}}>👁️ observando</span>}
                {" · sala "}<strong style={{color:S.gold,fontFamily:"monospace",letterSpacing:2}}>{roomCode}</strong>
                <span style={{marginLeft:8,color:connected?"#6b9b47":"#ef4444"}}>● {connected?"en vivo":"reconectando..."}</span>
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button onClick={()=>setShowShare(s=>!s)} style={ghostBtn}>🔗 Compartir</button>
            <button onClick={resetVotes} style={{...ghostBtn,color:"#fca5a5",borderColor:"#7f1d1d"}}>🔄 Resetear votos</button>
            {allVoted && (
              <button onClick={revealVotes} style={{background:"linear-gradient(135deg,#4a7a2d,#2d5a1a)",border:"none",borderRadius:10,padding:"10px 20px",color:"#d4f5b0",fontWeight:800,cursor:"pointer",fontSize:13,fontFamily:"Georgia,serif"}}>
                🎉 Revelar votos
              </button>
            )}
          </div>
        </div>

        {showShare && (
          <div style={{background:S.card,border:`2px solid ${S.border}`,borderRadius:16,padding:"18px 20px",marginBottom:16}}>
            <div style={{fontSize:11,color:S.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>🔗 Comparte con tu equipo</div>
            <div style={{display:"flex",gap:10,marginBottom:10,alignItems:"center"}}>
              <div style={{flex:1,background:S.card2,borderRadius:8,padding:"8px 14px",fontFamily:"monospace",fontSize:24,fontWeight:900,color:S.gold,letterSpacing:6,textAlign:"center"}}>{roomCode}</div>
              <CopyBtn text={roomCode} label="Copiar código"/>
            </div>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <div style={{flex:1,background:S.card2,borderRadius:8,padding:"8px 14px",fontSize:11,color:S.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{shareURL}</div>
              <CopyBtn text={shareURL} label="Copiar link"/>
            </div>
            <div style={{fontSize:10,color:S.muted,marginTop:8}}>El link incluye el código — quien lo abra entra directo a la sala.</div>
          </div>
        )}

        <div style={{background:S.card,border:`2px solid ${S.border}`,borderRadius:16,padding:"16px 20px",marginBottom:16}}>
          <div style={{fontSize:11,color:S.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Historia a estimar</div>
          <div style={{display:"flex",gap:10}}>
            <input value={storyInput} onChange={e=>setStoryInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveStory()} placeholder="Como usuario quiero... / Nombre del ticket" style={{flex:1,background:S.card2,border:`2px solid ${S.border}`,borderRadius:8,padding:"10px 14px",color:S.text,fontSize:14,outline:"none",fontFamily:"Georgia,serif"}}/>
            <button onClick={saveStory} style={{...ghostBtn,color:S.gold}}>Guardar</button>
          </div>
          {story && <div style={{marginTop:8,fontSize:13,color:S.text,fontStyle:"italic",padding:"8px 12px",background:S.card2,borderRadius:8}}>📋 {story}</div>}
        </div>

        {!amObserver && (
          <>
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              {[["vote","🍺 Votar tamaño"],["capacity","📊 Mi capacidad"]].map(([t,lbl])=>(
                <button key={t} onClick={()=>setTab(t)} style={{background:tab===t?S.card:"transparent",border:`2px solid ${tab===t?S.gold:S.border}`,borderRadius:10,padding:"8px 18px",color:tab===t?S.gold:S.muted,cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"Georgia,serif"}}>{lbl}</button>
              ))}
            </div>
            {tab==="vote" && (
              <div style={{background:S.card,border:`2px solid ${S.border}`,borderRadius:20,padding:"28px 24px",marginBottom:16}}>
                <div style={{fontSize:12,color:S.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:22,textAlign:"center"}}>¿Cuánta cerveza tiene esta historia?</div>
                <div style={{display:"flex",gap:14,flexWrap:"wrap",justifyContent:"center"}}>
                  {BEERS.map(beer=><BeerCard key={beer.id} beer={beer} selected={myVote===beer.id} onClick={()=>castVote(beer.id)}/>)}
                </div>
              </div>
            )}
            {tab==="capacity" && (
              <div style={{background:S.card,border:`2px solid ${S.border}`,borderRadius:20,padding:"28px 24px",marginBottom:16}}>
                <div style={{fontSize:12,color:S.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:20,textAlign:"center"}}>¿Cuántas cañas tienes este sprint?</div>
                <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center"}}>
                  {CAPACITY.map(c=>(
                    <button key={c.val} onClick={()=>saveCapacity(c.val)} style={{background:myCapacity===c.val?"#2d2418":S.card2,border:`3px solid ${myCapacity===c.val?S.gold:S.border}`,borderRadius:14,padding:"16px 20px",cursor:"pointer",textAlign:"center",transition:"all 0.2s",minWidth:110,transform:myCapacity===c.val?"scale(1.06)":"scale(1)",fontFamily:"Georgia,serif"}}>
                      <div style={{fontSize:20,marginBottom:4}}>{c.emoji}</div>
                      <div style={{fontSize:12,fontWeight:800,color:myCapacity===c.val?S.gold:S.text}}>{c.label}</div>
                      <div style={{fontSize:10,color:S.muted,marginTop:2}}>{c.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {amObserver && (
          <div style={{background:"#0d1a2d",border:"2px solid #1e3a5f",borderRadius:16,padding:"20px 24px",marginBottom:16,textAlign:"center"}}>
            <div style={{fontSize:32,marginBottom:8}}>👁️</div>
            <div style={{fontWeight:700,fontSize:15,color:"#60a5fa",fontFamily:"Georgia,serif"}}>Modo observador activo</div>
            <div style={{fontSize:12,color:S.muted,marginTop:4}}>Estás viendo la votación en tiempo real · No puedes votar</div>
            <div style={{marginTop:12,fontSize:13,color:"#93c5fd"}}>
              {totalVoted}/{voters.length} votantes han votado{allVoted?" · ¡Listos para revelar! 🎉":""}
            </div>
          </div>
        )}

        <div style={{background:S.card,border:`2px solid ${S.border}`,borderRadius:16,padding:"18px 20px",marginBottom:observers.length>0?12:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div style={{fontSize:12,color:S.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>Votantes · {totalVoted}/{voters.length} listos</div>
            {allVoted && <span style={{fontSize:12,color:"#6b9b47",fontWeight:700}}>¡Todos han votado! 🎉</span>}
          </div>
          <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
            {voters.map(p=>(
              <PlayerPill key={p.id} player={p} revealed={false} isMe={p.id===myId} onKick={()=>kickPlayer(p.id)} isObserver={false}/>
            ))}
            {voters.length===0 && <div style={{fontSize:13,color:S.muted,fontStyle:"italic"}}>Nadie votando aún...</div>}
          </div>
          <div style={{marginTop:14,height:5,background:"#111",borderRadius:3,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${voters.length>0?(totalVoted/voters.length)*100:0}%`,background:allVoted?"#6b9b47":S.gold,borderRadius:3,transition:"width 0.5s"}}/>
          </div>
        </div>

        {observers.length>0 && (
          <div style={{background:"#0a1520",border:"2px solid #1e3a5f",borderRadius:16,padding:"16px 20px"}}>
            <div style={{fontSize:12,color:"#3b82f6",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>👁️ Observando · {observers.length}</div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {observers.map(p=>(
                <PlayerPill key={p.id} player={p} revealed={false} isMe={p.id===myId} onKick={()=>kickPlayer(p.id)} isObserver={true}/>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if(screen==="results") return (
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${S.bg} 0%,#1a1208 60%,${S.bg} 100%)`,padding:"20px 16px"}}>
      <div style={{maxWidth:960,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:52}}>{winner?.emoji||"🍺"}</div>
          <h2 style={{fontSize:30,fontWeight:900,color:S.gold,fontFamily:"Georgia,serif",margin:"8px 0 4px"}}>¡Votos revelados!</h2>
          {story && <div style={{fontSize:14,color:S.text,fontStyle:"italic",background:S.card,borderRadius:10,padding:"8px 18px",display:"inline-block",marginTop:4}}>📋 {story}</div>}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
          <div style={{background:S.card,border:`2px solid ${S.border}`,borderRadius:18,padding:"22px 24px"}}>
            <div style={{fontSize:11,color:S.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:16}}>Distribución de votos</div>
            {BEERS.filter(b=>voteCounts[b.id]).map(b=>{
              const count=voteCounts[b.id]||0, pct=totalVotes>0?(count/totalVotes)*100:0, isW=b.id===winnerVote;
              return (
                <div key={b.id} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0"}}>
                  <span style={{fontSize:20,width:28}}>{b.emoji}</span>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:12,fontWeight:700,color:isW?b.color:S.text,fontFamily:"Georgia,serif"}}>{b.label} {isW?"🏆":""}</span>
                      <span style={{fontSize:11,color:S.muted}}>{count} voto{count!==1?"s":""}</span>
                    </div>
                    <div style={{height:8,background:"#111",borderRadius:4,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${pct}%`,background:isW?b.color:"#3d2f1a",borderRadius:4,transition:"width 0.8s cubic-bezier(.34,1.56,.64,1)"}}/>
                    </div>
                  </div>
                </div>
              );
            })}
            <div style={{marginTop:18,padding:"14px",background:S.card2,borderRadius:12,textAlign:"center"}}>
              <div style={{fontSize:11,color:S.muted,marginBottom:4}}>Estimación ganadora · Promedio</div>
              <div style={{fontSize:26,fontWeight:900,color:winner?.color||S.gold,fontFamily:"Georgia,serif"}}>{winner?.label||"—"} · {avgPoints} pts</div>
            </div>
          </div>

          <div style={{background:S.card,border:`2px solid ${S.border}`,borderRadius:18,padding:"22px 24px"}}>
            <div style={{fontSize:11,color:S.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:16}}>Votos individuales</div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {voters
                .sort((a,b)=>(BEERS.find(x=>x.id===b.vote)?.points||0)-(BEERS.find(x=>x.id===a.vote)?.points||0))
                .map(p=><PlayerPill key={p.id} player={p} revealed={true} isMe={p.id===myId} onKick={()=>kickPlayer(p.id)} isObserver={false}/>)
              }
            </div>
            {observers.length>0 && (
              <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${S.border}`}}>
                <div style={{fontSize:11,color:"#3b82f6",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>👁️ Observadores</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {observers.map(p=><PlayerPill key={p.id} player={p} revealed={true} isMe={p.id===myId} onKick={()=>kickPlayer(p.id)} isObserver={true}/>)}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{background:isConsensus?"#0d1a0d":"#1a0d0d",border:`2px solid ${isConsensus?"#6b9b47":"#7f1d1d"}`,borderRadius:14,padding:"16px 20px",marginBottom:20,textAlign:"center"}}>
          {isConsensus
            ? <div style={{color:"#86efac",fontWeight:700,fontSize:15}}>✅ ¡Consenso total! Todo el equipo votó {winner?.label}.</div>
            : <div style={{color:"#fca5a5",fontWeight:700,fontSize:15}}>⚠️ Hay diferencias — discutid y votad de nuevo. Los extremos deberían explicar su razonamiento.</div>
          }
        </div>

        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={resetVotes} style={{background:"linear-gradient(135deg,#d4a853,#b8831f)",border:"none",borderRadius:12,padding:"14px 32px",color:"#0d0a06",fontWeight:800,cursor:"pointer",fontSize:15,fontFamily:"Georgia,serif"}}>🔄 Nueva votación</button>
          <button onClick={()=>setShowShare(s=>!s)} style={{background:"transparent",border:`2px solid ${S.border}`,borderRadius:12,padding:"14px 20px",color:S.text,cursor:"pointer",fontSize:14,fontFamily:"Georgia,serif"}}>🔗 Compartir sala</button>
          <button onClick={()=>setScreen("voting")} style={{background:"transparent",border:`2px solid ${S.border}`,borderRadius:12,padding:"14px 20px",color:S.text,cursor:"pointer",fontSize:14,fontFamily:"Georgia,serif"}}>← Volver a sala</button>
        </div>

        {showShare && (
          <div style={{background:S.card,border:`2px solid ${S.border}`,borderRadius:16,padding:"18px 20px",marginTop:16}}>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <div style={{flex:1,background:S.card2,borderRadius:8,padding:"8px 14px",fontFamily:"monospace",fontSize:22,fontWeight:900,color:S.gold,letterSpacing:6,textAlign:"center"}}>{roomCode}</div>
              <CopyBtn text={shareURL} label="Copiar link"/>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return null;
}
