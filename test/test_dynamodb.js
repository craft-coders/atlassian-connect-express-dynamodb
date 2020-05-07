var expect = require('chai').expect;
var sinon = require('sinon');
var proxyquire =  require('proxyquire');
var RSVP = require('rsvp');

describe('DynamodbAdapter', function() {
    describe('set()', function() {
        it('sample entry', async function() {
            var clientKey = "12345678-1234-1234-1234-0123456789AB";
            var key = "clientInfo";
            var value = {
                "key": "my-add-on",
                "clientKey": "12345678-1234-1234-1234-0123456789AB",
                "publicKey": "123",
                "sharedSecret": "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
                "serverVersion": "6452",
                "pluginsVersion": "1.245.0",
                "baseUrl": "https://example.atlassian.net/wiki",
                "productType": "confluence",
                "description": "Atlassian Confluence at null ",
                "eventType": "installed"
            };

            var docClient = function() {};
            var dynamodb = proxyquire('../lib/dynamodb', {'aws-sdk': {DynamoDB: {DocumentClient: docClient}}});

            docClient.prototype.put = function(params, callback) {
                expect(params).to.deep.equal({
                    "TableName": "tenants",
                    "Item": {
                        "clientKey": "12345678-1234-1234-1234-0123456789AB",
                        "key": "clientInfo",
                        "val": value
                    }
                });
                callback(null);
            };

            var logger = {};
            var options = {"table": "tenants"};

            var adapter = dynamodb(logger, options);

            var result = await adapter.set(key, value, clientKey);
            expect(result).to.equal(value);
        }).timeout(10000);
    });

    describe('get()', function() {
        it('existing property', async function() {
            var clientKey = "12345678-1234-1234-1234-0123456789AB";
            var key = "clientInfo";
            var value = {
                "key": "my-add-on",
                "clientKey": "12345678-1234-1234-1234-0123456789AB",
                "publicKey": "123",
                "sharedSecret": "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
                "serverVersion": "6452",
                "pluginsVersion": "1.245.0",
                "baseUrl": "https://example.atlassian.net/wiki",
                "productType": "confluence",
                "description": "Atlassian Confluence at null ",
                "eventType": "installed"
            };

            var docClient = function() {};
            var dynamodb = proxyquire('../lib/dynamodb', {'aws-sdk': {DynamoDB: {DocumentClient: docClient}}});

            docClient.prototype.get = function(params, callback) {
                expect(params).to.deep.equal({
                    "TableName": "tenants",
                    "Key": {
                        "clientKey": "12345678-1234-1234-1234-0123456789AB",
                        "key": "clientInfo"
                    }
                });
                callback(null, {"key":"12345678-1234-1234-1234-0123456789AB:clientInfo", "val": value});
            };

            var logger = {};
            var options = {"table": "tenants"};

            var adapter = dynamodb(logger, options);

            var result = await adapter.get(key, clientKey);
            expect(result).to.equal(value);
        }).timeout(10000);

        it('missing property', async function() {
            var clientKey = "12345678-1234-1234-1234-0123456789AB";
            var key = "clientInfo";

            var docClient = function() {};
            var dynamodb = proxyquire('../lib/dynamodb', {'aws-sdk': {DynamoDB: {DocumentClient: docClient}}});

            docClient.prototype.get = function(params, callback) {
                expect(params).to.deep.equal({
                    "TableName": "tenants",
                    "Key": {
                        "clientKey": "12345678-1234-1234-1234-0123456789AB",
                        "key": "clientInfo"
                    }
                });
                callback(null, {});
            };

            var logger = {};
            var options = {"table": "tenants"};

            var adapter = dynamodb(logger, options);

            var result = await adapter.get(key, clientKey);
            expect(result).to.equal(null);
        }).timeout(10000);
    });

    describe('del()', function() {
        it('with clientKey and key', async function() {
            var clientKey = "12345678-1234-1234-1234-0123456789AB";
            var key = "clientInfo";

            var docClient = function() {};
            var dynamodb = proxyquire('../lib/dynamodb', {'aws-sdk': {DynamoDB: {DocumentClient: docClient}}});

            var deleteCalled = false;
            docClient.prototype.delete = function(params) {
                expect(params).to.deep.equal({
                    "TableName": "tenants",
                    "Key": {
                        "clientKey": "12345678-1234-1234-1234-0123456789AB",
                        "key": "clientInfo"
                    }
                });

                return {
                    promise: function () {
                        return new RSVP.Promise(function (resolve, reject) {
                            deleteCalled = true;
                            resolve();
                        });
                    }
                }
            };

            var logger = {};
            var options = {"table": "tenants"};

            var adapter = dynamodb(logger, options);

            await adapter.del(key, clientKey);
            expect(deleteCalled).to.equal(true);
        }).timeout(10000);

        it('with clientKey', async function() {
            var clientKey = "12345678-1234-1234-1234-0123456789AB";

            var docClient = function() {};
            var dynamodb = proxyquire('../lib/dynamodb', {'aws-sdk': {DynamoDB: {DocumentClient: docClient}}});
            var items = [{key: "A"}, {key: "B"}];

            docClient.prototype.query = function(params) {
                expect(params).to.deep.equal({
                    TableName: "tenants",
                    KeyConditionExpression: "clientKey = :clientKey",
                    ExpressionAttributeValues: {
                        ":clientKey": clientKey
                    }
                });

                return {
                    promise: function () {
                        return new RSVP.Promise(function (resolve, reject) {
                            resolve({Items: items});
                        });
                    }
                }
            };

            var deleteCounter = 0;
            docClient.prototype.delete = function(params) {
                expect(params).to.deep.equal({
                    "TableName": "tenants",
                    "Key": {
                        "clientKey": clientKey,
                        "key": items[deleteCounter].key
                    }
                });

                return {
                    promise: function () {
                        return new RSVP.Promise(function (resolve, reject) {
                            deleteCounter++;
                            resolve();
                        });
                    }
                }
            };

            var logger = {};
            var options = {"table": "tenants"};

            var adapter = dynamodb(logger, options);

            await adapter.del(clientKey);
            expect(deleteCounter).to.equal(2);
        }).timeout(10000);
    });
});
