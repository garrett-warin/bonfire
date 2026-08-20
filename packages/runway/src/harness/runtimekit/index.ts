import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { server as streamRelay, logging } from "@mercuryworkshop/wisp-js/server";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve paths relative to the package root (runway/)
const packageRoot = path.resolve(__dirname, "../../..");

export const PORT = 4500;
export const STREAM_RELAY_PORT = 4501;

export async function startHarness() {
	const app = express();

	app.use(
		"/runtimekit",
		express.static(
			path.join(packageRoot, "node_modules/@mercuryworkshop/runtimekit/dist")
		)
	);

	app.use(
		"/controller",
		express.static(
			path.join(
				packageRoot,
				"node_modules/@mercuryworkshop/runtimekit-controller/dist"
			)
		)
	);

	app.use(
		"/httpengine",
		express.static(
			path.join(
				packageRoot,
				"node_modules/@mercuryworkshop/libcurl-transport/dist"
			)
		)
	);

	app.use(express.static(path.join(__dirname, "public")));

	app.listen(PORT, () => {
		console.log(`    Harness server listening on port ${PORT}`);
	});

	const streamRelayServer = http.createServer((req, res) => {
		res.writeHead(200, { "Content-Type": "text/plain" });
		res.end("streamRelay server");
	});
	streamRelay.options.allow_private_ips = true;
	streamRelay.options.allow_loopback_ips = true;
	logging.set_level(logging.NONE);

	streamRelayServer.on("upgrade", (req, socket, head) => {
		streamRelay.routeRequest(req, socket, head);
	});

	streamRelayServer.listen(STREAM_RELAY_PORT, () => {
		console.log(`    StreamRelay server listening on port ${STREAM_RELAY_PORT}`);
	});
}
