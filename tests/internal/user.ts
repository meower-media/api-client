import { assertEquals } from './deps.ts';
import type { api_user, user } from '../../src/interfaces/user.ts';

export function user_is_api_user(user: user, api_user: api_user) {
	assertEquals(user.id, api_user._id);
	assertEquals(user.username, api_user.lower_username);
	assertEquals(user.avatar, api_user.avatar);
	assertEquals(user.banned, api_user.banned);
	assertEquals(user.created, api_user.created);
	assertEquals(user.flags, api_user.flags);
	assertEquals(user.last_seen, api_user.last_seen);
	assertEquals(user.lvl, api_user.lvl);
	assertEquals(user.permissions, api_user.permissions);
	assertEquals(user.pfp_data, api_user.pfp_data);
	assertEquals(user.profile_color, api_user.avatar_color);
	assertEquals(user.quote, api_user.quote);
	assertEquals(user.uuid, api_user.uuid);
}

export const regular_user: api_user = {
	_id: 'test',
	avatar: 'test',
	avatar_color: 'test',
	banned: false,
	created: 0,
	flags: 0,
	last_seen: 0,
	lower_username: 'test',
	lvl: 0,
	permissions: 0,
	pfp_data: 0,
	quote: 'test',
	uuid: 'test',
};
