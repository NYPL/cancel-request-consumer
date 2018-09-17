# Cancel Request Consumer Lambda
[![Coverage Status](https://coveralls.io/repos/github/NYPL/cancel-request-consumer/badge.svg?branch=master)](https://coveralls.io/github/NYPL/cancel-request-consumer?branch=master)
[![Build Status](https://travis-ci.org/NYPL/cancel-request-consumer.svg?branch=master)](https://travis-ci.org/NYPL/cancel-request-consumer)
[![Dependency Status](https://gemnasium.com/badges/github.com/NYPL/cancel-request-consumer.svg)](https://gemnasium.com/github.com/NYPL/cancel-request-consumer)

An AWS Lambda written in Node JS (ES7 via Babel), responsible for listening to a stream of Cancelled requests and performing the check-out/check-in process to cancel the requested item.

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
> Written in ES7
> AWS Node Target - [Node 6.10.3](https://nodejs.org/docs/v6.10.3/api/)

## Getting Started

### Installation

Install all Node dependencies via NPM
```console
$ npm install
```

### Developing Locally

To develop and run your Lambda locally you must set up a config/local.env file with NODE_ENV=development

***REMINDER:*** Your `./config/local.env` and `./.env` environment variables ***MUST*** be configured in order for the next step to work.

Next, run the following NPM command to use the **sample** event found in `./sample/sample_event.json`.

> Exceutes `node lambda run` pointing the the sample event.
```console
$ npm run local-run // Code is transpiled into dist/ and node-lambda will use that as the target path
```

### Deploying your Lambda

The following NPM Commands will execute the `node-lambda deploy` command mapping configurations to the proper environments. These commands can be modified in `package.json`.

> Prior to the execution of any `npm deploy ...` commands, `npm run build` is executed to successfully transpile all ES7 code th Node 6.10.x

* Runs `node-lambda deploy` with **DEVELOPMENT** configurations
```console
$ npm run deploy-[development|qa|production]
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
