#!/bin/bash

cd "$(dirname "$0")"
set -eu -o pipefail -o posix

echo >&2 "[INFO] Setup environment for integration testing."
aws cloudformation deploy \
    --region eu-west-1 \
    --template-file template.yml \
    --stack-name "atlassian-connect-express-dynamodb-test" \
    --capabilities CAPABILITY_NAMED_IAM \
    --no-fail-on-empty-changeset # See: https://github.com/aws/aws-cli/issues/3336#issuecomment-397087669
