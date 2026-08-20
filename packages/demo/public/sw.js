importScripts("/controller/controller.sw.js");

addEventListener("fetch", (e) => {
	if ($runtimekitController.shouldRoute(e)) {
		e.respondWith($runtimekitController.route(e));
	}
});
