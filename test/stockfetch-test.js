const expect = require('chai').expect;
const sinon = require('sinon');
const fs = require('fs');
const Stockfetch = require('./../src/stockfetch');

describe('Stockfetch tests', function() {
    let stockfetch, sandbox;

    this.beforeEach(function() {
        stockfetch = new Stockfetch();
        sandbox = sinon.sandbox.create();
    })

    this.afterEach(function() {
        sandbox.restore();
    })

    it('Should pass this canary test', function(){
        expect(true).to.be.true;
    })

    it('read should invoke error handler for invalid file', function(done) {
        const onError = (err) => {
            expect(err).to.be.eql('Error reading file: InvalidFile');
            done();
        }

        sandbox.stub(fs, 'readFile', function(fileName, callback) {
            callback(new Error('failed'))
        });

        stockfetch.readTickersFile('InvalidFile', onError);
    })

    it('read should invoke processTickers for valid file', function(done) {
        const rawData = "GOOG\nAAPL\nORCL\nMSFT";
        const parsedData = ['GOOG', 'AAPL', 'ORCL', 'MSFT'];

        sandbox.stub(stockfetch, 'parseTickers')
        .withArgs(rawData).returns(parsedData);

        sandbox.stub(stockfetch, 'processTickers', function(data) {
            expect(data).to.be.eql(parsedData);
            done();
        });

        sandbox.stub(fs, 'readFile', function(fileName, callback) {
            callback(null, rawData);
        })

        stockfetch.readTickersFile('tickers.txt')
    })

    it('read should return error if given file is empty', function(done) {
        const onError = function(error){
            expect(error).to.be.eql('File tickers.txt has invalid content');
            done();
        }

        sandbox.stub(stockfetch, 'parseTickers').withArgs('').returns([]);

        sandbox.stub(fs, 'readFile', function(fileName, callback) {
            callback(null, '');
        });

        stockfetch.readTickersFile('tickers.txt', onError);
    })

    it('parseTickers should return tickers', function() {
        expect(stockfetch.parseTickers("A\nB\nC")).to.be.eql(['A', 'B', 'C']);
    })

    it('parseTickers should return empty array for empty content', function() {
        expect(stockfetch.parseTickers('')).to.be.eql([]);
    })

    it('parseTickers should return empty array for white-space', function() {
        expect(stockfetch.parseTickers("  ")).to.be.eql([]);
    })

    it('parseTickers should ignore unexpected format on content', function() {
        const rawData = "AAPL \nBla h\nGOOG\n\n ";
        expect(stockfetch.parseTickers(rawData)).to.be.eql(['GOOG']);
    })

    it('processTickers should call getPrice for each ticker symbol', function() {
        const stockfetchMock = sandbox.mock(stockfetch);
        stockfetchMock.expects('getPrice').withArgs('A');
        stockfetchMock.expects('getPrice').withArgs('B');
        stockfetchMock.expects('getPrice').withArgs('C');

        stockfetch.processTickers(['A', 'B', 'C']);
        stockfetchMock.verify();
    })

    it('processTickers should save tickers count', function() {
        sandbox.stub(stockfetch, 'getPrice');

        stockfetch.processTickers(['A', 'B', 'C']);
        expect(stockfetch.tickersCount).to.be.eql(3);
    })

    it('getPrice should call get on http with valid URL',  function(done) {
        const httpSub = sandbox.stub(stockfetch.http, 'get', function(url) {
            expect(url).to.be.eql('http://ichart.finance.yahoo.com/table.csv?s=GOOG');
            done();
            return { on: function() {}};
        })

        stockfetch.getPrice('GOOG');
    })

    it('getPrice should send a response handler to get', function(done) {
        const aHandler = function() {};

        sandbox.stub(stockfetch.processResponse, 'bind')
        .withArgs(stockfetch, 'GOOG')
        .returns(aHandler);

        const httpStub = sandbox.stub(stockfetch.http, 'get', function(url, handler) {
            expect(handler).to.be.eql(aHandler);
            done();
            return { on: function() {}};
        });

        stockfetch.getPrice('GOOG');
    })

    it('getPrice should register handler for failure to reach host', function(done) {
        const errorHandler = function() {};

        sandbox.stub(stockfetch.processHttpError, 'bind')
            .withArgs(stockfetch, 'GOOG')
            .returns(errorHandler);

        const onStub = function(event, handler) {
            expect(event).to.be.eql('error');
            expect(handler).to.be.eql(errorHandler);
            done();
        }

        sandbox.stub(stockfetch.http, 'get').returns({ on: onStub});

        stockfetch.getPrice('GOOG');
    })

    it('processResponse should call parsePrice with valid data', function() {
        let dataFunction;
        let endFunction;

        const response = {
            statusCode: 200,
            on: function(event, handler) {
                if(event==='data') dataFunction = handler;
                if(event==='end') endFunction = handler;
            }
        }

        const parsePriceMock = sandbox.mock(stockfetch)
            .expects('parsePrice').withArgs('GOOG', 'some data');

        stockfetch.processResponse('GOOG', response);
        dataFunction('some ');
        dataFunction('data');
        endFunction();

        parsePriceMock.verify();
    })

    it('processResponse should call processError if response failed', function() {
        const response = { statusCode: 404 };

        const processErrorMock = sandbox.mock(stockfetch)
        .expects('processError')
        .withArgs('GOOG', 404);

        stockfetch.processResponse('GOOG', response);
        processErrorMock.verify();
    })

    it('processResponse should call processError only if response failed',function() {
        const response = {
            statusCode: 200,
            on: function () {}
        }

        const processErrorMock = sandbox.mock(stockfetch)
        .expects('processError')
        .never();

        stockfetch.processResponse('GOOG', response);
        processErrorMock.verify();
    })

    const data = "Date,Open,High,Low,Close,Volume,Adj Close\n\​2015-09-11,619.75,625.780029,617.419983,625.77002,1360900,625.77002\n\​2015-09-10,613.099976,624.159973,611.429993,621.349976,1900500,621.349976";

    it('parsePrice should update prices', function() {
        stockfetch.parsePrice('GOOG', data);

        expect(stockfetch.prices.GOOG).to.be.equal('625.77002');
    })

    it('parsePrice should call printReport', function() {
        const printReportMock = sandbox.mock(stockfetch).expects('printReport');

        stockfetch.parsePrice('GOOG', data);
        printReportMock.verify();
    })

    it('processError should update errors', function() {
        stockfetch.processError('GOOG', '...oops...');

        expect(stockfetch.errors.GOOG).to.be.eql('...oops...');
    })

    it('processError should call printReport', function() {
        const printReportMock = sandbox.mock(stockfetch).expects('printReport');

        stockfetch.processError('GOOG', '...oops...');
        printReportMock.verify();
    })

    it('printReport should send price, errors once all response arrive', function () {
        stockfetch.prices = { 'GOOG': 12.34 };
        stockfetch.errors = { 'AAPL': 'error' };
        stockfetch.tickersCount = 2;

        const callbackMock = sandbox.mock(stockfetch)
        .expects('reportCallback')
        .withArgs([['GOOG', 12.34]], [['AAPL', 'error']])

        stockfetch.printReport();
        callbackMock.verify();
    })

    it('printReport should not send before all responses arrive', function() {
        stockfetch.prices = { 'GOOG': 12.34 };
        stockfetch.errors = { 'AAPL': 'error' };
        stockfetch.tickersCount = 3;

        const callbackMock = sandbox.mock(stockfetch)
        .expects('reportCallback')
        .never();

        stockfetch.printReport();
        callbackMock.verify();
    })

    it('printReport should call sortData once for prices, once for errors', function() {
        stockfetch.prices = { 'GOOG': 12.34 };
        stockfetch.errors = { 'AAPPL': 'error' };
        stockfetch.tickersCount = 2;

        const mock = sandbox.mock(stockfetch);
        mock.expects('sortData').withArgs(stockfetch.prices);
        mock.expects('sortData').withArgs(stockfetch.errors);

        stockfetch.printReport();
        mock.verify();
    })

    it('sortData should srot the data based on the symbols', function() {
        const dataToSort = {
            'GOOG': 1.2,
            'AAPL': 2.1
        };

        const result = stockfetch.sortData(dataToSort);
        expect(result).to.be.eql([['AAPL', 2.1], ['GOOG', 1.2]]);
    })

    it('getPriceForTickers should report error for invalid file', function(done) {
        const onError = function(error){
            expect(error).to.be.eql('Error reading file: InvalidFile');
            done();
        }

        const display = function() {};

        stockfetch.getPriceForTickers('InvalidFile', display, onError);
    })

    it('getPriceForTickers should respond well for a valid file', function(done) {
        const onError = sandbox.mock().never();

        const display = function(prices, errors) {
            expect(prices.length).to.be.eql(4);
            expect(error.length).to.be.eql(4);
            onError.verify();
            done();
        }

        this.timeout(10000);

        stockfetch.getPriceForTickers('mixedTickers.txt', display, onError);
    })
});