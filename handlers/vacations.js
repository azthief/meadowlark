exports.	convertFromUSD = function convertFromUSD(value, curr) {
	switch(curr) {
		case 'USD': return value * 1;
		case 'GBP': return value * 0.6;
		case 'BTC': return value * 0.00237;
		default: return NaN;
	}
};