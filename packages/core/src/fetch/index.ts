import {
	BareCompatibleClient as ChannelCompatibleClient,
	BareResponse as ChannelResponse,
	ProxyTransport,
	BareRequestInit as ChannelRequestInit,
} from "@mercuryworkshop/proxy-transports";

import { type URLMeta } from "@rewriters/url";
import { type RuntimeKitRequestMode } from "./parse";
import { RuntimeKitHeaders } from "@/shared/headers";
import { HtmlRewriterHooks, RuntimeKitContext } from "@/shared";
import { Tap, TapInstance } from "@/Tap";
import { doHandleFetch } from "./fetch";
import { _URL, _Map } from "@/shared/snapshot";

export interface RuntimeKitFetchRequest {
	rawUrl: URL;
	rawReferrer: string | null;
	// use parsed.destination instead
	rawDestination: RequestDestination;
	mode: RequestMode;
	referrer: string;
	method: string;
	body: BodyType | null;
	cache: RequestCache;

	initialHeaders: RuntimeKitHeaders;

	rawClientUrl?: URL;

	/** The service worker FetchEvent.clientId that originated this request. */
	clientId: string;
}

export interface RuntimeKitFetchParsed {
	url: _URL;
	clientUrl?: _URL;
	referrerSourceUrl?: _URL | null;
	hadExtraParams: boolean;
	crossSiteRedirect: boolean;

	// track the worst case Sec-Fetch-Site classification through redirects
	fetchSiteState?: "same-origin" | "same-site" | "cross-site";

	// origin of the page that initialized the request
	// specifically for tracking Sec-Fetch-Site, don't use for anything else, it will diverge from clientUrl in some cases
	fetchInitiatorOrigin?: string;

	// was the request made with credentials=include?
	fetchCredentialsInclude?: boolean;

	// tracks RequestInit.mode if set
	fetchMode?: RuntimeKitRequestMode;

	// was this request made by an iframe? (runtimekit's definition of an iframe, not the browser's)
	isIframe?: boolean;

	// request.destination, but is overridden by $dest
	destination: RequestDestination;

	meta: URLMeta;
	isModule: boolean;
	isFakeDataURL: boolean;
	referrerPolicy?: string;
	trackedClient?: RuntimeKitFetchTrackedClient;
}

export interface RuntimeKitFetchResponse {
	body: BodyType;
	headers: RuntimeKitHeaders;
	status: number;
	statusText: string;
}

export type CookieSyncEntry = {
	url: URL;
	cookie: string;
};

export type CookieSyncOptions = {
	clear?: boolean;
	destination?: RequestDestination;
};

export type FetchHandlerInit = {
	transport: ProxyTransport;
	context: RuntimeKitContext;
	crossOriginIsolated?: boolean;

	sendSetCookie: (
		cookies: CookieSyncEntry[],
		options?: CookieSyncOptions
	) => Promise<void>;
	fetchDataUrl(dataUrl: string): Promise<ChannelResponse>;
	fetchBlobUrl(blobUrl: string): Promise<ChannelResponse>;
};

export type TrackedHistoryState = {
	url: string;
	refererPolicy?: string;
};
export class RuntimeKitFetchTrackedClient {
	history: TrackedHistoryState[] = [];
	constructor(public clientId: string) {}
}

// eslint-disable-next-line runtimekit-core/no-globals
export class RuntimeKitFetchHandler extends EventTarget {
	public client: ChannelCompatibleClient;
	public crossOriginIsolated: boolean = false;
	public context: RuntimeKitContext;

	public trackedClients = new _Map<string, RuntimeKitFetchTrackedClient>();

	public hooks: {
		rewriter: {
			html: TapInstance<HtmlRewriterHooks>;
		};
		fetch: TapInstance<FetchHooks>;
	};

	public fetchDataUrl: (dataUrl: string) => Promise<Response>;
	public fetchBlobUrl: (blobUrl: string) => Promise<Response>;
	public sendSetCookie: (
		cookies: CookieSyncEntry[],
		options?: CookieSyncOptions
	) => Promise<void>;

	constructor(init: FetchHandlerInit) {
		super();
		this.client = new ChannelCompatibleClient(init.transport);
		this.context = init.context;
		this.crossOriginIsolated = init.crossOriginIsolated || false;
		this.sendSetCookie = init.sendSetCookie;
		this.fetchDataUrl = init.fetchDataUrl;
		this.fetchBlobUrl = init.fetchBlobUrl;
		this.hooks = {
			rewriter: {
				html: Tap.create<HtmlRewriterHooks>(),
			},
			fetch: Tap.create<FetchHooks>(),
		};
		this.context.hooks = {
			rewriter: this.hooks.rewriter,
		};
	}

	async handleFetch(
		request: RuntimeKitFetchRequest
	): Promise<RuntimeKitFetchResponse> {
		return doHandleFetch(this, request);
	}
}
export type FetchHooks = {
	intercept: {
		context: {
			request: RuntimeKitFetchRequest;
			parsed: RuntimeKitFetchParsed;
		};
		props: {
			response?: RuntimeKitFetchResponse;
		};
	};
	request: {
		context: {
			request: RuntimeKitFetchRequest;
			parsed: RuntimeKitFetchParsed;
			client: ChannelCompatibleClient;
		};
		props: {
			init: ChannelRequestInit;
			url: URL;
			earlyResponse?: ChannelResponse;
		};
	};
	preresponse: {
		context: {
			request: RuntimeKitFetchRequest;
			parsed: RuntimeKitFetchParsed;
		};
		props: {
			response: ChannelResponse;
		};
	};
	response: {
		context: {
			request: RuntimeKitFetchRequest;
			parsed: RuntimeKitFetchParsed;
		};
		props: {
			response: RuntimeKitFetchResponse;
		};
	};
};

export type BodyType = string | ArrayBuffer | Blob | ReadableStream<any>;
