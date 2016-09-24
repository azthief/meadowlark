var express = require('express');
var app = express();

app.set('port', 3000);

function startServer() {
	app.listen(app.get('port'), function() {
		console.log('Express started in ' + app.get('env') + 'mode on http://localhost:' + app.get('port') );
	});
}

if(require.main === module) {
	startServer();
} else {
	module.exports = startServer;
}

// app.use(function(req, res, next){
// 	var cluster = require('cluster');
// 	if(cluster.isWorker) console.log('Worker %d received request', cluster.worker.id);
// });

app.get('/', function(req, res) {
	console.log('Hello');
	res.send('Hello');
});

app.get('/epic-fail', function(req, res){
	process.nextTick(function(){
		throw new Error('kaboom!');
	});
});