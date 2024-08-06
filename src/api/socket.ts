import { EventEmitter } from 'jsr:@denosaurs/event@2.0.2';
import { type api_post, post } from '../interfaces/post.ts';
import type { api_user, user_relationship_status } from '../interfaces/user.ts';
import type { api_chat } from '../interfaces/chat.ts';

/** options used to connect to the meower socket */
export interface socket_connect_opts {
	/** the api url */
	api_url: string;
	/** the api token */
	api_token: string;
	/** the socket url */
	socket_url: string;
}

/** socket value types */
export type socket_value =
	| string
	| { [key: string]: socket_value }

/** a packet sent over the socket */
export interface socket_packet {
	/** the packet command */
	cmd: string;
	/** the packet value */
	val: socket_value;
	/** listener id */
	listener?: string;
}

/** auth information from the socket */
export interface socket_auth_event {
	/** api user */
	account: api_user;
	/** api token */
	token: string;
	/** username */
	username: string;
	/** relationships */
	relationships: {
		username: string;
		tyoe: user_relationship_status
	}[];
	/** chats */
	chats: api_chat[];
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
	delete_message: [{ post_id: string, chat_id: string }];
	typing: [{ chat_id: string, username: string }];
	auth: [socket_auth_event];
}> {
	private socket: WebSocket;
	private opts: socket_connect_opts;
	ulist: string[] = [];

	/** create a socket instance from a given websocket connection */
	constructor(socket: WebSocket, opts: socket_connect_opts) {
		super();
		this.socket = socket;
		this.opts = opts;
		this.setup();
	}

	private setup() {
		this.emit('socket_open');

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

		this.on('cmd-post', packet => {
			try {
				const api = packet.val as unknown as api_post;
				const p = new post({
					api_token: this.opts.api_token,
					api_url: this.opts.api_url,
					data: api,
				});
				this.emit('create_message', p);
			} catch {
				// ignore
			}
		})

		this.on('cmd-update_post', packet => {
			try {
				const api = packet.val as unknown as api_post;
				const p = new post({
					api_token: this.opts.api_token,
					api_url: this.opts.api_url,
					data: api,
				});
				this.emit('edit_message', p);
			} catch {
				// ignore
			}
		})

		this.on('cmd-delete_post', packet => {
			this.emit('delete_message', packet.val as { post_id: string, chat_id: string });
		})

		this.on('cmd-typing', packet => {
			this.emit('typing', packet.val as { chat_id: string, username: string });
		})

		this.on('cmd-ulist', packet => {
			this.ulist = (packet.val as string).split(';')
		})

		this.on('cmd-auth', packet => {
			this.emit('auth', packet.val as unknown as socket_auth_event);

			this.opts.api_token = (packet.val as unknown as socket_auth_event).token;
		})
	}

	static async connect(opts: socket_connect_opts): Promise<socket> {
		const ws = new WebSocket(
			`${opts.socket_url}/?v=1&token=${opts.api_token}`,
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
			`${this.opts.socket_url}/?v=1&token=${this.opts.api_token}`,
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
