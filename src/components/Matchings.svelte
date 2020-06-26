<script>
  import Button from "./Button.svelte";
  import { getMatchings, increaseMatchingVote } from "../api.js";

  export let animeId;
  export let from;
  export let reload;

  let foundMatchings = [];

  $: {
    if (reload) {
      reload = false;
      let votes = JSON.parse(localStorage.getItem("user_votes"));

      getMatchings(animeId, from, results => {
        foundMatchings = results;

        if (foundMatchings === null) {
          return;
        }

        for (let i = 0; i < foundMatchings.length; i++) {
          foundMatchings[i].ratio = parseFloat(foundMatchings[i].ratio) * 100;
          foundMatchings[i].ratio += foundMatchings[i].votes / 100;

          if (foundMatchings[i].ratio > 100) {
            foundMatchings[i].ratio = 100;
          }

          if (foundMatchings[i].ratio > 60) {
            foundMatchings[i].ratioClass = "green";
          } else if (foundMatchings[i].ratio > 40) {
            foundMatchings[i].ratioClass = "yellow";
          } else {
            foundMatchings[i].ratioClass = "red";
          }

          if (votes && votes[foundMatchings[i].anime_id]) {
            foundMatchings[i].voted = votes[
              foundMatchings[i].anime_id
            ].includes(foundMatchings[i].title + "_" + foundMatchings[i].from);
          }
        }

        foundMatchings.sort(compare);
        foundMatchings = foundMatchings;
      });
    }
  }

  function inspect(url) {
    window.open(url);
  }

  function vote(title, from) {
    increaseMatchingVote(animeId, from, title, () => {
      let votes = JSON.parse(localStorage.getItem("user_votes"));

      if (!votes) {
        votes = {};
      }

      if (!votes[animeId]) {
        votes[animeId] = [];
      }

      votes[animeId].push(title + "_" + from);

      localStorage.setItem("user_votes", JSON.stringify(votes));

      let m = foundMatchings.find(
        x => x.anime_id === animeId && x.title === title && x.from === from
      );
      m.voted = true;
      m.votes++;

      foundMatchings.sort(compare);
      foundMatchings = foundMatchings;
    });
  }

  function compare(a, b) {
    let aR = a.ratio / 10 + a.votes;
    let bR = b.ratio / 10 + b.votes;

    return bR - aR;
  }
</script>

<style>
  .matchings {
    position: relative;
    display: grid;
    grid-gap: 20px;
    grid-template-columns: repeat(3, 1fr);
    margin-top: 12px;
    margin-bottom: 12px;
    min-height: 90px;
    max-height: 320px;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .matchings::-webkit-scrollbar {
    width: 4px;
    background-color: transparent;
  }

  .matchings::-webkit-scrollbar-thumb {
    background-color: #748899;
  }

  .matching {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    min-width: 260px;
    padding: 8px;
    background-color: white;
    border: 2px solid white;
    border-radius: 8px;
  }

  .matching.green {
    border-color: rgb(123, 213, 85);
  }

  .matching.yellow {
    border-color: rgb(247, 154, 99);
  }

  .matching.red {
    border-color: rgb(232, 93, 117);
  }

  .matching:not(:last-child) {
    margin-right: 16px;
  }

  .matching .region {
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
  }

  .region .from {
    margin-left: 6px;
    font-size: 12px;
    text-transform: uppercase;
  }

  .region .ratio,
  .region .votes {
    margin-left: 6px;
    font-size: 12px;
  }

  .region .ratio.green {
    color: rgb(123, 213, 85);
  }

  .region .ratio.yellow {
    color: rgb(247, 154, 99);
  }

  .region .ratio.red {
    color: rgb(232, 93, 117);
  }

  .matching .title {
    display: block;
    margin-top: 8px;
    font-weight: 500;
  }
</style>

<div class="matchings">
  {#if !foundMatchings || foundMatchings.length === 0}
    <div>No matchings to vote found</div>
  {:else}
    {#each foundMatchings as m}
      <div class="matching {m.ratioClass}">
        <div class="region">
          {#if m.voted}
            <span
              class="fas fa-vote-yea fa-fw"
              title="You already voted this matching" />
          {:else}
            <span class="fas fa-vote-yea fa-fw" style="display:none" />
          {/if}
          <span class="from">{m.from}</span>
          <span class="ratio {m.ratioClass}">{m.ratio.toFixed(2)}%</span>
          <span class="votes">{m.votes} votes</span>
          <Button
            icon="user-secret"
            tooltip="Inspect"
            tooltipDirection="center"
            circle={true}
            css="margin-left:auto"
            callback={() => inspect(m.url)} />
          {#if !m.voted}
            <Button
              icon="vote-yea"
              tooltip="Vote as OK"
              tooltipDirection="center"
              circle={true}
              css="margin-left:4px"
              callback={() => vote(m.title, m.from)} />
          {/if}
        </div>
        <span class="title">{m.title}</span>
      </div>
    {/each}
  {/if}
</div>
