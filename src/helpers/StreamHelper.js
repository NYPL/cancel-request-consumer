/* eslint-disable semi */
import async from 'async';
import CancelRequestConsumerError from './ErrorHelper';
import logger from './Logger';

const postItemsToStream = function (items, streamName, schemaName, streamsClient) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return Promise.reject(
      new CancelRequestConsumerError('the items array property not defined or empty, unable to post records to stream')
    );
  }

  if (!streamName || typeof streamName !== 'string' || streamName.trim() === '') {
    return Promise.reject(
      new CancelRequestConsumerError('the streamName string parameter is not defined, unable to post records to stream')
    );
  }

  if (!schemaName || typeof schemaName !== 'string' || schemaName.trim() === '') {
    return Promise.reject(
      new CancelRequestConsumerError('the schemaName string parameter is not defined, unable to post records to stream')
    );
  }

  if (!streamsClient || typeof streamsClient !== 'object' || typeof streamsClient.write !== 'function') {
    return Promise.reject(
      new CancelRequestConsumerError('the streamsClient utility class does not contain the write() function, unable to post records to stream')
    );
  }

  return new Promise((resolve, reject) => {
    return async.mapSeries(
      items,
      (item, callback) => {
        item.proccessedToResultStream = false;
        const itemToPost = generateStreamModel(item);

        return streamsClient.write(streamName, itemToPost, { avroSchemaName: schemaName })
        .then(response => {
          logger.info(`successfully posted Cancel Request Record (${item.id}) to CancelRequestResultStream`, { cancelRequestId: item.id });
          item.proccessedToResultStream = true;

          return callback(null, item);
        })
        .catch(error => {
          return callback(
            new CancelRequestConsumerError(
              `Fatal Error: Unable to post Cancel Request Record (${item.id}) to CancelRequestResultStream, received an error from the stream; exiting promise chain due to fatal error`,
              {
                type: 'cancel-request-result-stream-error',
                statusCode: (error && error.response && error.response.status) ? error.response.status : null
              }
            )
          );
        });
      },
      (err, results) => {
        return (err) ? reject(err) : resolve(results.filter(n => n))
      }
    );
  });
};

const generateStreamModel = function (object) {
  if (typeof object !== 'object' || !object.hasOwnProperty('id') || !Number.isInteger(object.id)) {
    throw new CancelRequestConsumerError('the cancelRequestId (type int) object property is not defined, unable to post record to stream');
  }

  const objectToBePosted = {};

  objectToBePosted.cancelRequestId = object.id;
  objectToBePosted.jobId = object.jobId || null;
  if (object.deleted === true) {
    objectToBePosted.success = true;
    objectToBePosted.error = null;
  } else {
    objectToBePosted.success = false;
    objectToBePosted.error = {};

    if (object.error && object.error.errorType) {
      objectToBePosted.error.type = object.error.errorType;
    } else {
      objectToBePosted.error.type = 'cancel-request-consumer-error';
    }

    if (object.error && object.error.errorMessage) {
      objectToBePosted.error.message = object.error.errorMessage;
    } else {
      objectToBePosted.error.message = `the checkout and checkin processed failed for Cancel Request Record (${object.id})`;
    }
  }

  return objectToBePosted;
};

export {
  postItemsToStream,
  generateStreamModel
};
