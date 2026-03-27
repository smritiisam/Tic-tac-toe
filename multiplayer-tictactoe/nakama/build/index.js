var OpCode = {
  MOVE: 1,
  STATE_REQUEST: 2,
};

function createEmptyBoard() {
  return [null, null, null, null, null, null, null, null, null];
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
    }
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
