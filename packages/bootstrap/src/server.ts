import { server as streamRelay } from "@mercuryworkshop/wisp-js/server";
import http from "http";
import { extract } from "tar";
import { Readable } from "stream";
import fs from "fs/promises";
import { join } from "node:path";
import {
	defaultConfig,
	SOCKET_ENGINE_TRANSPORT_PACKAGE_NAME,
	SOCKET_ENGINE_TRANSPORT_PINNED_MAJOR_VERSION,
	HTTP_ENGINE_TRANSPORT_PACKAGE_NAME,
	HTTP_ENGINE_TRANSPORT_PINNED_MAJOR_VERSION,
	REGISTRY_URL,
	RUNTIMEKIT_CONTROLLER_PACKAGE_NAME,
	RUNTIMEKIT_CONTROLLER_PINNED_MAJOR_VERSION,
	RUNTIMEKIT_PACKAGE_NAME,
	RUNTIMEKIT_UTILS_PACKAGE_NAME,
	RUNTIMEKIT_UTILS_PINNED_MAJOR_VERSION,
	BootstrapOptions,
} from "./common";

const bootstrapRoot = import.meta.dirname;

type ServerBootstrapOptions = BootstrapOptions & {
	downloadedFilesDir: string;
};

let config: ServerBootstrapOptions;

async function sendFile(
	res: http.ServerResponse,
	filePath: string,
	contentType: string
) {
	const data = await fs.readFile(filePath);
	res.writeHead(200, { "Content-Type": contentType });
	res.end(data);
}
const clientdata = await fs.readFile(
	join(bootstrapRoot, "bootstrap-client.js")
);
function routeRequest(
	req: http.IncomingMessage,
	res: http.ServerResponse
): boolean {
	if (!req.url) return false;

	if (req.url === config.swPath) {
		res.writeHead(200, { "Content-Type": "application/javascript" });
		res.end(`importScripts("${config.runtimekitControllerSwPath}");
addEventListener("fetch", (e) => {
	if ($runtimekitController.shouldRoute(e)) {
		e.respondWith($runtimekitController.route(e));
	}
});
`);

		return true;
	} else if (req.url === config.bootstrapInitPath) {
		res.writeHead(200, { "Content-Type": "application/javascript" });
		res.end(`async function initBootstrap() {
	const { init } = await import("data:text/javascript;base64,${Buffer.from(clientdata).toString("base64")}");
	return init(${JSON.stringify(config)});
}`);

		return true;
	}

	const pathsToFiles = {
		[config.runtimekitControllerApiPath]:
			config.downloadedFilesDir + "controller/package/dist/controller.api.js",
		[config.runtimekitControllerInjectPath]:
			config.downloadedFilesDir +
			"controller/package/dist/controller.inject.js",
		[config.runtimekitControllerSwPath]:
			config.downloadedFilesDir + "controller/package/dist/controller.sw.js",
		[config.runtimekitBundlePath]:
			config.downloadedFilesDir + "runtimekit/package/dist/runtimekit.js",
		[config.runtimekitWasmPath]:
			config.downloadedFilesDir + "runtimekit/package/dist/runtimekit.wasm",
		[config.runtimekitUtilsBundlePath]:
			config.downloadedFilesDir +
			"runtimekit-utils/package/dist/runtimekit-utils.js",

		[config.httpengineClientPath]:
			config.downloadedFilesDir + "httpengine-transport/package/dist/index.js",
	};
	if (req.url in pathsToFiles) {
		const filePath = pathsToFiles[req.url as keyof typeof pathsToFiles];
		const contentType = req.url.endsWith(".wasm")
			? "application/wasm"
			: "application/javascript";
		sendFile(res, filePath, contentType);
		return true;
	}

	return false;
}

function routeUpgrade(
	req: http.IncomingMessage,
	socket: any,
	head: Buffer
): boolean {
	if (!req.url) return false;
	if (!req.url.startsWith("/streamRelay/")) return false;

	streamRelay.routeRequest(req, socket, head);
	return true;
}

export async function unpack(tarball: string, name: string) {
	if (!name) throw new Error("no package name!");
	const response = await fetch(tarball);
	if (!response.ok) {
		throw new Error(`Failed to download tarball: ${response.statusText}`);
	}

	const arrayBuffer = await response.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	await fs.mkdir(config.downloadedFilesDir, { recursive: true });
	const file = `${config.downloadedFilesDir}${name}.tgz`;
	await fs.writeFile(file, buffer);

	const packagedir = `${config.downloadedFilesDir}/${name}`;

	if (await fs.stat(packagedir).catch(() => false)) {
		await fs.rm(packagedir, { recursive: true, force: true });
	}
	await fs.mkdir(packagedir, { recursive: true });

	try {
		await extract({
			f: file,
			cwd: packagedir,
		});
		await fs.unlink(file);
	} catch (err) {
		console.error("Error extracting tarball:", err);
		await fs.unlink(file);
		throw err;
	}
}

async function getDownloadedPackageVersion(
	name: string
): Promise<string | null> {
	const packagedir = `${config.downloadedFilesDir}${name}`;
	try {
		const pkgJson = JSON.parse(
			(await fs.readFile(
				`${packagedir}/package/package.json`,
				"utf-8"
			)) as unknown as string
		);
		return pkgJson.version;
	} catch {
		return null;
	}
}

async function updateRuntimeKit(controllerMeta: any) {
	const runtimekitVersion =
		controllerMeta.devDependencies["@mercuryworkshop/runtimekit"];

	console.log(`Fetching runtimekit version: ${runtimekitVersion}`);
	const runtimekitRes = await fetch(
		`${REGISTRY_URL}${RUNTIMEKIT_PACKAGE_NAME}/${runtimekitVersion}`
	);
	const runtimekitMeta = await runtimekitRes.json();

	await unpack(runtimekitMeta.dist.tarball, "runtimekit");
	await unpack(controllerMeta.dist.tarball, "controller");
}

export async function findLatestVersionOfPackage(
	packageName: string,
	majorVersion: string
): Promise<NodePackageMeta> {
	const packageRes = await fetch(`${REGISTRY_URL}${packageName}`);
	const packageMeta = await packageRes.json();
	const versions = Object.keys(packageMeta.versions).filter((v) =>
		v.startsWith(`${majorVersion}.`)
	);
	const sortedVersions = versions.sort((a, b) => {
		const aParts = a.split(".").map(Number);
		const bParts = b.split(".").map(Number);
		for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
			const aVal = aParts[i] || 0;
			const bVal = bParts[i] || 0;
			if (aVal !== bVal) return bVal - aVal;
		}
		return 0;
	});
	if (sortedVersions.length === 0) {
		throw new Error(
			`No versions found for package ${packageName} with major version ${majorVersion}`
		);
	}
	const latestVersion = sortedVersions[0];

	const latestRes = await fetch(
		`${REGISTRY_URL}${packageName}/${latestVersion}`
	);
	const latestMeta = await latestRes.json();
	return latestMeta;
}

type NodePackageMeta = {
	name: string;
	version: string;
	dist: {
		tarball: string;
	};
	dependencies: { [key: string]: string };
};

export async function bootstrap(
	cfg: Partial<ServerBootstrapOptions> = {}
): Promise<{
	routeRequest: typeof routeRequest;
	routeUpgrade: typeof routeUpgrade;
}> {
	config = {
		...defaultConfig,
		...cfg,
		downloadedFilesDir: join(bootstrapRoot, ".downloads") + "/",
	} as ServerBootstrapOptions;

	const downloadedControllerVersion =
		await getDownloadedPackageVersion("controller");
	if (downloadedControllerVersion) {
		console.log(
			`Found downloaded RuntimeKit Controller version: ${downloadedControllerVersion}`
		);
	}

	if (config.transport === "socket") {
		const socketengineMeta = await findLatestVersionOfPackage(
			SOCKET_ENGINE_TRANSPORT_PACKAGE_NAME,
			SOCKET_ENGINE_TRANSPORT_PINNED_MAJOR_VERSION
		);
		await unpack(socketengineMeta.dist.tarball, "socketengine-transport");
		console.log(`Using SocketEngine Transport version: ${socketengineMeta.version}`);
	} else if (config.transport === "http") {
		const httpengineMeta = await findLatestVersionOfPackage(
			HTTP_ENGINE_TRANSPORT_PACKAGE_NAME,
			HTTP_ENGINE_TRANSPORT_PINNED_MAJOR_VERSION
		);
		await unpack(httpengineMeta.dist.tarball, "httpengine-transport");
		console.log(`Using httpengine Transport version: ${httpengineMeta.version}`);
	} else {
		throw new Error(`Unknown transport option: ${config.transport}`);
	}

	const controllerMeta = await findLatestVersionOfPackage(
		RUNTIMEKIT_CONTROLLER_PACKAGE_NAME,
		RUNTIMEKIT_CONTROLLER_PINNED_MAJOR_VERSION
	);

	if (downloadedControllerVersion === controllerMeta.version) {
		console.log(
			`RuntimeKit Controller is up to date (version: ${downloadedControllerVersion}), skipping download.`
		);
	} else {
		await updateRuntimeKit(controllerMeta);
		console.log(
			`Downloaded RuntimeKit Controller version: ${controllerMeta.version}`
		);
	}

	const downloadedUtilsVersion =
		await getDownloadedPackageVersion("runtimekit-utils");
	const utilsMeta = await findLatestVersionOfPackage(
		RUNTIMEKIT_UTILS_PACKAGE_NAME,
		RUNTIMEKIT_UTILS_PINNED_MAJOR_VERSION
	);
	if (downloadedUtilsVersion === utilsMeta.version) {
		console.log(
			`RuntimeKit Utils is up to date (version: ${downloadedUtilsVersion}), skipping download.`
		);
	} else {
		await unpack(utilsMeta.dist.tarball, "runtimekit-utils");
		console.log(`Downloaded RuntimeKit Utils version: ${utilsMeta.version}`);
	}

	return {
		routeRequest,
		routeUpgrade,
	};
}
