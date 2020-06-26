<script>
  import Navbar from "./components/Navbar.svelte";
  import VideoPlayer from "./components/VideoPlayer.svelte";
  import Home from "./views/Home.svelte";
  import Detail from "./views/Detail.svelte";
  import Notification from "./views/Notification.svelte";
  import Status from "./views/Status.svelte";

  import { get } from "svelte/store";
  import { currentPage, currentUser } from "./store.js";
  import { getUser, getUserLists } from "./anilist.js";

  let page = get(currentPage);

  currentPage.subscribe(newPage => (page = newPage));

  let url = window.location.href;
  if (url.includes("access_token")) {
    let jwt = url.split("access_token=")[1].split("&token_type=")[0];
    if (jwt) {
      getUser(jwt);
    }
  }

  let user = JSON.parse(localStorage.getItem("current_user"));
  if (user) {
    currentUser.set(user);
    getUserLists(user);
  }
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

  {#if page === 'notification'}
    <Notification />
  {/if}

  {#if page === 'status'}
    <Status />
  {/if}
</main>
<VideoPlayer />
