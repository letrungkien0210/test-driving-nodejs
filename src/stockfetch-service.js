const http = require('http');
const querystring = require('querystring');
const StockFetch = require('./stockfetch');

const handler = function(req, res){
    const symbolsString = querystring.parse(req.url.split('?')[1]).s || '';

    if(symbolsString!== ''){
        const stockfetch = new StockFetch();
        const tickers = symbolsString.split(',');
        
        stockfetch.reportCallback = function(prices, errors){
            res.end(JSON.stringify({ prices, errors}));
        };

        stockfetch.processTickers(tickers);
    } else {
        res.end('invalid query, use format ? s=SYM1,SYM2');
    }
};

http.createServer(handler).listen(3001);