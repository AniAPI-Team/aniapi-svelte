<script>
  import Button from "../components/Button.svelte";

  const points = [
    {
      image: "ai_icon",
      title: "A clever brain",
      text:
        "Our system works in complete autonomy. Sometimes it needs some hammering, but it never stops working. Moreover, thanks to its modularity, it is made to expand and find more and more episodes!"
    },
    {
      image: "watch_icon",
      title: "Get comfortable",
      text:
        "Guess? Everything is ready. You just have to sit down, find a new anime to watch and lose yourself in its plot. In the meantime, AniAPI will take care of the most boring things."
    },
    {
      image: "queue_icon",
      title: "No waste of time",
      text:
        "Do you hate waiting for those long and boring processes? No problem! Our system has a manual processing queue, which allows users to update any anime at any time. It also allows you to see at what point in the queue it has arrived."
    },
    {
      image: "contribution_icon",
      title: "Count on community",
      text:
        "An important aspect of our system is the high integration with the community! In fact, anyone can add new episode sources on a particular site or vote for a specific source. In this way it is possible to help the system improve its work!"
    }
  ];
  const features = [
    {
      icon: "tv",
      tooltip: "Watch episodes"
    },
    {
      icon: "download",
      tooltip: "Download episodes"
    },
    {
      icon: "search",
      tooltip: "Search anime"
    },
    {
      icon: "sync-alt",
      tooltip: "Synchronize AniList"
    },
    {
      icon: "share-alt",
      tooltip: "Share anime"
    },
    {
      icon: "poll",
      tooltip: "Vote for matchings"
    },
    {
      icon: "plus",
      tooltip: "Add matchings"
    },
    {
      icon: "sign-in-alt",
      tooltip: "Login with AniList"
    },
    {
      icon: "bell",
      tooltip: "Track your anime"
    },
    {
      icon: "eye",
      tooltip: "Monitor status"
    }
  ];
</script>

<style>
  main {
    margin: 24px auto;
    margin-top: -24px !important;
    max-width: 1200px;
  }

  .jumbo {
    padding: 48px;
    background-color: rgb(54, 28, 71);
    border-radius: 16px;
    color: white;
    font-size: 14px;
  }

  .jumbo h1 {
    margin: 0;
    margin-bottom: 64px;
    text-align: center;
    color: white;
    font-size: 32px;
    font-weight: 600;
  }

  .jumbo h1 .sub {
    display: block;
    margin-top: 20px;
    color: rgb(173, 109, 211);
    font-size: 18px;
    font-weight: 500;
    line-height: 28px;
  }

  .jumbo .resources {
    display: flex;
    justify-content: center;
    align-items: center;
    line-height: 24px;
  }

  .jumbo .resources .left {
    text-align: left;
    max-width: 250px;
  }

  .jumbo .resources .right {
    text-align: right;
    max-width: 315px;
  }

  .jumbo .resources img.logo {
    margin: 0 96px;
    width: 96px;
    height: auto;
  }

  .jumbo .resources img.mini {
    margin: 0 4px;
    height: 24px;
    width: auto;
    border-radius: 12px;
    vertical-align: middle;
  }

  .points {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    margin: 32px 32px 0 32px;
  }

  .points .point {
    display: flex;
    align-items: center;
    width: calc(50% - 16px);
    background-color: white;
    padding: 16px;
    border-radius: 16px;
    margin-bottom: 32px;
    box-sizing: border-box;
  }

  .points .point img {
    margin-right: 32px;
  }

  .points .point .info {
    flex: 1;
  }

  .points .point .info h3 {
    margin: 0;
    color: #8d46b8;
    font-size: 20px;
    font-weight: 500;
  }

  .points .point .info p {
    color: #748899;
    font-size: 14px;
  }

  .features {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  @media screen and (max-width: 1200px) {
    main {
      margin: 0 0 24px 0;
      padding: 0;
    }

    .jumbo {
      border-radius: 0;
    }

    .jumbo .resources {
      flex-direction: column;
    }

    .jumbo .resources .left,
    .jumbo .resources .logo {
      margin-bottom: 24px !important;
    }

    .jumbo .resources .left,
    .jumbo .resources .right {
      text-align: center;
    }

    .points {
      margin: 32px 16px 0 16px !important;
    }

    .points .point {
      width: 100%;
    }

    .features {
      display: grid;
      grid-template-columns: repeat(4, auto);
      grid-gap: 16px 0;
      padding: 0 64px;
    }
  }
</style>

<main>
  <div class="jumbo">
    <h1>
      The biggest anime streaming API
      <span class="sub">
        Watch, share and develop
        <br />
        applications with AniAPI
      </span>
    </h1>
    <div class="resources">
      <div class="left">
        <b>AniAPI</b>
        is a REST API meant to expose a collection of anime's streaming videos
        available across the web.
      </div>
      <img class="logo" src="/images/aniapi_icon.png" alt="AniAPI Logo" />
      <div class="right">
        <b>AniAPI</b>
        embeds
        <img class="mini" src="/images/anilist_logo.png" alt="AniList Logo" />
        as profile system, so you can synchronize the anime you love. Also,
        <b>it</b>
        uses
        <img class="mini" src="/images/mal_logo.jpg" alt="MyAnimeList Logo" />
        as resource validator.
      </div>
    </div>
  </div>
  <div class="points">
    {#each points as p}
      <div class="point">
        <img src="/images/{p.image}.png" alt="{p.title} Icon" />
        <div class="info">
          <h3>{p.title}</h3>
          <p>{p.text}</p>
        </div>
      </div>
    {/each}
  </div>
  <div class="features">
    {#each features as f}
      <Button
        icon={f.icon}
        tooltip={f.tooltip}
        circle={true}
        tooltipDirection="center" />
    {/each}
  </div>
</main>
