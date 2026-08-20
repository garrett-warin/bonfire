// NOTE: this is the entrypoint for runtimekit.bundle.js
// as such it exports everything in runtimekit
// the entry point for runtimekit.all.js (what most sites wil use) is entry.ts

import "./global.d";
import { atob } from "@/shared/snapshot";
import { setWasm } from "@rewriters/wasm";
import { RuntimeKitVersionInfo, RuntimeKitConfig } from "./types";

declare const VERSION: string;
declare const COMMITHASH: string;
declare const BUILDDATE: string;
export const versionInfo: RuntimeKitVersionInfo = {
	version: VERSION,
	build: COMMITHASH,
	date: BUILDDATE,
};

export const defaultConfig: RuntimeKitConfig = {
	globals: {
		wrapfn: "$runtimekit$wrap",
		wrappropertybase: "$runtimekit__",
		wrappropertyfn: "$runtimekit$prop",
		cleanrestfn: "$runtimekit$clean",
		importfn: "$runtimekit$import",
		rewritefn: "$runtimekit$rewrite",
		metafn: "$runtimekit$meta",
		wrappostmessagefn: "$runtimekit$wrappostmessage",
		pushsourcemapfn: "$runtimekit$pushsourcemap",
		trysetfn: "$runtimekit$tryset",
		templocid: "$runtimekit$temploc",
		tempunusedid: "$runtimekit$tempunused",
	},
	flags: {
		syncxhr: false,
		disableComputedWrap: false,
		rewriterLogs: false,
		captureErrors: false,
		cleanErrors: false,
		scramitize: false,
		sourcemaps: true,
		destructureRewrites: true,
		allowInvalidJs: true,
		debugTrampolines: false,
		allowFailedIntercepts: false,
		encapsulateWorkers: true,
		debugSourceURL: false,
	},
	siteFlags: {},
	maskedfiles: [],
};

export const defaultConfigDev: RuntimeKitConfig = {
	...defaultConfig,
	flags: {
		...defaultConfig.flags,
		rewriterLogs: false,
		captureErrors: true,
		cleanErrors: false,
		debugTrampolines: true,
		debugSourceURL: true,
		allowInvalidJs: false,
	},
};

declare const REWRITERWASM: string | undefined;
// bundled build will have the wasm binary inlined as a base64 string
if (REWRITERWASM) {
	setWasm(Uint8Array.from(atob(REWRITERWASM), (c) => c.charCodeAt(0)));
}

export * from "./symbols";
export * from "./types";
export * from "./Tap";
export * from "./shared";
export * from "./fetch";
export { BareResponse as ChannelResponse } from "@mercuryworkshop/proxy-transports";
export * from "./client";
