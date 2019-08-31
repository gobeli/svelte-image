<script>
	// Photo by Omar Rodriguez on Unsplash
	import unsplash1 from './assets/unsplash-1.jpg';
	// Photo by Etienne Gobeli on Unsplash
	import unsplash2 from './assets/unsplash-2.jpg';

	import Image from '../src/Image.svelte';

	export let name;
</script>

<style>
	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr 1fr;
		grid-gap: 20px;
	}
	.bigImage {
		height: 100%;
		grid-column: 2;
		grid-row: 1 / span 2;
	}
	.container {
		max-width: 768px;
		margin: auto;	
		margin-bottom: 50px;	
	}
</style>

<div class="container">
	<h1>Example 1:</h1>
	<Image image={unsplash1} />
	<h1>Example 2:</h1>
	<div class="grid">
		<Image image={unsplash1} />
		<Image image={unsplash1} />
		<div class="bigImage">
			<Image height="100%" image={unsplash2} />
		</div>
	</div>
</div>
