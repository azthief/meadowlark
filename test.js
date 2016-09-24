var app = require('express')();

app.use(express.static);
console.log(express.static());

app.listen(3000, function() {
	console.log('Listening on 3000');
});