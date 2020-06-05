<script>
  export let name;
  export let tags;
</script>

<style>
  .tags {
    margin-right: 8px;
    padding: 8px;
    background-color: #ad6dd3;
    border-radius: 8px;
    color: white;
    font-size: 12px;
  }

  .tags .name {
    margin-right: 4px;
    font-weight: 600;
  }

  .tags .tag:not(:last-child)::after {
    margin-right: 2px;
    content: ",";
  }
</style>

{#if tags.length > 0}
  <div class="tags">
    <span class="name">{name}</span>
    {#each tags as tag}
      <span class="tag">{tag}</span>
    {/each}
  </div>
{/if}
