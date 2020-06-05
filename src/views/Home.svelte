<script>
  import TextBox from "../components/TextBox.svelte";
  import ComboBox from "../components/ComboBox.svelte";
  import CheckBox from "../components/CheckBox.svelte";
  import SearchTag from "../components/SearchTag.svelte";
  import SearchResult from "../components/SearchResult.svelte";

  import { get } from "svelte/store";
  import { animeGenres, animeTypes, animeSorts } from "../store.js";

  import { getAnimes } from "../api.js";

  let search = {
    title: "",
    genres: [],
    type: "TV",
    sort: "Title",
    desc: false,
    results: []
  };
  let searchTimeout;

  function onTitleChange(text) {
    search.title = text;
    onChange();
  }

  function onGenresChange(values) {
    search.genres = values;
    onChange();
  }

  function onTypeChange(value) {
    search.type = value;
    onChange();
  }

  function onSortChange(value) {
    search.sort = value;
    onChange();
  }

  function onSortDirectionChange(value) {
    search.desc = value;
    onChange();
  }

  function onChange() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(
      () =>
        getAnimes(
          search.title,
          search.genres,
          search.type,
          search.sort,
          search.desc,
          results => (search.results = results)
        ),
      1000
    );
  }

  onChange();
</script>

<style>
  main {
    margin: 42px auto;
    max-width: 1200px;
  }

  .search-filters {
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }

  .search-tags {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin-top: 24px;
  }

  .search-results {
    display: grid;
    grid-template-columns: repeat(auto-fill, 185px);
    grid-gap: 25px 20px;
    justify-content: space-between;
    margin-top: 42px;
  }
</style>

<main>
  <div class="search-filters">
    <TextBox hint="Search" callback={onTitleChange} />
    <ComboBox
      hint="Genres"
      items={get(animeGenres)}
      callback={onGenresChange} />
    <ComboBox
      hint="Type"
      items={get(animeTypes)}
      selected="TV"
      single={true}
      callback={onTypeChange} />
    <ComboBox
      hint="Sort"
      items={get(animeSorts)}
      selected="Title"
      single={true}
      callback={onSortChange} />
    <CheckBox label="Sort descending" callback={onSortDirectionChange} />
  </div>
  <div class="search-tags">
    {#if search.title !== ''}
      <SearchTag name="Title" tags={[search.title]} />
    {/if}
    <SearchTag name="Genres" tags={search.genres} />
    <SearchTag name="Type" tags={[search.type]} />
    {#if search.sort !== ''}
      <SearchTag name="Sort" tags={[search.sort]} />
    {/if}
  </div>
  <div class="search-results">
    {#each search.results as result}
      <SearchResult data={result} />
    {/each}
  </div>
</main>
