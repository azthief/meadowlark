var app = require('express')();

app.use(function(req, res, next){
	console.log('\n\nAllways');
	next();
});

app.get('/a', function(req, res){
	console.log('/a: route terminated');
	res.send('a');
});

app.get('/b', function(req, res, next){
	console.log('/b: route not terminated');
	next();
});

app.use(function(req, res, next){
	console.log('SOMETIMES');
	next();
});

app.get('/b', function(req, res, next){
	console.log('/b (part2): error throw');
	throw new Error('b failed');
});

app.use('/b', function(err, req, res, next){
	console.log('/b error detected and passed on');
	next(err);
});

app.get('/c', function(err, req){
	console.log('/c: error throw');
	throw new Error('c failed');
});

app.use('/c', function(err, req, res, next){
	console.log('/c Error detected but not passed on');
	next(err);
});

app.use(function(err, req, res, next){
	console.log('unhandled error detected: '+err.message);
	res.send('500 - server error');
});

app.use(function(req, res){
	console.log('route not handled');
	res.send('404 - not found');
});

app.listen(3000, function(){
	console.log('listening on 30000');
});