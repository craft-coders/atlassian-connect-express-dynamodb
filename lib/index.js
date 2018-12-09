var ac = require('atlassian-connect-express');

ac.store.register("dynamodb", require('./dynamodb'));
