<script>
  import Button from "../components/Button.svelte";
  import SelectBox from "../components/SelectBox.svelte";
  import NumericBox from "../components/NumericBox.svelte";
  import Tabs from "../components/Tabs.svelte";
  import Matchings from "../components/Matchings.svelte";
  import Episodes from "../components/Episodes.svelte";
  import AddMatching from "../components/AddMatching.svelte";

  import { get } from "svelte/store";
  import {
    currentAnime,
    currentUser,
    animeStatuses,
    animeEpisodesFrom
  } from "../store.js";

  import {
    getAnimeInfos,
    formatStatus,
    statusIntToString,
    getSeason,
    updateAnimeStatus,
    updateAnimeProgress
  } from "../anilist.js";

  const anime = get(currentAnime);
  let user = get(currentUser);
  let loaded = false;
  let episodes = [];
  let episodeNumber;
  let status;
  let progress;
  let sideInfos = [
    { title: "Status", items: [anime.type, statusIntToString(anime.status)] },
    {
      title: "Released",
      items: [
        getSeason(new Date(anime.airing_from)),
        new Date(anime.airing_from).getFullYear()
      ]
    },
    { title: "Genres", items: anime.genres },
    { title: "Titles", items: anime.other_titles }
  ];
  let selectedFrom = "dreamsub";
  let reloadMatching = true;
  let newMatching = false;

  $: {
    if (user) {
      let media = user.media[anime.anilist_id];

      if (media) {
        status = formatStatus(media.status);
        progress = media.progress;
      } else {
        status = "None";
        progress = undefined;
      }
    } else {
      status = "None";
      progress = undefined;
    }
  }

  $: {
    if (!loaded) {
      getAnimeInfos(anime.anilist_id).then(data => {
        anime.description = data.description;
        anime.banner = data.banner;
        anime.trailer = data.trailer;

        episodes = new Array(data.episodes);
        episodes[0] = true;
        onEpisodeTabChange(1);

        loaded = true;
      });
    }
  }

  function onStatusChange(value) {
    status = value;
    updateAnimeStatus(anime.anilist_id, value);
  }

  function onProgressChange(value) {
    updateAnimeProgress(anime.anilist_id, value);
  }

  function onEpisodeTabChange(value) {
    episodeNumber = value;
  }

  function onMatchingTabChange(value) {
    selectedFrom = value;
  }

  function onAddMatching() {
    if (newMatching) {
      newMatching = false;
    }
    newMatching = true;
  }

  function onMatchingAdded() {
    reloadMatching = false;
    reloadMatching = true;
  }

  function share() {
    let url = new URL(window.location.href);
    url = url.origin + "?anime=" + anime.id;

    window.prompt("Copy to clipboard: Ctlr+C, Enter", url);
  }
</script>

<style>
  .banner {
    position: relative;
    padding: 32px 0 24px 0;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    box-shadow: 0 1px 6px 1px rgba(0, 0, 0, 0.4) inset;
  }

  .banner .overlay {
    position: absolute;
    top: 0;
    height: 100%;
    width: 100%;
    background: rgba(0, 0, 0, 0.75);
    z-index: 0;
  }

  .banner .score {
    position: absolute;
    top: 24px;
    right: calc((100% - 1200px) / 2);
    display: flex;
    align-items: center;
    color: white;
    font-size: 32px;
    z-index: 1;
  }

  .fa-heart {
    margin-right: 8px;
    color: #8d46b8;
    font-size: 20px;
  }

  .head {
    display: flex;
    align-items: flex-end;
    margin: 0 auto;
    max-width: 1200px;
  }

  .head .picture {
    width: 185px;
    height: 265px;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    border-radius: 5px;
    box-shadow: 0 0 29px rgba(49, 54, 68, 0.25);
    z-index: 1;
  }

  .head .title {
    margin-left: 32px;
    color: white;
    font-size: 32px;
    font-weight: 300;
    z-index: 1;
  }

  .head .links {
    margin-left: auto;
    z-index: 1;
  }

  .head .links a {
    cursor: pointer;
  }

  .head .links img {
    margin-left: 8px;
    height: 32px;
    width: auto;
    border-radius: 50%;
    box-shadow: 0 0 29px rgba(49, 54, 68, 0.25);
  }

  main {
    display: flex;
    align-items: flex-start;
    margin: 32px auto;
    max-width: 1200px;
    color: #748899;
    font-size: 14px;
  }

  .side {
    margin-right: 24px;
    max-width: 240px;
    background-color: white;
    border-radius: 8px;
  }

  .side .trailer {
    width: 100%;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
  }

  .side .content {
    padding: 16px;
  }

  .side .content .info:not(:first-child) {
    margin-top: 16px;
  }

  .side .content .info .subTitle {
    font-weight: 500;
  }

  .side .content .info .chip {
    display: inline-block;
    margin-top: 4px;
    margin-right: 4px;
    padding: 3px 8px;
    max-width: 100%;
    border-radius: 3px;
    background-color: rgb(173, 109, 211);
    color: white;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    box-sizing: border-box;
  }

  .main {
    flex: 1;
    max-width: calc(100% - 240px);
  }

  .main .desc {
    text-align: justify;
  }

  .main .episodes {
    margin-top: 24px;
  }

  @media screen and (max-width: 1200px) {
    main {
      flex-direction: column;
    }

    .head,
    main {
      padding: 0 14px;
    }

    .banner .score {
      right: 14px;
    }

    .side {
      margin-bottom: 24px;
      width: 100%;
      max-width: 100%;
    }

    .main {
      max-width: 100%;
    }

    .head {
      flex-direction: column;
    }

    .head .picture {
      margin-right: auto;
      margin-bottom: 32px;
    }

    .head .title {
      margin-left: 0;
    }
  }
</style>

<div class="detail">
  <div
    class="banner"
    style="background-image:url({anime.banner ? anime.banner : ''})">
    <div class="overlay" />
    <div class="score">
      <i class="fas fa-heart fa-fw" />
      {anime.score}
    </div>
    <div class="head">
      <div class="picture" style="background-image:url({anime.picture})" />
      <div class="title">{anime.title}</div>
      <div class="links">
        <a on:click={share}>
          <img src="/images/detail_share_icon.png" alt="Share Icon" />
        </a>
        <a href="https://myanimelist.net/anime/{anime.mal_id}" target="_blank">
          <img src="/images/mal_logo.jpg" alt="MyAnimeList Logo" />
        </a>
        {#if anime.anilist_id}
          <a href="https://anilist.co/anime/{anime.anilist_id}" target="_blank">
            <img src="/images/anilist_logo.png" alt="AniList Logo" />
          </a>
        {/if}
      </div>
    </div>
  </div>
  <main>
    <div class="side">
      {#if anime.trailer}
        <iframe
          src={anime.trailer}
          title="Trailer"
          class="trailer"
          frameborder="0"
          allowfullscreen />
      {/if}
      <div class="content">
        {#if user}
          <SelectBox
            items={get(animeStatuses)}
            selected={status}
            callback={onStatusChange} />
          {#if status !== 'None'}
            <NumericBox
              hint="Progress"
              css="margin-top:8px"
              positive={true}
              number={progress}
              callback={onProgressChange} />
          {/if}
        {/if}
        {#each sideInfos as info}
          <div class="info">
            <div class="subTitle">{info.title}</div>
            {#each info.items as item}
              <span class="chip" title={item}>{item}</span>
            {/each}
          </div>
        {/each}
      </div>
    </div>
    <div class="main">
      {#if anime.description}
        <div class="desc">
          {@html anime.description}
        </div>
      {/if}
      <div class="episodes">
        <div style="display:flex;align-items:center;">
          <Button
            icon="plus"
            tooltip="Add a matching"
            circle={true}
            tooltipDirection="right"
            css="margin-right:8px"
            callback={onAddMatching} />
          <Tabs
            items={get(animeEpisodesFrom)}
            callback={onMatchingTabChange}
            css="flex:1" />
        </div>
        <Matchings
          animeId={anime.id}
          from={selectedFrom}
          reload={reloadMatching} />
        <Tabs items={episodes} callback={onEpisodeTabChange} counter={true} />
        <Episodes number={episodeNumber} animeId={anime.id} />
      </div>
    </div>
  </main>
</div>
<AddMatching active={newMatching} callback={onMatchingAdded} />
