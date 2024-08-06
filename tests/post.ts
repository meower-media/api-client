import { is_api_post, post } from '../src/interfaces/post.ts';
import {
	assertEquals,
	assertRejects,
	assertThrows,
	mockFetch,
} from './internal/deps.ts';
import { post_is_api_post, regular_post } from './internal/post.ts';

Deno.test('api_post validation', async (i) => {
	await i.step('number (invalid)', () => {
		assertEquals(is_api_post(1), false);
	});

	await i.step('string (invalid)', () => {
		assertEquals(is_api_post('test'), false);
	});

	await i.step('empty object (invalid)', () => {
		assertEquals(is_api_post({}), false);
	});

	await i.step('post (valid)', () => {
		assertEquals(is_api_post(regular_post), true);
	});
});

Deno.test('post construction', async (i) => {
	await i.step('throw error if data is not a post', () => {
		assertThrows(() => {
			new post({
				api_url: 'http://localhost:8000',
				api_token: 'test',
				// @ts-ignore: intentionally passing an empty object
				data: {},
			});
		});
	});

	await i.step('construct valid post', () => {
		const p = new post({
			api_url: 'http://localhost:8000',
			api_token: 'test',

			data: regular_post,
		});

		post_is_api_post(p, regular_post);
	});
});

Deno.test('post pinning', async (i) => {
	const p = new post({
		api_url: 'http://localhost:8000',
		api_token: 'test',

		data: regular_post,
	});

	await i.step('pin (successful)', async () => {
		mockFetch('http://localhost:8000/posts/:id/pin', {
			body: JSON.stringify({
				...regular_post,
				pinned: true,
			}),
		});

		await p.pin();

		assertEquals(p.pinned, true);
	});

	await i.step('unpin (successful)', async () => {
		mockFetch('http://localhost:8000/posts/:id/pin', {
			body: JSON.stringify({
				...regular_post,
				pinned: false,
			}),
		});

		await p.unpin();

		assertEquals(p.pinned, false);
	});

	await i.step('pin (failed)', async () => {
		mockFetch('http://localhost:8000/posts/:id/pin', {
			status: 404,
			body: JSON.stringify({
				error: true,
				type: 'notFound',
			}),
		});

		await assertRejects(async () => {
			await p.pin();
		});
	});

	await i.step('unpin (failed)', async () => {
		mockFetch('http://localhost:8000/posts/:id/pin', {
			status: 404,
			body: JSON.stringify({
				error: true,
				type: 'notFound',
			}),
		});

		await assertRejects(async () => {
			await p.unpin();
		});
	});
});

Deno.test('post deletion', async (i) => {
	const p = new post({
		api_url: 'http://localhost:8000',
		api_token: 'test',

		data: regular_post,
	});

	await i.step('delete (successful)', async () => {
		mockFetch('http://localhost:8000/posts/?id=:id', {
			status: 200,
		});

		// this will fail if the call fails

		await p.delete();
	});

	await i.step('delete (failed)', async () => {
		mockFetch('http://localhost:8000/posts/?id=:id', {
			status: 404,
			body: JSON.stringify({
				error: true,
				type: 'notFound',
			}),
		});

		await assertRejects(async () => {
			await p.delete();
		});
	});
});

Deno.test('post reporting', async (i) => {
	const p = new post({
		api_url: 'http://localhost:8000',
		api_token: 'test',

		data: regular_post,
	});

	await i.step('report (successful)', async () => {
		mockFetch('http://localhost:8000/posts/:id/report', {
			status: 200,
		});

		// this will fail if the call fails

		await p.report({ reason: 'test', comment: 'test' });
	});

	await i.step('report (failed)', async () => {
		mockFetch('http://localhost:8000/posts/:id/report', {
			status: 404,
			body: JSON.stringify({
				error: true,
				type: 'notFound',
			}),
		});

		await assertRejects(async () => {
			await p.report({ reason: 'test', comment: 'test' });
		});
	});
});

Deno.test('post editing', async (i) => {
	const p = new post({
		api_url: 'http://localhost:8000',
		api_token: 'test',

		data: regular_post,
	});

	await i.step('edit (successful)', async () => {
		mockFetch('http://localhost:8000/posts/?id=:id', {
			body: JSON.stringify({
				...regular_post,
				p: 'new content',
			}),
		});

		await p.update({
			content: 'new content',
		});

		assertEquals(p.content, 'new content');
	});

	await i.step('edit (failed)', async () => {
		mockFetch('http://localhost:8000/posts/?id=:id', {
			status: 404,
			body: JSON.stringify({
				error: true,
				type: 'notFound',
			}),
		});

		await assertRejects(async () => {
			await p.update({
				content: 'new content',
			});
		});
	});
});

Deno.test('post reply', async (i) => {
	const p = new post({
		api_url: 'http://localhost:8000',
		api_token: 'test',

		data: regular_post,
	});

	await i.step('reply (successful)', async () => {
		mockFetch('http://localhost:8000/posts/:id', {
			body: JSON.stringify(regular_post),
		});

		const post = await p.reply({
			content: 'test',
		});

		post_is_api_post(post, regular_post);
	});

	await i.step('reply (failed)', async () => {
		mockFetch('http://localhost:8000/posts/:id', {
			status: 404,
			body: JSON.stringify({
				error: true,
				type: 'notFound',
			}),
		});

		await assertRejects(async () => {
			await p.reply({
				content: 'test',
			});
		});
	});
});
