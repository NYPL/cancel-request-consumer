/* eslint-disable semi */
import createErrorClass from 'create-error-class'

const CancelRequestConsumerError = createErrorClass('CancelRequestConsumerError', (props) => {
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
