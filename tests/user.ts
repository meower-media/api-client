import {
	is_api_user,
	user,
	user_relationship_status,
} from '../src/interfaces/user.ts';
import {
	assertEquals,
	assertRejects,
	assertThrows,
	mockFetch,
} from './internal/deps.ts';
import { post_is_api_post } from './internal/post.ts';
import { regular_user, user_is_api_user } from './internal/user.ts';
import { regular_post } from './internal/post.ts';

Deno.test('api_user validation', async (i) => {
	await i.step('number (invalid)', () => {
		assertEquals(is_api_user(1), false);
	});

	await i.step('string (invalid)', () => {
		assertEquals(is_api_user('test'), false);
	});

	await i.step('empty object (invalid)', () => {
		assertEquals(is_api_user({}), false);
	});

	await i.step('user (valid)', () => {
		assertEquals(is_api_user(regular_user), true);
	});
});

Deno.test('user construction', async (i) => {
	await i.step('throw error if data is not a user', () => {
		assertThrows(() => {
			new user({
				api_url: 'http://localhost:8000',
				api_token: 'test',
				// @ts-ignore: intentionally passing an empty object
				data: {},
			});
		});
	});

	await i.step('construct valid user', () => {
		const u = new user({
			api_url: 'http://localhost:8000',
			api_token: 'test',
			api_username: 'test',
			data: regular_user,
		});

		user_is_api_user(u, regular_user);
	});
});

Deno.test('user reporting', async (i) => {
	const u = new user({
		api_url: 'http://localhost:8000',
		api_token: 'test',
		api_username: 'test',
		data: regular_user,
	});

	await i.step('report (successful)', async () => {
		mockFetch('http://localhost:8000/users/:id/report', {
			status: 200,
		});

		await u.report({ comment: 'test', reason: 'test' });
	});

	await i.step('report (failed)', async () => {
		mockFetch('http://localhost:8000/users/:id/report', {
			status: 400,
		});

		await assertRejects(async () => {
			await u.report({ comment: 'test', reason: 'test' });
		});
	});
});

Deno.test('user relationship', async (i) => {
	const u = new user({
		api_url: 'http://localhost:8000',
		api_token: 'test',
		api_username: 'test',
		data: regular_user,
	});

	await i.step('change_relationship (successful)', async () => {
		mockFetch('http://localhost:8000/users/:id/relationship', {
			status: 200,
		});

		await u.change_relationship(user_relationship_status.blocked);
	});

	await i.step('change_relationship (failed)', async () => {
		mockFetch('http://localhost:8000/users/:id/relationship', {
			status: 404,
			body: JSON.stringify({ error: true, type: 'notFound' }),
		});

		await assertRejects(async () => {
			await u.change_relationship(user_relationship_status.blocked);
		});
	});
});

Deno.test('user posts', async (i) => {
	const u = new user({
		api_url: 'http://localhost:8000',
		api_token: 'test',
		api_username: 'test',
		data: regular_user,
	});

	await i.step('get_posts (successful)', async () => {
		mockFetch('http://localhost:8000/users/:id/posts', {
			status: 200,
			body: JSON.stringify({ autoget: [regular_post] }),
		});

		const posts = await u.get_posts();

		assertEquals(posts.length, 1);

		post_is_api_post(posts[0], regular_post);
	});

	await i.step('get_posts (failed)', async () => {
		mockFetch('http://localhost:8000/users/:id/posts', {
			status: 404,
			body: JSON.stringify({ error: true, type: 'notFound' }),
		});

		await assertRejects(async () => {
			await u.get_posts();
		});
	});
});
