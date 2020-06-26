<script>
  export let hint;
  export let callback;
  export let number;
  export let css;
  export let positive = false;

  if (!number) {
    number = 0;
  }

  function add(n) {
    number += n;

    if (positive && number < 0) {
      number = 0;
    }

    if (callback) {
      callback(number);
    }
  }
</script>

<style>
  .numericbox {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background-color: white;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    color: #748899;
  }

  .fa-minus,
  .fa-plus {
    font-size: 12px;
    opacity: 0.6;
    transition: 0.3s;
  }

  .fa-minus:hover,
  .fa-plus:hover {
    cursor: pointer;
    opacity: 0.9;
    transition: 0.3s;
  }

  input {
    margin: 0 8px;
    min-width: 140px;
    width: 100%;
    background-color: transparent;
    border: none;
    outline: none;
    color: #748899;
    font-size: 14px;
    text-align: right;
  }
</style>

<div class="numericbox" style={css}>
  <i class="fas fa-minus fa-fw" on:click={() => add(-1)} />
  <input
    type="number"
    placeholder={hint}
    bind:value={number}
    on:change={() => add(0)} />
  <i class="fas fa-plus fa-fw" on:click={() => add(1)} />
</div>
