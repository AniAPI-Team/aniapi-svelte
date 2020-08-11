<script>
  import { currentVideo } from "../store.js";
  import { getEpisodes } from "../api.js";

  export let animeId;
  export let number;

  let page = 1;
  let foundEpisodes = [];

  $: {
    if (number) {
      getEpisodes(animeId, number, page, results => {
        foundEpisodes = results;
      });
    }
  }

  function watch(from, value) {
    if (from === "dreamsub") {
      currentVideo.set(
        "http://localhost:8080/api/v1/proxy?url=" +
          encodeURIComponent(value) +
          "&referer=" +
          encodeURIComponent("https://dreamsub.stream")
      );
    } else {
      currentVideo.set(value);
    }
  }
</script>

<style>
  .episodes {
    display: grid;
    grid-gap: 20px;
    grid-template-columns: repeat(4, 1fr);
    margin-top: 12px;
  }

  .episode {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    padding: 8px;
    background-color: white;
    border-radius: 8px;
  }

  .episode:hover {
    cursor: pointer;
  }

  .episode:hover .overlay {
    visibility: visible;
    animation-name: show;
    animation-duration: 0.3s;
  }

  .episode .overlay {
    display: flex;
    justify-content: center;
    align-items: center;
    visibility: collapse;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #8d46b8;
    border-radius: 8px;
    opacity: 0.8;
    color: white;
    z-index: 9;
    animation-name: hide;
    animation-duration: 0.3s;
  }

  @keyframes show {
    from {
      opacity: 0;
    }
    to {
      opacity: 0.8;
    }
  }

  @keyframes hide {
    from {
      opacity: 0.8;
      visibility: visible;
    }
    to {
      opacity: 0;
      visibility: collapse;
    }
  }

  .fa-play {
    margin-left: 4px;
  }

  .episode .region {
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }

  .region .flag-icon {
    z-index: 1;
  }

  .region .from {
    margin-left: 6px;
    font-size: 12px;
    text-transform: uppercase;
  }

  .episode .title {
    display: block;
    margin-top: 8px;
    font-weight: 500;
  }

  @media screen and (max-width: 1200px) {
    .episodes {
      grid-template-columns: repeat(1, 1fr);
    }
  }
</style>

<div class="episodes">
  {#if foundEpisodes.length === 0}
    <div>No episodes found</div>
  {/if}
  {#each foundEpisodes as episode}
    <div class="episode" on:click={() => watch(episode.from, episode.source)}>
      <div class="overlay">
        Watch
        <i class="fas fa-play fa-fw" />
      </div>
      <div class="region">
        <span class="flag-icon flag-icon-{episode.region}" />
        <span class="from">{episode.from}</span>
      </div>
      <span class="title">
        {episode.title === '' ? 'No title provided' : episode.title}
      </span>
    </div>
  {/each}
</div>
