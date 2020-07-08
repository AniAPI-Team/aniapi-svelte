<script>
  export let hint;
  export let text;
  export let items;
  export let single;
  export let selected = undefined;
  export let callback;

  let element;
  let empty = true;
  let showDropdown = false;

  if (!text) {
    text = "";
  }

  if (!items) {
    items = [];
  }

  if (!single) {
    single = false;
  }

  for (let i = 0; i < items.length; i++) {
    if (items[i].value) {
      items[i].selected = selected && items[i].value === selected;
      continue;
    }

    items[i] = {
      value: items[i],
      selected: selected && items[i] === selected
    };
  }

  document.body.addEventListener("click", function(e) {
    let outside = true;
    for (let i = 0; i < e.path.length; i++) {
      if (e.path[i] === element) {
        outside = false;
      }
    }

    if (outside) {
      showDropdown = false;
    }
  });

  function keyUp(e) {
    let value = e.target.value.trim();
    text = value;
  }

  function show() {
    showDropdown = true;
  }

  function changeItem(value) {
    if (single) {
      deselectAll();
    }

    let item = items.find(x => x.value === value);
    item.selected = !item.selected;
    items = items;

    empty = !isOneSelected();
    text = "";

    callCallback();
  }

  function isOneSelected() {
    for (let i = 0; i < items.length; i++) {
      if (items[i].selected) {
        return true;
      }
    }

    return false;
  }

  function deselectAll() {
    for (let i = 0; i < items.length; i++) {
      items[i].selected = false;
    }

    items = items;
  }

  function callCallback() {
    if (!callback) {
      return;
    }

    let values = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].selected) {
        values.push(items[i].value);
      }
    }

    if (single) {
      callback(values[0]);
    } else {
      callback(values);
    }
  }

  function clear() {
    for (let i = 0; i < items.length; i++) {
      if (single && selected) {
        items[i].selected = items[i].value === selected;
      } else {
        items[i].selected = false;
      }
    }

    callCallback();

    empty = true;
  }
</script>

<style>
  .combobox {
    position: relative;
    display: flex;
    align-items: center;
    margin-left: 24px;
    padding: 8px 12px;
    background-color: white;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    color: #748899;
  }

  .fa-chevron-down,
  .fa-times {
    font-size: 12px;
    opacity: 0.6;
  }

  input {
    flex: 1;
    width: 140px;
    background-color: transparent;
    border: none;
    outline: none;
    color: #748899;
    font-size: 14px;
  }

  .fa-chevron-down,
  .fa-times {
    margin-left: 8px;
    transition: 0.3s;
    cursor: pointer;
  }

  .fa-chevron-down:hover,
  .fa-times:hover {
    opacity: 0.9;
    transition: 0.3s;
  }

  .dropdown {
    visibility: collapse;
    position: absolute;
    left: 0;
    top: calc(100% + 8px);
    width: 100%;
    max-height: 280px;
    background-color: white;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    overflow-y: auto;
    animation-name: hide;
    animation-duration: 0.3s;
    z-index: 999;
  }

  .dropdown.active {
    visibility: visible;
    animation-name: show;
    animation-duration: 0.3s;
  }

  @keyframes show {
    from {
      opacity: 0;
      top: 100%;
    }
    to {
      opacity: 1;
      top: calc(100% + 8px);
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

  .dropdown .item:first-child {
    padding-top: 12px;
  }

  .dropdown .item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    font-size: 14px;
  }

  .dropdown .item:hover {
    cursor: pointer;
    background-color: rgba(237, 241, 245, 0.6);
    color: #8d46b8;
  }

  .dropdown .item:last-child {
    padding-bottom: 12px;
  }

  .dropdown .item .fa-check-circle {
    color: #8d46b8;
  }
</style>

<div class="combobox" bind:this={element}>
  <input
    type="text"
    placeholder={hint}
    value={text}
    on:keyup={keyUp}
    on:click={show} />
  {#if !empty}
    <i class="fas fa-times fa-fw" on:click={clear} />
  {:else}
    <i class="fas fa-chevron-down fa-fw" on:click={show} />
  {/if}
  <div class="dropdown {showDropdown ? 'active' : ''}">
    {#each items as item}
      {#if item.value.toLowerCase().includes(text.toLowerCase())}
        <div class="item" on:click={() => changeItem(item.value)}>
          {item.value}
          {#if item.selected}
            <i class="fas fa-check-circle fa-fw" />
          {:else}
            <i class="fas fa-check-circle fa-fw" style="visibility:hidden" />
          {/if}
        </div>
      {/if}
    {/each}
  </div>
</div>
