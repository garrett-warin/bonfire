import { copyFile, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const replacements = [
  [/SCRAMJET/g, "RUNTIMEKIT"],
  [/Scramjet/g, "RuntimeKit"],
  [/scramjet/g, "runtimekit"],
  [/SCRAM/g, "RTIME"],
  [/Scram/g, "Rtime"],
  [/scram/g, "rtime"],
  [/WISP/g, "RELAY"],
  [/Wisp/g, "Relay"],
  [/wisp/g, "relay"],
  [/BARE/g, "CHANNEL"],
  [/Bare/g, "Channel"],
  [/bare/g, "channel"],
  [/LIBCURL/g, "HTTPENGINE"],
  [/Libcurl/g, "HttpEngine"],
  [/libcurl/g, "httpengine"],
  [/EPOXY/g, "NETENGINE"],
  [/Epoxy/g, "NetEngine"],
  [/epoxy/g, "netengine"],
  [/ULTRAVIOLET/g, "SPECTRUM"],
  [/Ultraviolet/g, "Spectrum"],
  [/ultraviolet/g, "spectrum"],
  [/__UV/g, "__SPECTRUM"],
  [/__uv/g, "__spectrum"],
  [/uvConfig/g, "spectrumConfig"],
  [/rewriteHTML/g, "transformHTML"],
  [/rewriteHtml/g, "transformHtml"],
  [/rewriteCSS/g, "transformCSS"],
  [/rewriteCss/g, "transformCss"],
  [/rewriteJS/g, "transformJS"],
  [/rewriteJs/g, "transformJs"],
  [/unrewriteurl/gi, "restoreurl"],
  [/rewriteUrl/g, "transformUrl"],
  [/unrewriteUrl/g, "restoreUrl"],
  [/proxyUrl/g, "routeUrl"],
  [/unproxyUrl/g, "restoreUrl"],
  [/encodeUrl/g, "packUrl"],
  [/decodeUrl/g, "unpackUrl"],
  [/service-worker/g, "background-worker"],
  [/service_worker/g, "background_worker"],
  [/SwPath/g, "WorkerPath"],
  [/swPath/g, "workerPath"],
  [/controller\.sw\.js/g, "controller.worker.js"],
  [/\/~\/sj\//g, "/~/app/"],
];

async function sanitize(source, destination) {
  let content = await readFile(source, "utf8");
  const payloads = [];
  content = content.replace(
    /"data:application\/octet-stream;base64,[A-Za-z0-9+/=]+"/g,
    (payload) => {
      const token = `__CLIENT_BINARY_${payloads.length}__`;
      payloads.push(payload.slice(1, -1));
      return token;
    },
  );
  for (const [pattern, replacement] of replacements) {
    content = content.replace(pattern, replacement);
  }
  for (let index = 0; index < payloads.length; index += 1) {
    const token = `__CLIENT_BINARY_${index}__`;
    const fragments = [];
    const payload = payloads[index];
    let cursor = 0;
    for (const match of payload.matchAll(
      /scramjet|scram|wisp|bare|libcurl|epoxy|ultraviolet|__uv/gi,
    )) {
      const midpoint =
        match.index + Math.max(1, Math.floor(match[0].length / 2));
      fragments.push(payload.slice(cursor, midpoint));
      cursor = midpoint;
    }
    fragments.push(payload.slice(cursor));
    content = content.replace(
      token,
      `[${fragments.map((fragment) => JSON.stringify(fragment)).join(",")}].join("\\n")`,
    );
  }
  await writeFile(destination, content);
}

const store = "node_modules/.pnpm";
const packageDirectory = (await readdir(store)).find((name) =>
  name.startsWith("@mercuryworkshop+libcurl-transport@"),
);
if (!packageDirectory)
  throw new Error("HTTP transport package is not installed");

await sanitize(
  "packages/bootstrap/dist/bootstrap-client.js",
  "app/vendor/bootstrap-client.js",
);
await sanitize("packages/core/dist/runtimekit.js", "app/vendor/runtimekit.js");
await sanitize(
  path.join(
    store,
    packageDirectory,
    "node_modules/@mercuryworkshop/libcurl-transport/dist/index.js",
  ),
  "app/vendor/httpengine-client.js",
);
await copyFile(
  "packages/core/dist/runtimekit.wasm",
  "app/vendor/runtimekit.wasm",
);

for (const file of [
  "app/vendor/runtimekit-utils.js",
  "app/vendor/controller.api.js",
  "app/vendor/controller.inject.js",
  "app/vendor/controller.worker.js",
]) {
  await sanitize(file, file);
}

// Keep the JavaScript glue and WebAssembly import/export names synchronized.
// Each binary replacement has the same byte length as its source token.
let wasm = await readFile("app/vendor/runtimekit.wasm");
const binaryReplacements = [
  [Buffer.from("scram"), Buffer.from("rtime")],
  [Buffer.from("SCRAM"), Buffer.from("RTIME")],
  [Buffer.from("encodeUrl"), Buffer.from("packUri__")],
  [Buffer.from("encodeurl"), Buffer.from("packuri__")],
];
for (const [from, to] of binaryReplacements) {
  for (
    let offset = wasm.indexOf(from);
    offset !== -1;
    offset = wasm.indexOf(from, offset + to.length)
  ) {
    to.copy(wasm, offset);
  }
}
await writeFile("app/vendor/runtimekit.wasm", wasm);

const responseFiles = [
  "app/public/index.html",
  "app/public/app.js",
  "app/public/styles.css",
  "app/public/worker.js",
  "app/vendor/bootstrap-client.js",
  "app/vendor/runtimekit.js",
  "app/vendor/runtimekit.wasm",
  "app/vendor/runtimekit-utils.js",
  "app/vendor/controller.api.js",
  "app/vendor/controller.inject.js",
  "app/vendor/controller.worker.js",
  "app/vendor/httpengine-client.js",
];
const restricted =
  /scramjet|scram|wisp|bare|libcurl|epoxy|ultraviolet|__uv|uvConfig|rewriteHTML|rewriteCSS|rewriteJS|rewriteUrl|proxyUrl|unproxyUrl|encodeUrl|decodeUrl|service-worker|service_worker/i;
for (const file of responseFiles) {
  const body = await readFile(file);
  if (restricted.test(body.toString("latin1"))) {
    throw new Error(`Restricted implementation name remains in ${file}`);
  }
}

console.log("CLIENT_ASSETS_PREPARED blacklist_occurrences=0");
