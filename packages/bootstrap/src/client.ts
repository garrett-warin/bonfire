import { loadScript, registerSw } from "./clientcommon";
import { BootstrapOptions } from "./common";
import type { ProxyTransport } from "@mercuryworkshop/proxy-transports";
import type SocketEngineClient from "@mercuryworkshop/epoxy-transport";
import type HttpEngineClient from "@mercuryworkshop/libcurl-transport";
import * as ControllerApi from "@mercuryworkshop/runtimekit-controller";

export async function init(cfg: BootstrapOptions) {
	const sw = await registerSw(cfg.swPath);
	return await loadRest(sw, cfg);
}

export async function loadRest(sw: ServiceWorker, cfg: BootstrapOptions) {
	await loadScript(cfg.runtimekitBundlePath);
	await loadScript(cfg.runtimekitControllerApiPath);
	await loadScript(cfg.runtimekitUtilsBundlePath);

	const resolvedStreamRelayPath = `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}${cfg.streamRelayPath}`;

	let transport!: ProxyTransport;
	if (cfg.transport === "socket") {
		await loadScript(cfg.socketengineClientPath);
		const SocketEngineCtor: typeof SocketEngineClient = (window as any).EpoxyTransport
			.EpoxyClient;
		transport = new SocketEngineCtor({ wisp: resolvedStreamRelayPath });
	} else if (cfg.transport === "http") {
		await loadScript(cfg.httpengineClientPath);
		const HttpEngineCtor: typeof HttpEngineClient = (window as any).LibcurlTransport
			.LibcurlClient;
		transport = new HttpEngineCtor({ wisp: resolvedStreamRelayPath });
	} else if (cfg.transport === "channel") {
		throw new Error("Channel transport not implemented yet");
		//...
	}
	const { Controller, config } = (window as any)
		.$runtimekitController as typeof ControllerApi;
	config.injectPath = cfg.runtimekitControllerInjectPath;
	config.wasmPath = cfg.runtimekitWasmPath;
	config.runtimekitPath = cfg.runtimekitBundlePath;

	const controller = new Controller({
		serviceworker: sw,
		transport,
	});

	return controller;
}
