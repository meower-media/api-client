import { type api_attachment, is_api_attachment } from '../api/uploads.ts';
import type { message_send_opts } from './chat.ts';

/** types of posts */
export enum post_type {
	/** normal posts (home) */
	normal = 1,
	/** inbox posts */
	inbox = 2,
}

/** raw post data */
export interface api_post {
	/** attachments */
	attachments?: api_attachment[];
	/** is the post pinned */
	pinned: boolean;
	/** post id */
	_id: string;
	/** is the post deleted */
	isDeleted: boolean;
	/** post content */
	p: string;
	/** post id */
	post_id: string;
	/** post origin */
	post_origin: string;
	/** timestamp */
	t: {
		/** unix epoch seconds */
		e: number;
	};
	/** post type */
	type: post_type;
	/** username */
	u: string;
	/** stickers */
	stickers: api_attachment[];
	/** reply to */
	reply_to: api_post[];
	/** reactions */
	reactions: {
		count: number;
		emoji: string;
		user_reacted: boolean;
	}[];
}

/** post creation options */
export interface post_construction_opts {
	/** api url */
	api_url: string;
	/** api token */
	api_token: string;
	/** post data */
	data: api_post;
}

/** post report options */
export interface post_report_options {
	/** the reason */
	reason: string;
	/** additional comments */
	comment: string;
}

/** post update options */
export interface post_update_options {
	/** new content */
	content?: string;
	/** new attachments */
	attachments?: string[];
	/** nonce */
	nonce?: string;
}

/** check if a value is a post */
export function is_api_post(obj: unknown): obj is api_post {
	if (obj === null || typeof obj !== 'object') return false;
	if ('attachments' in obj && !Array.isArray(obj.attachments)) return false;
	if (!('pinned' in obj) || typeof obj.pinned !== 'boolean') return false;
	if (('bridged' in obj) && typeof obj.bridged !== 'object') return false;
	if (!('_id' in obj) || typeof obj._id !== 'string') return false;
	if (!('isDeleted' in obj) || typeof obj.isDeleted !== 'boolean') {
		return false;
	}
	if (!('p' in obj) || typeof obj.p !== 'string') return false;
	if (!('post_id' in obj) || typeof obj.post_id !== 'string') return false;
	if (!('post_origin' in obj) || typeof obj.post_origin !== 'string') {
		return false;
	}
	if (!('t' in obj) || typeof obj.t !== 'object' || obj.t === null) {
		return false;
	}
	if (!('e' in obj.t) || typeof obj.t.e !== 'number') return false;
	if (!('type' in obj) || typeof obj.type !== 'number') return false;
	if (!('u' in obj) || typeof obj.u !== 'string') return false;
	if (!('stickers' in obj) || !Array.isArray(obj.stickers)) return false;
	for (const i of obj.stickers) {
		if (!is_api_attachment(i)) return false;
	}
	if (!('reply_to' in obj) || !Array.isArray(obj.reply_to)) return false;
	for (const i of obj.reply_to) {
		if (!is_api_post(i)) return false;
	}
	if (!('reactions' in obj) || !Array.isArray(obj.reactions)) return false;
	for (const i of obj.reactions) {
		if (!is_api_attachment(i)) return false;
	}

	return true;
}

/** a post on meower */
export class post {
	private api_url: string;
	private api_token: string;
	/** raw api data */
	raw: api_post;
	/** attachments */
	attachments!: api_attachment[];
	/** post id */
	id!: string;
	/** whether the post in pinned */
	pinned!: boolean;
	/** is the post deleted */
	deleted!: boolean;
	/** post content */
	content!: string;
	/** post origin chat */
	chat_id!: string;
	/** timestamp in epoch seconds */
	timestamp!: number;
	/** post type */
	type!: post_type;
	/** username */
	username!: string;
	/** reply to */
	replies!: post[];
	/** stickers */
	stickers!: api_attachment[];
	/** reactions */
	reactions!: api_post['reactions'];

	constructor(opts: post_construction_opts) {
		this.api_url = opts.api_url;
		this.api_token = opts.api_token;
		this.raw = opts.data;
		if (!is_api_post(this.raw)) {
			throw new Error('data is not a post', { cause: this.raw });
		}
		this.assign_data();
	}

	private assign_data() {
		this.attachments = this.raw.attachments || [];
		this.id = this.raw._id;
		this.pinned = this.raw.pinned;
		this.deleted = this.raw.isDeleted;
		this.content = this.raw.p;
		this.chat_id = this.raw.post_origin;
		this.timestamp = this.raw.t.e;
		this.type = this.raw.type;
		this.username = this.raw.u;
		this.replies = this.raw.reply_to.map((i) =>
			new post({
				api_token: this.api_token,
				api_url: this.api_url,
				data: i,
			})
		);
		this.stickers = this.raw.stickers;
		this.reactions = this.raw.reactions;
	}

	/** delete the post */
	async delete() {
		const resp = await fetch(`${this.api_url}/posts/?id=${this.id}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				'token': this.api_token,
			},
		});

		if (!resp.ok) {
			throw new Error('failed to delete post', {
				cause: await resp.json(),
			});
		}
	}

	/** pin the post */
	async pin() {
		const resp = await fetch(`${this.api_url}/posts/${this.id}/pin`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'token': this.api_token,
			},
		});

		const data = await resp.json();

		if (!resp.ok || data.error) {
			throw new Error('failed to pin post', {
				cause: data,
			});
		}

		this.raw = data;
		this.assign_data();
	}

	/** unpin the post */
	async unpin() {
		const resp = await fetch(`${this.api_url}/posts/${this.id}/pin`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				'token': this.api_token,
			},
		});

		const data = await resp.json();

		if (!resp.ok || data.error) {
			throw new Error('failed to unpin post', {
				cause: data,
			});
		}

		this.raw = data;
		this.assign_data();
	}

	/** report the post */
	async report(opts: post_report_options) {
		const resp = await fetch(`${this.api_url}/posts/${this.id}/report`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'token': this.api_token,
			},
			body: JSON.stringify(opts),
		});

		if (!resp.ok) {
			throw new Error('failed to report post', {
				cause: await resp.json(),
			});
		}
	}

	/** edit the post */
	async update(opts: post_update_options) {
		const resp = await fetch(`${this.api_url}/posts/?id=${this.id}`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
				'token': this.api_token,
			},
			body: JSON.stringify({
				attachments: opts.attachments ?? this.attachments,
				content: opts.content ?? this.content,
				nonce: opts.nonce ?? undefined,
			}),
		});

		const data = await resp.json();

		if (!resp.ok || data.error) {
			throw new Error('failed to update post', {
				cause: data,
			});
		}

		this.raw = data;
		this.assign_data();
	}

	/** reply to the post */
	async reply(content: message_send_opts): Promise<post> {
		let url = `${this.api_url}/posts/${this.chat_id}`;

		if (this.chat_id === 'home') url = `${this.api_url}/home`;

		const resp = await (await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'token': this.api_token,
			},
			body: JSON.stringify({
				...content,
				reply_to: [...content.reply_to ?? [], this.id],
			}),
		})).json();

		if (resp.error) {
			throw new Error('failed to send reply', { cause: resp });
		}

		return new post({
			api_token: this.api_token,
			api_url: this.api_url,
			data: resp,
		});
	}

	/** react to the post */
	async react(emoji: string) {
		const url = `${this.api_url}/posts/${this.id}/reactions`;

		const resp = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'token': this.api_token,
			},
			body: JSON.stringify({
				emoji,
			}),
		});

		if (!resp.ok) {
			throw new Error('failed to react to post', {
				cause: await resp.json(),
			});
		}

		const found_emoji_index = this.reactions.findIndex((i) =>
			i.emoji === emoji
		);
		const found_raw_emoji_index = this.raw.reactions.findIndex((i) =>
			i.emoji === emoji
		);

		if (found_emoji_index === -1) {
			const new_reaction = {
				emoji,
				count: 1,
				user_reacted: true,
			};

			this.reactions.push(new_reaction);
			this.raw.reactions.push(new_reaction);
		} else {
			this.reactions[found_emoji_index].count++;
			this.raw.reactions[found_raw_emoji_index].count++;
		}
	}

	/** remove reaction */
	async remove_reaction(emoji: string) {
		const url = `${this.api_url}/posts/${this.id}/reactions`;

		const resp = await fetch(url, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				'token': this.api_token,
			},
			body: JSON.stringify({
				emoji,
			}),
		});

		if (!resp.ok) {
			throw new Error('failed to remove reaction from post', {
				cause: await resp.json(),
			});
		}

		const found_emoji_index = this.reactions.findIndex((i) =>
			i.emoji === emoji
		);
		const found_raw_emoji_index = this.raw.reactions.findIndex((i) =>
			i.emoji === emoji
		);

		if (found_emoji_index !== -1) {
			this.reactions[found_emoji_index].count--;
			this.raw.reactions[found_raw_emoji_index].count--;
		}
	}
}
