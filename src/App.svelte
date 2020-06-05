<script>
  import Navbar from "./components/Navbar.svelte";
  import Home from "./views/Home.svelte";
  import Detail from "./views/Detail.svelte";

  import { get } from "svelte/store";
  import { currentPage } from "./store.js";
  let page = get(currentPage);

  currentPage.subscribe(newPage => {
    page = newPage;
  });
</script>

<style>

</style>

<Navbar />
<main>
  {#if page === 'home'}
    <Home />
  {/if}

  {#if page === 'detail'}
    <Detail />
  {/if}
</main>
