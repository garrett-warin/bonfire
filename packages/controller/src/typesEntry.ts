import * as Types from "./index";
export * from "./index";

declare global {
	const $runtimekitController: typeof Types;
}
