import { useState } from "react";
import {
  authenticateUser,
  connectSocket,
  createMatch,
  listMatches,
} from "./api/nakama";

export default function App() {
  const [username, setUsername] = useState("");
  const [session, setSession] = useState(null);
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState("Not connected");
  const [matchIdInput, setMatchIdInput] = useState("");
  const [joinedMatchId, setJoinedMatchId] = useState("");
  const [gameState, setGameState] = useState(null);
  const [availableMatches, setAvailableMatches] = useState([]);

  async function handleConnect() {
    try {
      const newSession = await authenticateUser(username);
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
      setStatus("Connected to Nakama successfully");
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
      setStatus("Created and joined match");

      await socket.sendMatchState(matchId, 2, JSON.stringify({}));
    } catch (err) {
      console.error(err);
      setStatus("Create match failed");
    }
  }

  async function handleJoinMatch(id) {
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

  return (
    <div style={{ padding: 40, fontFamily: "Arial" }}>
      <h1>Nakama Test</h1>

      {!session && (
        <>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
          />
          <button onClick={handleConnect} style={{ marginLeft: 10 }}>
            Connect
          </button>
        </>
      )}

      <p>{status}</p>

      {session && (
        <>
          <div style={{ marginTop: 20 }}>
            <button onClick={handleCreateMatch}>Create Match</button>
            <button onClick={handleListMatches} style={{ marginLeft: 10 }}>
              List Matches
            </button>
          </div>

          <div style={{ marginTop: 20 }}>
            <input
              value={matchIdInput}
              onChange={(e) => setMatchIdInput(e.target.value)}
              placeholder="Enter match id"
              style={{ width: 400 }}
            />
            <button
              onClick={() => handleJoinMatch(matchIdInput)}
              style={{ marginLeft: 10 }}
            >
              Join Match
            </button>
          </div>

          <div style={{ marginTop: 20 }}>
            <h3>Available Matches</h3>
            {availableMatches.map((m) => (
              <div key={m.match_id} style={{ marginBottom: 10 }}>
                <div>Match ID: {m.match_id}</div>
                <div>Size: {m.size}</div>
                <button onClick={() => handleJoinMatch(m.match_id)}>
                  Join This Match
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20 }}>
            <h3>Joined Match</h3>
            <div>{joinedMatchId || "None"}</div>
          </div>

          <div style={{ marginTop: 20 }}>
            <h3>Game State</h3>
            <pre>{JSON.stringify(gameState, null, 2)}</pre>
          </div>
        </>
      )}
    </div>
  );
}