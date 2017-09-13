/* eslint-disable semi */
exports.kinesisHandler = (records, opts, context, callback) => {

};

exports.handler = (event, context, callback) => {
  const isProductionEnv = process.env.NODE_ENV === 'production';

  if (event && Array.isArray(event.Records) && event.Records.length > 0) {
    const record = event.Records[0];
    // Handle Kinesis Stream
    if (record.kinesis && record.kinesis.data) {
      // Execute the handler in local development mode, without decryption
      if (!isProductionEnv) {
        logger.info('executing kinesisHandler in local development mode');

        return exports.kinesisHandler(
          event.Records,
          {},
          context,
          callback
        );
      }

      // Handle Production decryption and execution of kinesisHandler
    }

    return callback(new Error('the event.Records array does not contain a kinesis stream of records to process'));
  }

  return callback(new Error('the event.Records array is undefined'));
};
