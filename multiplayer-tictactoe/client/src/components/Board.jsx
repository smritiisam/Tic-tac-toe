export default function Board({ board, onCellClick, canPlay, status }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 80px)",
        gap: "10px",
        marginTop: "20px",
      }}
    >
      {board.map((cell, index) => {
        const disabled = !canPlay || status !== "PLAYING" || cell !== null;

        return (
          <button
            key={index}
            onClick={() => onCellClick(index)}
            disabled={disabled}
            style={{
              width: "80px",
              height: "80px",
              fontSize: "28px",
              fontWeight: "bold",
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: cell !== null ? 0.85 : 1,
            }}
          >
            {cell || ""}
          </button>
        );
      })}
    </div>
  );
}