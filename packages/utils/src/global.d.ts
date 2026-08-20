import type * as RuntimeKitController from "@mercuryworkshop/runtimekit-controller";

declare global {
	const $runtimekit: typeof import("@mercuryworkshop/runtimekit");
	const $runtimekitController: typeof RuntimeKitController;
}

export {};
