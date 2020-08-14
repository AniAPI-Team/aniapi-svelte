<script>
  import QueueItem from "../components/QueueItem.svelte";

  import { API } from "../store.js";
  import { get } from "svelte/store";
  import { getScraper, getAnime, getQueue } from "../api.js";

  const api = get(API);

  let stopped = true;
  let animeScraping;

  let queueItems = [];

  let socket = new WebSocket(api.socket);

  socket.onmessage = e => {
    let message = JSON.parse(e.data);

    switch (message.channel) {
      case "scraper":
        stopped = !message.data.anime;

        if (stopped) {
          animeScraping = {
            start_time: message.data.start_time
          };

          return;
        }

        if (!message.data.anime.genres) {
          message.data.anime.genres = [];
        }

        animeScraping = message.data.anime;
        animeScraping.start_time = message.data.start_time;
        animeScraping.memory = message.data.memory;
        return;
      case "queue":
        if (!message.data) {
          return;
        }

        if (Array.isArray(message.data)) {
          queueItems = message.data;
          return;
        }

        if (message.data.completed) {
          let index = queueItems
            .map(x => {
              return x.anime.id;
            })
            .indexOf(message.data.anime.id);
          queueItems.splice(index, 1);
        } else if (message.data.running) {
          let index = queueItems
            .map(x => {
              return x.anime.id;
            })
            .indexOf(message.data.anime.id);

          queueItems[index].running = true;
        } else {
          queueItems.push(message.data);
        }

        queueItems = queueItems;
        return;
    }
  };

  function getTimePassedFromDate(date) {
    let d = new Date(date);
    let n = new Date();

    let s = (n - d) / 1000;
    let m = s / 60;

    if (m >= 60) {
      let h = parseInt(m / 60);

      return h + " " + (h <= 1 ? "hour" : "hours") + " ago";
    }

    m = parseInt(m);

    if (m === 0) {
      return "a moment ago";
    }

    return m + " " + (m <= 1 ? "minute" : "minutes") + " ago";
  }
</script>

<style>
  main {
    margin: 24px auto;
    max-width: 1200px;
  }

  .section {
    display: flex;
    margin-bottom: 32px;
  }

  .section:nth-child(2) {
    min-height: 190px;
  }

  .section-title {
    margin-right: 32px;
    width: 180px;
    color: #748899;
    font-size: 20px;
    font-weight: 500;
  }

  .scraper {
    position: relative;
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background-color: white;
    border-radius: 8px;
    color: #748899;
    font-size: 14px;
  }

  @keyframes hide {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }

  @keyframes show {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .anime {
    display: flex;
    opacity: 1;
  }

  .anime .picture {
    height: 80px;
    width: 64px;
    background-position: center;
    background-size: cover;
    background-repeat: no-repeat;
    border-radius: 8px;
  }

  .anime .info {
    display: flex;
    flex-direction: column;
    margin-left: 16px;
  }

  .anime .info .title {
    margin-bottom: 4px;
    font-weight: 600;
  }

  .anime .info .genres {
    margin-top: auto;
  }

  .anime .info .genres .genre {
    margin-right: 8px;
    padding: 3px 8px;
    background-color: rgb(173, 109, 211);
    border-radius: 3px;
    color: white;
  }

  .memory {
    margin-bottom: 32px;
  }

  .run {
    align-self: flex-end;
    text-align: right;
  }

  .run span {
    display: block;
  }

  .queue {
    display: flex;
    flex-wrap: wrap;
    flex: 1;
  }

  @media screen and (max-width: 1200px) {
    main {
      padding: 0 14px;
    }

    .section {
      flex-direction: column;
    }

    .section-title {
      margin-right: 0;
      margin-bottom: 16px;
    }

    .scraper {
      flex-direction: column;
      justify-content: unset;
      align-items: unset;
    }

    .genres {
      display: flex;
      flex-wrap: wrap;
    }

    .run {
      margin-top: 8px;
    }
  }
</style>

<main>
  <div class="section">
    <div class="section-title">Scraper Engine</div>
    {#if animeScraping && !stopped}
      <div class="scraper">
        <div class="anime">
          <div
            class="picture"
            style="background-image:url('{animeScraping.picture ? animeScraping.picture : ''}')" />
          <div class="info">
            <span class="title">{animeScraping.title}</span>
            <span class="type">{animeScraping.type}</span>
            <div class="genres">
              {#each animeScraping.genres as g}
                <span class="genre">{g}</span>
              {/each}
            </div>
          </div>
        </div>
        <div class="run">
          <div class="memory">{animeScraping.memory}% memory</div>
          <span>Run started</span>
          {getTimePassedFromDate(animeScraping.start_time)}
        </div>
      </div>
    {:else}
      <div class="scraper">
        <div class="anime">
          <div
            class="picture"
            style="background-image:url('/images/aniapi_icon.png')" />
          <div class="info">
            <span class="title">Idle state</span>
            <span class="type">Actually not running</span>
            <div class="genres" />
          </div>
        </div>
        <div class="run">
          <span>Waiting for next run...</span>
        </div>
      </div>
    {/if}
  </div>
  <div class="section">
    <div class="section-title">Queue Engine</div>
    <div class="queue">
      {#each queueItems as q}
        <QueueItem data={q} />
      {/each}
    </div>
  </div>
</main>
