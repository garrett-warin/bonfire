import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";

const port = 18080;
const origin = `http://127.0.0.1:${port}`;
let server;
let output = "";

test.before(async () => {
  server = spawn(process.execPath, ["app/server.mjs"], {
    cwd: new URL("..", import.meta.url),
    env: { ...process.env, HOST: "127.0.0.1", PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", (chunk) => (output += chunk));
  server.stderr.on("data", (chunk) => (output += chunk));

  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${origin}/healthz`);
      if (response.ok) return;
    } catch {}
    await delay(100);
  }
  throw new Error(`Server did not start:\n${output}`);
});

test.after(async () => {
  if (!server || server.exitCode !== null) return;
  server.kill("SIGTERM");
  await once(server, "exit");
});

test("health check reports the configured port", async () => {
  const response = await fetch(`${origin}/healthz`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok", port });
});

test("frontend contains only the automatic test iframe", async () => {
  const response = await fetch(origin);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /id="browser-frame"/);
  assert.match(html, /type="module" src="\/app\.js"/);
  assert.doesNotMatch(html, /<form|<input|<button/i);
});

test("browser bootstrap uses the local relay endpoint", async () => {
  const response = await fetch(`${origin}/app.js`);
  const source = await response.text();
  assert.equal(response.status, 200);
  assert.match(source, /streamRelayPath: "\/relay\/"/);
  assert.match(source, /transport: "http"/);
  assert.match(source, /controller\.createFrame\(iframe\)/);
  assert.match(source, /frame\.go\("https:\/\/example\.com\/"\)/);
  assert.doesNotMatch(
    source,
    /url-form|url-input|requestSubmit|addEventListener\("submit"/,
  );
});

test("every client response is free of restricted implementation names", async () => {
  const routes = [
    "/",
    "/app.js",
    "/styles.css",
    "/worker.js",
    "/bootstrap/bootstrap-client.js",
    "/runtime/runtimekit.js",
    "/runtime/runtimekit.wasm",
    "/runtime/runtimekit-utils.js",
    "/controller/controller.api.js",
    "/controller/controller.inject.js",
    "/controller/controller.worker.js",
    "/clients/httpengine-client.js",
    "/healthz",
  ];
  const restricted =
    /scramjet|scram|wisp|bare|libcurl|epoxy|ultraviolet|__uv|uvConfig|rewriteHTML|rewriteCSS|rewriteJS|rewriteUrl|proxyUrl|unproxyUrl|encodeUrl|decodeUrl|service-worker|service_worker/i;
  for (const route of routes) {
    const response = await fetch(`${origin}${route}`);
    const body = Buffer.from(await response.arrayBuffer()).toString("latin1");
    assert.doesNotMatch(body, restricted, route);
    for (const [name, value] of response.headers) {
      assert.doesNotMatch(`${name}: ${value}`, restricted, route);
    }
  }
});

test("client routes, assets, globals, methods, and worker targets are renamed", async () => {
  const routes = [
    "/",
    "/app.js",
    "/worker.js",
    "/bootstrap/bootstrap-client.js",
    "/runtime/runtimekit.js",
    "/runtime/runtimekit.wasm",
    "/runtime/runtimekit-utils.js",
    "/controller/controller.api.js",
    "/controller/controller.inject.js",
    "/controller/controller.worker.js",
    "/clients/httpengine-client.js",
  ];
  const routeOrAsset =
    /\/scram(?:jet)?\/|\/bare-?mux\/|\/uv\/|\/ultraviolet\/|scramjet(?:-frame|-container|\.alt\.js|\.worker\.js|\.shared\.js|\.wasm)|scram(?:\.codecs|\.codec|_codec|-frame)|bare(?:mux\/worker\.js|-client|\.c?js|-mux\.js|-mux-path|-mux-transport|-mux-config)/i;
  const globalsOrMethods =
    /ScramjetController|BareClient|BareMuxConnection|__uv\$?|uvConfig|rewriteHTML|rewriteCSS|rewriteJS|rewriteUrl|proxyUrl|unproxyUrl|encodeUrl|decodeUrl/i;
  const unsafeRegistration =
    /register\([^)]*(?:\bsw\b|service-worker|service_worker|\buv\b|scramjet|bare)/i;
  for (const route of routes) {
    const response = await fetch(`${origin}${route}`);
    const body = Buffer.from(await response.arrayBuffer()).toString("latin1");
    assert.doesNotMatch(body, routeOrAsset, route);
    assert.doesNotMatch(body, globalsOrMethods, route);
    assert.doesNotMatch(body, unsafeRegistration, route);
  }
});

for (const [route, contentType] of [
  ["/worker.js", "text/javascript"],
  ["/runtime/runtimekit.js", "text/javascript"],
  ["/runtime/runtimekit.wasm", "application/wasm"],
  ["/controller/controller.api.js", "text/javascript"],
  ["/controller/controller.inject.js", "text/javascript"],
  ["/controller/controller.worker.js", "text/javascript"],
  ["/clients/httpengine-client.js", "text/javascript"],
]) {
  test(`${route} is served as ${contentType}`, async () => {
    const response = await fetch(`${origin}${route}`, { method: "HEAD" });
    assert.equal(response.status, 200);
    assert.match(
      response.headers.get("content-type") || "",
      new RegExp(contentType),
    );
    assert.ok(Number(response.headers.get("content-length")) > 0);
  });
}

test("unknown paths return 404", async () => {
  assert.equal((await fetch(`${origin}/missing`)).status, 404);
});
