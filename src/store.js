import {
  writable,
  readable
} from "svelte/store";

export const currentPage = writable('home');
export const currentAnime = writable(undefined);

export const API = readable({
  url: process.env.API_URL,
  endpoints: {
    anime: 'anime',
    episode: 'episode'
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