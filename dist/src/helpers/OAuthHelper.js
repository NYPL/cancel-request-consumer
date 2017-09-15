'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.handleAuthentication = exports.fetchAccessToken = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _qs = require('qs');

var _qs2 = _interopRequireDefault(_qs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var getOauthConfig = function getOauthConfig(clientId, clientSecret, scope) {
  var grantType = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'client_credentials';

  if (!clientId || clientId === '') {
    throw new Error('missing clientId function parameter in getOauthConfig');
  }

  if (!clientSecret || clientSecret === '') {
    throw new Error('missing clientSecret function parameter in getOauthConfig');
  }

  if (!scope || scope === '') {
    throw new Error('missing scope function parameter in getOauthConfig');
  }

  return {
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: grantType,
    scope: scope
  };
};

var fetchAccessToken = function fetchAccessToken(oauthUrl, clientId, clientSecret, scope, grantType) {
  if (!oauthUrl || oauthUrl === '') {
    return _promise2.default.reject(new Error('missing oauthUrl function parameter in fetchAccessToken'));
  }

  var oAuthConfig = getOauthConfig(clientId, clientSecret, scope, grantType);

  return _axios2.default.post(oauthUrl, _qs2.default.stringify(oAuthConfig)).then(function (result) {
    if (!result.data || !result.data.access_token) {
      return _promise2.default.reject(new Error('the oAuthResponse object contained an undefined access_token property'));
    }

    return _promise2.default.resolve(result.data.access_token);
  }).catch(function (error) {
    var errorResponse = error.response || error.request || error;
    console.log('hit the fetchAccessToken catch block');
    return _promise2.default.reject(errorResponse);
  });
};

var handleAuthentication = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(cachedToken, getNewTokenFn) {
    var accessToken;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!(cachedToken && typeof cachedToken === 'string' && cachedToken !== '')) {
              _context.next = 2;
              break;
            }

            return _context.abrupt('return', _promise2.default.resolve(cachedToken));

          case 2:
            _context.prev = 2;
            _context.next = 5;
            return getNewTokenFn;

          case 5:
            accessToken = _context.sent;
            return _context.abrupt('return', accessToken);

          case 9:
            _context.prev = 9;
            _context.t0 = _context['catch'](2);
            return _context.abrupt('return', _promise2.default.reject(_context.t0));

          case 12:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[2, 9]]);
  }));

  return function handleAuthentication(_x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

exports.fetchAccessToken = fetchAccessToken;
exports.handleAuthentication = handleAuthentication;