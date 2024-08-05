/** api attachment */
export interface api_attachment {
	/** filename */
	filename: string;
	/** file type */
	mime: string;
	/** file size */
	size: number;
	/** image height */
	height?: number;
	/** image width */
	width?: number;
	/** file id */
	id: string;
}

/** uploads class construction options */
export interface uploads_opts {
	/** base url for uploads */
	base_url: string;
	/** an api token */
	token: string;
}

/** upload types */
export enum upload_types {
	attachment = 'attachments',
	icon = 'icons',
	sticker = 'stickers',
	emoji = 'emojis',
}

/** check if object is an api reaction */
export function is_api_attachment(obj: unknown): obj is api_attachment {
	if (obj === null || typeof obj !== 'object') return false;
	if (!('count' in obj) || typeof obj.count !== 'number') return false;
	if (!('emoji' in obj) || typeof obj.emoji !== 'string') return false;
	if (!('user_reacted' in obj) || typeof obj.user_reacted !== 'boolean') {
		return false;
	}

	return true;
}

/** access to meower uploads */
export class uploads {
	private opts: uploads_opts;

	constructor(opts: uploads_opts) {
		this.opts = opts;
	}

	/** upload a file */
	async upload_file(
		file: Blob,
		upload_type: upload_types = upload_types.attachment,
	): Promise<api_attachment> {
		const form = new FormData();
		form.append('file', file);
		const res = await fetch(`${this.opts.base_url}/${upload_type}`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${this.opts.token}`,
			},
			body: form,
		});
		if (!res.ok) {
			throw new Error('failed to upload file', {
				cause: await res.json(),
			});
		}
		return await res.json();
	}

	/** get the url for an attachment */
	get_file_url(
		file: api_attachment,
		upload_type: upload_types = upload_types.attachment,
	): string {
		return `${this.opts.base_url}/${upload_type}/${file.id}/${file.filename}`;
	}
}
