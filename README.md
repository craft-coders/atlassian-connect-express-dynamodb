# DynamoDB bindings for atlassian cloud applications

[AWS DynamoDB](https://aws.amazon.com/de/dynamodb/) bindings for atlassian-connect-express.

This is useful to host atlassian cloud applications in AWS lambda. One could use a rational DB with
AWS, but DynamoDB is better suited for this task.

## Installation

To use this library in your atlassian cloud application:

1. Create a new DynamoDB table to store information about tenants

    ```
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: tenants
      KeySchema:
        - AttributeName: clientKey
          KeyType: HASH
        - AttributeName: key
          KeyType: RANGE
      AttributeDefinitions:
        - AttributeName: clientKey
          AttributeType: S
        - AttributeName: key
          AttributeType: S
      ProvisionedThroughput:
        ReadCapacityUnits: 5
        WriteCapacityUnits: 5
      SSESpecification:
        SSEEnabled: true
      StreamSpecification:
        StreamViewType: NEW_IMAGE
    ```

2. Install this library

    `npm install --save atlassian-connect-express-dynamodb`

3. Add this library as requirement to `app.js`

    ```
    var ac = require('atlassian-connect-express'); // insert after this line
    require('atlassian-connect-express-dynamodb');
    ```

4. Modify `config.json` to use the dynamodb adapter

    ```
        [...]
        "store": {
            "adapter": "dynamodb",
            "table": "tenants"
        },
        [...]
    ```

## Credentials

This library uses the AWS SDK for nodejs. There are several methods for providing the needed AWS credentials.
Consult the [AWS documentation](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-credentials-node.html)
for more information.
