<script>
  export let label = "";
  export let checked = false;
  export let callback;

  function toggle() {
    checked = !checked;

    if (callback) {
      callback(checked);
    }
  }
</script>

<style>
  .checkbox {
    display: flex;
    align-items: center;
    margin-left: 24px;
    color: #748899;
    font-size: 14px;
  }

  .checkbox .circle {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 5px;
    width: 17px;
    height: 17px;
    background-color: white;
    border: 4px solid white;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    cursor: pointer;
    transition: 0.3s;
  }

  .checkbox .circle.checked {
    background-color: #8d46b8;
    transition: 0.3s;
  }

  .fa-check {
    font-size: 9px;
    color: white;
  }
</style>

<div class="checkbox" on:click={toggle}>
  <div class="circle {checked ? 'checked' : ''}">
    <i class="fas fa-check fa-fw" />
  </div>
  <span>{label}</span>
</div>
