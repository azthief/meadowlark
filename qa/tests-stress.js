var loadtest = require('loadtest');
var expect = require('chai').expect;

suite('Stress tests', function(){
	test('Homepage should handle 50 requests in a second'
		, function(done){
		var options = {
			url: 'http://localhost:3000',
			concurrency: 4,
			maxRequests: 500
		};
		loadtest.loadTest(options, function(err, result){
			expect(!err);
			expect(result.totalTimeSecondes < 1);
			done();
		});
	});
});