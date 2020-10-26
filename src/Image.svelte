<script>
  import { onMount } from 'svelte'
  import { observe } from './intersection.service'

  let style,
    source,
    imageEl

  onMount(async () => {
    source = image.placeholder
    await observe(imageEl)
    source = image.src
  })

  $: style = `width: ${width || 'auto'}; height: ${height || 'auto'}`
  $: containerClass = `image-container ${$$props.class || ''}`
  $: aspectRatio = image.width / image.height
  $: tagStyle = `width: 100%; padding-bottom: ${100 / aspectRatio}%`

  export let image, alt, width, height
</script>

<style>
  .image-container {   
    position: relative;
    overflow: hidden;
  }
  img {
    position: absolute;
    top: 0;
    left: 0;
    transition: opacity 0.5s ease;
    height: 100%; 
    width: 100%;
    max-height: 100%;
    max-width: 100%;
    object-fit: cover;
    object-position: center;
  }
</style>

<div class={containerClass} {style}>
  <div style={tagStyle}></div>
  <img
    bind:this={imageEl}
    src={source}
    {alt} />
</div>