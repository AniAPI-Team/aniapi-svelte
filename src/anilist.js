import jwt_decode from 'jwt-decode';
import {
  get
} from "svelte/store";
import {
  currentUser
} from './store';

export async function getUser(jwt) {
  let token = jwt_decode(jwt);

  const res = await anilistQuery(jwt, `
    query {
      User(id: ${parseInt(token.sub)}) {
        id
        name
        avatar {
          medium
        }
        siteUrl
      }
    }
  `);

  let user = res.data.User;
  user.avatar = user.avatar.medium;
  user.token = jwt;
  user.locale = (navigator.language || navigator.userLanguage).substr(0, 2);
  user.lists = await getUserLists(user);

  localStorage.setItem('current_user', JSON.stringify(user));
  window.location.href = "./";
}

export async function getUserLists(user) {
  const res = await anilistQuery(user.token, `
    query {
      MediaListCollection(userId: ${user.id}, type: ANIME) {
        lists {
          entries {
            id
            mediaId
            progress
          }
          isCustomList
          status
        }
      }
    }
  `)

  user.media = {};

  for (let i = 0; i < res.data.MediaListCollection.lists.length; i++) {
    let list = res.data.MediaListCollection.lists[i];

    if (list.isCustomList) {
      continue;
    }

    for (let j = 0; j < list.entries.length; j++) {
      user.media[list.entries[j].mediaId] = {
        id: list.entries[j].id,
        status: list.status,
        progress: list.entries[j].progress
      };
    }
  }

  currentUser.set(user);
}

export async function getAnimeInfos(animeId) {
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query: `
        query {
          Media(id: ${animeId}) {
            description
            bannerImage
            trailer {
              id
            }
            episodes
            airingSchedule {
              nodes {
                episode
              }
            } 
          }
        }
      `
    })
  });

  let data = (await res.json()).data.Media;

  return {
    description: data.description,
    banner: data.bannerImage,
    trailer: data.trailer ? `http://www.youtube.com/embed/${data.trailer.id}` : '',
    episodes: data.episodes ? data.episodes : data.airingSchedule.nodes[data.airingSchedule.nodes.length - 1].episode
  }
}

export async function updateAnimeStatus(animeId, status) {
  let user = get(currentUser);
  status = statusToAnilist(status);

  if (!status) {
    let id = user.media[animeId].id;

    if (id) {
      await anilistQuery(user.token, `
        mutation {
          DeleteMediaListEntry(id: ${id}) {
            deleted
          }
        }
      `);
    }
  } else {
    await anilistQuery(user.token, `
      mutation {
        SaveMediaListEntry(mediaId: ${animeId}, status: ${status}) {
          id
          status
        }
      }
    `);
  }

  user.lists = await getUserLists(user);
  currentUser.set(user);
}

export async function updateAnimeProgress(animeId, progress) {
  let user = get(currentUser);

  await anilistQuery(user.token, `
    mutation {
      SaveMediaListEntry(mediaId: ${animeId}, progress: ${progress}) {
        id
        progress
      }
    }
  `);

  user.lists = await getUserLists(user);
  currentUser.set(user);
}

function statusToAnilist(status) {
  switch (status) {
    case "Watching":
      return "CURRENT";
    case "Paused":
      return "PAUSED";
    case "Completed":
      return "COMPLETED";
    case "Planning":
      return "PLANNING";
    case "Dropped":
      return "DROPPED";
  }

  return undefined;
}

export function formatStatus(status) {
  switch (status) {
    case "CURRENT":
      return "Watching";
    case "PAUSED":
      return "Paused";
    case "COMPLETED":
      return "Completed";
    case "PLANNING":
      return "Planning";
    case "DROPPED":
      return "Dropped";
  }

  return undefined;
}

export function statusIntToString(status) {
  switch (status) {
    case 0:
      return "Completed";
    case 1:
      return "Airing";
    case 2:
      return "Coming soon";
  }

  return "Unknown";
}

export function getSeason(date) {
  switch (date.getMonth()) {
    case 0:
    case 1:
    case 2:
      return "Winter";
    case 3:
    case 4:
    case 5:
      return "Spring";
    case 6:
    case 7:
    case 8:
      return "Summer";
    case 9:
    case 10:
    case 11:
      return "Fall";
  }

  return "Unknown";
}

async function anilistQuery(token, query) {
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query: query
    })
  });

  return await res.json();
}