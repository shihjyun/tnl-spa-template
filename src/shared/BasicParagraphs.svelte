<style>
  figcaption {
    margin: 0 10px;
    font-size: 12px;
    letter-spacing: 0.05em;
    padding: 0 0 3px 0;
    color: #777;
    line-height: 1.5rem;
    max-width: 650px;
    border-bottom: dashed 1px #ccc;
  }

  @media (min-width: 640px) {
    figcaption {
      font-size: 16px;
      letter-spacing: 0.05em;
      margin: 0 auto;
      padding: 0 7px 7px 7px;
      color: #777;
      line-height: 1.5rem;
      max-width: 650px;
      border-bottom: dashed 1px #ccc;
    }
  }
</style>

<script>
  import ContentDataStore from '../stores/ContentDataStore.js';

  // the object name this section need to query
  export let sectionName = 'testing';

  let basicPragraphsData;

  // check store has fetched content data from GCS
  $: if ($ContentDataStore) {
    basicPragraphsData = $ContentDataStore[sectionName];
  }
</script>

<div class="basic-p-container">
  <!--  check store has fetched content data from GCS -->
  {#if $ContentDataStore}
    {#each basicPragraphsData as { type, value }}
      {#if type === 'text'}
        <p>{value}</p>
      {:else if type === 'subtitle'}
        <h3>{value}</h3>
      {:else if type === 'image'}
        <figure class="img-wrapper">
          <img src={value.url} alt={value.discription} />
          <figcaption>{value.note}</figcaption>
        </figure>
      {/if}
    {/each}
  {/if}
</div>
