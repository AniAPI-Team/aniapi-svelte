<script>
  export let data;

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
  .queue-item {
    display: flex;
    flex-direction: column;
    margin-right: 16px;
    min-width: 260px;
    border-radius: 8px;
    font-size: 14px;
    color: #748899;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }

  .queue-item .picture {
    width: 100%;
    height: 128px;
    background-position: center;
    background-size: cover;
    background-repeat: no-repeat;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
  }

  .queue-item .info {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 16px;
    background-color: white;
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
  }

  .queue-item .title {
    margin-bottom: 4px;
    font-weight: 600;
  }

  .queue-item .time {
    margin-left: auto;
    font-size: 12px;
  }

  .queue-item .running {
    position: absolute;
    bottom: 16px;
    left: 16px;
    width: 8px;
    height: 8px;
    content: "";
    background-color: rgb(123, 213, 85);
    border-radius: 4px;
  }

  .queue-item .running.not {
    background-color: rgb(232, 93, 117);
  }
</style>

<div class="queue-item" title="{data.running ? 'Currently' : 'Not'} running">
  <div
    class="picture"
    style="background-image:url('{data.anime.picture ? data.anime.picture : ''}')" />
  <div class="info">
    <span class="title">{data.anime.title}</span>
    <span class="time">
      Queued {getTimePassedFromDate(data.insertion_date)}
    </span>
    <span class="running {!data.running ? 'not' : ''}" />
  </div>
</div>
