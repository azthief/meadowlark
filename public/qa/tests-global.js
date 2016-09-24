suite('Global Tests', function() {
	test('page has a valid title', function() {
		console.log(document.title);
		assert(document.title && document.title.toUpperCase() !== 'TODO'
			&& document.title.match(/\S/) );
	});
});