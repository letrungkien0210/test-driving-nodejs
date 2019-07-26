const http = require('https');

const getPriceTrial = function(ticker){
    const options = {
        host: 'query1.finance.yahoo.com',
        path: `/v7/finance/download/${ticker}?period1=1532563869&period2=1564099869&interval=1d&events=history&crumb=UZCvuJz9gPx`,
        method: 'GET',
        headers: {
            "Cookie": 'APID=UP25707bc1-6911-11e9-8ad3-02b779cd917c; T=z=MYrHdBMsSMdBSBwlOb5jqNOMzc2MQY1Mk9OMjFOME8wMDM3Mj&a=QAE&sk=DAAQZ1g3g9Yjg2&ks=EAAxXLi3siz6VyFXBEtk4E0Hg--~G&kt=EAAdAgWK9KgnKlwhRSsE9w7Dw--~I&ku=FAAnDl3kDOyiB0n.c8lEyDKLxycoiSAmG5hNU6mK1DMEvkRjWqhY941tat5fmodYSOVmqLISsljFrgqAaA8ZoseDtwKqw06OzT1lFxddiEkeRzmH7AjOkkWIjlyUQ0oA_hspqw5uBdXXyCfKXg7XOiA3tgrvbMnkfVkpmdwwlDApmE-~A&d=bnMBeWFob28BZwFFQlFJQ0JVUzNMSldDUlhBSUQ3TzJBRDVFWQFzbAFOREF4TmdFeU5UZzVOVFk1TnpnM056UXdOVEF6T0EtLQFhAVFBRQFhYwFBRUdiZTNLYgFsYXQBTVlySGRCAWNzAQFzYwFkZXNrdG9wX3dlYgFmcwF2NFVWeWxWZEhyWU0BenoBTVlySGRCQTdF&af=JnRzPTE1NjIyOTM3NzImcHM9OUpWOTY2b1A0Y1gwdWMxWnBKZE9RZy0t; F=d=0Ppy0bA9vKWJBEJyhYEaG7vU49aVWrm8eFGVhHSPow--; PH=fn=RQlnCBB73Ll.66nPDpk-&l=en-US&i=us; Y=v=1&n=4jlhjs5gdn6uv&l=a42e3ed_a4d/o&p=m2p0c1p00000000&r=k4&intl=us; AO=u=1; GUC=AQEAAQJdH_1d-kIaNwOv&s=AQAAACJFygd2&g=XR62Gw; ucs=tr=1564185033000; PRF=t%3DBTC-USD; APIDTS=1564100262; B=285n7ldec9405&b=4&d=bqsnDtxpYELbCAxJF0hTsj50xuXM048GIzGE4Q--&s=lu&i=goplCBeh.vm6fFNkpa7M'
        }
    }

    const req = http.request(options,
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

    req.end();
};

getPriceTrial('GOOG');
getPriceTrial('INVALID');