// entrypoint for runtimekit.client.js

import { RuntimeKitContext, RuntimeKitInterface } from "@/shared/index";
import { RUNTIMEKITCLIENT } from "@/symbols";
import { RuntimeKitClient } from "@client/index";
import { RuntimeKitConfig } from "@/types";

export const iswindow = "window" in globalThis && window instanceof Window;
export const isworker = "WorkerGlobalScope" in globalThis;
export const issw = "ServiceWorkerGlobalScope" in globalThis;
export const isdedicated = "DedicatedWorkerGlobalScope" in globalThis;
export const isshared = "SharedWorkerGlobalScope" in globalThis;
