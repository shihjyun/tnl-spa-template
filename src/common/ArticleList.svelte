<style>
</style>

<script>
  export let projectName
  export let articleData
</script>

<div class="relative article-list-grid-template pb-10">
  {#await articleData}
    <div class="w-64 h-64">loading ...</div>
  {:then articleData}
    {#each articleData.slice(0, 6) as { article_title, article_img_url, article_url }}
      <div class="my-4">
        <div class="overflow-hidden">
          <a
            href={`${article_url}?utm_source=TNL-interactive&utm_medium=article-zone&utm_campaign=${projectName}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img class="article-lists-img hover:scale-110" src={article_img_url} alt="" />
          </a>
        </div>
        <a
          href={`${article_url}?utm_source=TNL-interactive&utm_medium=article-zone&utm_campaign=${projectName}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <h3 class="article-lists-h3 hover-opacity">{article_title}</h3>
        </a>
      </div>
    {/each}
  {:catch error}
    <p class="text-center">An error occurred!</p>
  {/await}
</div>
