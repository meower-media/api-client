import {
	type api_chat,
	type chat,
	chat_type,
} from '../../src/interfaces/chat.ts';
import { assertEquals } from './deps.ts';

export function chat_is_api_chat(chat: chat, api_chat: api_chat) {
	assertEquals(chat.id, api_chat._id);
	assertEquals(chat.allow_pinning, api_chat.allow_pinning);
	assertEquals(chat.created, api_chat.created);
	assertEquals(chat.deleted, api_chat.deleted);
	assertEquals(chat.icon, api_chat.icon);
	assertEquals(chat.icon_color, api_chat.icon_color);
	assertEquals(chat.last_active, api_chat.last_active);
	assertEquals(chat.members, api_chat.members);
	assertEquals(chat.nickname, api_chat.nickname);
	assertEquals(chat.owner, api_chat.owner);
	assertEquals(chat.type, api_chat.type);
}

export const regular_chat: api_chat = {
	'_id': 'test',
	'allow_pinning': false,
	'created': 0,
	'deleted': false,
	'icon': '',
	'icon_color': '000000',
	'last_active': 0,
	'members': ['test'],
	'nickname': 'test',
	'owner': 'test',
	'type': chat_type.chat,
};
