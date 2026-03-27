export default function MatchInfo({ gameState, myPlayer, isMyTurn }) {
  if (!gameState) return null;

  return (
    <div style={{ marginTop: 20 }}>
      <div>Status: {gameState.status}</div>
      <div>Current Turn: {gameState.currentTurn}</div>
      <div>My Mark: {myPlayer ? myPlayer.mark : "Not assigned yet"}</div>
      <div>
        {gameState.status === "PLAYING"
          ? isMyTurn
            ? "Your turn"
            : "Opponent's turn"
          : "Game not active"}
      </div>
      <div>
        Winner: {gameState.winner ? gameState.winner : "None"}
      </div>
    </div>
  );
}