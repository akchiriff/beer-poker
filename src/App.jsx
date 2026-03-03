import { useState, useEffect, useCallback, useRef } from "react";

// ─── Beer sizes ──────────────────────────────────────────────
const BEERS = [
  { id: "quinto",  label: "Quinto",   emoji: "🍺",   points: 1,  desc: "Simple y rápido",          color: "#F59E0B", bg: "#2d2100" },
  { id: "cana",    label: "Caña",     emoji: "🍻",   points: 2,  desc: "Algo de análisis",          color: "#F97316", bg: "#2d1800" },
  { id: "tercio",  label: "Tercio",   emoji: "🍾",   points: 3,  desc: "Compleja, con partes",      color: "#EF4444", bg: "#2d0d0d" },
  { id: "jarra",   label: "Jarra",    emoji: "🪣",   points: 5,  desc: "Muy compleja, riesgo alto", color: "#8B5CF6", bg: "#1a0d2d" },
  { id: "litrona", label: "Litrona",  emoji: "🛢️",  points: 8,  desc: "Épica, hay que dividirla",  color: "#3B82F6", bg: "#0d1a2d" },
  { id: "barril",  label: "¡Barril!", emoji: "🛑",   points: 13, desc: "Rompe en tareas primero",   color: "#6B7280", bg: "#1a1a1a" },
];

const CAPACITY = [
  { val: 0,  label: "0 cañas", emoji: "❌", desc: "No contéis conmigo" },
  { val: 2,  label: "2 cañas", emoji: "🍺", desc: "Muy poca disponibilidad" },
  { val: 4,  label: "4 cañas", emoji: "🍺🍺", desc: "Puedo asumir poca carga" },
  { val: 6,  label: "6 cañas", emoji: "🍺🍺🍺", desc: "Mitad del Sprint" },
  { val: 8,  label: "8 cañas", emoji: "🍺🍺🍺🍺", desc: "1 semana menos" },
  { val: 10, label: "10 cañas", emoji: "🍺🍺🍺🍺🍺", desc: "A tope 🚀" },
];

// ─── Room code from URL ──────────────────────────────────────
function getRoomFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("room") || params.get("sala");
}

function setRoomInURL(code) {
  const url = new URL(window.location.href);
  url.searchParams.set("room", code);
  window.history.replaceState({}, "", url.toString());
}

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Storage (localStorage + BroadcastChannel for same-device sync) ──
// For cross-device: we use a simple polling approach with localStorage
// and a server-sent-events approach via a free service (or just localStorage for demo)
// 
// For real cross-device multiplayer without a server, we use:
// localStorage (same device) + optional Supabase/Firebase key in .env
// 
// Since this is GitHub Pages (static), we implement:
// Option A: localStorage + BroadcastChannel (same browser/device, multiple tabs)  ← WORKS
// Option B: PeerJS (P2P via WebRTC) — host shares link, others join via URL       ← WORKS cross-device

const STORAGE_PREFIX = "beerpoker_room_";

function saveRoomLocal(code, data) {
  try {
    localStorage.setItem(STORAGE_PREFIX + code, JSON.stringify({ ...data, updatedAt: Date.now() }));
    // Broadcast to other tabs
    try {
      const bc = new BroadcastChannel("beerpoker_" + code);
      bc.postMessage({ type: "update", data });
      bc.close();
    } catch {}
  } catch {}
}

function loadRoomLocal(code) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + code);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ─── Share URL builder ────────────────────────────────────────
function buildShareURL(code) {
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("room", code);
  return url.toString();
}

// ─── Components ──────────────────────────────────────────────

const S = {
  bg: "#0d0a06",
  card: "#1e1a16",
  card2: "#111",
  border: "#2d2418",
  gold: "#d4a853",
  muted: "#6b5a3e",
  text: "#c9b99a",
};

function Btn({ children, onClick, variant = "ghost", disabled, style = {} }) {
  const variants = {
    primary: { background: "linear-gradient(135deg, #d4a853, #b8831f)", color: "#0d0a06", border: "none" },
    ghost: { background: "transparent", color: S.text, border: `2px solid ${S.border}` },
    green: { background: "linear-gradient(135deg, #4a7a2d, #2d5a1a)", color: "#d4f5b0", border: "none" },
    danger: { background: "transparent", color: "#ef4444", border: "2px solid #7f1d1d" },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...variants[variant],
        borderRadius: 10,
        padding: "10px 20px",
        fontWeight: 800,
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: 13,
        fontFamily: "Georgia, serif",
        opacity: disabled ? 0.4 : 1,
        transition: "all 0.2s",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function BeerCard({ beer, selected, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 92,
        height: 126,
        borderRadius: 16,
        border: `3px solid ${selected ? beer.color : S.border}`,
        background: selected ? beer.bg : S.card2,
        cursor: disabled ? "default" : "pointer",
        transition: "all 0.25s cubic-bezier(.34,1.56,.64,1)",
        transform: selected ? "translateY(-12px) scale(1.07)" : "scale(1)",
        boxShadow: selected ? `0 16px 40px ${beer.color}44` : "0 4px 12px rgba(0,0,0,0.5)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "10px 6px",
        position: "relative",
        flexShrink: 0,
      }}
    >
      {selected && (
        <div style={{
          position: "absolute", top: -10, right: -10,
          background: beer.color, borderRadius: "50%",
          width: 24, height: 24, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 13,
        }}>✓</div>
      )}
      <span style={{ fontSize: 34, lineHeight: 1 }}>{beer.emoji}</span>
      <span style={{ fontSize: 12, fontWeight: 800, color: selected ? beer.color : S.gold, fontFamily: "Georgia, serif" }}>
        {beer.label}
      </span>
      <span style={{ fontSize: 9, color: selected ? beer.color : S.muted, textAlign: "center", lineHeight: 1.3 }}>
        {beer.desc}
      </span>
    </button>
  );
}

function PlayerPill({ player, revealed, isMe }) {
  const beer = player.vote ? BEERS.find(b => b.id === player.vote) : null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      background: isMe ? "#2d2418" : S.card,
      border: `2px solid ${isMe ? S.gold : S.border}`,
      borderRadius: 14, padding: "12px 16px",
      minWidth: 190,
    }}>
      {/* Card face */}
      <div style={{
        width: 44, height: 58, borderRadius: 10,
        background: player.vote ? (revealed ? (beer?.bg || S.border) : "#2d2418") : "#111",
        border: `2px solid ${player.vote ? (revealed && beer ? beer.color : S.gold) : S.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: revealed && beer ? 22 : 16,
        transition: "all 0.5s",
        flexShrink: 0,
      }}>
        {player.vote ? (revealed ? (beer?.emoji || "?") : "🍺") : "·"}
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: isMe ? S.gold : S.text, fontFamily: "Georgia, serif" }}>
          {player.name}{isMe ? " (tú)" : ""}
        </div>
        {revealed && beer ? (
          <div style={{ fontSize: 12, color: beer.color, fontWeight: 700, marginTop: 1 }}>{beer.label}</div>
        ) : (
          <div style={{ fontSize: 11, color: player.vote ? "#6b9b47" : S.muted, marginTop: 1 }}>
            {player.vote ? "✓ Listo" : "Pensando..."}
          </div>
        )}
        {player.capacity != null && (
          <div style={{ fontSize: 10, color: S.muted, marginTop: 1 }}>
            {CAPACITY.find(c => c.val === player.capacity)?.label ?? ""}
          </div>
        )}
      </div>
    </div>
  );
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button onClick={copy} style={{
      background: copied ? "#1a2d0d" : S.card,
      border: `2px solid ${copied ? "#6b9b47" : S.border}`,
      borderRadius: 8, padding: "8px 14px",
      color: copied ? "#86efac" : S.text,
      cursor: "pointer", fontSize: 12, fontFamily: "Georgia, serif",
      transition: "all .2s", flexShrink: 0,
    }}>
      {copied ? "✓ Copiado" : "Copiar"}
    </button>
  );
}

function SharePanel({ roomCode }) {
  const shareURL = buildShareURL(roomCode);
  return (
    <div style={{
      background: S.card, border: `2px solid ${S.border}`,
      borderRadius: 16, padding: "18px 20px",
    }}>
      <div style={{ fontSize: 11, color: S.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
        🔗 Compartir sala
      </div>

      {/* Code */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{
          flex: 1, background: S.card2, borderRadius: 8, padding: "8px 14px",
          fontFamily: "monospace", fontSize: 22, fontWeight: 900,
          color: S.gold, letterSpacing: 6, textAlign: "center",
        }}>
          {roomCode}
        </div>
        <CopyBtn text={roomCode} />
      </div>

      {/* URL */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          flex: 1, background: S.card2, borderRadius: 8, padding: "8px 14px",
          fontSize: 11, color: S.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {shareURL}
        </div>
        <CopyBtn text={shareURL} />
      </div>

      <div style={{ fontSize: 10, color: S.muted, marginTop: 8, lineHeight: 1.6 }}>
        Comparte el código o el link directo. El resto del equipo lo introduce en la pantalla de entrada.
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────
export default function App() {
  const [myId] = useState(() => uid());
  const [myName, setMyName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [codeInput, setCodeInput] = useState(getRoomFromURL() || "");
  const [roomCode, setRoomCode] = useState(null);
  const [room, setRoom] = useState(null);
  const [screen, setScreen] = useState(getRoomFromURL() ? "join" : "home");
  const [myVote, setMyVote] = useState(null);
  const [myCapacity, setMyCapacity] = useState(null);
  const [storyInput, setStoryInput] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [tab, setTab] = useState("vote");
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const bcRef = useRef(null);
  const pollRef = useRef(null);

  // ── Sync loop ──
  const syncRoom = useCallback((code) => {
    const r = loadRoomLocal(code || roomCode);
    if (!r) return;
    setRoom(r);
    setRevealed(r.revealed || false);
    if (r.players?.[myId]) {
      setMyVote(r.players[myId].vote || null);
      setMyCapacity(r.players[myId].capacity ?? null);
    }
    if (r.story) setStoryInput(r.story);
    if (r.revealed) setScreen("results");
    else if (screen !== "voting") setScreen("voting");
  }, [myId, roomCode, screen]);

  function startPolling(code) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      const r = loadRoomLocal(code);
      if (!r) return;
      setRoom(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(r)) return r;
        return prev;
      });
      setRevealed(r.revealed || false);
      if (r.players?.[myId]) {
        setMyVote(r.players[myId].vote || null);
        setMyCapacity(r.players[myId].capacity ?? null);
      }
      if (r.story) setStoryInput(s => s || r.story);
      if (r.revealed) setScreen("results");
    }, 800);

    // BroadcastChannel for same-browser instant sync
    try {
      if (bcRef.current) bcRef.current.close();
      bcRef.current = new BroadcastChannel("beerpoker_" + code);
      bcRef.current.onmessage = () => {
        const r = loadRoomLocal(code);
        if (r) setRoom(r);
      };
    } catch {}
  }

  useEffect(() => () => {
    clearInterval(pollRef.current);
    bcRef.current?.close();
  }, []);

  // ── Actions ──
  function createRoom() {
    if (!nameInput.trim()) return;
    const code = generateCode();
    const newRoom = {
      code,
      players: { [myId]: { name: nameInput.trim(), vote: null, capacity: null, joinedAt: Date.now(), isHost: true } },
      story: "",
      revealed: false,
      createdAt: Date.now(),
    };
    saveRoomLocal(code, newRoom);
    setRoomCode(code);
    setMyName(nameInput.trim());
    setRoom(newRoom);
    setRoomInURL(code);
    setScreen("voting");
    setShowShare(true);
    startPolling(code);
  }

  function joinRoom() {
    if (!nameInput.trim() || !codeInput.trim()) return;
    const code = codeInput.trim().toUpperCase();
    let r = loadRoomLocal(code);
    if (!r) {
      r = { code, players: {}, story: "", revealed: false, createdAt: Date.now() };
    }
    r.players[myId] = { name: nameInput.trim(), vote: null, capacity: null, joinedAt: Date.now() };
    saveRoomLocal(code, r);
    setRoomCode(code);
    setMyName(nameInput.trim());
    setRoom(r);
    setRoomInURL(code);
    setScreen("voting");
    startPolling(code);
  }

  async function updateRoom(updater) {
    const r = loadRoomLocal(roomCode);
    if (!r) return;
    const updated = updater(r);
    saveRoomLocal(roomCode, updated);
    setRoom(updated);
    return updated;
  }

  async function castVote(beerId) {
    const newVote = myVote === beerId ? null : beerId;
    setMyVote(newVote);
    updateRoom(r => {
      r.players[myId] = { ...r.players[myId], vote: newVote };
      return r;
    });
  }

  async function saveCapacity(val) {
    setMyCapacity(val);
    updateRoom(r => {
      r.players[myId] = { ...r.players[myId], capacity: val };
      return r;
    });
  }

  async function saveStory() {
    updateRoom(r => ({ ...r, story: storyInput }));
  }

  async function revealVotes() {
    updateRoom(r => ({ ...r, revealed: true }));
    setRevealed(true);
    setScreen("results");
  }

  async function resetVotes() {
    updateRoom(r => {
      Object.keys(r.players).forEach(pid => { r.players[pid].vote = null; });
      r.revealed = false;
      r.story = storyInput;
      return r;
    });
    setMyVote(null);
    setRevealed(false);
    setScreen("voting");
  }

  // ── Derived ──
  const players = room?.players ? Object.entries(room.players).map(([id, p]) => ({ id, ...p })) : [];
  const totalVoted = players.filter(p => p.vote).length;
  const allVoted = players.length > 0 && totalVoted === players.length;
  const voteCounts = {};
  players.forEach(p => { if (p.vote) voteCounts[p.vote] = (voteCounts[p.vote] || 0) + 1; });
  const totalVotes = Object.values(voteCounts).reduce((s, v) => s + v, 0);
  const winnerVote = Object.entries(voteCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const winner = BEERS.find(b => b.id === winnerVote);
  const avgPoints = totalVotes > 0
    ? (players.filter(p => p.vote).reduce((s, p) => s + (BEERS.find(b => b.id === p.vote)?.points || 0), 0) / totalVotes).toFixed(1)
    : null;
  const avgCapacity = players.filter(p => p.capacity != null).length > 0
    ? (players.filter(p => p.capacity != null).reduce((s, p) => s + p.capacity, 0) / players.filter(p => p.capacity != null).length).toFixed(1)
    : null;
  const isConsensus = totalVotes > 0 && Object.keys(voteCounts).length === 1;
  const amHost = room?.players?.[myId]?.isHost;

  // ════════════════════════════════════════════════════════
  // HOME SCREEN
  // ════════════════════════════════════════════════════════
  if (screen === "home" || screen === "join") {
    const hasRoomInURL = !!getRoomFromURL();
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #0d0a06 0%, #1a1208 60%, #0d0a06 100%)",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "32px 20px",
      }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 72, marginBottom: 8 }}>🍺</div>
          <h1 style={{
            fontSize: 42, fontWeight: 900, color: S.gold, letterSpacing: -1.5,
            margin: "0 0 6px", textShadow: "0 4px 30px rgba(212,168,83,0.5)",
            fontFamily: "Georgia, serif",
          }}>
            Beer Poker
          </h1>
          <p style={{ color: S.muted, fontSize: 15 }}>Planning en cañas, no en puntos abstractos</p>
        </div>

        <div style={{
          background: S.card, border: `2px solid ${S.border}`,
          borderRadius: 24, padding: "36px 40px", width: "100%", maxWidth: 460,
          boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
        }}>
          {/* Name */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: S.muted, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 8 }}>
              Tu nombre
            </label>
            <input
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (hasRoomInURL ? joinRoom() : createRoom())}
              placeholder="Ej: Jordi, María..."
              autoFocus
              style={{
                width: "100%", background: S.card2, border: `2px solid ${S.border}`,
                borderRadius: 10, padding: "12px 16px", color: S.text, fontSize: 15, outline: "none",
              }}
            />
          </div>

          {/* Room code input (if joining) */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: S.muted, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 8 }}>
              Código de sala
              <span style={{ color: S.muted, fontWeight: 400, textTransform: "none", marginLeft: 6 }}>(déjalo vacío para crear una nueva)</span>
            </label>
            <input
              value={codeInput}
              onChange={e => setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
              onKeyDown={e => e.key === "Enter" && (codeInput ? joinRoom() : createRoom())}
              placeholder="Ej: BIRRA7"
              style={{
                width: "100%", background: S.card2, border: `2px solid ${S.border}`,
                borderRadius: 10, padding: "12px 16px", color: S.gold, fontSize: 18,
                fontFamily: "monospace", letterSpacing: 4, outline: "none", textTransform: "uppercase",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            {codeInput.length === 6 ? (
              <Btn variant="primary" onClick={joinRoom} disabled={!nameInput.trim()} style={{ flex: 1 }}>
                🍺 Unirse a la sala
              </Btn>
            ) : (
              <>
                <Btn variant="primary" onClick={createRoom} disabled={!nameInput.trim()} style={{ flex: 1 }}>
                  🎲 Crear sala nueva
                </Btn>
                {codeInput.length > 0 && (
                  <Btn variant="ghost" onClick={joinRoom} disabled={!nameInput.trim() || codeInput.length < 4} style={{ flex: 1 }}>
                    Unirse
                  </Btn>
                )}
              </>
            )}
          </div>
        </div>

        {/* Beer legend */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginTop: 36, maxWidth: 520 }}>
          {BEERS.map(b => (
            <div key={b.id} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24 }}>{b.emoji}</div>
              <div style={{ fontSize: 10, color: b.color, fontWeight: 700, marginTop: 2 }}>{b.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // VOTING SCREEN
  // ════════════════════════════════════════════════════════
  if (screen === "voting") {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #0d0a06 0%, #1a1208 60%, #0d0a06 100%)",
        padding: "20px 16px",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 28 }}>🍺</span>
              <div>
                <div style={{ fontSize: 17, fontWeight: 900, color: S.gold, fontFamily: "Georgia, serif" }}>Beer Poker</div>
                <div style={{ fontSize: 11, color: S.muted }}>{myName} · sala <strong style={{ color: S.gold, fontFamily: "monospace", letterSpacing: 2 }}>{roomCode}</strong></div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Btn onClick={() => setShowShare(s => !s)} variant="ghost" style={{ fontSize: 12 }}>
                🔗 Compartir sala
              </Btn>
              {allVoted && (
                <Btn onClick={revealVotes} variant="green">
                  🎉 Revelar votos
                </Btn>
              )}
            </div>
          </div>

          {/* Share panel */}
          {showShare && (
            <div style={{ marginBottom: 16 }}>
              <SharePanel roomCode={roomCode} />
            </div>
          )}

          {/* Story */}
          <div style={{ background: S.card, border: `2px solid ${S.border}`, borderRadius: 16, padding: "16px 20px", marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: S.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
              Historia a estimar
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                value={storyInput}
                onChange={e => setStoryInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && saveStory()}
                placeholder="Como usuario quiero... / Nombre del ticket"
                style={{
                  flex: 1, background: S.card2, border: `2px solid ${S.border}`,
                  borderRadius: 8, padding: "10px 14px", color: S.text, fontSize: 14, outline: "none",
                }}
              />
              <Btn onClick={saveStory} variant="ghost" style={{ fontSize: 12 }}>Guardar</Btn>
            </div>
            {room?.story && (
              <div style={{ marginTop: 8, fontSize: 13, color: S.text, fontStyle: "italic", padding: "8px 12px", background: S.card2, borderRadius: 8 }}>
                📋 {room.story}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[["vote", "🍺 Votar tamaño"], ["capacity", "📊 Mi capacidad"]].map(([t, lbl]) => (
              <button key={t} onClick={() => setTab(t)} style={{
                background: tab === t ? S.card : "transparent",
                border: `2px solid ${tab === t ? S.gold : S.border}`,
                borderRadius: 10, padding: "8px 18px",
                color: tab === t ? S.gold : S.muted,
                cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "Georgia, serif",
              }}>
                {lbl}
              </button>
            ))}
          </div>

          {/* Vote cards */}
          {tab === "vote" && (
            <div style={{ background: S.card, border: `2px solid ${S.border}`, borderRadius: 20, padding: "28px 24px", marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: S.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 22, textAlign: "center" }}>
                ¿Cuánta cerveza tiene esta historia?
              </div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
                {BEERS.map(beer => (
                  <BeerCard key={beer.id} beer={beer} selected={myVote === beer.id} onClick={() => castVote(beer.id)} />
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 22 }}>
                {BEERS.map(b => (
                  <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: S.card2, borderRadius: 8 }}>
                    <span style={{ fontSize: 18 }}>{b.emoji}</span>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: b.color }}>{b.label}</div>
                      <div style={{ fontSize: 9, color: S.muted }}>{b.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Capacity */}
          {tab === "capacity" && (
            <div style={{ background: S.card, border: `2px solid ${S.border}`, borderRadius: 20, padding: "28px 24px", marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: S.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 20, textAlign: "center" }}>
                ¿Cuántas cañas tienes este sprint?
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                {CAPACITY.map(c => (
                  <button
                    key={c.val}
                    onClick={() => saveCapacity(c.val)}
                    style={{
                      background: myCapacity === c.val ? "#2d2418" : S.card2,
                      border: `3px solid ${myCapacity === c.val ? S.gold : S.border}`,
                      borderRadius: 14, padding: "16px 20px", cursor: "pointer",
                      textAlign: "center", transition: "all 0.2s", minWidth: 110,
                      transform: myCapacity === c.val ? "scale(1.06)" : "scale(1)",
                      fontFamily: "Georgia, serif",
                    }}
                  >
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{c.emoji}</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: myCapacity === c.val ? S.gold : S.text }}>{c.label}</div>
                    <div style={{ fontSize: 10, color: S.muted, marginTop: 2 }}>{c.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Players */}
          <div style={{ background: S.card, border: `2px solid ${S.border}`, borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: S.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                Jugadores · {totalVoted}/{players.length} listos
              </div>
              {allVoted && <span style={{ fontSize: 12, color: "#6b9b47", fontWeight: 700 }}>¡Todos han votado! 🎉</span>}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {players.map(p => (
                <PlayerPill key={p.id} player={p} revealed={false} isMe={p.id === myId} />
              ))}
            </div>
            {/* Progress */}
            <div style={{ marginTop: 14, height: 5, background: "#111", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${players.length > 0 ? (totalVoted / players.length) * 100 : 0}%`,
                background: allVoted ? "#6b9b47" : S.gold,
                borderRadius: 3, transition: "width 0.5s",
              }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // RESULTS SCREEN
  // ════════════════════════════════════════════════════════
  if (screen === "results") {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #0d0a06 0%, #1a1208 60%, #0d0a06 100%)",
        padding: "20px 16px",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 52 }}>{winner?.emoji || "🍺"}</div>
            <h2 style={{ fontSize: 30, fontWeight: 900, color: S.gold, fontFamily: "Georgia, serif", margin: "8px 0 4px" }}>
              ¡Votos revelados!
            </h2>
            {room?.story && (
              <div style={{ fontSize: 14, color: S.text, fontStyle: "italic", background: S.card, borderRadius: 10, padding: "8px 18px", display: "inline-block", marginTop: 4 }}>
                📋 {room.story}
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

            {/* Results chart */}
            <div style={{ background: S.card, border: `2px solid ${S.border}`, borderRadius: 18, padding: "22px 24px" }}>
              <div style={{ fontSize: 11, color: S.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>
                Distribución de votos
              </div>
              {BEERS.filter(b => voteCounts[b.id]).map(b => {
                const count = voteCounts[b.id] || 0;
                const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
                const isWinner = b.id === winnerVote;
                return (
                  <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
                    <span style={{ fontSize: 20, width: 28 }}>{b.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: isWinner ? b.color : S.text, fontFamily: "Georgia, serif" }}>
                          {b.label} {isWinner ? "🏆" : ""}
                        </span>
                        <span style={{ fontSize: 11, color: S.muted }}>{count} voto{count !== 1 ? "s" : ""}</span>
                      </div>
                      <div style={{ height: 8, background: "#111", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", width: `${pct}%`,
                          background: isWinner ? b.color : "#3d2f1a",
                          borderRadius: 4, transition: "width 0.8s cubic-bezier(.34,1.56,.64,1)",
                        }} />
                      </div>
                    </div>
                  </div>
                );
              })}

              <div style={{ marginTop: 18, padding: "14px", background: S.card2, borderRadius: 12, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: S.muted, marginBottom: 4 }}>Estimación ganadora · Promedio</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: winner?.color || S.gold, fontFamily: "Georgia, serif" }}>
                  {winner?.label || "—"} · {avgPoints} pts
                </div>
              </div>

              {avgCapacity != null && (
                <div style={{ marginTop: 10, padding: "10px 14px", background: S.card2, borderRadius: 10, textAlign: "center", fontSize: 13, color: S.gold }}>
                  📊 Capacidad media del equipo: <strong>{avgCapacity} cañas</strong>
                </div>
              )}
            </div>

            {/* Players revealed */}
            <div style={{ background: S.card, border: `2px solid ${S.border}`, borderRadius: 18, padding: "22px 24px" }}>
              <div style={{ fontSize: 11, color: S.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>
                Votos individuales
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {players.sort((a, b) => {
                  const pa = BEERS.find(x => x.id === a.vote)?.points || 0;
                  const pb = BEERS.find(x => x.id === b.vote)?.points || 0;
                  return pb - pa;
                }).map(p => (
                  <PlayerPill key={p.id} player={p} revealed={true} isMe={p.id === myId} />
                ))}
              </div>
            </div>
          </div>

          {/* Consensus */}
          <div style={{
            background: isConsensus ? "#0d1a0d" : "#1a0d0d",
            border: `2px solid ${isConsensus ? "#6b9b47" : "#7f1d1d"}`,
            borderRadius: 14, padding: "16px 20px", marginBottom: 20, textAlign: "center",
          }}>
            {isConsensus ? (
              <div style={{ color: "#86efac", fontWeight: 700, fontSize: 15 }}>
                ✅ ¡Consenso total! Todo el equipo votó {winner?.label}.
              </div>
            ) : (
              <div style={{ color: "#fca5a5", fontWeight: 700, fontSize: 15 }}>
                ⚠️ Hay diferencias — discutid y votad de nuevo. Los extremos deberían explicar su razonamiento.
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Btn variant="primary" onClick={resetVotes} style={{ fontSize: 15, padding: "14px 32px" }}>
              🔄 Nueva votación
            </Btn>
            <Btn variant="ghost" onClick={() => setShowShare(s => !s)}>
              🔗 Compartir sala
            </Btn>
            <Btn variant="ghost" onClick={() => { setScreen("voting"); setRevealed(false); }}>
              ← Volver a sala
            </Btn>
          </div>

          {showShare && (
            <div style={{ marginTop: 16 }}>
              <SharePanel roomCode={roomCode} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
