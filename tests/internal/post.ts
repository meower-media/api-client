import { assertEquals } from 'jsr:@std/assert@0.226.0';
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
	if (api_post.bridged && post.bridged) {
		post_is_api_post(post.bridged, api_post.bridged);
	} else {
		assertEquals(post.bridged, undefined);
	}
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
};

export const bridged_post: api_post = {
	...regular_post,
	bridged: regular_post,
};
