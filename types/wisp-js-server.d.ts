declare module "@mercuryworkshop/wisp-js/server" {
	import type { IncomingMessage } from "node:http";
	import type { Duplex } from "node:stream";

	export interface WispServerOptions {
		hostname_blacklist: RegExp[] | null;
		hostname_whitelist: RegExp[] | null;
		port_blacklist: Array<number | [number, number]> | null;
		port_whitelist: Array<number | [number, number]> | null;
		allow_direct_ip: boolean;
		allow_private_ips: boolean;
		allow_loopback_ips: boolean;
		client_ip_blacklist: string[] | null;
		client_ip_whitelist: string[] | null;
		stream_limit_per_host: number;
		stream_limit_total: number;
		allow_udp_streams: boolean;
		allow_tcp_streams: boolean;
		dns_ttl: number;
		dns_method: "lookup" | "resolve";
		dns_servers: string[] | null;
		dns_result_order: "verbatim" | "ipv4first" | "ipv6first";
		parse_real_ip: boolean;
		parse_real_ip_from: string[];
		wisp_version: 1 | 2;
		wisp_motd: string | null;
	}

	export interface WispConnectionOptions {
		wisp_version?: 1 | 2;
	}

	export const server: {
		options: WispServerOptions;
		routeRequest(
			request: IncomingMessage,
			socket: Duplex,
			head: Buffer,
			connectionOptions?: WispConnectionOptions
		): void;
		parse_real_ip(headers: IncomingMessage["headers"], clientIp: string): string;
	};

	export const logging: {
		readonly DEBUG: 0;
		readonly INFO: 1;
		readonly WARN: 2;
		readonly ERROR: 3;
		readonly NONE: 4;
		readonly log_level: number;
		set_level(level: number): void;
		get_timestamp(): string;
		debug(...messages: unknown[]): void;
		info(...messages: unknown[]): void;
		log(...messages: unknown[]): void;
		warn(...messages: unknown[]): void;
		error(...messages: unknown[]): void;
	};
}
