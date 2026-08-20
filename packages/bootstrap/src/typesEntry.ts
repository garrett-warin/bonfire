import type { Controller } from "@mercuryworkshop/runtimekit-controller";
declare global {
	function initBootstrap(): Promise<Controller>;
}

export * from "./server";
