import { chat, is_api_chat } from '../src/interfaces/chat.ts';
import { chat_is_api_chat, regular_chat } from './internal/chat.ts';
import {
	assertEquals,
	assertRejects,
	assertThrows,
	mockFetch,
} from './internal/deps.ts';
import { post_is_api_post, regular_post } from './internal/post.ts';

Deno.test('api_chat validation', async (i) => {
	await i.step('number (invalid)', () => {
		assertEquals(is_api_chat(1), false);
	});

	await i.step('string (invalid)', () => {
		assertEquals(is_api_chat('test'), false);
	});

	await i.step('empty object (invalid)', () => {
		assertEquals(is_api_chat({}), false);
	});

	await i.step('chat (valid)', () => {
		assertEquals(is_api_chat(regular_chat), true);
	});
});

Deno.test('chat construction', async (i) => {
	await i.step('throw error if data is not a chat', () => {
		assertThrows(() => {
			new chat({
				api_url: 'http://localhost:8000',
				api_token: 'test',
				// @ts-ignore: intentionally passing an empty object
				data: {},
			});
		});
	});

	await i.step('construct valid chat', () => {
		const c = new chat({
			api_url: 'http://localhost:8000',
			api_token: 'test',
			data: regular_chat,
		});

		chat_is_api_chat(c, regular_chat);
	});
});

Deno.test('chat leaving', async (i) => {
	const c = new chat({
		api_url: 'http://localhost:8000',
		api_token: 'test',
		data: regular_chat,
	});

	await i.step('leave chat (successful)', async () => {
		mockFetch('http://localhost:8000/chats/:id', {
			status: 200,
		});

		await c.leave();
	});

	await i.step('leave chat (failed)', async () => {
		mockFetch('http://localhost:8000/chats/:id', {
			status: 404,
			body: JSON.stringify({
				error: true,
				type: 'notFound',
			}),
		});

		await assertRejects(async () => {
			await c.leave();
		});
	});
});

Deno.test('chat updating', async (i) => {
	const c = new chat({
		api_url: 'http://localhost:8000',
		api_token: 'test',
		data: regular_chat,
	});

	await i.step('update chat (successful)', async () => {
		mockFetch('http://localhost:8000/chats/:id', {
			status: 200,
			body: JSON.stringify({
				...regular_chat,
				nickname: 'test2',
			}),
		});

		await c.update({
			nickname: 'test2',
		});

		assertEquals(c.nickname, 'test2');
	});

	await i.step('update chat (failed)', async () => {
		mockFetch('http://localhost:8000/chats/:id', {
			status: 404,
			body: JSON.stringify({
				error: true,
				type: 'notFound',
			}),
		});

		await assertRejects(async () => {
			await c.update({});
		});
	});
});

Deno.test('chat members', async (i) => {
	const c = new chat({
		api_url: 'http://localhost:8000',
		api_token: 'test',
		data: regular_chat,
	});

	await i.step('add member (successful)', async () => {
		mockFetch('http://localhost:8000/chats/:id/members/:user', {
			status: 200,
		});

		await c.add_member('test');
	});

	await i.step('add member (failed)', async () => {
		mockFetch('http://localhost:8000/chats/:id/members/:user', {
			status: 404,
			body: JSON.stringify({
				error: true,
				type: 'notFound',
			}),
		});

		await assertRejects(async () => {
			await c.add_member('test');
		});
	});

	await i.step('remove member (successful)', async () => {
		mockFetch('http://localhost:8000/chats/:id/members/:user', {
			status: 200,
		});

		await c.remove_member('test');
	});

	await i.step('remove member (failed)', async () => {
		mockFetch('http://localhost:8000/chats/:id/members/:user', {
			status: 404,
			body: JSON.stringify({
				error: true,
				type: 'notFound',
			}),
		});

		await assertRejects(async () => {
			await c.remove_member('test');
		});
	});

	await i.step('transfer ownership (successful)', async () => {
		mockFetch('http://localhost:8000/chats/:id/members/:user/transfer', {
			status: 200,
			body: JSON.stringify({
				...regular_chat,
				owner: 'test2',
			}),
		});

		await c.transfer_ownership('test2');

		assertEquals(c.owner, 'test2');
	});

	await i.step('transfer ownership (failed)', async () => {
		mockFetch('http://localhost:8000/chats/:id/members/:user/transfer', {
			status: 404,
			body: JSON.stringify({
				error: true,
				type: 'notFound',
			}),
		});

		await assertRejects(async () => {
			await c.transfer_ownership('test2');
		});
	});
});

Deno.test('chat messages', async (i) => {
	const c = new chat({
		api_url: 'http://localhost:8000',
		api_token: 'test',
		data: regular_chat,
	});

	await i.step('send typing (successful)', async () => {
		mockFetch('http://localhost:8000/chats/:id/typing', {
			status: 200,
		});

		await c.send_typing_indicator();
	});

	await i.step('send typing (failed)', async () => {
		mockFetch('http://localhost:8000/chats/:id/typing', {
			status: 404,
			body: JSON.stringify({
				error: true,
				type: 'notFound',
			}),
		});

		await assertRejects(async () => {
			await c.send_typing_indicator();
		});
	});

	await i.step('send message (successful)', async () => {
		mockFetch('http://localhost:8000/posts/:id', {
			status: 200,
			body: JSON.stringify({
				...regular_post,
				content: 'test',
			}),
		});

		const p = await c.send_message('test');

		post_is_api_post(p, regular_post);
	});

	await i.step('send message (failed)', async () => {
		mockFetch('http://localhost:8000/posts/:id', {
			status: 404,
			body: JSON.stringify({
				error: true,
				type: 'notFound',
			}),
		});

		await assertRejects(async () => {
			await c.send_message('test');
		});
	});

	await i.step('get messages (successful)', async () => {
		mockFetch('http://localhost:8000/posts/test?autoget=1&page=1', {
			status: 200,
			body: JSON.stringify({
				autoget: [regular_post],
			}),
		});

		const posts = await c.get_messages();

		assertEquals(posts.length, 1);
		post_is_api_post(posts[0], regular_post);
	});

	await i.step('get messages (failed)', async () => {
		mockFetch('http://localhost:8000/posts/test?autoget=1&page=1', {
			status: 404,
			body: JSON.stringify({
				error: true,
				type: 'notFound',
			}),
		});

		await assertRejects(async () => {
			await c.get_messages();
		});
	});
});

Deno.test('chat search', async (i) => {
	const c = new chat({
		api_url: 'http://localhost:8000',
		api_token: 'test',
		data: regular_chat,
	});

	const h = new chat({
		api_url: 'http://localhost:8000',
		api_token: 'test',
		data: {
			...regular_chat,
			_id: 'home',
		},
	});

	await i.step('search not in home (failed)', async () => {
		await assertRejects(async () => {
			await c.search('test');
		});
	});

	await i.step('search in home (successful)', async () => {
		mockFetch('http://localhost:8000/search/home/?autoget&q=test&page=1', {
			status: 200,
			body: JSON.stringify({
				autoget: [regular_post],
			}),
		});

		const posts = await h.search('test');

		assertEquals(posts.length, 1);
		post_is_api_post(posts[0], regular_post);
	});

	await i.step('search in home (failed)', async () => {
		mockFetch('http://localhost:8000/search/home/?autoget&q=test&page=1', {
			status: 404,
			body: JSON.stringify({
				error: true,
				type: 'notFound',
			}),
		});

		await assertRejects(async () => {
			await h.search('test');
		});
	});
});
