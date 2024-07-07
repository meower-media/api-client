import { rest_api } from '../src/api/rest.ts';
import { chat_is_api_chat, regular_chat } from './internal/chat.ts';
import { assertEquals, assertRejects, mockFetch } from './internal/deps.ts';
import { client } from './internal/rest.ts';
import { post_is_api_post, regular_post } from './internal/post.ts';
import { regular_user, user_is_api_user } from './internal/user.ts';

Deno.test('login and signup', async (i) => {
	await i.step('login (successful)', async () => {
		mockFetch('http://localhost:8000/auth/login', {
			status: 200,
			body: JSON.stringify({
				token: 'test',
				account: regular_user,
			}),
		});

		const r = await rest_api.login('test', 'test', 'http://localhost:8000');

		assertEquals(r.api_token, 'test');
	});

	await i.step('login (failed)', async () => {
		mockFetch('http://localhost:8000/auth/login', {
			status: 404,
			body: JSON.stringify({
				error: true,
				type: 'notFound',
			}),
		});

		await assertRejects(async () => {
			await rest_api.login('test', 'test', 'http://localhost:8000');
		});
	});

	await i.step('signup (successful)', async () => {
		mockFetch('http://localhost:8000/signup', {
			status: 200,
			body: JSON.stringify({
				token: 'test',
				account: regular_user,
			}),
		});

		const r = await rest_api.signup(
			'test',
			'test',
			'test',
			'http://localhost:8000',
		);

		assertEquals(r.api_token, 'test');
	});

	await i.step('signup (failed)', async () => {
		mockFetch('http://localhost:8000/signup', {
			status: 404,
			body: JSON.stringify({
				error: true,
				type: 'notFound',
			}),
		});

		await assertRejects(async () => {
			await rest_api.signup(
				'test',
				'test',
				'test',
				'http://localhost:8000',
			);
		});
	});
});

Deno.test('api statistics', async (i) => {
	await i.step('get statistics (successful)', async () => {
		mockFetch('http://localhost:8000/statistics', {
			status: 200,
			body: JSON.stringify({
				users: 1,
				chats: 1,
				posts: 1,
			}),
		});

		const stats = await client.get_statistics();

		assertEquals(stats.users, 1);
		assertEquals(stats.chats, 1);
		assertEquals(stats.posts, 1);
	});

	await i.step('get statistics (failed)', async () => {
		mockFetch('http://localhost:8000/statistics', {
			status: 404,
			body: JSON.stringify({
				error: true,
				type: 'notFound',
			}),
		});

		await assertRejects(async () => {
			await client.get_statistics();
		});
	});
});

Deno.test('api chats', async (i) => {
	await i.step('get chats (successful)', async () => {
		mockFetch('http://localhost:8000/chats', {
			status: 200,
			body: JSON.stringify({
				autoget: [regular_chat],
			}),
		});

		const chats = await client.get_chats();

		assertEquals(chats.length, 3); // we add home and livechat
		chat_is_api_chat(chats[0], regular_chat);
	});

	await i.step('get chats (failed)', async () => {
		mockFetch('http://localhost:8000/chats', {
			status: 404,
			body: JSON.stringify({
				error: true,
				type: 'notFound',
			}),
		});

		await assertRejects(async () => {
			await client.get_chats();
		});
	});

	await i.step('get single chat (successful)', async () => {
		mockFetch('http://localhost:8000/chats/test', {
			status: 200,
			body: JSON.stringify(regular_chat),
		});

		chat_is_api_chat(await client.get_chat('test'), regular_chat);
	});

	await i.step('get single chat (failed)', async () => {
        // @ts-ignore: clear chat cache
        client.chat_cache.set('test', undefined)

		mockFetch('http://localhost:8000/chats/test', {
			status: 404,
			body: JSON.stringify({
				error: true,
				type: 'notFound',
			}),
		});

		await assertRejects(async () => {
			await client.get_chat('test');
		});
	});

	await i.step('create chat (successful)', async () => {
		mockFetch('http://localhost:8000/chats', {
			status: 200,
			body: JSON.stringify(regular_chat),
		});

		chat_is_api_chat(await client.create_chat(regular_chat), regular_chat);
	});

	await i.step('create chat (failed)', async () => {
		mockFetch('http://localhost:8000/chats', {
			status: 404,
			body: JSON.stringify({
				error: true,
				type: 'notFound',
			}),
		});

		await assertRejects(async () => {
			await client.create_chat(regular_chat);
		});
	});
});

Deno.test('api get post', async (i) => {
	await i.step('get post (successful)', async () => {
		mockFetch('http://localhost:8000/posts?id=test', {
			status: 200,
			body: JSON.stringify(regular_post),
		});

		post_is_api_post(await client.get_post('test'), regular_post);
	});

	await i.step('get post (failed)', async () => {
        // @ts-ignore: clear post cache
        client.post_cache.set('test', undefined)

		mockFetch('http://localhost:8000/posts?id=test', {
			status: 404,
			body: JSON.stringify({
				error: true,
				type: 'notFound',
			}),
		});

		await assertRejects(async () => {
			await client.get_post('test');
		});
	});
});

Deno.test('api users', async (i) => {
	await i.step('get user (successful)', async () => {
		mockFetch('http://localhost:8000/users/test', {
			status: 200,
			body: JSON.stringify(regular_user),
		});

		user_is_api_user(await client.get_user('test'), regular_user);
	});

	await i.step('get user (failed)', async () => {
        // @ts-ignore: clear user cache
        client.user_cache.set('test', undefined)

		mockFetch('http://localhost:8000/users/test', {
			status: 404,
			body: JSON.stringify({
				error: true,
				type: 'notFound',
			}),
		});

		await assertRejects(async () => {
			await client.get_user('test');
		});
	});

	await i.step('search users (successful)', async () => {
		mockFetch('http://localhost:8000/search/users/?autoget&q=test&page=1', {
			status: 200,
			body: JSON.stringify({ autoget: [regular_user] }),
		});

		const r = await client.search_users('test');

		assertEquals(r.length, 1);
		user_is_api_user(r[0], regular_user);
	});

	await i.step('search users (failed)', async () => {
		mockFetch('http://localhost:8000/search/users/?autoget&q=test&page=1', {
			status: 404,
			body: JSON.stringify({
				error: true,
				type: 'notFound',
			}),
		});

		await assertRejects(async () => {
			await client.search_users('test');
		});
	});
});
