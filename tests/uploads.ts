import { uploads } from '../src/api/uploads.ts';
import { assertEquals, assertRejects, mockFetch } from './internal/deps.ts';

Deno.test('attachment file url', () => {
	const u = new uploads({
		base_url: 'http://localhost:8080',
		token: 'test',
	});

	assertEquals(
		u.get_file_url({
			filename: 'test.txt',
			id: '1234',
			mime: 'text/plain',
			size: 1234,
		}),
		'http://localhost:8080/attachments/1234/test.txt',
	);
});

Deno.test('attachment upload', async (i) => {
	const u = new uploads({
		base_url: 'http://localhost:8080',
		token: 'test',
	});

	await i.step('successful', async () => {
		mockFetch('http://localhost:8080/attachments', {
			body: JSON.stringify({
				filename: 'string',
				mime: 'string',
				size: 1,
				id: 'string',
			}),
		});

		const file = new Blob(['test'], { type: 'text/plain' });

		const res = await u.upload_file(file);

		assertEquals(res, {
			filename: 'string',
			mime: 'string',
			size: 1,
			id: 'string',
		});
	});

	await i.step('failure', async () => {
		mockFetch('http://localhost:8080/attachment', {
			status: 500,
			body: JSON.stringify({
				error: true,
				message: 'notFound',
			}),
		});

		const file = new Blob(['test'], { type: 'text/plain' });

		await assertRejects(async () => {
			await u.upload_file(file);
		});
	});
});
