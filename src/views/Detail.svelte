<script>
  import { get } from "svelte/store";
  import { currentAnime } from "../store.js";

  const anime = get(currentAnime);
</script>

<h1>{anime.title}</h1>
