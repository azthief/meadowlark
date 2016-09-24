var fortunes = [
	'You foolish',
	'I am hungry',
	'Do not fear it',
	'Watch the tv shows'
];

exports.getFortune = function() {
	return fortunes[Math.floor(Math.random() * fortunes.length)];
};