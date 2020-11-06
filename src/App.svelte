<style>
  .container-width {
    width: 100%;
  }
</style>

<script>
  import Header from './shared/Header.svelte';
  import Footer from './shared/Footer.svelte';
  import BasicParagraphs from './shared/BasicParagraphs.svelte';
  import TeamCreatorList from './shared/TeamCreatorList.svelte';
  import MobileDetector from './utils/MobileDetector.svelte';
  import ArticleList from './shared/ArticleList.svelte';
</script>

<!-- utils components -->
<MobileDetector />

<!-- content -->
<Header />
<main>
  <article class="main-grid-template">
    <section class="container-width mx-auto grid-full-cols">
      <BasicParagraphs />
    </section>
  </article>
  <!-- read more -->
  <div class="mx-auto">
    <ArticleList projectName="us-election-2020-article-lists-tc">
      <h2 class="text-center">延伸閱讀</h2>
    </ArticleList>
  </div>
</main>
<!-- creator -->
<TeamCreatorList />
<!-- footer -->
<Footer />
