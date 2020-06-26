<script>
  import Button from "./Button.svelte";

  import { get } from "svelte/store";
  import { currentPage, currentUser } from "../store.js";

  let user = get(currentUser);

  currentUser.subscribe(newUser => (user = newUser));

  function changePage(page) {
    if (page === "github") {
      window.open("https://github.com/AniAPI-Team/aniapi-svelte");
      return;
    }

    if (page === "profile") {
      window.open(user.siteUrl);
      return;
    }

    currentPage.set(page);
  }

  function tryOauthLogin() {
    window.location.href =
      "https://anilist.co/api/v2/oauth/authorize?client_id=" +
      process.env.ANILIST_CLIENTID +
      "&response_type=token";
  }

  function tryLogout() {
    localStorage.removeItem("current_user");
    window.location.reload();
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

  navbar .side div.image-profile {
    display: block;
    height: 32px;
    width: 32px;
    background-color: #8d46b8;
    background-position: center;
    background-size: cover;
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
      {#if user}
        <li>
          <img
            src="/images/nav_notifications_icon.png"
            alt="Notifications"
            on:click={() => changePage('notification')} />
        </li>
        <li on:click={() => changePage('profile')}>Profile</li>
      {/if}
      <li>
        {#if !user}
          <Button text="Login" css="font-size:14px" callback={tryOauthLogin} />
        {:else}
          <div
            class="image-profile"
            title="Logout"
            style="background-image:url('{user.avatar}')"
            on:click={tryLogout} />
        {/if}
      </li>
    </ul>
  </nav>
</navbar>
