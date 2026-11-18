"use strict";

// Grupo da turma do WhatsApp do OSLab: só repassa mensagens em tempo real entre os alunos conectados.
// Sem banco de dados: guarda as últimas mensagens na memória (somem quando o Render adormece).
const http = require("node:http");
const { WebSocketServer } = require("ws");

const PORT = Number(process.env.PORT) || 8787;
const ORIGINS = (process.env.ALLOWED_ORIGINS || "https://fernandobalbino.github.io").split(",").map((origin) => origin.trim()).filter(Boolean);
const HISTORY = 60;
const MAX_TEXT = 500;
const MAX_CLIENTS = 150;
const history = [];
let sequence = 0;

const clean = (value, max) => String(value ?? "").replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
// Página publicada, mais localhost/rede local para o professor testar.
const allowedOrigin = (origin) => Boolean(origin) && (ORIGINS.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(origin));

const server = http.createServer((_request, response) => {
  response.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
  response.end("OSLab · grupo da turma no ar");
});
const wss = new WebSocketServer({
  server,
  maxPayload: 2048,
  verifyClient: ({ origin }) => allowedOrigin(origin) && wss.clients.size < MAX_CLIENTS,
});

function members() {
  const unique = new Map();
  wss.clients.forEach((client) => { if (client.member) unique.set(client.member.id, client.member); });
  return [...unique.values()];
}
function send(client, data) { if (client.readyState === 1) client.send(JSON.stringify(data)); }
function broadcast(data) { const text = JSON.stringify(data); wss.clients.forEach((client) => { if (client.readyState === 1 && client.member) client.send(text); }); }

wss.on("connection", (socket) => {
  socket.alive = true;
  socket.tokens = 5;
  socket.refilledAt = Date.now();
  socket.on("pong", () => { socket.alive = true; });
  socket.on("message", (raw) => {
    let data;
    try { data = JSON.parse(String(raw)); } catch { return; }
    if (data?.t === "join" && !socket.member) {
      const id = clean(data.id, 40);
      const name = clean(data.name, 30);
      const phone = /^\+55 82 9\d{4}-\d{4}$/.test(data.phone) ? data.phone : "";
      if (!id || name.length < 2 || !phone) { socket.close(1008, "perfil inválido"); return; }
      socket.member = { id, name, phone };
      send(socket, { t: "welcome", history, members: members() });
      broadcast({ t: "members", members: members() });
      return;
    }
    if (data?.t === "msg" && socket.member) {
      // Limite simples: até 5 mensagens seguidas, recarregando 1 a cada 1,5 s.
      const now = Date.now();
      socket.tokens = Math.min(5, socket.tokens + (now - socket.refilledAt) / 1500);
      socket.refilledAt = now;
      if (socket.tokens < 1) { send(socket, { t: "slow" }); return; }
      socket.tokens -= 1;
      const text = clean(data.text, MAX_TEXT);
      if (!text) return;
      const message = { id: ++sequence, from: socket.member, text, at: now, cid: clean(data.cid, 40) };
      history.push(message);
      if (history.length > HISTORY) history.shift();
      broadcast({ t: "msg", message });
    }
  });
  socket.on("close", () => { if (socket.member) broadcast({ t: "members", members: members() }); });
});

// Derruba conexões mortas (Chromebook fechado sem despedida) para não manter membros fantasmas.
const heartbeat = setInterval(() => {
  wss.clients.forEach((socket) => {
    if (!socket.alive) { socket.terminate(); return; }
    socket.alive = false;
    socket.ping();
  });
}, 30000);
wss.on("close", () => clearInterval(heartbeat));

server.listen(PORT, () => console.log(`Grupo da turma ouvindo na porta ${PORT}`));
module.exports = { server, wss };
