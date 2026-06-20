import { createServer as createHttpServer } from "node:http";
import { createServer as createHttpsServer } from "node:https";
import { execFile, execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { access, mkdir, readFile, rm, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const execFileAsync = promisify(execFile);
const certDir = join(root, ".certs");
const certPath = join(certDir, "localhost.crt");
const keyPath = join(certDir, "localhost.key");
const nativeSourcePath = join(root, "native", "clipboard-bridge.swift");
const nativeBinPath = join(root, "native", "bin", "clipboard-bridge");
const nativeAssetsDir = join(root, ".native-assets");
const useHttp = process.argv.includes("--http");
const portArg = process.argv.find((arg) => arg.startsWith("--port="));
const port = Number(portArg?.split("=")[1]) || 3000;

const mime = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".xml": "application/xml; charset=utf-8"
};

if (!useHttp) ensureCertificate();

const server = useHttp
  ? createHttpServer(handleRequest)
  : createHttpsServer({ key: readFileSync(keyPath), cert: readFileSync(certPath) }, handleRequest);

server.listen(port, "127.0.0.1", () => {
  const protocol = useHttp ? "http" : "https";
  console.log(`EasyPPT dev server: ${protocol}://localhost:${port}/src/taskpane.html`);
  if (!useHttp) {
    console.log(`Certificate: ${certPath}`);
    console.log("If PowerPoint blocks the pane, trust this certificate in Keychain Access.");
  }
});

async function handleRequest(request, response) {
  const url = new URL(request.url || "/", `http://${request.headers.host}`);
  const pathname = decodeURIComponent(url.pathname === "/" ? "/src/taskpane.html" : url.pathname);
  if (pathname.startsWith("/api/native/")) {
    await handleNativeApi(request, response, pathname);
    return;
  }
  const filePath = normalize(join(root, pathname));

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": mime[extname(filePath)] || "application/octet-stream",
    "Cache-Control": "no-store"
  });
  response.end(readFileSync(filePath));
}

async function handleNativeApi(request, response, pathname) {
  try {
    if (request.method === "GET" && pathname === "/api/native/status") {
      const helper = await ensureNativeHelper();
      sendJson(response, 200, {
        ok: true,
        helper,
        powerPointInstalled: existsSync("/Applications/Microsoft PowerPoint.app")
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/native/animations/apply") {
      const body = await readJsonBody(request);
      const result = await applyNativeAnimations(body);
      sendJson(response, 200, { ok: true, ...result });
      return;
    }

    const previewMatch = pathname.match(/^\/api\/native\/assets\/([a-zA-Z0-9-]+)\/preview\.png$/);
    if (request.method === "GET" && previewMatch) {
      const previewPath = join(nativeAssetDirectory(previewMatch[1]), "preview.png");
      const data = await readFile(previewPath);
      response.writeHead(200, {
        "Content-Type": "image/png",
        "Cache-Control": "no-store"
      });
      response.end(data);
      return;
    }

    if (request.method === "POST" && pathname === "/api/native/assets/save") {
      const body = await readJsonBody(request);
      const id = validAssetId(body.id || randomUUID());
      const result = await saveNativeAsset(id);
      sendJson(response, 200, {
        ok: true,
        id,
        previewUrl: result.hasPreview ? `/api/native/assets/${id}/preview.png` : null,
        objectCount: result.objectCount,
        itemCount: result.itemCount,
        typeCount: result.typeCount
      });
      return;
    }

    const insertMatch = pathname.match(/^\/api\/native\/assets\/([a-zA-Z0-9-]+)\/insert$/);
    if (request.method === "POST" && insertMatch) {
      const id = validAssetId(insertMatch[1]);
      await insertNativeAsset(id);
      sendJson(response, 200, { ok: true, id });
      return;
    }

    const deleteMatch = pathname.match(/^\/api\/native\/assets\/([a-zA-Z0-9-]+)$/);
    if (request.method === "DELETE" && deleteMatch) {
      const id = validAssetId(deleteMatch[1]);
      await rm(nativeAssetDirectory(id), { recursive: true, force: true });
      sendJson(response, 200, { ok: true, id });
      return;
    }

    sendJson(response, 404, { ok: false, error: "Native helper endpoint not found." });
  } catch (error) {
    const message = nativeErrorMessage(error);
    console.error("Native helper error:", error);
    sendJson(response, 500, { ok: false, error: message });
  }
}

async function saveNativeAsset(id) {
  await ensureNativeHelper();
  await mkdir(nativeAssetsDir, { recursive: true });
  const destination = nativeAssetDirectory(id);
  const backup = join("/private/tmp", `easyppt-clipboard-${randomUUID()}`);
  const hasBackup = await snapshotClipboardIfPossible(backup);
  try {
    const selectedCount = Number(await runPowerPointScript(`
      tell application "Microsoft PowerPoint"
        if not (exists active window) then error "请先打开一个 PowerPoint 演示文稿。"
        set currentSelection to selection of active window
        if selection type of currentSelection is not selection type shapes then error "请先在幻灯片中选择一个或多个对象。"
        set selectedShapes to shape range of currentSelection
        set selectedCount to count of selectedShapes
        «event sDRwSRcp» selectedShapes
        return selectedCount
      end tell
    `)) || 1;
    await delay(250);
    return {
      ...await runNativeHelper("snapshot", destination),
      objectCount: selectedCount
    };
  } catch (error) {
    await rm(destination, { recursive: true, force: true });
    throw error;
  } finally {
    if (hasBackup) await restoreClipboardQuietly(backup);
    await rm(backup, { recursive: true, force: true });
  }
}

async function insertNativeAsset(id) {
  await ensureNativeHelper();
  const source = nativeAssetDirectory(id);
  await access(join(source, "manifest.json"));
  const backup = join("/private/tmp", `easyppt-clipboard-${randomUUID()}`);
  const hasBackup = await snapshotClipboardIfPossible(backup);
  try {
    await runNativeHelper("restore", source);
    await runPowerPointScript(`
      tell application "Microsoft PowerPoint"
        if not (exists active window) then error "请先打开一个 PowerPoint 演示文稿。"
        «event sPPTPpst» view of active window
      end tell
    `);
    await delay(250);
  } finally {
    if (hasBackup) await restoreClipboardQuietly(backup);
    await rm(backup, { recursive: true, force: true });
  }
}

async function applyNativeAnimations(input) {
  const effectNames = {
    appear: "entry effect appear",
    fade: "entry effect fade smoothly",
    float: "entry effect fade fly from bottom",
    wipe: "entry effect wipe right",
    zoom: "entry effect zoom in slightly"
  };
  const transitionNames = {
    fade: "entry effect fade smoothly"
  };
  const effects = Array.isArray(input.effects) ? input.effects.slice(0, 12) : [];
  if (!effects.length) throw new Error("没有收到可应用的动画方案。");

  let appliedCount = 0;
  let skippedCount = 0;
  for (const [index, item] of effects.entries()) {
    const name = String(item?.name || "").slice(0, 240);
    const effect = effectNames[item?.effect] || effectNames.fade;
    const script = [
      'tell application "Microsoft PowerPoint"',
      'if not (exists active window) then error "请先打开一个 PowerPoint 演示文稿。"',
      "set targetSlide to slide of view of active window",
      `set targetShape to shape "${escapeAppleScriptString(name)}" of targetSlide`,
      "set targetSettings to animation settings of targetShape",
      "set animate of targetSettings to true",
      `set entry effect of targetSettings to ${effect}`,
      `set animation order of targetSettings to ${index + 1}`,
      "return true",
      "end tell"
    ].join("\n");
    try {
      await runPowerPointScript(script);
      appliedCount += 1;
    } catch (error) {
      if (isPowerPointUnavailable(error)) {
        throw new Error(`PowerPoint 已退出，安全写入在第 ${index + 1} 个对象处停止。已应用 ${appliedCount} 个对象。`);
      }
      skippedCount += 1;
    }
    await delay(80);
  }

  const transition = transitionNames[input.transition?.effect === "morph" ? "fade" : input.transition?.effect];
  if (transition) {
    const duration = Math.min(3, Math.max(0.1, Number(input.transition?.duration) || 0.65));
    try {
      await runPowerPointScript([
        'tell application "Microsoft PowerPoint"',
        'if not (exists active window) then error "请先打开一个 PowerPoint 演示文稿。"',
        "set targetSlide to slide of view of active window",
        `set entry effect of slide show transition of targetSlide to ${transition}`,
        `set transition duration of slide show transition of targetSlide to ${duration}`,
        "end tell"
      ].join("\n"));
    } catch (error) {
      if (isPowerPointUnavailable(error)) {
        throw new Error(`PowerPoint 已退出。对象动画已应用 ${appliedCount} 个，但页面过渡未设置。`);
      }
    }
  }

  if (!appliedCount) {
    throw new Error("未能写入动画。请确认 PowerPoint 已打开当前页，并允许终端控制 PowerPoint。");
  }
  return {
    appliedCount,
    skippedCount,
    limitedCount: Math.max(0, (Array.isArray(input.effects) ? input.effects.length : 0) - effects.length),
    safeMode: true
  };
}

function escapeAppleScriptString(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

function isPowerPointUnavailable(error) {
  const message = `${error?.message || ""}\n${error?.stderr || ""}`.toLowerCase();
  return message.includes("application isn’t running")
    || message.includes("application isn't running")
    || message.includes("connection is invalid")
    || message.includes("invalid connection")
    || message.includes("-600")
    || message.includes("-609");
}

async function ensureNativeHelper() {
  await mkdir(join(root, "native", "bin"), { recursive: true });
  let needsBuild = !existsSync(nativeBinPath);
  if (!needsBuild) {
    const [sourceStat, binStat] = await Promise.all([stat(nativeSourcePath), stat(nativeBinPath)]);
    needsBuild = sourceStat.mtimeMs > binStat.mtimeMs;
  }
  if (needsBuild) {
    await execFileAsync("/usr/bin/swiftc", [nativeSourcePath, "-o", nativeBinPath], {
      cwd: root,
      maxBuffer: 4 * 1024 * 1024
    });
  }
  return nativeBinPath;
}

async function runNativeHelper(command, directory) {
  const { stdout } = await execFileAsync(nativeBinPath, [command, directory], {
    cwd: root,
    maxBuffer: 4 * 1024 * 1024
  });
  return JSON.parse(stdout || "{}");
}

async function runPowerPointScript(source) {
  const { stdout } = await execFileAsync("/usr/bin/osascript", ["-e", source], {
    cwd: root,
    maxBuffer: 1024 * 1024,
    timeout: 12000
  });
  return stdout.trim();
}

async function snapshotClipboardIfPossible(directory) {
  try {
    await runNativeHelper("snapshot", directory);
    return true;
  } catch {
    return false;
  }
}

async function restoreClipboardQuietly(directory) {
  try {
    await runNativeHelper("restore", directory);
  } catch {
    // A failed clipboard restoration shouldn't hide a successful PowerPoint operation.
  }
}

function nativeAssetDirectory(id) {
  return join(nativeAssetsDir, validAssetId(id));
}

function validAssetId(value) {
  const id = String(value || "");
  if (!/^[a-zA-Z0-9-]+$/.test(id)) throw new Error("Invalid native asset ID.");
  return id;
}

function readJsonBody(request) {
  return new Promise((resolveBody, rejectBody) => {
    const chunks = [];
    let size = 0;
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > 1024 * 1024) {
        rejectBody(new Error("Request body is too large."));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      try {
        const text = Buffer.concat(chunks).toString("utf8");
        resolveBody(text ? JSON.parse(text) : {});
      } catch (error) {
        rejectBody(error);
      }
    });
    request.on("error", rejectBody);
  });
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(body));
}

function nativeErrorMessage(error) {
  const stderr = String(error?.stderr || "").trim();
  if (stderr) {
    try {
      return JSON.parse(stderr).error || stderr;
    } catch {
      return stderr;
    }
  }
  return error?.message || String(error);
}

function delay(milliseconds) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}

function ensureCertificate() {
  if (existsSync(certPath) && existsSync(keyPath)) return;
  mkdirSync(certDir, { recursive: true });
  execFileSync("openssl", [
    "req",
    "-x509",
    "-newkey",
    "rsa:2048",
    "-nodes",
    "-keyout",
    keyPath,
    "-out",
    certPath,
    "-days",
    "365",
    "-subj",
    "/CN=localhost",
    "-addext",
    "subjectAltName=DNS:localhost,IP:127.0.0.1"
  ], { stdio: "ignore" });
}
