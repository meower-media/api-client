import { EventEmitter } from 'jsr:@denosaurs/event@2.0.2';
import { type api_post, post } from '../interfaces/post.ts';

/** options used to connect to the meower socket */
export interface socket_connect_opts {
	/** the api url */
	api_url: string;
	/** the api token */
	api_token: string;
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

/** access to the meower socket */
export class socket extends EventEmitter<{
	socket_open: [];
	socket_close: [];
	socket_error: [Event | ErrorEvent];
	packet: [socket_packet];
	[key: `cmd-${string}`]: [socket_packet];
	[key: `listener-${string}`]: [socket_packet];
	post: [post];
}> {
	private socket: WebSocket;
	private opts: socket_connect_opts;

	private constructor(socket: WebSocket, opts: socket_connect_opts) {
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
				'pswd': this.opts.api_token
			}
		})

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
			if (packet.cmd) return;

			const p = new post({
				api_token: this.opts.api_token,
				api_url: this.opts.api_url,
				data: packet.val as unknown as api_post,
			});

			this.emit('post', p);
		});
	}

	static async connect(opts: socket_connect_opts): Promise<socket> {
		const ws =
			new (globalThis.WebSocket ? WebSocket : ((await import('ws')).default))(
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
		const socket =
			new (globalThis.WebSocket ? WebSocket : ((await import('ws')).default))(
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
