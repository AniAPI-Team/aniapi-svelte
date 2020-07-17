<script>
  export let items;
  export let callback;
  export let css;
  export let counter = false;

  export let progress;

  if (!counter) {
    for (let i = 0; i < items.length; i++) {
      if (!items[i].value) {
        items[i] = {
          value: items[i]
        };

        items[i].selected = i === 0;
      }
    }
  }

  function onClick(value) {
    for (let i = 0; i < items.length; i++) {
      if (counter) {
        items[i] = i === value;
      } else {
        items[i].selected = items[i].value === value;
      }
    }
    items = items;

    callback(value + 1);
  }
</script>

<style>
  .tabs {
    padding: 8px;
    background-color: white;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    overflow: auto;
    white-space: nowrap;
  }

  .tabs::-webkit-scrollbar {
    height: 4px;
    background-color: transparent;
  }

  .tabs::-webkit-scrollbar-thumb {
    background-color: #748899;
  }

  .tab {
    position: relative;
    display: inline-block;
    padding: 8px 16px;
    border-radius: 8px;
    box-sizing: border-box;
    transition: 0.3s;
  }

  .tab.selected {
    background-color: #8d46b8;
    color: white;
    transition: 0.3s;
  }

  .tab.active::after {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 24px;
    height: 24px;
    content: "";
    background-color: rgb(123, 213, 85);
    border-radius: 12px;
    opacity: 0.3;
  }

  .tab.selected::after,
  .tab:hover::after {
    background-color: transparent;
  }

  .tab:hover {
    cursor: pointer;
    background-color: rgb(173, 109, 211);
    color: white;
  }
</style>

<div class="tabs" style={css}>
  {#each items as item, i}
    {#if counter}
      <div
        class="tab {item ? 'selected' : ''}
        {progress >= i + 1 ? 'active' : ''}"
        on:click={() => onClick(i)}>
        {i + 1}
      </div>
    {:else}
      <div
        class="tab {item.selected ? 'selected' : ''}"
        on:click={() => onClick(item.value)}>
        {item.value}
      </div>
    {/if}
  {/each}
</div>
