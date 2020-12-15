<style>
  .creator-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-column-gap: 20px;
    justify-items: center;
  }
</style>

<script>
  export let bgColor = '#4D4D4D';
  export let englishVersion = false;
  export let creators = [
    {
      work: '製作',
      name: ['Steven Yeo、Steven Yeo'],
    },
    {
      work: '監製',
      name: ['Steven Yeo、Steven Yeo'],
    },
  ];

  const teamText = englishVersion ? 'Production Team' : '製作團隊';
</script>

<div class="mx-auto" style="background-color: {bgColor};">
  <div class="text-center text-white font-light pt-6 pb-6">
    <h4 class="text-lg sm:text-2xl leading-normal tracking-wide text-white font-light pb-3">{teamText}</h4>
    <div class="creator-grid inline-block text-left text-sm sm:text-base px-4 content-center">
      {#each creators as { work, name }}
        <div class="col-start-1 col-end-2 ml-auto pt-1">{work}</div>
        <div class="col-start-2 col-end-3 mr-auto pt-1" style="word-break: keep-all;">
          {@html name}
        </div>
      {/each}
    </div>
    {#if !englishVersion}<span class="block text-sm sm:text-base mt-3">（姓名依筆劃排序）</span>{/if}
  </div>
</div>
