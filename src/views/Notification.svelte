<script>
  import { get } from "svelte/store";
  import { currentPage, currentUser, currentAnime } from "../store.js";

  import { getNotifications } from "../api.js";

  let notifications = [];

  let user = get(currentUser);

  let anilistIDs = [];
  for (let anilistID in user.media) {
    anilistIDs.push(anilistID);
  }

  getNotifications(anilistIDs.join(","), result => (notifications = result));

  function openAnime(anime) {
    currentAnime.set(anime);
    currentPage.set("detail");
  }

  function calcTimeFromDate(date) {
    let d = new Date(date);
    let now = new Date();
    let diff = now - d;

    diff /= 1000 * 60 * 60 * 24;

    let days = Math.round(diff);

    if (days === 0) {
      return "Today";
    }

    return days + (days > 1 ? " days" : " day") + " ago";
  }
</script>

<style>
  main {
    margin: 24px auto;
    max-width: 1200px;
  }

  main {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .notification {
    display: flex;
    align-items: center;
    width: calc(50% - 16px);
    background-color: white;
    border-radius: 8px;
    font-size: 14px;
    color: #748899;
  }

  .notification {
    margin-bottom: 16px;
  }

  .notification .picture {
    height: 100%;
    width: 64px;
    background-repeat: no-repeat;
    background-position: center;
    background-size: cover;
    border-top-left-radius: 8px;
    border-bottom-left-radius: 8px;
  }

  .notification .info {
    display: flex;
    flex-direction: column;
  }

  .notification .anime {
    padding-top: 16px;
    margin-left: 16px;
    color: rgb(173, 109, 211);
    font-weight: 600;
  }

  .notification .anime:hover {
    cursor: pointer;
  }

  .notification .message {
    margin-left: 16px;
    margin-top: 8px;
    margin-bottom: 16px;
  }

  .notification .time {
    align-self: flex-start;
    margin-left: auto;
    padding: 16px;
    font-size: 12px;
  }

  @media screen and (max-width: 1200px) {
    main {
      padding: 0 14px;
      min-height: 550px;
    }

    .notification {
      width: 100%;
      max-height: 100px;
    }
  }
</style>

<main>
  {#if notifications.length === 0}
    <div class="notification" style="width:100%">
      <div
        class="picture"
        style="background-image:('/images/aniapi_icon.png')" />
      <div class="info">
        <span class="anime">All is ok</span>
        <span class="message">
          Seems like you have no new notifications to read
        </span>
      </div>
      <span class="time" />
    </div>
  {/if}
  {#each notifications as n}
    <div class="notification">
      <div
        class="picture"
        style="background-image:url('{n.anime.picture ? n.anime.picture : ''}')" />
      <div class="info">
        <span class="anime" on:click={() => openAnime(n.anime)}>
          {n.anime.title}
        </span>
        <span class="message">
          {@html n.message}
        </span>
      </div>
      <span class="time">{calcTimeFromDate(n.on)}</span>
    </div>
  {/each}
</main>
