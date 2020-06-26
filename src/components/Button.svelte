<script>
  export let text;
  export let icon;
  export let tooltip;
  export let tooltipDirection = "left";
  export let circle;
  export let css;
  export let callback;
</script>

<style>
  button {
    position: relative;
    padding: 8px;
    background-color: white;
    border: 1px solid white;
    border-radius: 5px;
    color: #748899;
    font-size: 16px;
    transition: 0.3s;
    outline: none;
  }

  button:hover {
    cursor: pointer;
    background-color: #8d46b8;
    border-color: #8d46b8;
    color: white;
    transition: 0.3s;
  }

  button:active {
    background-color: #ad6dd3;
    border-color: #ad6dd3;
    color: white;
    transition: 0.1s;
  }

  button.circle {
    border-radius: 50%;
  }

  button .tooltip {
    visibility: collapse;
    position: absolute;
    top: calc(100% + 8px);
    padding: 8px 16px;
    min-width: 140px;
    background-color: white;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    color: #748899;
    font-size: 14px;
    text-align: left;
    animation-name: hide;
    animation-duration: 0.3s;
    z-index: 999;
  }

  button .tooltip.left {
    right: 0;
  }

  button .tooltip.center {
    left: 50%;
    transform: translateX(-50%);
  }

  button .tooltip.right {
    left: 0;
  }

  button:hover .tooltip {
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
</style>

<button class={circle ? 'circle' : ''} style={css} on:click={callback}>
  {#if icon}
    <i class="fas fa-{icon} fa-fw" />
  {/if}
  {#if text}{text}{/if}
  {#if tooltip}
    <div class="tooltip {tooltipDirection}">
      {@html tooltip}
    </div>
  {/if}
</button>
