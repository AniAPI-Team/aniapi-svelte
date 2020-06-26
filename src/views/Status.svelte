<script>
  import QueueItem from "../components/QueueItem.svelte";

  import { getScraper, getAnime, getQueue } from "../api.js";

  let animeScraping;
  let idling;

  let queueItems = [];

  getAnimeScraping();
  setInterval(getAnimeScraping, 5000);

  getQueueItems();
  setInterval(getQueueItems, 30 * 1000);

  function getAnimeScraping() {
    getScraper(s => {
      idling = false;

      if (s.anime_id === 0) {
        return;
      }

      getAnime(s.anime_id, a => {
        if (!a.genres) {
          a.genres = [];
        }

        animeScraping = a;
        animeScraping.start_time = s.start_time;

        idling = true;
      });
    });
  }

  function getQueueItems() {
    getQueue(res => {
      queueItems = res;
    });
  }

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

  .scraper::after {
    visibility: hidden;
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 4px;
    content: "";
    background-color: #8d46b8;
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
  }

  .scraper.idling::after {
    visibility: visible;
    width: 0;
    animation-name: idle;
    animation-duration: 5s;
    animation-iteration-count: infinite;
  }

  @keyframes idle {
    from {
      width: 100%;
    }
    to {
      width: 0;
    }
  }

  .anime {
    display: flex;
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
</style>

<main>
  <div class="section">
    <div class="section-title">Scraper Engine</div>
    {#if animeScraping}
      <div class="scraper {idling ? 'idling' : ''}">
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
          <span>Run started</span>
          {getTimePassedFromDate(animeScraping.start_time)}
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
