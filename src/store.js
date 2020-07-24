import {
  writable,
  readable
} from "svelte/store";

export const currentUser = writable(undefined);

export const currentPage = writable('home');
export const currentAnime = writable(undefined);
export const currentVideo = writable(undefined);

export const API = readable({
  url: process.env.API_URL,
  socket: process.env.API_SOCKET,
  endpoints: {
    anime: 'anime',
    episode: 'episode',
    matching: 'matching',
    notification: 'notification'
  }
})

export const animeGenres = readable([
  'Action',
  'Adventure',
  'Cars',
  'Comedy',
  'Dementia',
  'Demons',
  'Drama',
  'Ecchi',
  'Fantasy',
  'Game',
  'Harem',
  'Historical',
  'Horror',
  'Josei',
  'Kids',
  'Magic',
  'Martial Arts',
  'Mecha',
  'Military',
  'Music',
  'Mystery',
  'Parody',
  'Police',
  'Psychological',
  'Romance',
  'Samurai',
  'School',
  'Sci - Fi',
  'Seinen',
  'Shoujo',
  'Shoujo Ai',
  'Shounen',
  'Shounen Ai',
  'Slice of Life',
  'Space',
  'Sports',
  'Super Power',
  'Supernatural',
  'Thriller',
  'Vampire',
  'Yaoi',
  'Yuri'
])

export const animeTypes = readable([
  'TV',
  'OVA',
  'Movie',
  'Special',
  'ONA'
])

export const animeSorts = readable([
  'Airing Date',
  'Score',
  'Title'
])

export const animeStatuses = readable([
  'None',
  'Watching',
  'Paused',
  'Completed',
  'Planning',
  'Dropped'
])

export const animeEpisodesFrom = readable([
  'dreamsub',
  'gogoanime'
])

export const animeEpisodesFromTemplate = readable({
  'dreamsub': 'https://dreamsub.stream/anime/anime-name',
  'gogoanime': 'https://gogoanime.pro/anime/anime_name-anime_id'
})