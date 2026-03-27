import { Client } from "@heroiclabs/nakama-js";

const client = new Client(
  import.meta.env.VITE_NAKAMA_SERVER_KEY,
  import.meta.env.VITE_NAKAMA_HOST,
  import.meta.env.VITE_NAKAMA_PORT,
  import.meta.env.VITE_NAKAMA_USE_SSL === "true",
);

export async function authenticateUser(username) {
  const existing = localStorage.getItem("deviceId");
  const deviceId = existing || crypto.randomUUID();

  if (!existing) {
    localStorage.setItem("deviceId", deviceId);
  }

  const session = await client.authenticateDevice(deviceId, true, username);
  return session;
}

export async function connectSocket(session) {
  const socket = client.createSocket(
    import.meta.env.VITE_NAKAMA_USE_SSL === "true",
    false,
  );

  await socket.connect(session, true);
  return socket;
}

export async function createMatch(session) {
  const result = await client.rpc(session, "create_match", JSON.stringify({}));
  return typeof result.payload === "string"
    ? JSON.parse(result.payload)
    : result.payload;
}

export async function listMatches(session) {
  const result = await client.listMatches(session, 20, true, "", 0, 2, "");
  return result.matches;
}

export { client };
