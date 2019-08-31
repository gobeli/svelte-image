<script>
  let loaded = false,
    style,
    visible;

  $: style = `width: ${width || 'auto'}; height: ${height || 'auto'}`;
  $: containerClass = `image-container ${$$props.class || ''}`;
  $: aspectRatio = image.width / image.height;
  $: tagStyle = `width: 100%; padding-bottom: ${100 / aspectRatio}%`;

  export let image, alt, width, height;
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
    opacity: 0;
    height: 100%; 
    width: 100%;
    max-height: 100%;
    max-width: 100%;
    object-fit: cover;
    object-position: center;
  }
  img.placeholder {
    transition-delay: 0.25s;
  }
  img.shown {
    opacity: 1;
  }
</style>

<div class={containerClass} {style}>
  <div style={tagStyle}></div>
  <img class="placeholder" class:shown={!loaded} src={image.placeholder} {alt} />
  <img
    class:shown={loaded}
    src={image.src}
    {alt}
    on:load={() => (loaded = true)} />
</div>