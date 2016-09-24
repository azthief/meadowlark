var cluster = require('cluster');
function startWorker() {
	var worker = cluster.fork();
	console.log('CLUSTER: Worker %d stared', worker.id);
}

console.log(cluster.isMaster);

if(cluster.isMaster) {
	require('os').cpus().forEach(function(){
		startWorker();
	});

	cluster.on('disconnect', function(worker){
		console.log('CLUSTER: Worker %d disconnected from the cluster', worker.id);
	});

	cluster.on('exit', function(worker, code, signal){
		console.log('CLUSTER: Worker %d died with exit code %d (%s)', worker.id, code, signal);
		startWorker();
	});
} else {
	console.log('else..........');
	require('./app.js')();
}