const http = require('http');

const getPriceTrial = function(ticker){
    http.get('http://ichart.finance.yahoo.com/table.csv?s=' + ticker,
    function(response) {
        if (response.statusCode === 200) {
            let data = '';
            const getChunk = function(chunk) { data += chunk };
            response.on('data', getChunk);
            response.on('end', function() {
                console.log('received data for ' + ticker);
                console.log(data);
            })
        } else {
            console.log(ticker + ' - error getting data: ' + response.statusCode);
        }
    }).on('error', function(error) {
        console.log(ticker + ' - error getting data: ' + error.code);
    });
};

getPriceTrial('GOOG');
getPriceTrial('INVALID');