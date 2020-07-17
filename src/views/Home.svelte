<script>
  import TextBox from "../components/TextBox.svelte";
  import ComboBox from "../components/ComboBox.svelte";
  import CheckBox from "../components/CheckBox.svelte";
  import Button from "../components/Button.svelte";
  import SearchTag from "../components/SearchTag.svelte";
  import SearchResult from "../components/SearchResult.svelte";
  import Pagination from "../components/Pagination.svelte";

  import { get } from "svelte/store";
  import { animeGenres, animeTypes, animeSorts } from "../store.js";

  import { getAnimes } from "../api.js";

  let search = {
    title: "",
    genres: [],
    type: "TV",
    sort: "Score",
    desc: true,
    page: 1,
    reset: false,
    results: []
  };
  let searchTimeout;
  let emptyPage;
  let emptyFilters = true;

  function onTitleChange(text) {
    search.title = text;
    search.page = 1;
    onChange();
  }

  function onGenresChange(values) {
    search.genres = values;
    search.page = 1;
    onChange();
  }

  function onTypeChange(value) {
    search.type = value;
    search.page = 1;
    onChange();
  }

  function onSortChange(value) {
    search.sort = value;
    search.page = 1;
    onChange();
  }

  function onSortDirectionChange(value) {
    search.desc = value;
    search.page = 1;
    onChange();
  }

  function onPageChange(value) {
    search.page = value;
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
          search.page,
          results => {
            if (results.length === 0) {
              emptyPage = true;

              if (search.page > 1) {
                search.page--;
              } else {
                search.results = [];
              }
            } else {
              search.results = results;
              emptyPage = false;
            }
          }
        ),
      500
    );

    emptyFilters =
      search.title === "" &&
      search.genres.length === 0 &&
      search.type === "TV" &&
      search.sort === "Score";
  }

  function clearFilters() {
    search.title = "";
    search.genres = [];
    search.type = "TV";
    search.sort = "Score";
    emptyFilters = true;

    window.sessionStorage.clear();
    search.reset = true;
    setTimeout(() => {
      search.reset = false;
    }, 0);

    onChange();
  }

  onChange();
</script>

<style>
  main {
    margin: 24px auto;
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
    margin-top: 12px;
    padding-top: 12px;
    min-height: 555px;
    border-top: 1px solid #d8e0e9;
  }

  .search-results.empty {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #d8e0e9;
    border-radius: 8px;
  }

  @media screen and (max-width: 1200px) {
    main {
      padding: 0 14px;
    }

    .search-filters {
      display: grid;
      grid-template-columns: repeat(1, 100%);
      grid-gap: 16px;
    }

    .search-results {
      display: flex;
      flex-wrap: wrap;
      grid-gap: none;
      grid-template-columns: none;
    }
  }
</style>

<main>
  {#if !search.reset}
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
        selected="Score"
        single={true}
        callback={onSortChange} />
      <CheckBox
        label="Sort descending"
        checked={true}
        callback={onSortDirectionChange} />
      {#if !emptyFilters}
        <Button
          icon="times"
          tooltip="Clear filters"
          circle={true}
          callback={clearFilters}
          css="margin-left:auto" />
      {/if}
      <Button
        icon="keyboard"
        tooltip="You can use <b>arrow keys</b> or <b>swipe's gestures</b> to
        change page"
        circle={true}
        css="margin-left:auto" />
    </div>
  {/if}
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
  <div class="search-results {search.results.length === 0 ? 'empty' : ''}">
    {#if search.results.length === 0}
      <div class="no-results">
        <img src="/images/aniapi_404.png" alt="404 - Not found" />
      </div>
    {/if}
    {#each search.results as result}
      <SearchResult data={result} />
    {/each}
  </div>
  <Pagination page={search.page} empty={emptyPage} callback={onPageChange} />
</main>
