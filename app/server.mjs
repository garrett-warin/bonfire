import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { server as relay } from "@mercuryworkshop/wisp-js/server";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number.parseInt(process.env.PORT || "8080", 10);
const host = process.env.HOST || "0.0.0.0";

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new TypeError(`Invalid PORT: ${process.env.PORT}`);
}

const routes = new Map([
  ["/", ["public/index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["public/index.html", "text/html; charset=utf-8"]],
  ["/app.js", ["public/app.js", "text/javascript; charset=utf-8"]],
  ["/styles.css", ["public/styles.css", "text/css; charset=utf-8"]],
  ["/worker.js", ["public/worker.js", "text/javascript; charset=utf-8"]],
  [
    "/bootstrap/bootstrap-client.js",
    ["vendor/bootstrap-client.js", "text/javascript; charset=utf-8"],
  ],
  [
    "/runtime/runtimekit.js",
    ["vendor/runtimekit.js", "text/javascript; charset=utf-8"],
  ],
  ["/runtime/runtimekit.wasm", ["vendor/runtimekit.wasm", "application/wasm"]],
  [
    "/runtime/runtimekit-utils.js",
    ["vendor/runtimekit-utils.js", "text/javascript; charset=utf-8"],
  ],
  [
    "/controller/controller.api.js",
    ["vendor/controller.api.js", "text/javascript; charset=utf-8"],
  ],
  [
    "/controller/controller.inject.js",
    ["vendor/controller.inject.js", "text/javascript; charset=utf-8"],
  ],
  [
    "/controller/controller.worker.js",
    ["vendor/controller.worker.js", "text/javascript; charset=utf-8"],
  ],
  [
    "/clients/httpengine-client.js",
    ["vendor/httpengine-client.js", "text/javascript; charset=utf-8"],
  ],
]);

function commonHeaders() {
  return {
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
  };
}

async function sendFile(req, res, relativePath, contentType) {
  const filePath = path.join(root, relativePath);
  const file = await stat(filePath);
  res.writeHead(200, {
    ...commonHeaders(),
    "Content-Type": contentType,
    "Content-Length": file.size,
    "Cache-Control": relativePath.startsWith("vendor/")
      ? "public, max-age=3600"
      : "no-store",
  });
  if (req.method === "HEAD") return res.end();
  createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url || "/", "http://localhost").pathname;
    if (pathname === "/healthz") {
      const body = JSON.stringify({ status: "ok", port });
      res.writeHead(200, {
        ...commonHeaders(),
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": Buffer.byteLength(body),
        "Cache-Control": "no-store",
      });
      return res.end(body);
    }
    if (pathname === "/favicon.ico") {
      res.writeHead(204, {
        ...commonHeaders(),
        "Cache-Control": "public, max-age=86400",
      });
      return res.end();
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { ...commonHeaders(), Allow: "GET, HEAD" });
      return res.end("Method Not Allowed");
    }

    const route = routes.get(pathname);
    if (!route) {
      res.writeHead(404, commonHeaders());
      return res.end("Not Found");
    }

    await sendFile(req, res, route[0], route[1]);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) res.writeHead(500, commonHeaders());
    res.end("Internal Server Error");
  }
});

server.on("upgrade", (req, socket, head) => {
  const pathname = new URL(req.url || "/", "http://localhost").pathname;
  if (!pathname.startsWith("/relay/")) return socket.destroy();
  relay.routeRequest(req, socket, head);
});

server.listen(port, host, () => {
  console.log(`Fixed app listening on http://${host}:${port}`);
});

function shutdown(signal) {
  console.log(`${signal} received; closing server`);
  server.close((error) => {
    if (error) {
      console.error(error);
      process.exitCode = 1;
    }
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
