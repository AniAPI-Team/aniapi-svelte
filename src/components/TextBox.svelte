<script>
  export let hint;
  export let callback;
  export let text;
  export let icon = "search";
  export let css;

  let empty = true;

  if (!text) {
    text = "";
  }

  function keyUp(e) {
    let value = e.target.value.trim();

    empty = value === "";
    text = value;

    if (callback) {
      callback(text);
    }
  }

  function clear() {
    text = "";
    empty = true;

    if (callback) {
      callback(text);
    }
  }
</script>

<style>
  .textbox {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    background-color: white;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    color: #748899;
  }

  .fa-search,
  .fa-times {
    font-size: 12px;
    opacity: 0.6;
  }

  .fa-search {
    margin-right: 8px;
  }

  input {
    min-width: 140px;
    width: 100%;
    background-color: transparent;
    border: none;
    outline: none;
    color: #748899;
    font-size: 14px;
  }

  .fa-times {
    margin-left: 8px;
    cursor: pointer;
    transition: 0.3s;
  }

  .fa-times:hover {
    opacity: 0.9;
    transition: 0.3s;
  }
</style>

<div class="textbox" style={css}>
  <i class="fas fa-{icon} fa-fw" />
  <input type="text" placeholder={hint} value={text} on:keyup={keyUp} />
  {#if !empty}
    <i class="fas fa-times fa-fw" on:click={clear} />
  {:else}
    <i class="fas fa-times fa-fw" style="visibility:hidden" />
  {/if}
</div>
