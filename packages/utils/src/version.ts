declare const RUNTIMEKIT_EXPECTED_VERSION: string;
declare const CONTROLLER_EXPECTED_VERSION: string;

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

export function assertDependencyVersions() {
	if (typeof $runtimekit === "undefined") {
		console.error(
			"@mercuryworkshop/runtimekit is not loaded. Load runtimekit before runtimekit-utils."
		);
	}

	assertVersionMatch(
		"@mercuryworkshop/runtimekit",
		RUNTIMEKIT_EXPECTED_VERSION,
		$runtimekit.versionInfo.version
	);

	if (typeof $runtimekitController === "undefined") {
		console.error(
			"@mercuryworkshop/runtimekit-controller is not loaded. Load the controller before runtimekit-utils."
		);
	}

	assertVersionMatch(
		"@mercuryworkshop/runtimekit-controller",
		CONTROLLER_EXPECTED_VERSION,
		$runtimekitController.VERSION
	);
}
