<script>
  import { currentPage } from "../store.js";

  function changePage(page) {
    if (page === "github") {
      window.open("https://github.com/AniAPI-Team/aniapi-svelte");
      return;
    }

    currentPage.set(page);
  }
</script>

<style>
  navbar {
    display: block;
    padding: 14px 0;
    background-color: rgb(54, 28, 71);
  }

  navbar nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 0 auto;
    max-width: 1200px;
  }

  navbar img.brand {
    height: 32px;
    cursor: pointer;
  }

  navbar ul {
    display: flex;
    align-items: center;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  navbar ul li:not(:last-child) {
    margin-right: 24px;
  }

  navbar ul li {
    color: white;
    font-size: 14px;
    cursor: pointer;
    opacity: 0.8;
    transition: 0.3s;
  }

  navbar ul li img {
    display: block;
    height: 24px;
  }

  navbar ul li:hover {
    opacity: 1;
    transition: 0.3s;
  }

  navbar .side img.profile {
    display: block;
    height: 32px;
    background-color: #8d46b8;
    border-radius: 16px;
  }

  @media screen and (max-width: 1200px) {
    navbar nav {
      padding: 0 14px;
    }
  }
</style>

<navbar>
  <nav>
    <img
      src="/images/aniapi_icon.png"
      alt="AniAPI logo"
      class="brand"
      on:click={() => changePage('home')} />
    <ul>
      <li on:click={() => changePage('about')}>About</li>
      <li on:click={() => changePage('api')}>API</li>
      <li on:click={() => changePage('status')}>Status</li>
      <li>
        <img
          src="/images/nav_github_icon.png"
          alt="Github"
          on:click={() => changePage('github')} />
      </li>
    </ul>
    <ul class="side">
      <li>
        <img src="/images/nav_search_icon.png" alt="Search" />
      </li>
      <li>
        <img
          class="profile"
          src="https://s4.anilist.co/file/anilistcdn/user/avatar/large/default.png"
          alt="Profile" />
      </li>
    </ul>
  </nav>
</navbar>
