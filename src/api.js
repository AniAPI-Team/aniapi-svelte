import {
  get
} from "svelte/store";
import {
  API
} from "./store.js";
const api = get(API);

export async function getAnimes(title, genres, type, sort, desc, callback) {
  let url = api.url + api.endpoints.anime + '?';

  let params = [];

  if (title !== '') {
    params.push('title=' + encodeURI(title));
  }

  if (genres.length > 0) {
    params.push('genres=' + genres.join(','));
  }

  if (type !== '') {
    params.push('type=' + type);
  }

  if (sort !== '') {
    switch (sort) {
      case 'Airing Date':
        sort = 'airing_start';
        break;
      case 'Score':
        sort = 'score';
        break;
      case 'Title':
        sort = 'main_title';
        break;
    }

    params.push('sort=' + sort);
  }

  if (desc) {
    params.push('desc=1');
  }

  url += params.join('&');
  console.log(url);

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  let data = await res.json();
  callback(data);
}