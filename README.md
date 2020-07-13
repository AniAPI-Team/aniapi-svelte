# AniAPI Svelte
AniAPI Svelte is a Web App that allows users to watch a collection of **anime**'s episodes available thanks to AniAPI Golang .

It also allows synchronization with [AniList](https://anilist.co/home) lists and animes' status.

## Requirements
* NodeJS
* Svelte ^3.0.0

## Environment variables
| Name | Description | Required |
|------|-------------|----------|
| `API_URL` | Web API endpoint | Yes |
| `API_SOCKET` | Web API socket endpoint | Yes |
| `ANILIST_CLIENTID` | AniList application ID | Yes |