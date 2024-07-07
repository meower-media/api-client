import { rest_api } from '../../src/api/rest.ts';
import { regular_user } from './user.ts';

export const client = new rest_api({
	token: 'test',
	api_url: 'http://localhost:8000',
	account: regular_user,
});
