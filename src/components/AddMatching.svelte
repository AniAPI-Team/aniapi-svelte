<script>
  import SelectBox from "../components/SelectBox.svelte";
  import NumericBox from "../components/NumericBox.svelte";
  import TextBox from "../components/TextBox.svelte";
  import Button from "../components/Button.svelte";

  import { get } from "svelte/store";
  import {
    currentAnime,
    animeEpisodesFrom,
    animeEpisodesFromTemplate
  } from "../store.js";
  import { addCustomMatching } from "../api.js";

  export let active = false;
  export let callback;

  let element;
  let from = get(animeEpisodesFrom)[0].value;
  let url = "";
  let urlHint;
  let episodesNumber = 1;

  updateURLHint();

  $: {
    if (active) {
      setTimeout(function() {
        document.body.addEventListener("click", onDocumentClick);
      }, 500);
    }
  }

  function onDocumentClick(e) {
    let outside = true;
    for (let i = 0; i < e.path.length; i++) {
      if (e.path[i] === element) {
        outside = false;
      }
    }

    if (outside) {
      active = false;
      document.body.removeEventListener("click", onDocumentClick);
    }
  }

  function onAnimeFromChange(value) {
    from = value;
    updateURLHint();
  }

  function updateURLHint() {
    urlHint = get(animeEpisodesFromTemplate)[from];
  }

  function onURLChange(value) {
    url = value;
  }

  function onEpisodesNumberChange(value) {
    episodesNumber = value;
  }

  function onAdd() {
    if (url === "" || from === "" || episodesNumber === 0) {
      alert("Please, fill all fields with valid data!");
      return;
    }

    addCustomMatching(
      get(currentAnime).id,
      from,
      url,
      episodesNumber,
      result => {
        active = false;
        callback();
      }
    );
  }
</script>

<style>
  .addmatching {
    visibility: collapse;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.75);
    animation-name: hide;
    animation-duration: 0.3s;
    z-index: 999;
    opacity: 0;
  }

  .addmatching.active {
    visibility: visible;
    animation-name: show;
    animation-duration: 0.3s;
    opacity: 1;
  }

  .body {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 16px;
    min-width: 360px;
    background-color: white;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    color: #748899;
    font-size: 14px;
  }

  @keyframes show {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes hide {
    from {
      opacity: 1;
      visibility: visible;
    }
    to {
      opacity: 0;
      visibility: collapse;
    }
  }

  .url {
    display: flex;
    align-items: center;
  }
</style>

<div class="addmatching {active ? 'active' : ''}">
  <div class="body" bind:this={element}>
    <SelectBox
      items={get(animeEpisodesFrom)}
      selected={from}
      callback={onAnimeFromChange} />
    <br />
    <div class="url">
      <TextBox hint={urlHint} icon="link" callback={onURLChange} css="flex:1" />
      <Button
        tooltip="It's important you follow the URL template or the matching
        won't work!"
        icon="info"
        circle={true}
        css="margin-left:8px" />
    </div>
    <br />
    <NumericBox
      hint="Episodes number"
      number={1}
      positive={true}
      callback={onEpisodesNumberChange} />
    <br />
    <Button text="Add matching" callback={onAdd} />
  </div>
</div>
