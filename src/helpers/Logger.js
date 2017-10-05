/* eslint-disable semi */
const winston = require('winston');
const SlackHook = require('winston-slack-hook');
const CircularJSON = require('circular-json');
JSON.truncate = require('json-truncate');
// Supress error handling
winston.emitErrs = true;
// Set default NYPL agreed upon log levels
const levels = {
  emergency: 0,
  alert: 1,
  critical: 2,
  error: 3,
  warning: 4,
  notice: 5,
  info: 6,
  debug: 7
};

const getLogLevelCode = (levelString) => {
  switch (levelString) {
    case 'emergency':
      return 0;
    case 'alert':
      return 1;
    case 'critical':
      return 2;
    case 'error':
      return 3;
    case 'warning':
      return 4;
    case 'notice':
      return 5;
    case 'info':
      return 6;
    case 'debug':
      return 7;
    default:
      return 'n/a';
  }
};

const loggerTransports = [];

if (process.env.NODE_ENV !== 'test') {
  loggerTransports.push(
    new winston.transports.Console({
      timestamp: () => {
        return new Date().toISOString();
      },
      formatter: (options) => {
        const result = {
          timestamp: options.timestamp(),
          levelCode: getLogLevelCode(options.level),
          level: options.level.toUpperCase()
        };

        if (process.pid) {
          result.pid = process.pid.toString();
        }

        if (options.message) {
          result.message = options.message;
        }

        if (options.meta && Object.keys(options.meta).length) {
          if (options.meta.cancelRequestId) {
            result.cancelRequestId = options.meta.cancelRequestId;
            delete options.meta.cancelRequestId;
          }

          if (options.meta && Object.keys(options.meta).length) {
            result.meta = CircularJSON.stringify(options.meta);
          }
        }

        return CircularJSON.stringify(result);
      }
    })
  );
}

if (process.env.NODE_ENV === 'production' && process.env.SLACK_WEBHOOK_URL && process.env.SLACK_WEBHOOK_URL !== ''
  && process.env.SLACK_CHANNEL && process.env.SLACK_CHANNEL !== ''
  && process.env.SLACK_USERNAME && process.env.SLACK_USERNAME !== '') {

  loggerTransports.push(
    new (SlackHook)({
      level: 'error',
      hookUrl: process.env.SLACK_WEBHOOK_URL,
      username: process.env.SLACK_USERNAME,
      channel: process.env.SLACK_CHANNEL,
      appendMeta: false,
      prependLevel: false,
      formatter: (options) => {
        let slackText = '>>> *Timestamp*: ' + new Date().toISOString() + '\n';

        if (options.level) {
          slackText += '*Level*: ' + options.level.toUpperCase() + '\n';
          slackText += '*Level Code*: ' + getLogLevelCode(options.level) + '\n';
        }

        if (options.message) {
          slackText += '*Message*:\n' + options.message + '\n';
        }

        if (options.meta && Object.keys(options.meta).length) {
          if (options.meta.cancelRequestId) {
            slackText += '*Cancel Request ID*: ' + options.meta.cancelRequestId + '\n';
            delete options.meta.cancelRequestId;
          }

          if (options.meta && Object.keys(options.meta).length) {
            slackText += '*Meta*:\n' + '```' + CircularJSON.stringify(JSON.truncate(options.meta, { maxDepth: 4, replace: '[Truncated...]' }), null, '\t') + '```' + '\n';
          }
        }

        return slackText;
      }
    })
  );
}

const logger = new (winston.Logger)({
  levels: levels,
  transports: loggerTransports,
  exitOnError: false
});

module.exports = logger;
