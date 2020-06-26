import {
  get
} from "svelte/store";
import {
  API
} from "./store.js";
const api = get(API);

export async function getAnime(id, callback) {
  let url = api.url + api.endpoints.anime + '/' + id;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  let data = await res.json();
  callback(data);
}

export async function getAnimes(title, genres, type, sort, desc, page, callback) {
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

  params.push('page=' + page);

  url += params.join('&');

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  let data = await res.json();
  callback(data);
}

export async function getEpisodes(animeId, number, page, callback) {
  let url = api.url + api.endpoints.episode + '?anime_id=' + animeId + '&number=' + number + '&sort=number&page=' + page;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  let data = await res.json();
  callback(data);
}

export async function getMatchings(animeId, from, callback) {
  let url = api.url + api.endpoints.matching + '?anime_id=' + animeId + '&from=' + from + '&sort=ratio&desc=1';

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  let data = await res.json();
  callback(data);
}

export async function increaseMatchingVote(animeId, from, title, callback) {
  let url = api.url + api.endpoints.matching;

  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      anime_id: animeId,
      from: from,
      title: title
    })
  });

  callback();
}

export async function addCustomMatching(animeId, from, siteUrl, episodes, callback) {
  let url = api.url + api.endpoints.matching;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      anime_id: animeId,
      from: from,
      episodes: episodes,
      url: siteUrl
    })
  });

  let data = await res.json();
  callback(data);
}

export async function getNotifications(anilistIds, callback) {
  let url = api.url + api.endpoints.notification + '?anilist_id=' + anilistIds;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  let data = await res.json();
  callback(data);
}

export async function getScraper(callback) {
  let url = api.url + api.endpoints.scraper;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  let data = await res.json();
  callback(data);
}

export async function getQueue(callback) {
  let url = api.url + api.endpoints.queue;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  let data = await res.json();
  callback(data);
}