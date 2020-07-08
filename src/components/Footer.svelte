<script>
  import { get } from "svelte/store";
  import { currentPage } from "../store.js";

  function changePage(page) {
    currentPage.set(page);
  }
</script>

<style>
  footer {
    padding: 32px 0 48px 0;
    background-color: rgb(54, 28, 71);
    color: white;
    font-size: 14px;
    font-weight: 300;
  }

  .main {
    margin: 0 auto;
    max-width: 1200px;
  }

  .main .logo {
    height: 32px;
    width: auto;
  }

  .footer {
    display: flex;
    justify-content: space-between;
    margin-top: 16px;
  }

  .copyright span {
    font-weight: 400;
  }

  .footer ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .footer ul li {
    margin-bottom: 8px;
  }

  .footer ul li a {
    color: white;
    text-decoration: none;
    opacity: 0.8;
    transition: 0.3s;
  }

  .footer ul li a:hover {
    opacity: 1;
    transition: 0.3s;
    cursor: pointer;
  }

  @media screen and (max-width: 1200px) {
    .main {
      padding: 0 14px;
    }
  }
</style>

<footer>
  <div class="main">
    <img src="/images/aniapi_logo.png" alt="AniAPI Logo" class="logo" />
    <div class="footer">
      <div class="copyright">
        <span>AniAPI</span>
        &copy; 2020
      </div>
      <ul>
        <li>
          <a on:click={() => changePage('termsprivacy')}>Terms & Privacy</a>
        </li>
        <li>
          <a
            href="https://github.com/AniAPI-Team/aniapi-go/wiki"
            target="_blank">
            API
          </a>
        </li>
        <li>
          <a
            href="https://github.com/AniAPI-Team/aniapi-svelte"
            target="_blank">
            Github
          </a>
        </li>
      </ul>
    </div>
  </div>
</footer>
