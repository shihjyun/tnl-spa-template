<style>
  img {
    width: 220px;
  }
</style>

<script>
  import SocialBox from './SocialBox.svelte'
  export let homePageUrl = 'https://www.thenewslens.com/'
  export let socialIconColor = '#807F80'
</script>

<header class="relative flex justify-between bg-white py-2 px-2 shadow z-10">
  <div class="inline-block">
    <a href={homePageUrl}>
      <figure class="ml-2">
        <img src="https://image3.thenewslens.com/assets/web/publisher-photo-1.png" alt="Tne News Lens logo" />
      </figure>
    </a>
  </div>
  <div class="inline-block">
    <SocialBox {socialIconColor} />
  </div>
</header>

