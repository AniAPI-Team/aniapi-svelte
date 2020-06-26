<script>
  export let page = 1;
  export let callback;

  document.addEventListener("keyup", keyUp);

  function keyUp(e) {
    if (e.keyCode === 39) {
      changePage(1);
    } else if (e.keyCode === 37) {
      changePage(-1);
    }
  }

  function changePage(n) {
    page += n;

    if (page < 1) {
      page = 1;
    }

    if (callback) {
      callback(page);
    }
  }
</script>

<style>
  /*.pages {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 42px;
    color: #748899;
    font-size: 14px;
    user-select: none;
  }

  .before,
  .after {
    cursor: pointer;
    transition: 0.3s;
  }

  .before:hover,
  .after:hover {
    color: #8d46b8;
    transition: 0.3s;
  }

  .after.hidden,
  .before.hidden {
    visibility: hidden;
  }*/
</style>

<!--<div class="pages">
  <span
    class="before {page <= 1 ? 'hidden' : ''}"
    on:click={() => changePage(-1)}>
    <i class="fas fa-chevron-left fa-fw" />
    Previous
  </span>
  <span class="current">{page}</span>
  <span class="after {empty ? 'hidden' : ''}" on:click={() => changePage(1)}>
    Next
    <i class="fas fa-chevron-right fa-fw" />
  </span>
</div>-->
