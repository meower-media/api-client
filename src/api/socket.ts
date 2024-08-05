import { EventEmitter } from 'jsr:@denosaurs/event@2.0.2';
import { type api_post, post } from '../interfaces/post.ts';
import type { api_user } from '../interfaces/user.ts';

/** options used to connect to the meower socket */
export interface socket_connect_opts {
	/** the api url */
	api_url: string;
	/** the api token */
	api_token: string;
	/** the password */
	password?: string;
	/** the socket url */
	socket_url: string;
	/** the username */
	username: string;
}

/** socket value types */
export type socket_value =
	| string
	| number
	| boolean
	| { [key: string]: socket_value }
	| socket_value[];

/** a packet sent over the socket */
export interface socket_packet {
	/** the packet command */
	cmd: string;
	/** the packet value */
	val?: socket_value;
	/** packet names */
	name?: string;
	/** packet id */
	id?: string;
	/** listener id */
	listener?: string;
}

/** auth information from the socket */
export interface socket_auth_event {
	/** api user */
	account: api_user;
	/** api token */
	token: string;
}

/** access to the meower socket */
export class socket extends EventEmitter<{
	socket_open: [];
	socket_close: [];
	socket_error: [Event | ErrorEvent];
	packet: [socket_packet];
	[key: `cmd-${string}`]: [socket_packet];
	[key: `listener-${string}`]: [socket_packet];
	create_message: [post];
	edit_message: [post];
	delete_message: [{ id: string }];
	auth: [socket_auth_event];
}> {
	private socket: WebSocket;
	private opts: socket_connect_opts;

	/** create a socket instance from a given websocket connection */
	constructor(socket: WebSocket, opts: socket_connect_opts) {
		super();
		this.socket = socket;
		this.opts = opts;
		this.setup();
	}

	private setup() {
		this.emit('socket_open');

		this.send({
			'cmd': 'direct',
			'val': {
				'cmd': 'type',
				'val': 'js',
			},
		});

		this.send({
			'cmd': 'authpswd',
			'val': {
				'username': this.opts.username,
				'pswd': this.opts.password ?? this.opts.api_token,
			},
		});

		setInterval(() => {
			if (this.socket.readyState === 1) {
				this.send({
					'cmd': 'ping',
					'val': '',
				});
			}
		}, 30000);

		this.socket.onclose = () => this.emit('socket_close');

		this.socket.onmessage = (event) => {
			const packet = JSON.parse(event.data);

			if (!packet) return;

			this.emit('packet', packet);
			this.emit(`cmd-${packet.cmd}`, packet);

			if (packet.listener) {
				this.emit(`listener-${packet.listener}`, packet);
			}
		};

		this.socket.onerror = (err) => this.emit('socket_error', err);

		this.on('cmd-direct', (packet) => {
			if (
				!packet.val || typeof packet.val !== 'object' ||
				Array.isArray(packet.val)
			) return;

			if (packet.val.p) {
				const event = 'payload' in packet.val
					? 'edit_message'
					: 'create_message';
				const api = (packet.val.payload ?? packet.val) as unknown as api_post;
				const p = new post({
					api_token: this.opts.api_token,
					api_url: this.opts.api_url,
					api_username: this.opts.username,
					data: api,
				});
				this.emit(event, p);
			}

			if (packet.val.mode === 'delete_post') {
				this.emit('delete_message', { id: packet.val.id as string });
			}
		});

		this.on('cmd-direct', (packet) => {
			const val = packet.val as Record<string, unknown>;

			if (val.mode !== 'auth') return;

			const auth_event = val.payload as socket_auth_event;

			this.opts.api_token = auth_event.token;

			this.emit('auth', auth_event);
		});
	}

	static async connect(opts: socket_connect_opts): Promise<socket> {
		const ws = new WebSocket(
			opts.socket_url,
		);
		await new Promise((resolve) => ws.onopen = resolve);
		return new socket(ws, opts);
	}

	/** send a packet over the socket */
	send(packet: socket_packet) {
		this.socket.send(JSON.stringify(packet));
	}

	/** reconnect to the socket */
	async reconnect() {
		this.disconnect();
		const socket = new WebSocket(
			this.opts.socket_url,
		);
		await new Promise((resolve) => socket.onopen = resolve);
		this.socket = socket;
		this.setup();
	}

	/** disconnect from the socket */
	disconnect() {
		this.socket.close();
	}
}
