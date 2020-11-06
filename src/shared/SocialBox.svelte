<script>
  import { onMount } from 'svelte';
  import { isMobile } from '../stores/DeviceDetectorStore.js';
  export let shareUrl;
  export let tnlDomainPageId;
  export let socialIconColor = '#484748';

  let webShareIcon;

  // detect if user is using facebook in-app browser
  function isFacebookApp() {
    var ua = navigator.userAgent || navigator.vendor || window.opera;
    return ua.indexOf('FBAN') > -1 || ua.indexOf('FBAV') > -1;
  }

  onMount(() => {
    // if user is on mobile device add event listener to 'mobile-share-icon' element
    if ($isMobile && !isFacebookApp()) {
      webShareIcon = document.getElementById('mobile-share-icon');
      webShareIcon.addEventListener('click', async () => {
        if (navigator.share) {
          navigator
            .share({
              url: tnlDomainPageId,
            })
            .then(() => console.log('successful share!'))
            .catch((error) => console.log('error sharing!', error));
        }
      });
    }
  });
</script>

{#if $isMobile && !isFacebookApp()}
  <div class="px-2" id="mobile-share-icon">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 20.44 23.36"><path
        d="M18.33,15a4.36,4.36,0,0,0-2.72.95L10.93,13a4.35,4.35,0,0,0,0-1.9l4.68-2.92A4.38,4.38,0,1,0,14,4.78a4.26,4.26,0,0,0,.11,1L9.38,8.65a4.38,4.38,0,1,0,0,6.86l4.68,2.92a4.33,4.33,0,0,0-.11.95A4.38,4.38,0,1,0,18.33,15Z"
        transform="translate(-2.27 -0.4)"
        style="fill:{socialIconColor}"
      /></svg>
  </div>
{:else}
  <div class="flex mx-auto">
    <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} target="_blank" class="px-2 hover-opacity">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 23.5 23.5"><path
          d="M11.75,0a11.8,11.8,0,0,0-2,23.42V14.26H7V11H9.79V8.53c0-2.82,1.72-4.35,4.22-4.35a23.11,23.11,0,0,1,2.53.13V7.25H14.8c-1.36,0-1.62.65-1.62,1.61V11h3.25L16,14.26H13.18V23.5A11.8,11.8,0,0,0,11.75,0Z"
          style="fill:{socialIconColor}"
        /></svg>
    </a>
    <a href={`https://lineit.line.me/share/ui?url=${shareUrl}`} target="_blank" class="px-2 hover-opacity">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path
          d="M18.8,0H5.2A5.2,5.2,0,0,0,0,5.2V18.8A5.2,5.2,0,0,0,5.2,24H18.8A5.2,5.2,0,0,0,24,18.8V5.2A5.2,5.2,0,0,0,18.8,0Zm0,15.31A28.29,28.29,0,0,1,12,20.38c-.93.39-.79-.25-.76-.47s.13-.75.13-.75a1.76,1.76,0,0,0,0-.79c-.1-.24-.48-.37-.77-.43-4.2-.55-7.31-3.49-7.31-7C3.22,7,7.14,3.85,12,3.85S20.7,7,20.7,10.94a6.34,6.34,0,0,1-1.87,4.37Z"
          style="fill:{socialIconColor}"
        />
        <path
          d="M10.19,9.06H9.57a.17.17,0,0,0-.17.17V13a.17.17,0,0,0,.17.17h.62a.17.17,0,0,0,.17-.17V9.23a.17.17,0,0,0-.17-.17"
          style="fill:{socialIconColor}"
        />
        <path
          d="M14.4,9.06h-.61a.17.17,0,0,0-.17.17v2.26L11.88,9.13l0,0h-.74a.17.17,0,0,0-.17.17V13a.17.17,0,0,0,.17.17h.61a.17.17,0,0,0,.18-.17V10.77l1.74,2.36a.1.1,0,0,0,0,0h.7a.16.16,0,0,0,.17-.17V9.23a.16.16,0,0,0-.17-.17"
          style="fill:{socialIconColor}"
        />
        <path
          d="M8.71,12.25H7v-3a.16.16,0,0,0-.17-.17H6.26a.17.17,0,0,0-.17.17V13a.17.17,0,0,0,0,.12h0a.21.21,0,0,0,.12,0H8.71A.17.17,0,0,0,8.88,13v-.61a.18.18,0,0,0-.17-.17"
          style="fill:{socialIconColor}"
        />
        <path
          d="M17.79,10A.18.18,0,0,0,18,9.84V9.23a.17.17,0,0,0-.17-.17H15.34a.16.16,0,0,0-.12,0h0a.17.17,0,0,0-.05.12V13a.17.17,0,0,0,.05.12h0a.17.17,0,0,0,.12,0h2.45A.17.17,0,0,0,18,13v-.61a.18.18,0,0,0-.17-.17H16.12v-.64h1.67a.18.18,0,0,0,.17-.17v-.62a.18.18,0,0,0-.17-.17H16.12V10Z"
          style="fill:{socialIconColor}"
        /></svg>
    </a>
    <a href={`https://twitter.com/share?url=${shareUrl}`} target="_blank" class="px-2 hover-opacity">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 157.32 126.73"><path
          d="M162.49,38.91A65.42,65.42,0,0,1,143.93,44a32.21,32.21,0,0,0,14.2-17.74A64.79,64.79,0,0,1,137.63,34a32.2,32.2,0,0,0-55,29.19A92,92,0,0,1,16.14,29.77a31.87,31.87,0,0,0,10,42.74,32.77,32.77,0,0,1-14.64-4v.38a32.09,32.09,0,0,0,25.88,31.38,32.35,32.35,0,0,1-8.48,1.15,34.5,34.5,0,0,1-6.08-.59A32.32,32.32,0,0,0,53,123.05a65.16,65.16,0,0,1-40.09,13.69,61.75,61.75,0,0,1-7.69-.45,92.23,92.23,0,0,0,49.48,14.36c59.36,0,91.84-48.75,91.84-91,0-1.38-.05-2.77-.11-4.13a63.63,63.63,0,0,0,16.11-16.57"
          transform="translate(-5.17 -23.92)"
          style="fill:{socialIconColor}"
        /></svg>
    </a>
  </div>
{/if}
