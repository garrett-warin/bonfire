import { init } from "/bootstrap/bootstrap-client.js";

const iframe = document.querySelector("#frame");

async function initialize() {
  const controller = await init({
    transport: "http",
    workerPath: "/worker.js",
    streamRelayPath: "/relay/",
    httpengineClientPath: "/clients/httpengine-client.js",
    socketengineClientPath: "/clients/httpengine-client.js",
    channelClientPath: "/clients/httpengine-client.js",
    runtimekitBundlePath: "/runtime/runtimekit.js",
    runtimekitWasmPath: "/runtime/runtimekit.wasm",
    runtimekitUtilsBundlePath: "/runtime/runtimekit-utils.js",
    runtimekitControllerApiPath: "/controller/controller.api.js",
    runtimekitControllerInjectPath: "/controller/controller.inject.js",
    runtimekitControllerWorkerPath: "/controller/controller.worker.js",
    bootstrapApiPath: "/bootstrap/bootstrap-client.js",
    bootstrapInitPath: "/app.js",
  });
  await controller.wait();
  const frame = controller.createFrame(iframe);
  frame.go("https://google.com/");
}

initialize().catch(console.error);
