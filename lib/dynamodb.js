const _ = require('lodash');
const AWS = require("aws-sdk");
const RSVP = require('rsvp');

function DynamodbAdapter(logger, opts) {
  var docClientOptions = {
    httpOptions: {
      connectTimeout: 'connectTimeout' in opts ? opts.connectTimeout : 2500,
      timeout: 'timeout' in opts ? opts.timeout : 2500
    },
    maxRetries: 'maxRetries' in opts ? opts.maxRetries : 4
  };

  this.settings = {
    logger: logger,
    table: opts.table
  };

  this.docClient = new AWS.DynamoDB.DocumentClient(docClientOptions)

  _.bindAll(this, 'get', 'set', 'del');
}

var proto = DynamodbAdapter.prototype;

// return a promise to a single object identified by 'key' in the data belonging to tenant 'clientKey'
proto.get = async function (key, clientKey) {
  try {
    var data = await this.docClient.get({
      "TableName": this.settings.table,
      "Key": {
        "key": key,
        "clientKey": clientKey
      }
    }).promise();

    if ('Item' in data) {
      data = data.Item;
    }

    if ('val' in data) {
      return data.val;
    } else {
      return null;
    }
  } catch (err) {
    throw new Error("atlassian-connect-express-dynamodb get failed: " + err.message);
  }
};

proto.set = async function (key, value, clientKey) {
  try {
    await this.docClient.put({
      "TableName": this.settings.table,
      "Item": {
        "key": key,
        "clientKey": clientKey,
        "val": value
      }
    }).promise();
    return value;
  } catch (err) {
    throw new Error("atlassian-connect-express-dynamodb set failed: " + err.message);
  }
};

proto._del_multiple = function (keys, clientKey) {
  var promisses = [];
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    promisses.push(this.docClient.delete({
      "TableName": this.settings.table,
      "Key": {
        "clientKey": clientKey,
        "key": key
      }
    }).promise());
  }
  return Promise.all(promisses);
};

proto._query_by_client_key = function (clientKey) {
  return this.docClient.query({
    TableName: this.settings.table,
    KeyConditionExpression: "clientKey = :clientKey",
    ExpressionAttributeValues: {
      ":clientKey": clientKey
    }
  }).promise();
};

proto.del = async function (key, clientKey) {
  try {
    if (arguments.length < 2) {
      clientKey = key;

      var data = await this._query_by_client_key(clientKey);
      var keys = [];
      for (var i = 0; i < data.Items.length; i++) {
        var item = data.Items[i];
        keys.push(item.key);
      }
      return await this._del_multiple(keys, clientKey);
    } else {
      return await this._del_multiple([key], clientKey);
    }
  } catch (err) {
    throw new Error("atlassian-connect-express-dynamodb del failed: " + err.message);
  }
};

module.exports = function (logger, opts) {
  if (0 == arguments.length) {
    return DynamodbAdapter;
  }
  return new DynamodbAdapter(logger, opts);
};
