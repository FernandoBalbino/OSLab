import assert from "node:assert/strict";
import { test } from "node:test";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const serverDir = path.join(root, "server/zap-group");
let WebSocket = null;
try { WebSocket = createRequire(path.join(serverDir, "package.json"))("ws"); } catch { /* rode npm install em server/zap-group */ }
const skip = WebSocket ? false : "instale com: cd server/zap-group && npm install";

function startServer(port) {
  const child = spawn(process.execPath, ["server.js"], { cwd: serverDir, env: { ...process.env, PORT: String(port) }, stdio: ["ignore", "pipe", "inherit"] });
  return new Promise((resolve) => child.stdout.once("data", () => resolve(child)));
}
function client(port, origin = "https://fernandobalbino.github.io") {
  const socket = new WebSocket(`ws://127.0.0.1:${port}`, { origin });
  const inbox = [];
  const waiters = [];
  socket.on("message", (raw) => {
    const data = JSON.parse(String(raw));
    const index = waiters.findIndex((waiter) => waiter.match(data));
    if (index >= 0) waiters.splice(index, 1)[0].resolve(data); else inbox.push(data);
  });
  socket.next = (match) => {
    const found = inbox.findIndex(match);
    if (found >= 0) return Promise.resolve(inbox.splice(found, 1)[0]);
    return new Promise((resolve, reject) => { waiters.push({ match, resolve }); setTimeout(() => reject(new Error("tempo esgotado")), 3000); });
  };
  socket.opened = new Promise((resolve, reject) => { socket.once("open", resolve); socket.once("error", reject); socket.once("unexpected-response", (_req, res) => reject(new Error(String(res.statusCode)))); });
  return socket;
}
const join = (socket, name, phone) => socket.send(JSON.stringify({ t: "join", id: `id-${name}`, name, phone }));

test("grupo da turma: só a página do OSLab conecta, perfis válidos entram e todos recebem as mensagens", { skip }, async () => {
  const port = 20000 + Math.floor(Math.random() * 20000);
  const server = await startServer(port);
  try {
    await assert.rejects(client(port, "https://site-estranho.com").opened, "origem desconhecida é recusada");

    const intruder = client(port);
    await intruder.opened;
    const closed = new Promise((resolve) => intruder.on("close", (code) => resolve(code)));
    join(intruder, "X", "123");
    assert.equal(await closed, 1008, "perfil sem nome ou número de Maceió é recusado");

    const ana = client(port);
    await ana.opened;
    join(ana, "Ana", "+55 82 91234-5678");
    const welcome = await ana.next((d) => d.t === "welcome");
    assert.deepEqual(welcome.history, []);

    const bruno = client(port);
    await bruno.opened;
    join(bruno, "Bruno <b>", "+55 82 98765-4321");
    await bruno.next((d) => d.t === "welcome");
    const roster = await ana.next((d) => d.t === "members" && d.members.length === 2);
    assert.ok(roster.members.some((m) => m.name === "Bruno b"), "nome sem HTML");

    ana.send(JSON.stringify({ t: "msg", text: "  Alguém achou a senha do Wi-Fi?  ", cid: "c1" }));
    const received = await bruno.next((d) => d.t === "msg");
    assert.equal(received.message.text, "Alguém achou a senha do Wi-Fi?");
    assert.equal(received.message.from.name, "Ana");
    assert.equal((await ana.next((d) => d.t === "msg")).message.cid, "c1", "remetente recebe a própria mensagem confirmada");

    for (let index = 0; index < 6; index += 1) bruno.send(JSON.stringify({ t: "msg", text: `flood ${index}` }));
    await bruno.next((d) => d.t === "slow");

    const late = client(port);
    await late.opened;
    join(late, "Caio", "+55 82 90000-1111");
    const history = (await late.next((d) => d.t === "welcome")).history;
    assert.equal(history[0].text, "Alguém achou a senha do Wi-Fi?", "quem chega depois vê as últimas mensagens");
    [ana, bruno, late].forEach((socket) => socket.close());
  } finally {
    server.kill();
  }
});
