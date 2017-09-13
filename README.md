# Cancel Request Consumer Lambda
An AWS Lambda written in Node JS, responsible for listening to a stream of Cancelled requests and performing the check-out/check-in process to cancel the requested item.

## Table of Contents
- [Requirements](#requirements)
- Getting Started
  - [Installation](#installation)
  - [Setup Configurations](#setup-configurations)
  - [Developing Locally](#developing-locally)
  - [Deploying your Lambda](#deploying-your-lambda)
  - [Tests](#tests)
  - [Linting](#linting)
- [Dependencies](#npm-dependencies)

## Version
> v0.0.1

## Requirements
> [Node 6.10.3](https://nodejs.org/docs/v6.10.3/api/)

## Getting Started

### Installation

Install all Node dependencies via NPM
```console
$ npm install
```

### Setup Configurations

Once all dependencies are installed, you want to run the following NPM commands included in the `package.json` configuration file to setup a local development environment.

#### Step 1: Create an `.env` file for the `node-lambda` module
> Copies the sample .env file under ./sample/.env.sample into ./.env

```console
$ npm run setup-node-lambda-env
```

#### Step 2: Add your AWS environment variables
Once the `.env` file is copied, open the file and edit the following:
```console
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_PROFILE=
AWS_SESSION_TOKEN=
AWS_ROLE_ARN=
AWS_REGION=us-east-1
AWS_FUNCTION_NAME=<FUNCTION NAME>
AWS_HANDLER=index.handler
AWS_MEMORY_SIZE=128
AWS_TIMEOUT=30
AWS_DESCRIPTION=
AWS_RUNTIME=nodejs6.10
AWS_VPC_SUBNETS=
AWS_VPC_SECURITY_GROUPS=
AWS_TRACING_CONFIG=
EXCLUDE_GLOBS="event.json"
PACKAGE_DIRECTORY=build
```
> Note: This ENV file is used by node-lambda to obtain your AWS basic configuration. AWS ARN_ROLE and PROFILES are handled by npm commands via --profile and --role
#### Step 3: Setup your environment specific `{environment}.env` file

Running the following NPM Commands will:

* Set up your **LOCAL** `.env` file as `./config/local.env` used for local development

```console
$ npm run setup-local-env // Used in local development when running `npm run local-run`
```

* Set up your **DEVELOPMENT** `.env` file as `./config/dev.env`
```console
$ npm run setup-dev-env
```

* Set up your **PRODUCTION** `.env` file as `./config/prod.env`
```console
$ npm run setup-prod-env
```

These environment specific `.env` files will be used to set **environment variables** when deployed by the `node-lambda` module.

An example of the sample deployment environment `.env` file:
```console
NYPL_CHECKOUT_API_URL=XXX
NYPL_CHECKIN_API_URL=XXX
OAUTH_PROVIDER_URL=XXX
OAUTH_PROVIDER_SCOPE=XXX
OAUTH_CLIENT_ID=XXX
OAUTH_CLIENT_SECRET=XXX
RECAP_CANCEL_REQUEST_SCHEMA_NAME=XXX
CANCEL_REQUEST_RESULT_STREAM_NAME=XXX
CANCEL_REQUEST_RESULT_SCHEMA_NAME=XXX
NODE_ENV=XXX // Use 'development' when developing locally via `npm run local-run`. If deploying to AWS use 'production', this will trigger the decryption client.
```

#### Step 4: Setup your environment specific `event_sources_{environment}.json` file
This file is used by the `node-lambda` module to deploy your Lambda with the correct mappings.

You **must** edit the file once created and add your specific **EventSourceArn** value, found in the AWS Console. If no mapping is necessary, update the file to an empty object `{}`.

Running the following NPM Commands will:

* Set up your **DEVELOPMENT** `event_sources_dev.json` file in `./config/`
```console
$ npm run setup-dev-sources
```

* Set up your **PRODUCTION** `event_sources_prod.json` file in `./config/`
```console
$ npm run setup-prod-sources
```
### Developing Locally
To develop and run your Lambda locally you must ensure to complete `Step 1` and `Step 2` of the Setup process.

***REMINDER:*** Your `./config/local.env` and `./.env` environment variables ***MUST*** be configured in order for the next step to work.

Next, run the following NPM command to use the **sample** event found in `./sample/sample_event.json`.

> Exceutes `node lambda run` pointing the the sample event.
```console
$ npm run local-run
```

### Deploying your Lambda
To deploy your Lambda function via the `node-lambda` module __**ensure**__ you have completed all the steps of the [Setup](#setup-configurations) process and have added all configuration variables required.

The following NPM Commands will execute the `node-lambda deploy` command mapping configurations to the proper environments (qa & production). These commands can be modified in `package.json`.

* Runs `node-lambda deploy` with **DEVELOPMENT** configurations
```console
$ npm run deploy-dev
```

* Runs `node-lambda deploy` with **PRODUCTION** configurations
```console
$ npm run deploy-prod
```

### Tests
#### Test Coverage
[Istanbul](https://github.com/istanbuljs/nyc) is currently used in conjunction with Mocha to report coverage of all unit tests.

Simply run:
```javascript
$ npm run coverage-report
```

Executing this NPM command will create a `./coverage/` folder with an interactive UI reporting the coverage analysis, now you can open up `./coverage/index.html` in your browser to view an enhanced report.

#### Running Unit Tests
Unit tests are written using [Mocha](https://github.com/mochajs/mocha), [Chai](https://github.com/chaijs) and [Sinon](https://github.com/domenic/sinon-chai). All tests can be found under the `./test` directory. Mocha configurations are set and can be modified in `./test/mocha.opts`.

> To run test, use the following NPM script found in `package.json`.

```javascript
$ npm run test // Will run all tests found in the ./test/ path
```

```javascript
$ npm run test [filename].test.js // Will run a specific test for the given filename
```
### Linting
This codebase currently uses [Standard JS](https://www.npmjs.com/package/standard) as the JavaScript linter.

To lint files use the following NPM command:
```javascript
$ npm run lint // Will lint all files except those listed in package.json under standard->ignore
```

```javascript
$ npm run lint [filename].js // Will lint the specific JS file
```

## NPM Dependencies
* [nypl-streams-client](https://www.npmjs.com/package/@nypl/nypl-streams-client)
* [aws-sdk](https://www.npmjs.com/package/aws-sdk)
* [async](https://www.npmjs.com/package/async)
* [axios](https://www.npmjs.com/package/axios)
* [circular-json](https://www.npmjs.com/package/circular-json)
* [lambda-env-vars](https://www.npmjs.com/package/lambda-env-vars)
* [qs](https://www.npmjs.com/package/qs)
* [winston](https://www.npmjs.com/package/winston)
* [winston-slack-hook](https://www.npmjs.com/package/winston-slack-hook)
* [node-lambda](https://www.npmjs.com/package/node-lambda)
* [mocha](https://www.npmjs.com/package/mocha)
* [chai](https://www.npmjs.com/package/chai)
* [coveralls](https://www.npmjs.com/package/coveralls)
* [sinon](https://www.npmjs.com/package/sinon)
* [sinon-chai](https://www.npmjs.com/package/sinon-chai)
* [standard-js](https://www.npmjs.com/package/standard)
* [istanbul](https://github.com/istanbuljs/nyc)
