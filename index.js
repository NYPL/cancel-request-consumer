/* eslint-disable semi */
import NyplStreamsClient from '@nypl/nypl-streams-client';
import { handleAuthentication, fetchAccessToken } from './src/helpers/OAuthHelper';
import ApiHelper from './src/helpers/ApiHelper';
import Cache from './src/cache/CacheFactory';
import CancelRequestConsumerError from './src/helpers/ErrorHelper';

exports.handleKinesisAsyncProcessing = async function(records, opts, context, callback) {
  try {
    // Destructure configuration params
    const {
      oAuthProviderUrl,
      oAuthClientId,
      oAuthClientSecret,
      oAuthProviderScope,
      nyplDataApiBaseUrl,
      recapCancelRequestSchema,
      nyplCheckinRequestApiUrl,
      nyplCheckoutRequestApiUrl
    } = opts;

    const streamsClient = new NyplStreamsClient({ nyplDataApiClientBase: nyplDataApiBaseUrl });

    const [ tokenResponse, decodedRecords ] = await Promise.all([
      handleAuthentication(Cache.getToken(), fetchAccessToken(oAuthProviderUrl, oAuthClientId, oAuthClientSecret, oAuthProviderScope)),
      streamsClient.decodeData(recapCancelRequestSchema, records.map(i => i.kinesis.data))
    ]);

    if (tokenResponse.tokenType === 'new-token') {
      console.log('setting a new access token from OAuth Service');
      Cache.setToken(tokenResponse.token);
    } else {
      console.log('using an existing access token from Cache');
    }

    // console.log(decodedRecords);
    let processedCheckoutItems = await ApiHelper.handleCancelItemPostRequests(decodedRecords, 'checkout-service', nyplCheckoutRequestApiUrl, Cache.getToken());
    // console.log(processedCheckoutItems);
    let processedCheckinItems = await ApiHelper.handleCancelItemPostRequests(processedCheckoutItems, 'checkin-service', nyplCheckinRequestApiUrl, Cache.getToken());
    /// console.log(processedCheckinItems);

  } catch (e) {
    console.log('handleKinesisAsyncLogic', e);

    if (e.name === 'AvroValidationError') {
      console.log(e);
      console.log('a fatal/non-recoverable AvroValidationError occured which prohibits decoding the kinesis stream; the CancelRequestConsumer Lambda will NOT restart');
      return false;
    }

    // console.log('handleKinesisAsyncLogic', e);
    // return callback(e);
  }
};

exports.kinesisHandler = (records, opts, context, callback) => {
  try {
    if (!opts || Object.keys(opts).length === 0) {
      throw new CancelRequestConsumerError(
        'missing/undefined opts object configuration parameter',
        { type: 'function-parameter-error' }
      );
    }

    if (!opts.oAuthProviderUrl || typeof opts.oAuthProviderUrl !== 'string' || opts.oAuthProviderUrl.trim() === '') {
      throw new CancelRequestConsumerError(
        'missing/undefined oAuthProviderUrl configuration parameter',
        { type: 'function-parameter-error' }
      );
    }

    if (!opts.oAuthClientId || typeof opts.oAuthClientId !== 'string' || opts.oAuthClientId.trim() === '') {
      throw new CancelRequestConsumerError(
        'missing/undefined oAuthClientId configuration parameter',
        { type: 'function-parameter-error' }
      );
    }

    if (!opts.oAuthClientSecret || typeof opts.oAuthClientSecret !== 'string' || opts.oAuthClientSecret.trim() === '') {
      throw new CancelRequestConsumerError(
        'missing/undefined oAuthClientSecret configuration parameter',
        { type: 'function-parameter-error' }
      );
    }

    if (!opts.oAuthProviderScope || typeof opts.oAuthProviderScope !== 'string' || opts.oAuthProviderScope.trim() === '') {
      throw new CancelRequestConsumerError(
        'missing/undefined oAuthProviderScope configuration parameter',
        { type: 'function-parameter-error' }
      );
    }

    if (!opts.nyplDataApiBaseUrl || typeof opts.nyplDataApiBaseUrl !== 'string' || opts.nyplDataApiBaseUrl.trim() === '') {
      throw new CancelRequestConsumerError(
        'missing/undefined nyplDataApiBaseUrl configuration parameter',
        { type: 'function-parameter-error' }
      );
    }

    if (!opts.recapCancelRequestSchema || typeof opts.recapCancelRequestSchema !== 'string' || opts.recapCancelRequestSchema.trim() === '') {
      throw new CancelRequestConsumerError(
        'missing/undefined recapCancelRequestSchema configuration parameter',
        { type: 'function-parameter-error' }
      );
    }

    if (!opts.nyplCheckinRequestApiUrl || typeof opts.nyplCheckinRequestApiUrl !== 'string' || opts.nyplCheckinRequestApiUrl.trim() === '') {
      throw new CancelRequestConsumerError(
        'missing/undefined nyplCheckinRequestApiUrl configuration parameter',
        { type: 'function-parameter-error' }
      );
    }

    if (!opts.nyplCheckoutRequestApiUrl || typeof opts.nyplCheckoutRequestApiUrl !== 'string' || opts.nyplCheckoutRequestApiUrl.trim() === '') {
      throw new CancelRequestConsumerError(
        'missing/undefined nyplCheckoutRequestApiUrl configuration parameter',
        { type: 'function-parameter-error' }
      );
    }

    return exports.handleKinesisAsyncProcessing(records, opts, context, callback);
  } catch (e) {
    // console.log('kinesisHandler Error Caught', e);
    // callback(e.message);
    return callback(e.message);
  }
};

exports.handler = (event, context, callback) => {
  const isProductionEnv = process.env.NODE_ENV === 'production';

  if (event && Array.isArray(event.Records) && event.Records.length > 0) {
    const record = event.Records[0];
    // Handle Kinesis Stream
    if (record.kinesis && record.kinesis.data) {
      // Execute the handler in local development mode, without decryption
      //if (!isProductionEnv) {
        return exports.kinesisHandler(
          event.Records,
          {
            oAuthProviderUrl: process.env.OAUTH_PROVIDER_URL,
            oAuthClientId: process.env.OAUTH_CLIENT_ID,
            oAuthClientSecret: process.env.OAUTH_CLIENT_SECRET,
            oAuthProviderScope: process.env.OAUTH_PROVIDER_SCOPE,
            nyplDataApiBaseUrl: process.env.NYPL_DATA_API_BASE_URL,
            recapCancelRequestSchema: process.env.RECAP_CANCEL_REQUEST_SCHEMA_NAME,
            nyplCheckinRequestApiUrl: process.env.NYPL_CHECKIN_REQUEST_API_URL,
            nyplCheckoutRequestApiUrl: process.env.NYPL_CHECKOUT_REQUEST_API_URL
          },
          context,
          callback
        );
      //}

      // Handle Production decryption and execution of kinesisHandler
    }

    return callback(new Error('the event.Records array does not contain a kinesis stream of records to process'));
  }

  return callback(new Error('the event.Records array is undefined'));
};
