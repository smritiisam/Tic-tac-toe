var OpCode = {
  MOVE: 1,
  STATE_REQUEST: 2,
};

function createEmptyBoard() {
  return [null, null, null, null, null, null, null, null, null];
}

function checkWinner(board) {
  var lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (var i = 0; i < lines.length; i++) {
    var a = lines[i][0];
    var b = lines[i][1];
    var c = lines[i][2];

    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return board[a];
    }
  }

  for (var j = 0; j < board.length; j++) {
    if (board[j] === null) return null;
  }

  return "DRAW";
}

function serializeState(state) {
  return JSON.stringify({
    type: "STATE",
    state: {
      board: state.board,
      players: state.players.map(function (p) {
        return {
          userId: p.userId,
          username: p.username,
          mark: p.mark,
        };
      }),
      currentTurn: state.currentTurn,
      winner: state.winner,
      status: state.status,
    },
  });
}

function broadcastState(dispatcher, state) {
  dispatcher.broadcastMessage(100, serializeState(state), null, null, true);
}

function matchInit(ctx, logger, nk, params) {
  var state = {
    matchId: ctx.matchId,
    board: createEmptyBoard(),
    players: [],
    currentTurn: "X",
    winner: null,
    status: "WAITING",
  };

  return {
    state: state,
    tickRate: 1,
    label: JSON.stringify({
      status: "WAITING",
      playerCount: 0,
    }),
  };
}

function matchJoinAttempt(
  ctx,
  logger,
  nk,
  dispatcher,
  tick,
  state,
  presence,
  metadata,
) {
  if (state.players.length >= 2) {
    return {
      state: state,
      accept: false,
      rejectMessage: "Match full",
    };
  }

  return {
    state: state,
    accept: true,
  };
}

function matchJoin(ctx, logger, nk, dispatcher, tick, state, presences) {
  for (var i = 0; i < presences.length; i++) {
    var p = presences[i];

    var exists = state.players.some(function (player) {
      return player.userId === p.userId;
    });

    if (exists) continue;

    state.players.push({
      userId: p.userId,
      username: p.username || "Player",
      sessionId: p.sessionId,
      mark: state.players.length === 0 ? "X" : "O",
    });
  }

  if (state.players.length === 2) {
    state.status = "PLAYING";
  }

  broadcastState(dispatcher, state);

  return {
    state: state,
    label: JSON.stringify({
      status: state.status,
      playerCount: state.players.length,
    }),
  };
}

function matchLeave(ctx, logger, nk, dispatcher, tick, state, presences) {
  var leavingIds = {};
  for (var i = 0; i < presences.length; i++) {
    leavingIds[presences[i].userId] = true;
  }

  state.players = state.players.filter(function (p) {
    return !leavingIds[p.userId];
  });

  if (state.players.length < 2) {
    state.status = "WAITING";
  }

  broadcastState(dispatcher, state);

  return {
    state: state,
    label: JSON.stringify({
      status: state.status,
      playerCount: state.players.length,
    }),
  };
}

function matchLoop(ctx, logger, nk, dispatcher, tick, state, messages) {
  for (var i = 0; i < messages.length; i++) {
    var msg = messages[i];

    if (msg.opCode === OpCode.STATE_REQUEST) {
      dispatcher.broadcastMessage(
        100,
        serializeState(state),
        [msg.sender],
        null,
        true,
      );
      continue;
    }

    if (msg.opCode !== OpCode.MOVE) continue;
    if (state.status !== "PLAYING") continue;
    if (state.winner) continue;

    var player = state.players.find(function (p) {
      return p.userId === msg.sender.userId;
    });

    if (!player) continue;
    if (player.mark !== state.currentTurn) continue;

    var payload;
    try {
      payload = JSON.parse(nk.binaryToString(msg.data));
    } catch (e) {
      continue;
    }

    var index = payload.index;

    if (typeof index !== "number" || index < 0 || index > 8) continue;
    if (state.board[index] !== null) continue;

    state.board[index] = player.mark;

    var result = checkWinner(state.board);

    if (result) {
      state.winner = result;
      state.status = "FINISHED";
    } else {
      state.currentTurn = state.currentTurn === "X" ? "O" : "X";
    }

    broadcastState(dispatcher, state);
  }

  return { state: state };
}

function matchTerminate(
  ctx,
  logger,
  nk,
  dispatcher,
  tick,
  state,
  graceSeconds,
) {
  return { state: state };
}

function matchSignal(ctx, logger, nk, dispatcher, tick, state, data) {
  return {
    state: state,
    data: data,
  };
}

function createMatchRpc(ctx, logger, nk, payload) {
  var matchId = nk.matchCreate("tic_tac_toe", {});
  return JSON.stringify({ matchId: matchId });
}

function InitModule(ctx, logger, nk, initializer) {
  initializer.registerRpc("create_match", createMatchRpc);

  initializer.registerMatch("tic_tac_toe", {
    matchInit: matchInit,
    matchJoinAttempt: matchJoinAttempt,
    matchJoin: matchJoin,
    matchLeave: matchLeave,
    matchLoop: matchLoop,
    matchTerminate: matchTerminate,
    matchSignal: matchSignal,
  });

  logger.info("Loaded tic_tac_toe runtime");
}
