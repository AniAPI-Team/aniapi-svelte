<script>
  import Navbar from "./components/Navbar.svelte";
  import VideoPlayer from "./components/VideoPlayer.svelte";
  import Footer from "./components/Footer.svelte";
  import Home from "./views/Home.svelte";
  import Detail from "./views/Detail.svelte";
  import Notification from "./views/Notification.svelte";
  import Status from "./views/Status.svelte";
  import About from "./views/About.svelte";
  import TermsPrivacy from "./views/TermsPrivacy.svelte";

  import { get } from "svelte/store";
  import { currentPage, currentUser, currentAnime } from "./store.js";
  import { getUser, getUserLists } from "./anilist.js";
  import { getAnime } from "./api.js";

  let page = get(currentPage);

  currentPage.subscribe(newPage => {
    page = newPage;
    window.scrollTo(0, 0);
  });

  let url = new URL(window.location.href);
  if (url.hash !== "") {
    let jwt = url.hash.split("access_token=")[1].split("&token_type=")[0];
    if (jwt) {
      getUser(jwt);
    }
  }

  let user = JSON.parse(localStorage.getItem("current_user"));
  if (user) {
    currentUser.set(user);
    getUserLists(user);
  }

  let animeId = url.searchParams.get("anime");
  if (animeId) {
    getAnime(parseInt(animeId), anime => {
      currentAnime.set(anime);
      currentPage.set("detail");
    });
  }
</script>

<style>
  main {
    background-color: rgb(237, 241, 245);
    padding: 24px 0;
  }
</style>

<Navbar />
<main>
  {#if page === 'home'}
    <Home />
  {/if}

  {#if page === 'detail'}
    <Detail />
  {/if}

  {#if page === 'about'}
    <About />
  {/if}

  {#if page === 'status'}
    <Status />
  {/if}

  {#if page === 'notification'}
    <Notification />
  {/if}

  {#if page === 'termsprivacy'}
    <TermsPrivacy />
  {/if}
</main>
<Footer />
<VideoPlayer />
