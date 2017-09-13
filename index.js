/* eslint-disable semi */
const waterfall = require('async/waterfall');

async function test() {
  const promises = [250, 500, 1000].map(ms => wait(ms));
  console.log('resolved to', await Promise.all(promises));
}

async function wait(ms) {
  await new Promise(resolve => setTimeout(() => resolve(), ms));
  console.log('waited', ms);
  return ms;
}

exports.kinesisHandler = (records, opts, context, callback) => {
  console.log(records);
  test();
};

exports.handler = (event, context, callback) => {
  const isProductionEnv = process.env.NODE_ENV === 'production';

  if (event && Array.isArray(event.Records) && event.Records.length > 0) {
    const record = event.Records[0];
    // Handle Kinesis Stream
    if (record.kinesis && record.kinesis.data) {
      // Execute the handler in local development mode, without decryption
      // if (!isProductionEnv) {
        return exports.kinesisHandler(
          event.Records,
          {},
          context,
          callback
        );
      // }

      // Handle Production decryption and execution of kinesisHandler
    }

    return callback(new Error('the event.Records array does not contain a kinesis stream of records to process'));
  }

  return callback(new Error('the event.Records array is undefined'));
};
