<script>
  import { get } from "svelte/store";
  import { currentAnime, currentVideo, API } from "../store.js";
  import { updateAnimeProgress } from "../anilist.js";

  const api = get(API);

  export let src;
  let video;
  let alreadyCompleted = false;
  let firstTime = true;

  currentVideo.subscribe(newSrc => {
    if (!newSrc) {
      src = undefined;
      return;
    }

    let value = newSrc.value;

    if (value.includes("vvvid")) {
      window.open(value);
    } else if (value.includes("streamtape")) {
      window.open(value);
    } else if (value.includes("dreamsub")) {
      src =
        api.url +
        "proxy?url=" +
        encodeURIComponent(value) +
        "&referer=" +
        encodeURIComponent("https://dreamsub.stream");
    } else {
      src = value;
    }

    video.oncanplay = e => onCanPlay(newSrc);

    video.ontimeupdate = e => {
      if (video.readyState === 0) {
        firstTime = true;
        onCanPlay(newSrc);
        return;
      }

      let diff = video.duration - video.currentTime;
      let perc = (video.currentTime * 100) / video.duration;
      let completed = diff <= 140;

      let watches = JSON.parse(localStorage.getItem("user_watches"));

      if (!watches) {
        watches = {};
      }

      let key = newSrc.from + "_" + newSrc.animeId + "_" + newSrc.number;
      watches[key] = JSON.stringify({
        time: completed ? 0 : video.currentTime,
        percentual: completed ? 100 : perc,
        completed: completed
      });

      localStorage.setItem("user_watches", JSON.stringify(watches));

      if (completed && !alreadyCompleted) {
        updateAnimeProgress(get(currentAnime).anilist_id, newSrc.number);
        alreadyCompleted = true;
      }
    };
  });

  function close() {
    currentVideo.set(undefined);
    video.pause();
  }

  function onCanPlay(newSrc) {
    if (!firstTime) {
      return;
    }

    let watches = JSON.parse(localStorage.getItem("user_watches"));

    if (watches) {
      let key = newSrc.from + "_" + newSrc.animeId + "_" + newSrc.number;
      let watch = watches[key];

      if (watch) {
        watch = JSON.parse(watch);
        video.currentTime = watch.time;
      }
    }

    firstTime = false;
  }
</script>

<style>
  .video-player {
    visibility: collapse;
    position: fixed;
    bottom: 8px;
    right: 8px;
    background-color: black;
    z-index: 999;
  }

  .video-player.visible {
    visibility: visible;
    animation-name: show;
    animation-duration: 0.3s;
  }

  @keyframes show {
    from {
      bottom: -8px;
      opacity: 0;
    }
    to {
      bottom: 8px;
      opacity: 1;
    }
  }

  .video-player video {
    display: block;
    width: 400px;
    height: 225px;
    outline: none;
  }

  .fa-times {
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 4px 3px;
    border-radius: 50%;
    font-size: 18px;
    color: white;
    cursor: pointer;
    z-index: 9999;
    transition: 0.3s;
  }

  .fa-times:hover {
    background-color: rgba(0, 0, 0, 0.3);
    transition: 0.3s;
  }

  @media screen and (max-width: 1200px) {
    .video-player {
      bottom: 0;
      right: 0;
    }

    .video-player video {
      width: 100%;
    }
  }

  @media screen and (max-width: 1200px) and (orientation: landscape) {
    .video-player {
      width: 100%;
    }

    .video-player video {
      height: 100%;
    }
  }
</style>

<div class="video-player {src ? 'visible' : ''}">
  <i class="fas fa-times fa-fw" on:click={close} />
  <video {src} controls autoplay disablePictureInPicture bind:this={video} />
</div>
