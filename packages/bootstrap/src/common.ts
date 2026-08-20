export const REGISTRY_URL = "https://registry.npmjs.org/";
export const RUNTIMEKIT_PACKAGE_NAME = "@mercuryworkshop/runtimekit";

export const RUNTIMEKIT_CONTROLLER_PACKAGE_NAME =
	"@mercuryworkshop/runtimekit-controller";
export const RUNTIMEKIT_CONTROLLER_PINNED_MAJOR_VERSION = "0";

export const RUNTIMEKIT_UTILS_PACKAGE_NAME = "@mercuryworkshop/runtimekit-utils";
export const RUNTIMEKIT_UTILS_PINNED_MAJOR_VERSION = "0";

export const SOCKET_ENGINE_TRANSPORT_PACKAGE_NAME = "@mercuryworkshop/epoxy-transport";
export const SOCKET_ENGINE_TRANSPORT_PINNED_MAJOR_VERSION = "3";

export const HTTP_ENGINE_TRANSPORT_PACKAGE_NAME =
	"@mercuryworkshop/libcurl-transport";
export const HTTP_ENGINE_TRANSPORT_PINNED_MAJOR_VERSION = "2";

export type TransportOptions = "socket" | "http" | "channel";

export type BootstrapOptions = {
	transport: TransportOptions;
	swPath: string;

	streamRelayPath: string;

	runtimekitBundlePath: string;
	runtimekitWasmPath: string;
	runtimekitUtilsBundlePath: string;

	socketengineClientPath: string;
	httpengineClientPath: string;
	channelClientPath: string;
	runtimekitControllerApiPath: string;
	runtimekitControllerInjectPath: string;
	runtimekitControllerSwPath: string;

	bootstrapApiPath: string;
	bootstrapInitPath: string;

	runtimekitVersionPin?: string;
	runtimekitControllerVersionPin?: string;
	runtimekitUtilsVersionPin?: string;
	socketengineTransportVersionPin?: string;
	httpengineTransportVersionPin?: string;
	channelTransportVersionPin?: string;
};

export const defaultConfig: Partial<BootstrapOptions> = {
	transport: "http",
	swPath: "/sw.js",
	streamRelayPath: "/streamRelay/",

	socketengineClientPath: "/clients/socketengine-client.js",
	httpengineClientPath: "/clients/httpengine-client.js",
	channelClientPath: "/clients/channel-client.js",
	bootstrapInitPath: "/bootstrap-init.js",

	runtimekitControllerApiPath: "/controller/controller.api.js",
	runtimekitControllerInjectPath: "/controller/controller.inject.js",
	runtimekitControllerSwPath: "/controller/controller.sw.js",
	runtimekitBundlePath: "/runtime/runtimekit.js",
	runtimekitWasmPath: "/runtime/runtimekit.wasm",
	runtimekitUtilsBundlePath: "/runtime/runtimekit-utils.js",
};
