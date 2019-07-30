const Stockfetch = require('./stockfetch');

const onError = function(error) { console.log(error); };

const display = function(prices, errors) {
    const print = function(data) { console.log(data[0] + `\t` + data[1]) };

    console.log('Prices for ticker symbols;');
    prices.forEach(print);

    console.log('Ticker symbols with error:');
    errors.forEach(print);
}

new Stockfetch().getPriceForTickers('mixedTickers.txt', display, onError);
