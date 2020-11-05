<script>
  import { isMobile } from '../stores/DeviceDetectorStore.js';

  export let minWidth = 500;
  // media query event handler
  if (matchMedia) {
    const mq = window.matchMedia(`(min-width: ${minWidth}px)`);
    mq.addListener(WidthSizeChange);
    WidthSizeChange(mq);
  }

  // mobile detector when window's width size change
  function WidthSizeChange(mq) {
    if (mq.matches) {
      isMobile.set(false);
    } else {
      isMobile.set(true);
    }
  }
</script>
