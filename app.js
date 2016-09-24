var express = require('express');
var exphbs = require('express-handlebars');
var fortune = require('./lib/fortune');
var credentials = require('./credentials');
var cartValidation = require('./lib/cartValidation.js');
var nodemailer = require('nodemailer');
var formidable = require('formidable');
var fs = require('fs');
var vhost = require('vhost');
// var admin = express.Router();
var app = express();
var autoViews = {};

var rest = require('connect-rest');
var apiOptions = {
	context: '/api',
	domain: require('domain').create()
};

// app.use(vhost('admin.*', admin));

var mailTransport = nodemailer.createTransport('SMTP', {
	service: 'Gmail',
	auth: {
		user: credentials.gmail.user,
		pass: credentials.gmail.password,
	}
});

// var mailTransport = nodemailer.createTransport('SMTP', {
// 	host: 'smtp.meadowlarktravel.com',
// 	secureConnection: true,
// 	port: 465,
// 	auth: {
// 		user: credentials.gmail.user,
// 		pass: credentials.gmail.password,
// 	}
// });

// mailTransport.sendMail({
// 	from: '"Meadowlark Travel" <info@meadowlarktravel.com>',
// 	to: 'choiyg81@gmail.com',
// 	subject: 'Your Meadowlark Travel Tour',
// 	text: 'Thank you for booking your trip with Meadowlark Travel.'
// }, function(err) {
// 	if(err) console.error('Unable to send email: ' + err);

// });
var mongoose = require('mongoose');
var opts = {
	server:{
		socketOptions: {keepAlive:1}
	}
};
switch(app.get('env')){
	case 'development':
		mongoose.connect(credentials.mongo.development.connectionString, opts);
		console.log('Connected on Development DB');
		break;
	case 'production':
		mongoose.connect(credentials.mongo.production.connectionString, opts);
		console.log('Connected on Production DB');
		break;
	default:
		throw new Error('Unknown execution environment: ' + app.get('env'));
}

var handlebars = require('express3-handlebars').create({
	defaultLayout: 'main',
	helpers: {
		static: function(name) {
			return require('./lib/static.js').map(name);
		}
	}
});

var Vacation = require('./models/vacation.js');

Vacation.find(function(err, vacations){
	if(err) return console.error(err);

	console.log(vacations.length);

	if(vacations.length) return;

    new Vacation({
        name: 'Hood River Day Trip',
        slug: 'hood-river-day-trip',
        category: 'Day Trip',
        sku: 'HR199',
        description: 'Spend a day sailing on the Columbia and ' + 
            'enjoying craft beers in Hood River!',
        priceInCents: 9995,
        tags: ['day trip', 'hood river', 'sailing', 'windsurfing', 'breweries'],
        inSeason: true,
        maximumGuests: 16,
        available: true,
        packagesSold: 0,
    }).save();

    new Vacation({
        name: 'Oregon Coast Getaway',
        slug: 'oregon-coast-getaway',
        category: 'Weekend Getaway',
        sku: 'OC39',
        description: 'Enjoy the ocean air and quaint coastal towns!',
        priceInCents: 269995,
        tags: ['weekend getaway', 'oregon coast', 'beachcombing'],
        inSeason: false,
        maximumGuests: 8,
        available: true,
        packagesSold: 0,
    }).save();

    new Vacation({
        name: 'Rock Climbing in Bend',
        slug: 'rock-climbing-in-bend',
        category: 'Adventure',
        sku: 'B99',
        description: 'Experience the thrill of rock climbing in the high desert.',
        priceInCents: 289995,
        tags: ['weekend getaway', 'bend', 'high desert', 'rock climbing', 'hiking', 'skiing'],
        inSeason: true,
        requiresWaiver: true,
        maximumGuests: 4,
        available: false,
        packagesSold: 0,
        notes: 'The tour guide is currently recovering from a skiing accident.',
    }).save();
});



app.set('port', process.env.PORT || 3000);

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');


app.use('/api', require('cors')());

//Domain
app.use(function(req ,res, next){
	var domain = require('domain').create();
	domain.on('error', function(err){
		console.error('DOMAIN Error Caught\n', err.stack);
		try{
			setTimeout(function(){
				console.error('Failsafe Shutdown');
				process.exit(1);
			},5000);

			var worker = require('cluster').worker;
			if(worker) worker.disconnect();

			server.close();
			try{
				next(err);
			}catch(err){
				console.error('Express error mechanism failed.\n', err.stack);
				res.statusCode = 500;
				res.setHeader('content-type', 'text/plain');
				res.end('Server error.');
			}

		}catch(err){
			console.error('Unable to send 500 response.\n', err.stack);
		}
	});
	domain.add(req);
	domain.add(res);

	domain.run(next);
});


app.use(express.static(__dirname + '/public'));

console.log(app.get('env'));


switch(app.get('env')) {
	case 'development':
		app.use(require('morgan')('dev'));
		break;
	case 'production':
		app.use(require('express-logger')({
			path: __dirname + '/log/requests.log'
		}));
		break;
}


app.use(function(req, res, next) {
	res.locals.showTests = app.get('env') !== 'production' && req.query.test === '1';
	next();
});

app.use(require('body-parser').urlencoded({extended: true}));

//middleware
app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(require('express-session')({
	resave: false,
	saveUninitialized: false,
	secret: credentials.cookieSecret
}));

app.use(function(req, res, next){
	res.locals.flash = req.session.flash;
	delete req.session.flash;getWeatherData();
	next();
});

var VALID_EMAIL_REGEX = new RegExp(
	'^[a-zA-Z0-9.!#$%&\'*+\/=?^_`{|}~-]+@' +
	'[a-zA-Z0-9](?:[a-zA-Z0-9]{0,61}[a-zA-Z0-9])?' +
	'(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9]{0,61}[a-zA-Z0-9])?)+$'
	);


//Session-Mongoose

// var sessionStore = new MongoSessionStore({url: credentials.mongo[app.get('env')].connectionString});

// app.use(require('cookie-parse')(credentials.cookieSecret));
// app.use(require('express-session')({
// 	resave: false,
// 	saveUninitialized: false,
// 	secret: credentials.cookieSecret,
// 	store: sessionStore
// }));

var dataDir = __dirname + '/data';
var vacationPhotoDir = dataDir + '/vacation-photo';
if(!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if(!fs.existsSync(vacationPhotoDir)) fs.mkdirSync(vacationPhotoDir);

//File
app.post('/contest/vacation-photo/:year/:month', function(req, res){
	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields, files) {
		if(err) return res.redirect(303, '/error');
		if(err) {
			res.session.flash = {
				type: 'danger',
				intro: 'Oops!',
				message: 'There was an error processing your submission. Please try again.',
			};
			return res.redirect(303, '/contest/vacation-photo');
		}

		var photo = files.photo;
		var dir = vacationPhotoDir + '/' + Date.now();
		var path = dir + '/' + photo.name;
		fs.mkdirSync(dir);


		fs.renameSync(photo.path, dir + '/' + photo.name);
		saveContestEntry('vacation-photo', fields.email, req.params.year, req.params.month, path);
		req.session.flash = {
			type: 'success',
			intro: 'Good luck!',
			message: 'You have been entered into the contest',
		};
		return res.redirect(303, '/contest/vaction-photo/entries');
	});
});

function saveContestEntry(contentName, email, year, month, photoPath) {

}


//Models
var VacationInSeasonListener = require('./models/vacationInSeasonListener.js');


//Router
require('./routes.js')(app);

//image Thumbnail
var jqupload = require('jquery-file-upload-middleware');
app.use('/upload', function(req, res, next){
	var now = Date.now();
	jqupload.fileHandler({
		uploadDir: function() {
			return __dirname + '/public/uploads/' + now;
		},
		uploadUrl: function(){
			return '/uploads/' + now;
		}
	})(req, res, next);
});



app.get('/fail', function(req, res){
	throw new Error('Nope!');
});

app.get('/epic-fail', function(req, res){
	process.nextTick(function(){
		throw new Error('kaboom!');
	});
});


app.use(function(req, res, next){
	var path = req.path.toLowerCase();
	if(autoViews[path]) return res.render(autoViews[path]);
	if(fs.existsSync(__dirname + '/views' + path + '.handlebars')){
		autoViews[path] = path.replace(/^\//, '');
	}
	next();
});

var Attraction = require('./models/attraction.js');
app.get('/api/attractions', function(req, res){
	Attraction.find({approved: true}, function(err, attractions){
		if(err) return res.status(500).send('Error occured: database error');
		res.json(attractions.map(function(a){
			return {
				name: a.name,
				id: a._id,
				description: a.description,
				location: a.location
			};
		}));
	});
});

app.post('/api/attraction', function(req, res){
	var a = new Attraction({
		name: req.body.name,
		description: req.body.description,
		location: {lat: req.body.lat, lng: req.body.lng},
		history: {
			event: 'created',
			email: req.body.email,
			date: new Date(),
		},
		approved: false
	});

	a.save(function(err, a){
		if(err) return res.status(500).send('Error occurred: database error.');
		res.json({id: a._id});
	});
});

app.get('/api/attraction/:id', function(req, res){
	Attraction.findById(req.params.id, function(err, a){
		if(err) return res.status(500).send('Error occured: database error');
		res.json({
			name: a.name,
			id: a._id,
			description: a.description,
			location: a.location
		});
	});
});

// app.use(rest.rester(apiOptions));

//Custom 404 page
app.use(function(req, res){
	res.status(404);
	res.render('404');
});

//Custom 500 Page
app.use(function(err, req, res, next) {
	console.error(err.stack);
	res.status(500);
	res.render('500');
});

function getWeatherData() {
	return {
		locations: [
			{
				name: 'Portland',
				forecastUrl: 'http://wunderground.com/US/OR/Portland.html',
				iconUrl: 'httop://icon-ak.wxug.com/i/c/k/cloudy.gif',
				weather: 'Overcast',
				temp: '54.1 F (12.3 C)',
			},
			{
				name: 'Bend',
				forecastUrl: 'http://wunderground.com/US/OR/Portland.html',
				iconUrl: 'httop://icon-ak.wxug.com/i/c/k/cloudy.gif',
				weather: 'Overcast',
				temp: '54.1 F (12.3 C)',
			},
			{
				name: 'Manzanita',
				forecastUrl: 'http://wunderground.com/US/OR/Portland.html',
				iconUrl: 'httop://icon-ak.wxug.com/i/c/k/cloudy.gif',
				weather: 'Overcast',
				temp: '54.1 F (12.3 C)',
			}						
		]
	};
}

app.use(function(req, res, next){
	if(!res.locals.partials) res.locals.partials = {};
	res.locals.partials.weatherContext = getWeatherData();
	console.log(res.locals.partials.weatherContext);
	next();
});




var server = app.listen(app.get('port'), function() {
	console.log('Express stated on http://localhost:' + app.get('port'));
});