'use strict';

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _nyplStreamsClient = require('@nypl/nypl-streams-client');

var _nyplStreamsClient2 = _interopRequireDefault(_nyplStreamsClient);

var _OAuthHelper = require('./src/helpers/OAuthHelper');

var _ErrorHelper = require('./src/helpers/ErrorHelper');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var handleKinesisAsyncProcessing = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(records, opts, context, callback) {
    var oAuthProviderUrl, oAuthClientId, oAuthClientSecret, oAuthProviderScope, nyplDataApiBaseUrl, recapCancelRequestSchema, streamsClient, _ref2, _ref3, accessToken, decodedRecords;

    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;

            // Destructure configuration params
            oAuthProviderUrl = opts.oAuthProviderUrl, oAuthClientId = opts.oAuthClientId, oAuthClientSecret = opts.oAuthClientSecret, oAuthProviderScope = opts.oAuthProviderScope, nyplDataApiBaseUrl = opts.nyplDataApiBaseUrl, recapCancelRequestSchema = opts.recapCancelRequestSchema;
            streamsClient = new _nyplStreamsClient2.default({ nyplDataApiClientBase: nyplDataApiBaseUrl });
            _context.next = 5;
            return _promise2.default.all([(0, _OAuthHelper.handleAuthentication)(null, (0, _OAuthHelper.fetchAccessToken)(oAuthProviderUrl, oAuthClientId, oAuthClientSecret, oAuthProviderScope)), streamsClient.decodeData(recapCancelRequestSchema, records.map(function (i) {
              return i.kinesis.data;
            }))]);

          case 5:
            _ref2 = _context.sent;
            _ref3 = (0, _slicedToArray3.default)(_ref2, 2);
            accessToken = _ref3[0];
            decodedRecords = _ref3[1];


            console.log(accessToken, decodedRecords);
            _context.next = 15;
            break;

          case 12:
            _context.prev = 12;
            _context.t0 = _context['catch'](0);

            console.log('handleKinesisAsyncLogic', _context.t0);

          case 15:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[0, 12]]);
  }));

  return function handleKinesisAsyncProcessing(_x, _x2, _x3, _x4) {
    return _ref.apply(this, arguments);
  };
}(); /* eslint-disable semi */


exports.handleKinesisAsyncProcessing = handleKinesisAsyncProcessing;

exports.kinesisHandler = function (records, opts, context, callback) {
  try {
    if (!opts || (0, _keys2.default)(opts).length == 0) {
      throw new _ErrorHelper.CancelRequestConsumerError({ message: 'missing/undefined opts object configuration parameter' });
    }

    if (!opts.oAuthProviderUrl || typeof opts.oAuthProviderUrl === 'string' && opts.oAuthProviderUrl.trim() === '') {
      throw new _ErrorHelper.CancelRequestConsumerError({ message: 'missing/undefined oAuthProviderUrl configuration parameter' });
    }

    if (!opts.oAuthClientId || typeof opts.oAuthClientId === 'string' && opts.oAuthClientId.trim() === '') {
      throw new _ErrorHelper.CancelRequestConsumerError({ message: 'missing/undefined oAuthClientId configuration parameter' });
    }

    if (!opts.oAuthClientSecret || typeof opts.oAuthClientSecret === 'string' && opts.oAuthClientSecret.trim() === '') {
      throw new _ErrorHelper.CancelRequestConsumerError({ message: 'missing/undefined oAuthClientSecret configuration parameter' });
    }

    if (!opts.oAuthProviderScope || typeof opts.oAuthProviderScope === 'string' && opts.oAuthProviderScope.trim() === '') {
      throw new _ErrorHelper.CancelRequestConsumerError({ message: 'missing/undefined oAuthProviderScope configuration parameter' });
    }

    if (!opts.nyplDataApiBaseUrl || typeof opts.nyplDataApiBaseUrl === 'string' && opts.nyplDataApiBaseUrl.trim() === '') {
      throw new _ErrorHelper.CancelRequestConsumerError({ message: 'missing/undefined nyplDataApiBaseUrl configuration parameter' });
    }

    if (!opts.recapCancelRequestSchema || typeof opts.recapCancelRequestSchema === 'string' && opts.recapCancelRequestSchema.trim() === '') {
      throw new _ErrorHelper.CancelRequestConsumerError({ message: 'missing/undefined recapCancelRequestSchema configuration parameter' });
    }

    return exports.handleKinesisAsyncProcessing(records, opts, context, callback);
  } catch (e) {
    // console.log('kinesisHandler Error Caught', e);
    return e;
  }
};

exports.handler = function (event, context, callback) {
  var isProductionEnv = process.env.NODE_ENV === 'production';

  if (event && Array.isArray(event.Records) && event.Records.length > 0) {
    var record = event.Records[0];
    // Handle Kinesis Stream
    if (record.kinesis && record.kinesis.data) {
      // Execute the handler in local development mode, without decryption
      // if (!isProductionEnv) {
      return exports.kinesisHandler(event.Records, {
        oAuthProviderUrl: process.env.OAUTH_PROVIDER_URL,
        oAuthClientId: process.env.OAUTH_CLIENT_ID,
        oAuthClientSecret: process.env.OAUTH_CLIENT_SECRET,
        oAuthProviderScope: process.env.OAUTH_PROVIDER_SCOPE,
        nyplDataApiBaseUrl: process.env.NYPL_DATA_API_BASE_URL,
        recapCancelRequestSchema: process.env.RECAP_CANCEL_REQUEST_SCHEMA_NAME
      }, context, callback);
      // }

      // Handle Production decryption and execution of kinesisHandler
    }

    return callback(new Error('the event.Records array does not contain a kinesis stream of records to process'));
  }

  return callback(new Error('the event.Records array is undefined'));
};