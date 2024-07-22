const expect = require('chai').expect;
const { v4: uuidv4 } = require('uuid');
const dynamodb = require('../lib/dynamodb');
const AWS = require("aws-sdk");

const { DynamoDBDocument } = require("@aws-sdk/lib-dynamodb");
const { DynamoDB } = require("@aws-sdk/client-dynamodb");

const tenant_table = "atlassian-connect-express-dynamodb-test-tenant-table";

// JS SDK v3 does not support global configuration.
// Codemod has attempted to pass values to each service client in this file.
// You may need to update clients outside of this file, if they use global config.
// JS SDK v3 does not support global configuration.
// Codemod has attempted to pass values to each service client in this file.
// You may need to update clients outside of this file, if they use global config.
AWS.config.update({region: 'eu-west-1'});

describe('Integration Test', function() {
    var adapter;

    before(async function() {
        // Create sample data
        var docClient = DynamoDBDocument.from(new DynamoDB());

        await docClient.put({
          "TableName": tenant_table,
          "Item": {
            "key": "clientInfo",
            "clientKey": "40b74094-18e8-417a-85bc-0b2c66eedad5",
            "val": {"abc":123}
          }
        })

        await docClient.put({
          "TableName": tenant_table,
          "Item": {
            "key": "clientInfo",
            "clientKey": "2921425a-abae-4969-82a5-7d03ce09a624",
            "val": {"def":456}
          }
        })

        var logger = {};
        var options = {"table": tenant_table};
        adapter = dynamodb(logger, options);
    });

    describe('save, retrieve and delete entry', function() {
        var clientKey = uuidv4();

        const value = {
            "key": "my-add-on",
            "clientKey": clientKey,
            "publicKey": "123",
            "sharedSecret": "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
            "serverVersion": "6452",
            "pluginsVersion": "1.245.0",
            "baseUrl": "https://example.atlassian.net/wiki",
            "productType": "confluence",
            "description": "Atlassian Confluence at null ",
            "eventType": "installed"
        };

        const key = "clientInfo";

        it('create entry', async function() {
            var result = await adapter.set(key, value, clientKey);
            expect(result).to.equal(value);
        }).timeout(10000);

        it('get entry', async function() {
            var result = await adapter.get(key, clientKey);
            expect(result).to.deep.equal(value);
        }).timeout(10000);

        it('delete entry', async function() {
            await adapter.del(key, clientKey);
        }).timeout(10000);

        it('check entry is gone', async function() {
            var result = await adapter.get(key, clientKey);
            expect(result).to.equal(null);
        }).timeout(10000);
    });

    describe('delete mutiple entries', function () {
        var clientKey = uuidv4();
        const keyA = "keyA";
        const keyB = "keyB";
        const valueA = {test: 123};
        const valueB = {test: 456};

        it('create entries', async function() {
            var result = await adapter.set(keyA, valueA, clientKey);
            expect(result).to.equal(valueA);
            var result = await adapter.set(keyB, valueB, clientKey);
            expect(result).to.equal(valueB);
        }).timeout(10000);

        it('delete entries', async function() {
            await adapter.del(clientKey);
        }).timeout(10000);

        it('check entries are gone', async function() {
            var result = await adapter.get(keyA, clientKey);
            expect(result).to.equal(null);

            var result = await adapter.get(keyB, clientKey);
            expect(result).to.equal(null);
        }).timeout(10000);
    });

    after(async function () {
        // Make sure sample data from before is untouched
        var docClient = DynamoDBDocument.from(new DynamoDB());

        var result = await docClient.get({
          "TableName": tenant_table,
          "Key": {
            "key": "clientInfo",
            "clientKey": "40b74094-18e8-417a-85bc-0b2c66eedad5",
          }
        });
        expect(result.Item.val).to.deep.equal({"abc": 123});

        var result = await docClient.get({
          "TableName": tenant_table,
          "Key": {
            "key": "clientInfo",
            "clientKey": "2921425a-abae-4969-82a5-7d03ce09a624",
          }
        });
        expect(result.Item.val).to.deep.equal({"def": 456});
    })
});
