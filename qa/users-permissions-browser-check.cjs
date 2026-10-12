const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
let activeBrowser = null;

(async () => {
  const base = process.env.OSLAB_URL || "http://127.0.0.1:4381/index.html?app=userspermissions";
  const evidence = path.resolve(__dirname, "..", "qa-evidence", "users-permissions");
  fs.mkdirSync(evidence, { recursive: true });
  const browser = activeBrowser = await chromium.launch({ headless: true, executablePath: process.env.OSLAB_BROWSER || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", args: ["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"] });
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(evidence, "01-login-1366x768.png") });
  if (await page.locator("#login-user-list [data-login-user]").count() !== 1) throw new Error("O perfil legado não apareceu no login.");
  await page.locator("#password").fill("alunos2026");
  await page.locator("#login-form").press("Enter");
  await page.locator("#desktop:not(.is-hidden)").waitFor({ timeout: 7000 });
  await page.locator("#oslab-window-userspermissions").waitFor({ timeout: 5000 });
  await page.screenshot({ path: path.join(evidence, "02-trilha-1366x768.png") });

  await page.locator("#oslab-window-userspermissions [data-users-action='start']").click();
  const assistant = page.locator(".learning-assistant.is-users-permissions:not(.is-hidden)");
  await assistant.waitFor({ timeout: 5000 });
  const assistantStartText = await assistant.innerText();
  if (!assistantStartText.includes("Uma conta para cada pessoa") || !assistantStartText.includes("Abra Configurações") || !assistantStartText.includes("Abrir Outros usuários")) throw new Error("O assistente não mostrou o resumo completo da missão 1.");
  await page.locator("#oslab-window-settings [data-account-action='other-users']").click();
  await page.waitForFunction(() => window.OSLab.userMissions.getProgress().active?.checklist?.["opened-accounts"] === true);
  await page.locator("#oslab-window-settings [data-account-action='add']").click();
  await page.locator("#oslab-window-settings [data-account-action='no-signin']").click();
  await page.locator("#oslab-window-settings [data-account-action='local-account']").click();
  await page.locator("#oslab-window-settings [name='displayName']").fill("Ana Laboratório");
  await page.locator("#oslab-window-settings [name='password']").fill("ana2026");
  await page.locator("#oslab-window-settings [name='confirmPassword']").fill("ana2026");
  await page.locator("#oslab-window-settings [data-local-account-form] button[type='submit']").click();
  await page.locator(".uac-root:not(.is-hidden)").waitFor();
  await page.screenshot({ path: path.join(evidence, "03-uac-1366x768.png") });
  await page.locator(".uac-root:not(.is-hidden) [data-uac='yes']").click();
  await page.locator("#oslab-window-settings .account-card", { hasText: "Ana Laboratório" }).waitFor();
  await page.locator(".learning-assistant [data-assistant-action='users-next']").waitFor({ timeout: 5000 });
  const firstProgress = await page.evaluate(() => ({ progress: window.OSLab.userMissions.getProgress(), next: window.OSLab.userMissions.getMissions().find((mission) => mission.id === "users-2") }));
  if (firstProgress.progress.active?.phase !== "completed" || firstProgress.next?.status !== "available") throw new Error("A missão 1 não concluiu ou não liberou a missão 2.");
  await page.screenshot({ path: path.join(evidence, "04-assistente-conclusao-1366x768.png") });
  await page.locator(".learning-assistant [data-assistant-action='users-next']").click();
  await page.waitForFunction(() => window.OSLab.userMissions.getProgress().active?.id === "users-2" && window.OSLab.userMissions.getProgress().active?.phase === "practice");
  await page.locator(".learning-assistant", { hasText: "Seu espaço, do seu jeito" }).waitFor({ timeout: 5000 });
  await page.screenshot({ path: path.join(evidence, "05-assistente-missao-2-1366x768.png") });

  await page.locator("#start-button").click();
  await page.locator("#start-profile-button").click();
  await page.locator("#profile-menu [data-profile-action='signout']").click();
  await page.locator("#login-user-list", { hasText: "Ana Laboratório" }).waitFor();
  await page.locator("#login-user-list [data-login-user]", { hasText: "Ana Laboratório" }).click();
  await page.locator("#password").fill("ana2026");
  await page.locator("#login-form").press("Enter");
  await page.locator("#desktop:not(.is-hidden)").waitFor({ timeout: 7000 });
  const current = await page.evaluate(() => window.OSLab.users.getCurrent());
  if (current.displayName !== "Ana Laboratório" || current.role !== "standard") throw new Error("A troca para a conta padrão não foi preservada.");

  await page.evaluate(() => window.OSLab.shell.openApp("google"));
  const faviconSearches = ["Criar Gmail", "Criar Outlook", "Criar Yahoo", "Criar Netflix", "Criar Spotify", "Criar Discord", "Criar YouTube", "Criar Google Drive"];
  const faviconMeasurements = [];
  for (const query of faviconSearches) {
    const address = page.locator("#oslab-window-google [name='address']");
    await address.fill(query);
    await address.press("Enter");
    const logo = page.locator("#oslab-window-google .dl-google-search .result-favicon .dl-brand-icon").first();
    await logo.waitFor({ timeout: 5000 });
    await logo.evaluate((image) => image.complete && image.naturalWidth > 0 ? true : new Promise((resolve, reject) => { image.addEventListener("load", () => resolve(true), { once: true }); image.addEventListener("error", () => reject(new Error(`Falha ao carregar ${image.getAttribute("src")}`)), { once: true }); }));
    faviconMeasurements.push(await logo.evaluate((image) => {
      const imageRect = image.getBoundingClientRect();
      const wrapperRect = image.parentElement.getBoundingClientRect();
      const imageStyle = getComputedStyle(image);
      const wrapperStyle = getComputedStyle(image.parentElement);
      return { src: image.getAttribute("src"), naturalWidth: image.naturalWidth, imageWidth: imageRect.width, imageHeight: imageRect.height, cssImageWidth: parseFloat(imageStyle.width), cssImageHeight: parseFloat(imageStyle.height), wrapperWidth: wrapperRect.width, wrapperHeight: wrapperRect.height, cssWrapperWidth: parseFloat(wrapperStyle.width), cssWrapperHeight: parseFloat(wrapperStyle.height), offsetX: Math.abs((imageRect.left + imageRect.width / 2) - (wrapperRect.left + wrapperRect.width / 2)), offsetY: Math.abs((imageRect.top + imageRect.height / 2) - (wrapperRect.top + wrapperRect.height / 2)) };
    }));
  }
  for (const measurement of faviconMeasurements) {
    if (!measurement.naturalWidth || measurement.cssImageWidth > 20 || measurement.cssImageHeight > 20 || measurement.cssWrapperWidth !== 28 || measurement.cssWrapperHeight !== 28 || measurement.offsetX > 1.5 || measurement.offsetY > 1.5) throw new Error(`Favicon fora do padrão: ${JSON.stringify(measurement)}`);
  }
  await page.screenshot({ path: path.join(evidence, "06-resultados-favicons-1366x768.png") });
  await page.evaluate(() => window.OSLab.shell.openApp("explorer"));
  await page.locator("#oslab-window-explorer [data-folder='root-public']").first().click();
  await page.locator("#oslab-window-explorer [data-file-action='new-text']").click();
  const renameInput = page.locator("#oslab-window-explorer .file-rename-input");
  await renameInput.waitFor({ timeout: 5000 });
  await renameInput.press("Enter");
  await page.locator("#oslab-window-explorer [data-file-item].is-selected").waitFor({ timeout: 5000 });
  await page.locator("#oslab-window-explorer [data-file-action='properties']").click();
  await page.locator(".security-dialog input[value='modify']").check();
  await page.screenshot({ path: path.join(evidence, "07-permissoes-1366x768.png") });
  await page.locator(".security-dialog [data-security-save]").click();
  const publicPermission = await page.evaluate(() => window.OSLab.fileSystem.list(window.OSLab.fileSystem.roots.public)[0]?.permission);
  if (publicPermission !== "modify") throw new Error("A permissão Modificação não foi persistida no item público.");
  await page.screenshot({ path: path.join(evidence, "08-perfil-publica-1366x768.png") });

  const desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  if (desktopOverflow) throw new Error("Há rolagem horizontal no viewport 1366x768.");
  if (errors.length) throw new Error(`Erros de execução: ${errors.join(" | ")}`);

  await page.reload({ waitUntil: "networkidle" });
  await page.locator("#password").fill("ana2026");
  await page.locator("#login-form").press("Enter");
  await page.locator("#desktop:not(.is-hidden)").waitFor({ timeout: 7000 });
  const persisted = await page.evaluate(() => window.OSLab.fileSystem.list(window.OSLab.fileSystem.roots.public).some((item) => item.permission === "modify"));
  if (!persisted) throw new Error("O documento público não sobreviveu ao recarregamento.");

  const mobile = await context.newPage();
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.goto(base, { waitUntil: "networkidle" });
  await mobile.screenshot({ path: path.join(evidence, "09-login-390x844.png") });
  const mobileOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  if (mobileOverflow) throw new Error("Há rolagem horizontal no viewport 390x844.");

  await page.bringToFront();
  await page.waitForFunction(() => document.documentElement.dataset.offlineReady === "true", null, { timeout: 15000 });
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("#login-screen:not(.is-hidden)").waitFor({ timeout: 7000 });
  await page.locator("#password").fill("ana2026");
  await page.locator("#login-form").press("Enter");
  await page.locator("#oslab-window-userspermissions").waitFor({ timeout: 7000 });
  const offlineIconLoaded = await page.locator("#oslab-window-userspermissions img[src='assets/users-permissions/trail-icon.png']").first().evaluate((image) => image.complete && image.naturalWidth > 0);
  if (!offlineIconLoaded) throw new Error("A imagem da trilha não foi recuperada pelo cache offline.");
  await page.screenshot({ path: path.join(evidence, "10-trilha-offline-1366x768.png") });
  await context.setOffline(false);
  await browser.close(); activeBrowser = null;
  console.log("OK  progressão, assistente, 8 favicons, login, UAC, pasta Pública, viewports e recarga offline");
})().catch(async (error) => { console.error(error.stack || error); await activeBrowser?.close().catch(() => {}); process.exitCode = 1; });
