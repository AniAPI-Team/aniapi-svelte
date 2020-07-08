<script>
  import { get } from "svelte/store";
  import { currentPage, currentAnime, currentUser } from "../store.js";
  import { formatStatus } from "../anilist.js";

  export let data;

  let status;
  let progress;

  $: {
    let user = get(currentUser);

    if (user) {
      let media = user.media[data.anilist_id];

      if (media) {
        status = formatStatus(media.status);
        progress = media.progress;
      } else {
        status = undefined;
        progress = undefined;
      }
    } else {
      status = undefined;
      progress = undefined;
    }
  }

  function selectAnime(anime) {
    currentAnime.set(anime);
    currentPage.set("detail");
  }
</script>

<style>
  .card {
    width: 185px;
    max-height: 265px;
    border: 3px solid white;
    border-radius: 8px;
    box-shadow: 0 2px 6px 0px rgba(0, 0, 0, 0.2);
  }

  .card.completed {
    border-color: rgb(123, 213, 85);
  }

  .card.watching {
    border-color: rgb(61, 180, 242);
  }

  .card.paused {
    border-color: rgb(250, 122, 122);
  }

  .card.dropped {
    border-color: rgb(232, 93, 117);
  }

  .card.planning {
    border-color: rgb(247, 154, 99);
  }

  .card .picture {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    height: 265px;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    border-radius: 5px;
    transition: 0.3s;
  }

  .score,
  .title {
    color: white;
    z-index: 1;
  }

  .card:hover .picture {
    cursor: pointer;
    transform: scale(1.05);
    transition: 0.3s;
  }

  .card:hover .overlay:after {
    background-color: rgba(0, 0, 0, 0.6);
    transition: 0.3s;
  }

  .card:hover .status {
    visibility: visible;
    opacity: 1;
    transition: 0.3s;
  }

  .overlay {
    position: absolute;
    height: 100%;
    width: 100%;
    background: rgba(0, 0, 0, 0.75);
    background: linear-gradient(
      0deg,
      rgba(0, 0, 0, 0.75) 0%,
      rgba(0, 0, 0, 0) 60%,
      rgba(0, 0, 0, 0.6) 90%,
      rgba(0, 0, 0, 0.6) 100%
    );
    border-radius: 5px;
    transition: 0.3s;
    z-index: 0;
  }

  .overlay:after {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    content: "";
    background-color: rgba(0, 0, 0, 0);
    border-radius: 5px;
    transition: 0.3s;
  }

  .status {
    visibility: hidden;
    position: absolute;
    top: 8px;
    left: 8px;
    width: 10px;
    height: 10px;
    border-radius: 5px;
    opacity: 0;
    transition: 0.3s;
  }

  .status.completed {
    background-color: rgb(123, 213, 85);
  }

  .status.watching {
    background-color: rgb(61, 180, 242);
  }

  .status.paused {
    background-color: rgb(250, 122, 122);
  }

  .status.dropped {
    background-color: rgb(232, 93, 117);
  }

  .status.planning {
    background-color: rgb(247, 154, 99);
  }

  .progress {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    color: white;
    font-size: 14px;
  }

  .score {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 8px 8px 4px 8px;
    font-size: 16px;
    font-weight: 600;
  }

  .title {
    padding: 4px 8px 8px 8px;
    border-bottom-left-radius: 5px;
    border-bottom-right-radius: 5px;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .fa-heart {
    margin-right: 4px;
    font-size: 10px;
    color: rgb(173, 109, 211);
  }

  .fa-clipboard-check {
    margin-right: 4px;
    font-size: 12px;
    color: rgb(173, 109, 211);
  }

  @media screen and (max-width: 1200px) {
    .card {
      margin-bottom: 16px;
      width: 145px;
      max-height: 225px;
    }

    .card .picture {
      height: 225px;
    }
  }
</style>

<div
  class="card {status ? status.toLowerCase() : ''}"
  on:click={() => selectAnime(data)}>
  <div class="picture" style="background-image:url({data.picture})">
    <div class="overlay" />
    {#if status}
      <div class="status {status.toLowerCase()}" title={status} />
    {/if}
    {#if progress}
      <div class="progress" title="{progress} episodes seen">
        <i class="fas fa-clipboard-check fa-fw" />
        {progress}
      </div>
    {/if}
    <div class="score">
      {#if data.score !== 0}
        <i class="fas fa-heart fa-fw" />
        {data.score}
      {/if}
    </div>
    <div class="title" title={data.title}>{data.title}</div>
  </div>
</div>
