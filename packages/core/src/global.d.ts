/// <reference types="@rspack/core/module" />

declare global {
	interface Window {
		WASM: string;
		REAL_WASM: Uint8Array;

		/**
		 * The runtimekit client belonging to a window.
		 */
		[import("./symbols").RUNTIMEKITCLIENT]: import("./client").RuntimeKitClient;
	}

	interface Document {
		/**
		 * Should be the same as window.
		 */
		[import("./symbols").RUNTIMEKITCLIENT]: import("./client").RuntimeKitClient;
	}
}

declare const dbg: {
	log: (message: string, ...args: any[]) => void;
	warn: (message: string, ...args: any[]) => void;
	error: (message: string, ...args: any[]) => void;
	debug: (message: string, ...args: any[]) => void;
	time: (meta: URLMeta, before: number, type: string) => void;
};

// eslint-disable-next-line runtimekit-core/no-globals
declare type GlobalThis = typeof globalThis;
declare type Self = Window & GlobalThis;
