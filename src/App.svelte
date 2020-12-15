<style>
  .container-width {
    width: 100%;
  }
</style>

<script>
  import Header from './common/Header.svelte';
  import Footer from './common/Footer.svelte';
  import BasicParagraphs from './common/BasicParagraphs.svelte';
  import TeamCreatorList from './common/TeamCreatorList.svelte';
  import MobileDetector from './utils/MobileDetector.svelte';
  import ArticleList from './common/ArticleList.svelte';
  import SocialBoxInArticle from './common/SocialBoxArticle.svelte'
  import ContentDataStore from './stores/ContentDataStore.js'

  window.onbeforeunload = function () {
    window.scrollTo(0, 0)
  }
</script>

<!-- utils components -->
<MobileDetector />

<!-- content -->
<Header />
<main>
  <article class="main-grid-template">
    <section class="container-width mx-auto grid-full-cols">
      <BasicParagraphs sectionName="intro" />
    </section>
  </article>
  {#if $ContentDataStore}
  <!-- read more -->
  <div class="text-center text-lg mx-auto pt-10 px-8 sm:px-12 sm:p-0" style="max-width: 530px">分享這篇文章</div>
  <SocialBoxInArticle shareUrl={$ContentDataStore.article_url} />
  <h2 class="text-center font-bold text-lg sm:text-2xl text-black pt-12">推薦文章</h2>
    <ArticleList projectName={$ContentDataStore.project_name} articleData={$ContentDataStore.read_more_articles} />
  {/if}
</main>
<!-- footer -->
<Footer />
