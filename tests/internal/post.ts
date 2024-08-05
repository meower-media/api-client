import { assertEquals } from './deps.ts';
import {
	type api_post,
	type post,
	post_type,
} from '../../src/interfaces/post.ts';

export function post_is_api_post(post: post, api_post: api_post) {
	assertEquals(post.id, api_post._id);
	assertEquals(post.deleted, api_post.isDeleted);
	assertEquals(post.content, api_post.p);
	assertEquals(post.pinned, api_post.pinned);
	assertEquals(post.id, api_post.post_id);
	assertEquals(post.chat_id, api_post.post_origin);
	assertEquals(post.timestamp, api_post.t.e);
	assertEquals(post.type, api_post.type);
	assertEquals(post.username, api_post.u);
	assertEquals(post.reactions, api_post.reactions);
}

export const regular_post: api_post = {
	_id: 'test',
	attachments: [],
	isDeleted: false,
	p: 'test',
	pinned: false,
	post_id: 'test',
	post_origin: 'test',
	t: {
		e: 0,
	},
	type: post_type.normal,
	u: 'test',
	reactions: [],
	reply_to: [],
	stickers: [],
};
