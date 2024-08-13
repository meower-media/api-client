![Project logo](https://raw.githubusercontent.com/meower-media-co/api-client/main/banner.png)

# api-client

A Meower API Client written in Typescript.

## installation

get the package from your favorite source of packages:

- @meower/api-client on jsr
- esm.sh/jsr/@meower/api-client in browsers

## example

see the [docs](https://docs.meower.org/api-client/) for more

```ts
import { socket } from '@meower/api-client';

const events = await socket.login({
	api_url: 'https://api.meower.org',
	api_token: 'your.token.here',
	socket_url: 'wss://server.meower.org',
});

events.on('auth', ({ username }) => {
	console.log(`logged in as ${username}`);
});
```
