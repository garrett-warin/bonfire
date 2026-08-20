import { IncrementalHtmlRewriter } from "@/shared";
import { RuntimeKitClient } from "./client";
import { SourceMaps } from "./shared/sourcemaps";
import {
	Object_getOwnPropertyNames,
	Object_getOwnPropertyDescriptor,
} from "@/shared/snapshot";

export class SingletonBox {
	clients: RuntimeKitClient[] = [];
	globals: Map<Self, RuntimeKitClient> = new Map();
	documents: Map<Document, RuntimeKitClient> = new Map();
	histories: Map<History, RuntimeKitClient> = new Map();
	locations: Map<Location, RuntimeKitClient> = new Map();
	writeRewriters = new WeakMap<Document, IncrementalHtmlRewriter>();
	unproxy = new Map<any, any>();

	ctors: Record<string, Function[]> = {};

	sourcemaps: SourceMaps = {};

	constructor(public ownerclient: RuntimeKitClient) {}

	registerClient(client: RuntimeKitClient, global: Self) {
		this.clients.push(client);
		this.globals.set(global, client);
		this.documents.set(global.document, client);
		this.locations.set(global.location, client);
		this.histories.set(global.history, client);

		Object_getOwnPropertyNames(global).forEach((prop) => {
			const desc = Object_getOwnPropertyDescriptor(global, prop);
			if (desc && typeof desc.value === "function") {
				if (!this.ctors[prop]) this.ctors[prop] = [];
				this.ctors[prop].push(desc.value);
			}
		});
	}

	instanceof(obj: any, name: string): boolean {
		const ctors = this.ctors[name];
		if (!ctors) {
			dbg.error(`No constructors for ${name} found`);
			return false;
		}
		for (const ctor of ctors) {
			// eslint-disable-next-line runtimekit-core/no-instanceof
			if (obj instanceof ctor) return true;
		}
		return false;
	}
}
