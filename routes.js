var hdVacations = require('./handlers/vacations.js');
var hdMain = require('./handlers/main.js');

module.exports = function(app){


	app.get('/user(name)?', function(req, res){
		res.render('user');
	});
	app.get('/khaa+n', function(req, res){
		res.render('user');
	});


	// app.get('/foo', function(req, res, next){
	// 	// if(Math.random()<0.5) return next();
	// 	res.send('sometimes this');
	// });
	// app.get('/foo', function(req, res){
	// 	res.send('and sometimes that');
	// });

	// admin.get('/', function(req, res){
	// 	res.render('admin/home');
	// });

	// admin.get('/users', function(req, res){
	// 	res.render('admin/users');
	// });


	app.get('/set-currency/:currency', function(req, res){
		req.session.currency = req.params.currency;
		return res.redirect(303, '/vacations');
	});

	var Vacation = require('./models/vacation.js');
	app.get('/vacations', function(req, res){
		Vacation.find( function(err, vacations){
			var currency = req.session.currency || 'USD';
			var context = {
				currency: currency,
				vacations: vacations.map(function(vacation){
					return{
						sku: vacation.sku,
						name: vacation.name,
						description: vacation.description,
						// price: hdVacations.convertFromUSD(vacation.priceInCents/100, currency),
						inSeason: vacation.inSeason,
						qty: vacation.qty,
					};
				})

			};

			switch(currency) {
				case 'USD': context.currencyUSD = 'selected'; break;
				case 'GBP': context.currencyGBP = 'selected'; break;
				case 'BTC': context.currencyBTC = 'selected'; break;
			}

			res.render('vacations', context);
		});
	});



	app.get('/notify-me-when-in-season', function(req, res){
		res.render('notify-me-when-in-season', {sku: req.query.sku});
	});

	app.post('/notify-me-when-in-season', function(req, res){
		VacationInSeasonListener.update(
			{email:req.body.email},
			{$push: {skus: req.body.sku}},
			{upsert: true},
			function(err){
				if(err) {
					console.error(err.stack);
					req.session.flash = {
						type: 'danger',
						intro: 'Ooops!',
						message: 'There was an error processing your request.',
					};
					return res.redirect(303, '/vacations');
				}
				req.session.flash = {
					type: 'success',
					intro: 'Thank you!',
					message: 'You will be notified when this vacation is in season.'
				};
				return res.redirect(303, '/vacations');
			}
		);
	});

	app.get('/newsletter', function(req, res){
		res.render('newsletter', {csrf: 'CSRF token goes here'});
	});

	app.post('/newsletter', function(req, res){
		var name = req.body.name || '', email = req.body.email || '';
		console.log(name + '/' + email);
		if(!email.match(VALID_EMAIL_REGEX)) {
			if(req.xhr) return res.json({error: 'Invalid name email address.'});
			req.session.flash = {
				type: 'danger',
				intro: 'Validation error!',
				message: 'The email address you entered was not valid',
			};
			return res.redirect(303, '/newsletter/archive');
		}

		new NewletterSignup({name: name, email: email}).save(function(err){
			if(err) {
				if(req.xhr) return res.json({error: 'Database error.'});
			req.session.flash = {
				type: 'danger',
				intro: 'Database error!',
				message: 'There was a database error; please try again later',
				};
			return res.redirect(303, '/newsletter/archive');
			}

			if(req.xhr) return res.json({success: true});
			req.session.flash = {
				type: 'success',
				intro: 'Thank you!',
				message: 'You have now been signed up for the newsletter',
			};
			return res.redirect(303, '/newsletter/archive');
		});
	});

	app.get('/newsletter/archive', function(req, res){
		res.render('newsletter/archive');
	});

	app.post('/process', function(req, res){
		console.log('/process');
		console.log(req.xhr);
		console.log(req.accepts);
		if(req.xhr || req.accepts('json,html')==='json'){
			res.send({success: true});
		} else {
			res.redirect(303, '/thank-you');
		}
	});


	app.get('/', function(req, res){
		res.cookie('monster', 'nom nom');
		res.cookie('signed_monster', 'nom nom', {signed: true});
		req.session.userName = "choi";
		res.render('home', {
			pageTestScript: '/qa/tests-global.js'
		});
	});

	app.get('/about', function(req, res){
		res.render('about', {
			fortune: fortune.getFortune(),
			pageTestScript: '/qa/tests-about.js'
		});
	});

	app.get('/tours/hood-river', function(req, res) {
		res.render('tours/hood-river');
	});
	app.get('/tours/request-group-rate', function(req, res) {
		res.render('tours/request-group-rate');
	});

	app.get('/headers', function(req, res) {
		res.set('Content-Type', 'text/plain');
		var s = '';
		for(var name in req.headers) {
			s += name + ': ' + req.headers[name] + '\n';
		}
		 res.send(s);
	});

	app.get('/nursery-rhyme', function(req, res) {
		res.render('nursery-rhyme');
	});
	app.get('/data/nursery-rhyme', function(req, res) {
		res.json({
			animal: 'squirrel',
			bodyPart: 'tail',
			adjective: 'bushy',
			noun: 'heck'
		});
	});


	//File Upload
	app.get('/contest/vacation-photo', function(req, res){
		var now = new Date();
		res.render('contest/vacation-photo', {
			year: now.getFullYear(), month: now.getMonth()
		});
	});

};