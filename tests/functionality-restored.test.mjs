import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFile(resolve(root, file), "utf8");

const operationalSources = [
	"packages/bootstrap/src/client.ts",
	"packages/bootstrap/src/common.ts",
	"packages/bootstrap/src/server.ts",
	"packages/bootstrap/src/static.ts",
	"packages/controller/src/index.ts",
	"packages/controller/src/sw.ts",
	"packages/core/src/shared/rewriters/url.ts",
	"packages/core/src/fetch/fetch.ts",
	"packages/runway/src/harness/runtimekit/index.ts",
	"devserver.ts",
];

for (const file of operationalSources) {
	test(`${file} has no testing-only network guard`, async () => {
		assert.doesNotMatch(
			await read(file),
			/failClosed|Networking disabled in defensive fixture|disabled-(?:socket|http|channel)/
		);
	});
}

test("production bundler uses operational bootstrap entrypoints", async () => {
	const config = await read("rspack.config.ts");
	assert.match(config, /src\/server\.ts/);
	assert.match(config, /src\/client\.ts/);
	assert.match(config, /src\/static\.ts/);
	assert.doesNotMatch(config, /src\/disabled-(?:server|client|static)\.ts/);
});

test("bootstrap defaults to an implemented transport", async () => {
	const common = await read("packages/bootstrap/src/common.ts");
	assert.match(common, /transport: "http"/);
	assert.match(common, /"socket" \| "http" \| "channel"/);
	assert.doesNotMatch(common, /transport: "disabled"/);
});

for (const file of [
	"packages/bootstrap/dist/bootstrap-client.js",
	"packages/bootstrap/dist/bootstrap-server.js",
	"packages/bootstrap/dist/bootstrap-static.js",
	"packages/controller/dist/controller.api.js",
	"packages/controller/dist/controller.sw.js",
	"packages/core/dist/runtimekit.js",
]) {
	test(`${file} has no testing-only network guard`, async () => {
		assert.doesNotMatch(
			await read(file),
			/Networking disabled in defensive fixture/
		);
	});
}
