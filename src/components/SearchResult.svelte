<script>
  import { currentPage, currentAnime } from "../store.js";

  export let data;

  function selectAnime(anime) {
    currentAnime.set(anime);
    currentPage.set("detail");
  }
</script>

<style>
  .card {
    width: 185px;
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
    box-shadow: 0 2px 6px 1px #e8e8e8;
    transition: 0.3s;
  }

  .score,
  .title {
    color: white;
    z-index: 1;
  }

  .card:hover .picture {
    cursor: pointer;
    transform: scale(1.02);
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
      rgba(0, 0, 0, 0) 60%
    );
    border-radius: 5px;
    transition: 0.3s;
    z-index: 0;
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
</style>

<div class="card" on:click={() => selectAnime(data)}>
  <div class="picture" style="background-image:url({data.picture})">
    <div class="overlay" />
    <div class="score">
      {#if data.score !== 0}
        <i class="fas fa-heart fa-fw" />
        {data.score}
      {/if}
    </div>
    <div class="title">{data.title}</div>
  </div>
</div>
