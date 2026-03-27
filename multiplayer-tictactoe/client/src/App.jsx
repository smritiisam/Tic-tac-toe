import { useEffect, useMemo, useState } from "react";
import {
  authenticateUser,
  connectSocket,
  createMatch,
  listMatches,
  sendMove,
} from "./api/nakama";
import "./App.css";

const PAGES = {
  LANDING: "LANDING",
  LOBBY: "LOBBY",
  WAITING: "WAITING",
  GAME: "GAME",
};

function LandingPage({ username, setUsername, onConnect, status }) {
  return (
    <div className="page-center">
      <div className="glass card landing-card">
        <div className="eyebrow">Realtime Multiplayer</div>
        <h1 className="hero-title">Tic-Tac-Toe</h1>
        <p className="hero-subtitle">Show us how smart you can Go</p>

        <div className="form-block">
          <input
            className="glass-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
          />
          <button className="primary-btn" onClick={onConnect}>
            Connect
          </button>
        </div>

        <div className="status-line">{status}</div>
      </div>
    </div>
  );
}

function LobbyPage({
  status,
  matchIdInput,
  setMatchIdInput,
  onCreateMatch,
  onJoinMatch,
  availableMatches,
  onListMatches,
}) {
  return (
    <div className="page-shell">
      <nav className="top-nav glass">
        <div className="brand">Tic-Tac-Toe</div>
        <div className="connected-badge">Connected</div>
      </nav>

      <div className="page-center page-top-gap">
        <div className="glass card lobby-card">
          <h2 className="section-title">Game Lobby</h2>
          <p className="section-subtitle">{status}</p>

          <div className="lobby-grid">
            <div className="glass panel">
              <h3>Create a Match</h3>
              <p>Create a new room and wait for another player to join.</p>
              <button className="primary-btn full-width" onClick={onCreateMatch}>
                Create Match
              </button>
            </div>

            <div className="glass panel">
              <h3>Join a Match</h3>
              <p>Join by Match ID or pick one from the available list.</p>
              <input
                className="glass-input"
                value={matchIdInput}
                onChange={(e) => setMatchIdInput(e.target.value)}
                placeholder="Enter Match ID"
              />
              <button
                className="secondary-btn full-width"
                onClick={() => onJoinMatch(matchIdInput)}
              >
                Join Match
              </button>
            </div>
          </div>

          <div className="glass panel match-list-panel">
            <div className="row-between">
              <h3>Available Matches</h3>
              <button className="ghost-btn" onClick={onListMatches}>
                Refresh
              </button>
            </div>

            {availableMatches.length === 0 ? (
              <div className="empty-text">No visible matches yet.</div>
            ) : (
              <div className="match-list">
                {availableMatches.map((m) => (
                  <div className="match-row" key={m.match_id}>
                    <div>
                      <div className="match-id">{m.match_id}</div>
                      <div className="match-meta">Players: {m.size}</div>
                    </div>
                    <button
                      className="secondary-btn"
                      onClick={() => onJoinMatch(m.match_id)}
                    >
                      Join
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function WaitingPage({ joinedMatchId, gameState }) {
  const otherPlayer =
    gameState?.players?.length > 1 ? gameState.players[1]?.username || "Player 2" : null;

  return (
    <div className="page-shell">
      <nav className="top-nav glass">
        <div className="brand">Tic-Tac-Toe</div>
        <div className="connected-badge">Connected</div>
      </nav>

      <div className="page-center page-top-gap">
        <div className="glass card waiting-card">
          <div className="waiting-icon">◌</div>
          <h2 className="section-title">Match Created</h2>

          <div className="match-id-box glass">
            <div className="label">Match ID</div>
            <div className="big-match-id">{joinedMatchId}</div>
          </div>

          <div className="waiting-state">
            Waiting<span className="dots"><span>.</span><span>.</span><span>.</span></span>
          </div>

          {otherPlayer ? (
            <div className="player-joined">{otherPlayer} joined the match.</div>
          ) : (
            <div className="section-subtitle">
              Share this Match ID with another player to continue.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GamePage({ gameState, myPlayer, isMyTurn, onCellClick }) {
  const winnerMessage =
    gameState?.status === "FINISHED"
      ? gameState.winner === "DRAW"
        ? "Match Draw"
        : gameState.winner === myPlayer?.mark
        ? "You WON"
        : "Better Luck Next Time"
      : null;

  return (
    <div className="page-shell">
      <nav className="top-nav glass">
        <div className="brand">Tic-Tac-Toe</div>
        <div className="connected-badge">Connected</div>
      </nav>

      <div className="page-center page-top-gap">
        <div className="game-layout">
          <div className="glass game-info">
            <h3 className="section-title small">Match Status</h3>
            <div className="info-item">
              <span>Status</span>
              <strong>{gameState?.status}</strong>
            </div>
            <div className="info-item">
              <span>Your Mark</span>
              <strong>{myPlayer?.mark || "-"}</strong>
            </div>
            <div className="info-item">
              <span>Turn</span>
              <strong>{isMyTurn ? "Your Turn" : "Opponent's Turn"}</strong>
            </div>

            <div className="players-box">
              <div className="players-title">Players</div>
              {gameState?.players?.map((p) => (
                <div className="player-row" key={p.userId}>
                  <span>{p.username}</span>
                  <span>{p.mark}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass board-wrapper">
            <div className="board">
              {gameState?.board?.map((cell, index) => {
                const disabled =
                  !isMyTurn ||
                  gameState?.status !== "PLAYING" ||
                  gameState?.board?.[index] !== null;

                return (
                  <button
                    key={index}
                    className={`cell ${cell ? "filled" : ""}`}
                    disabled={disabled}
                    onClick={() => onCellClick(index)}
                  >
                    {cell || ""}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {winnerMessage && (
        <div className="result-overlay">
          <div className="glass result-card">
            <div className="result-text">{winnerMessage}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [username, setUsername] = useState("");
  const [session, setSession] = useState(null);
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState("Not connected");
  const [matchIdInput, setMatchIdInput] = useState("");
  const [joinedMatchId, setJoinedMatchId] = useState("");
  const [gameState, setGameState] = useState(null);
  const [availableMatches, setAvailableMatches] = useState([]);
  const [myUserId, setMyUserId] = useState("");
  const [currentPage, setCurrentPage] = useState(PAGES.LANDING);

  const myPlayer = useMemo(
    () => gameState?.players?.find((p) => p.userId === myUserId),
    [gameState, myUserId]
  );

  const isMyTurn =
    !!gameState &&
    !!myPlayer &&
    gameState.status === "PLAYING" &&
    gameState.currentTurn === myPlayer.mark;

  useEffect(() => {
    if (!session) {
      setCurrentPage(PAGES.LANDING);
      return;
    }

    if (joinedMatchId && gameState?.status === "WAITING") {
      setCurrentPage(PAGES.WAITING);
      return;
    }

    if (joinedMatchId && (gameState?.status === "PLAYING" || gameState?.status === "FINISHED")) {
      setCurrentPage(PAGES.GAME);
      return;
    }

    setCurrentPage(PAGES.LOBBY);
  }, [session, joinedMatchId, gameState]);

  async function handleConnect() {
    if (!username.trim()) return;

    try {
      const newSession = await authenticateUser(username.trim());
      const newSocket = await connectSocket(newSession);

      newSocket.onmatchdata = (message) => {
        const text = new TextDecoder().decode(message.data);
        const payload = JSON.parse(text);

        if (payload.type === "STATE") {
          setGameState(payload.state);
        }
      };

      setSession(newSession);
      setSocket(newSocket);
      setMyUserId(newSession.user_id);
      setStatus("Connected");
      setCurrentPage(PAGES.LOBBY);
    } catch (err) {
      console.error(err);
      setStatus("Connection failed");
    }
  }

  async function handleCreateMatch() {
    try {
      const result = await createMatch(session);
      const matchId = result.matchId;

      await socket.joinMatch(matchId);
      setJoinedMatchId(matchId);
      setStatus("Match created");

      await socket.sendMatchState(matchId, 2, JSON.stringify({}));
      setCurrentPage(PAGES.WAITING);
    } catch (err) {
      console.error(err);
      setStatus("Create match failed");
    }
  }

  async function handleJoinMatch(id) {
    if (!id) return;

    try {
      await socket.joinMatch(id);
      setJoinedMatchId(id);
      setStatus("Joined match");

      await socket.sendMatchState(id, 2, JSON.stringify({}));
    } catch (err) {
      console.error(err);
      setStatus("Join match failed");
    }
  }

  async function handleListMatches() {
    try {
      const matches = await listMatches(session);
      setAvailableMatches(matches);
    } catch (err) {
      console.error(err);
      setStatus("List matches failed");
    }
  }

  async function handleCellClick(index) {
    if (!socket || !joinedMatchId || !gameState || !myPlayer) return;
    if (gameState.status !== "PLAYING") return;
    if (!isMyTurn) return;
    if (gameState.board[index] !== null) return;

    try {
      await sendMove(socket, joinedMatchId, index);
    } catch (err) {
      console.error(err);
    }
  }

  if (currentPage === PAGES.LANDING) {
    return (
      <LandingPage
        username={username}
        setUsername={setUsername}
        onConnect={handleConnect}
        status={status}
      />
    );
  }

  if (currentPage === PAGES.LOBBY) {
    return (
      <LobbyPage
        status={status}
        matchIdInput={matchIdInput}
        setMatchIdInput={setMatchIdInput}
        onCreateMatch={handleCreateMatch}
        onJoinMatch={handleJoinMatch}
        availableMatches={availableMatches}
        onListMatches={handleListMatches}
      />
    );
  }

  if (currentPage === PAGES.WAITING) {
    return <WaitingPage joinedMatchId={joinedMatchId} gameState={gameState} />;
  }

  return (
    <GamePage
      gameState={gameState}
      myPlayer={myPlayer}
      isMyTurn={isMyTurn}
      onCellClick={handleCellClick}
    />
  );
}