/* eslint-disable semi */
import createErrorClass from 'create-error-class'

const CancelRequestConsumerError = createErrorClass('CancelRequestConsumerError', function(props) {
  if (!props || !props.message) {
    throw new Error('an error message is required at minimum');
  }

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
})

export {
  CancelRequestConsumerError
};
