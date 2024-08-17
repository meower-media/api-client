import { EventEmitter } from 'jsr:@denosaurs/event@2.0.2';
import { type api_post, post } from '../interfaces/post.ts';
import type { api_user, user_relationship_status } from '../interfaces/user.ts';
import type { api_chat, chat } from '../interfaces/chat.ts';

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
	| { [key: string]: socket_value };

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
		tyoe: user_relationship_status;
	}[];
	/** chats */
	chats: api_chat[];
}

/** deleted message information from the socket */
export interface socket_delete_message {
	/** the post id */
	post_id: string;
	/** the chat id */
	chat_id: string;
}

/** post reaction information from the socket */
export interface socket_post_reaction {
	/** the chat id */
	chat_id: string;
	/** the post id */
	post_id: string;
	/** the emoji */
	emoji: string;
	/** the username */
	username: string;
}

/** relationship update information from the socket */
export interface socket_relationship_update {
	/** the username */
	username: string;
	/** the type */
	type: user_relationship_status;
	/** time changed at in unix seconds */
	updated_at: number;
}

/** user ban states */
export enum user_ban_state {
	/** not banned */
	none = 'none',
	/** temporary restriction */
	temporary_restriction = 'temp_restriction',
	/** permanent restriction */
	permanent_restriction = 'perm_restriction',
	/** temporary ban */
	temporary_ban = 'temp_ban',
	/** permanent ban */
	permanent_ban = 'perm_ban',
}

/** user ban information */
export interface api_user_ban {
	/** status */
	status: user_ban_state;
	/** new user permissions bitfield */
	permissions: number;
	/** time the ban expires in unix seconds */
	expires: number;
	/** reason for the ban */
	reason: string;
}

/** updated profile information from the socket */
export interface socket_profile_update {
	/** profile image number */
	pfp_data?: number;
	/** avatar id */
	avatar?: string;
	/** profile color */
	avatar_color?: string;
	/** bio */
	quote?: string;
}

/** updated config information from the socket */
export interface socket_config_update extends socket_profile_update {
	/** whether your inbox in unread */
	unread_inbox?: boolean;
	/** the theme used */
	theme?: string;
	/** light/dark mode */
	mode?: boolean;
	/** the layout to use */
	layout?: string;
	/** whether sound effects are enabled */
	sfx?: boolean;
	/** whether background music is enabled */
	bgm?: boolean;
	/** which bgm to use */
	bgm_song?: number;
	/** whether debugging is enabled */
	debug?: boolean;
	/** whether to hide blocked users */
	hide_blocked_users?: boolean;
	/** favorite chats */
	favorited_chats?: string[];
	/** permissions bitfield */
	permissions?: number;
	/** ban information */
	ban?: api_user_ban;
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
	create_post: [post];
	delete_message: [socket_delete_message];
	delete_post: [socket_delete_message];
	edit_message: [post];
	edit_post: [post];
	inbox_message: [post];
	ulist: [string[]];
	create_chat: [chat];
	update_chat: [chat];
	delete_chat: [{ chat_id: string }];
	post_reaction_add: [socket_post_reaction];
	post_reaction_remove: [socket_post_reaction];
	update_relationship: [socket_relationship_update];
	update_config: [socket_config_update];
	update_profile: [socket_profile_update];
	typing: [{ chat_id: string; username: string }];
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

		this.on('cmd-post', (packet) => {
			try {
				const api = packet.val as unknown as api_post;
				const p = new post({
					api_token: this.opts.api_token,
					api_url: this.opts.api_url,
					data: api,
				});
				this.emit('create_message', p);
				this.emit('create_post', p);
			} catch {
				// ignore
			}
		});

		this.on('cmd-update_post', (packet) => {
			try {
				const api = packet.val as unknown as api_post;
				const p = new post({
					api_token: this.opts.api_token,
					api_url: this.opts.api_url,
					data: api,
				});
				this.emit('edit_message', p);
				this.emit('edit_post', p);
			} catch {
				// ignore
			}
		});

		this.on('cmd-delete_post', (packet) => {
			const p = packet.val as { post_id: string; chat_id: string };
			this.emit('delete_message', p);
			this.emit('delete_post', p);
		});

		this.on('cmd-typing', (packet) => {
			this.emit('typing', packet.val as { chat_id: string; username: string });
		});

		this.on('cmd-ulist', (packet) => {
			this.ulist = (packet.val as string).split(';');
		});

		this.on('cmd-auth', (packet) => {
			this.emit('auth', packet.val as unknown as socket_auth_event);

			this.opts.api_token = (packet.val as unknown as socket_auth_event).token;
		});
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
