<script>
  export let bgColor = 'black';
  export let projectName = '';
  export let copyRightColor = 'white';
  export let homePageUrl = 'https://www.thenewslens.com/';
  export let tnlLogoUrl = 'https://datastore.thenewslens.com/infographic/assets/tnl-logo/tnl-footer-dark-bg-logo.png';
</script>

<footer>
  <div class="text-center p-8 text-white font-light tracking-wide" style="background-color: {bgColor};">
    <a href={homePageUrl}>
      <figure class="mx-auto my-2">
        <img
          class="mx-auto my-2"
          width="250px"
          src={`${tnlLogoUrl}?utm_source=TNL-interactive&utm_medium=footer&utm_campaign=${projectName}`}
          alt="tnl-white-logo"
        />
      </figure>
    </a>
    <div class="text-xs md:text-sm pt-2" style="color: {copyRightColor}">Copyright © 2020 The News Lens 關鍵評論</div>
  </div>
</footer>
