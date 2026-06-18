import { createServer as createHttpServer } from "node:http";
import { createServer as createHttpsServer } from "node:https";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const certDir = join(root, ".certs");
const certPath = join(certDir, "localhost.crt");
const keyPath = join(certDir, "localhost.key");
const useHttp = process.argv.includes("--http");
const portArg = process.argv.find((arg) => arg.startsWith("--port="));
const port = Number(portArg?.split("=")[1]) || 3000;

const mime = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
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

function handleRequest(request, response) {
  const url = new URL(request.url || "/", `http://${request.headers.host}`);
  const pathname = decodeURIComponent(url.pathname === "/" ? "/src/taskpane.html" : url.pathname);
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
