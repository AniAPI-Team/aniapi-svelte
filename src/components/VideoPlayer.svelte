<script>
  import { currentVideo } from "../store.js";

  export let src;
  let video;

  currentVideo.subscribe(newSrc => {
    if (!newSrc) {
      src = newSrc;
      return;
    }

    if (newSrc.includes("vvvid")) {
      window.open(newSrc);
    } else {
      src = newSrc;
    }
  });

  function close() {
    currentVideo.set(undefined);
    video.pause();
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
</style>

<div class="video-player {src ? 'visible' : ''}">
  <i class="fas fa-times fa-fw" on:click={close} />
  <video {src} controls autoplay disablePictureInPicture bind:this={video} />
</div>
