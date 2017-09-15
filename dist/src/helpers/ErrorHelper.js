'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CancelRequestConsumerError = undefined;

var _createErrorClass = require('create-error-class');

var _createErrorClass2 = _interopRequireDefault(_createErrorClass);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var CancelRequestConsumerError = (0, _createErrorClass2.default)('CancelRequestConsumerError', function (props) {
  this.message = props.message;

  // Optional
  if (props.statusCode) {
    this.statusCode = props.statusCode;
  }
  if (props.type) {
    this.type = props.type;
  }
  if (props.debugInfo) {
    this.debugInfo = props.debugInfo;
  }
});

exports.CancelRequestConsumerError = CancelRequestConsumerError;