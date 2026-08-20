declare const RUNTIMEKIT_EXPECTED_VERSION: string;
declare const CONTROLLER_VERSION: string;

export const VERSION = CONTROLLER_VERSION;

function assertVersionMatch(
	packageName: string,
	expected: string,
	actual: string
) {
	if (expected !== actual) {
		throw new Error(
			`${packageName} version mismatch: this build expects ${expected}, but the loaded runtime is ${actual}`
		);
	}
}

export function assertRuntimeRuntimeKitVersion() {
	if (typeof $runtimekit === "undefined") {
		throw new Error(
			"@mercuryworkshop/runtimekit is not loaded. Load runtimekit before the controller."
		);
	}

	assertVersionMatch(
		"@mercuryworkshop/runtimekit",
		RUNTIMEKIT_EXPECTED_VERSION,
		$runtimekit.versionInfo.version
	);
}
