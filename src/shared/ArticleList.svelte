<style>
  #article-img {
    width: 45%;
  }
  @media (min-width: 640px) {
    #article-img {
      width: 28.1%;
    }
  }
</style>

<script>
  import Spinner from './Spinner.svelte';
  export let projectName = '';
  export let tnlLanguage = 'tw';

  const articleListsUrl =
    'https://datastore.thenewslens.com/infographic/article-lists/' + projectName + '.json?' + `${Date.now()}`;

  const articleData = (async () => {
    const response = await fetch(articleListsUrl);
    return await response.json();
  })();
</script>

<slot />

<div class="article-list-grid-template pb-20">
  {#await articleData}
    <div class="w-64 h-64">
      <Spinner />
    </div>
  {:then articleData}
    {#each articleData.slice(0, 6) as { articletitle, articledate, articleimage, articleid }}
      <div class="my-4 shadow">
        <div class="overflow-hidden">
          <a
            href={`https://www.thenewslens.com/${articleid}?utm_source=TNL-interactive&utm_medium=article-zone&utm_campaign=${projectName}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img class="article-lists-img hover:scale-110" src={articleimage} alt="" />
          </a>
        </div>
        <span class="article-lists-date">{articledate}</span>
        <a
          href={`https://www.thenewslens.com/${articleid}?utm_source=TNL-interactive&utm_medium=article-zone&utm_campaign=${projectName}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <h3 class="article-lists-h3 hover:text-blue-800">{articletitle}</h3>
        </a>
      </div>
    {/each}
  {:catch error}
    <p class="text-center">An error occurred!</p>
  {/await}
</div>
