import { rest_api } from './rest.ts';
import { socket } from './socket.ts';
import { uploads } from './uploads.ts';

/** options used by the client to login */
export interface client_login_options {
	/** username */
	username: string;
	/** password or api token */
	password: string;
	/** api url */
	api_url: string;
	/** socket url */
	socket_url: string;
	/** uploads url */
	uploads_url: string;
}

/** options used by the client to signup */
export interface client_signup_options extends client_login_options {
	/** captcha response key */
	captcha: string;
}

/** a meower api client written in typescript */
export class client {
	/** access to the rest api */
	api: rest_api;
	/** access to websocket events */
	socket: socket;
	/** access to uploads */
	uploads: uploads;

	constructor(api: rest_api, socket: socket, uploads: uploads) {
		this.api = api;
		this.socket = socket;
		this.uploads = uploads;

		socket.on("auth", (data) => {
			for (const chat of data.chats) {
				api._chat_cache.set(chat._id, chat);
			}
		})
	}

	/** signup for an account and login */
	static async signup(
		opts: client_signup_options,
	): Promise<client> {
		const rest = await rest_api.signup(
			opts.username,
			opts.password,
			opts.captcha,
			opts.api_url,
		);

		const ws = await socket.connect({ ...opts, api_token: rest.api_token });

		const u = new uploads({
			base_url: opts.uploads_url,
			token: rest.api_token,
		});

		return new client(rest, ws, u);
	}

	/** login to an account */
	static async login(opts: client_login_options): Promise<client> {
		const rest = await rest_api.login(
			opts.username,
			opts.password,
			opts.api_url,
		);

		const ws = await socket.connect({ ...opts, api_token: rest.api_token });

		const token = await new Promise((resolve) => {
			ws.on('auth', (data) => {
				resolve(data.token);
			});
		}) as string;

		rest.api_token = token;

		const u = new uploads({
			base_url: opts.uploads_url,
			token,
		});

		return new client(rest, ws, u);
	}
}
