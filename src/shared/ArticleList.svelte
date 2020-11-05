<script>
  export let projectName
  export let tnlLanguage = 'tw'

  const articleListsUrl =
    'https://datastore.thenewslens.com/infographic/article-lists/' +
    projectName +
    '.json?' +
    `${Math.round(Math.random() * 100000)}`

  const articleData = (async () => {
    const response = await fetch(articleListsUrl)
    return await response.json()
  })()
</script>

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

<div class="pt-10 sm:pt-20 pb-3 sm:pb-6 mx-auto" id="article-img">
  <img
    src="https://datastore.thenewslens.com/infographic/us-election-2020/images-tw/read-more.png?{Math.round(Math.random() * 100000)}"
    alt="read-more" />
</div>

<div class="article-list-grid-template pb-20">
  {#await articleData}
    <p class="text-center">Loading ...</p>
  {:then articleData}
    {#each articleData.slice(0, 6) as { articletitle, articledate, articleimage, articleid }}
      <div class="my-4 shadow">
        <div class="overflow-hidden">
          <a
            href={`https://www.thenewslens.com/${articleid}?utm_source=TNL-interactive&utm_medium=article-zone&utm_campaign=${projectName}`}
            target="_blank"
            rel="noopener noreferrer">
            <img
              class="article-lists-img hover:scale-110"
              src={articleimage}
              alt="" />
          </a>
        </div>
        <span class="article-lists-date">{articledate}</span>
        <a
          href={`https://www.thenewslens.com/${articleid}?utm_source=TNL-interactive&utm_medium=article-zone&utm_campaign=${projectName}`}
          target="_blank"
          rel="noopener noreferrer">
          <h3 class="article-lists-h3 hover:text-blue-800">{articletitle}</h3>
        </a>
      </div>
    {/each}
  {:catch error}
    <p class="text-center">An error occurred!</p>
  {/await}
</div>
