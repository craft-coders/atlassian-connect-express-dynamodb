var _ = require('lodash');
var AWS = require("aws-sdk");
var RSVP = require('rsvp');

function getAsObject(val) {
  if (typeof val === "string") {
    try {
      val = JSON.parse(val);
    } catch (e) {
      // it's OK if we can't parse this. We'll just return the string below.
    }
  }

  return val;
}

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
proto.get = function (key, clientKey) {
  var self = this;

  return new RSVP.Promise(function(resolve, reject) {
    self.docClient.get({
      "TableName": self.settings.table,
      "Key": {
        "clientKey": clientKey,
        "key": key
      }
    }, function(err, data) {
      if (err) {
        reject(err);
      } else {
        if ('val' in data) {
          resolve(data.val);
        } else {
          resolve(null);
        }
      }
    });
  });
};

proto.set = function (key, value, clientKey) {
  var self = this;

  return new RSVP.Promise(function(resolve, reject) {
    return self.docClient.put({
      "TableName": self.settings.table,
      "Item": {
        "clientKey": clientKey,
        "key": key,
        "val": value
      }
    }, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(value);
      }
    })
  });
};

proto._del_multiple = function (keys, clientKey) {
  var self = this;

  var promisses = [];
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    promisses.push(self.docClient.delete({
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
  var self = this;

  return self.docClient.query({
    TableName: self.settings.table,
    KeyConditionExpression: "clientKey = :clientKey",
    ExpressionAttributeValues: {
      ":clientKey": clientKey
    }
  }).promise();
};

proto.del = function (key, clientKey) {
  var self = this;

  if (arguments.length < 2) {
    clientKey = key;
    return new RSVP.Promise(function(resolve, reject) {
      self._query_by_client_key(clientKey).catch(reject).then(function(data) {
        var keys = [];
        for (var i = 0; i < data.Items.length; i++) {
          var item = data.Items[i];
          keys.push(item.key);
        }
        self._del_multiple(keys, clientKey).then(resolve).catch(reject);
      });
    });
  } else {
    return self._del_multiple([key], clientKey);
  }
};

module.exports = function (logger, opts) {
  if (0 == arguments.length) {
    return DynamodbAdapter;
  }
  return new DynamodbAdapter(logger, opts);
};
