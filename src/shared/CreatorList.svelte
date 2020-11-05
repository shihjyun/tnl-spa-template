<script>
  export let items = [
    {
      work: '文字內容',
      name: ['林宜萱、羅元祺<br/>Nicholas Haggerty<br/>Daphne K. Lee'],
    },
    {
      work: '網頁設計',
      name: ['林奕甫、高嘉宏<br/>黃彥翔、楊時鈞'],
    },
    {
      work: '網頁工程',
      name: ['楊時鈞'],
    },
    {
      work: '影音製作',
      name: ['李漢威、高丞澔<br/>鄭宇軒'],
    },
    {
      work: '共同監製',
      name: ['翁世航、黃筱歡<br/>楊士範'],
    },
  ]
</script>

<style>
  .creator-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-column-gap: 20px;
    justify-items: center;
  }
</style>

<div class="text-center text-white font-light pb-6">
  <h2 class="text-white font-light pt-6 pb-3">製作團隊</h2>
  <div
    class="creator-grid inline-block text-left text-sm sm:text-base px-4 content-center">
    {#each items as { work, name }}
      <div class="col-start-1 col-end-2 ml-auto pt-1">{work}</div>
      <div
        class="col-start-2 col-end-3 mr-auto pt-1"
        style="word-break: keep-all;">
        {@html name}
      </div>
    {/each}
  </div>
  <span class="block text-sm sm:text-base mt-3">（姓名依筆劃排序）</span>
</div>
