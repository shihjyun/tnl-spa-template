<script>
  import NavBar from './shared/NavBar.svelte';
  import Footer from './shared/Footer.svelte';
  import CreatorList from './shared/CreatorList.svelte';
  import MobileDetector from './utils/MobileDetector.svelte';
</script>

<!-- utils components -->
<MobileDetector />

<!-- content -->
<main>
  <NavBar />
  <article class="main-grid-template">
    <section class="grid-full-cols">
      <div class="w-full" style="max-width: 560px">
        <h1 class=" text-green-800 text-center pt-4">TNL Graphic</h1>
        <p class=" pt-4">
          Lorem ipsum dolor sit, amet consectetur adipisicing elit. Cum magni, quidem doloribus optio est, nisi
          excepturi necessitatibus rem quis molestias et? Quibusdam dolorum voluptate sunt laudantium, doloremque
          perspiciatis doloribus officiis?
        </p>
      </div>
    </section>
  </article>
  <!-- creator -->
  <div class="grid-full-cols" style="background-color: #4D4D4D;">
    <div class="container-width mx-auto">
      <CreatorList />
    </div>
  </div>
  <!-- footer -->
  <Footer />
</main>
