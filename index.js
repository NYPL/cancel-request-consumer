/* eslint-disable semi */
import NyplStreamsClient from '@nypl/nypl-streams-client';
import LambdaEnvVars from 'lambda-env-vars';
import { handleAuthentication, fetchAccessToken } from './src/helpers/OAuthHelper';
import ApiHelper from './src/helpers/ApiHelper';
import Cache from './src/cache/CacheFactory';
import CancelRequestConsumerError from './src/helpers/ErrorHelper';
import { postItemsToStream } from './src/helpers/StreamHelper';
import logger from './src/helpers/Logger';

const lambdaEnvVarsClient = new LambdaEnvVars();

exports.handleKinesisAsyncProcessing = async function (records, opts, context, callback) {
  try {
    const {
      oAuthProviderUrl,
      oAuthClientId,
      oAuthClientSecret,
      oAuthProviderScope,
      nyplDataApiBaseUrl,
      recapCancelRequestSchema,
      nyplCheckinRequestApiUrl,
      nyplCheckoutRequestApiUrl,
      nyplRecapRequestApiUrl,
      cancelRequestResultSchemaName,
      cancelRequestResultStreamName
    } = opts;

    const streamsClient = new NyplStreamsClient({ nyplDataApiClientBase: nyplDataApiBaseUrl });

    const [ tokenResponse, decodedRecords ] = await Promise.all([
      handleAuthentication(Cache.getToken(), fetchAccessToken(oAuthProviderUrl, oAuthClientId, oAuthClientSecret, oAuthProviderScope)),
      streamsClient.decodeData(recapCancelRequestSchema, records.map(i => i.kinesis.data))
    ]);

    const unprocessedRecords = await Cache.filterProcessedRecords(decodedRecords);

    if (tokenResponse.tokenType === 'new-token') {
      logger.info('Obtained a new access token from the OAuth Service');
      Cache.setToken(tokenResponse.token);
    } else {
      logger.info('Using existing access token from Cache');
    }

    const processedCheckedOutItems = await ApiHelper.handleCancelItemPostRequests(unprocessedRecords, 'checkout-service', nyplCheckoutRequestApiUrl, Cache.getToken());
    const processedCheckedInItems = await ApiHelper.handleCancelItemPostRequests(processedCheckedOutItems, 'checkin-service', nyplCheckinRequestApiUrl, Cache.getToken());
    const processedItemsToRecap = await ApiHelper.handleCancelItemsPostRequests(processedCheckedInItems, 'recap-service', nyplRecapRequestApiUrl, Cache.getToken());

    if (!processedItemsToRecap || !Array.isArray(processedItemsToRecap)) {
      logger.error('The CancelRequestConsumer Lambda failed to process all Cancel Request Items', { processedItemsToRecap: processedItemsToRecap });
      return callback('The CancelRequestConsumer Lambda failed to process all Cancel Request Items');
    }

    logger.info('The CancelRequestConsumer Lambda has successfully processed all Cancel Request Items; no fatal errors have occured');
    return callback(null, 'The CancelRequestConsumer Lambda has successfully processed all Cancel Request Items; no fatal errors have occured');
  } catch (e) {
    if (e.name === 'AvroValidationError') {
      logger.error('A fatal/non-recoverable AvroValidationError occured which prohibits decoding the kinesis stream; the CancelRequestConsumer Lambda will NOT restart', { debugInfo: e });
      return false;
    }

    if (e.name === 'CancelRequestConsumerError') {
      if (e.type === 'filtered-records-array-empty') {
        logger.info('The CancelRequestConsumer Lambda has successfully processed all Cancel Request Items; no fatal errors have occured');
        return callback(null, 'The CancelRequestConsumer Lambda has no records to process; all processed records were filtered out resulting in an empty array; no fatal errors have occured');
      }

      // Recoverable Error: Reset the access_token
      if (e.statusCode === 401) {
        logger.notice('Restarting the CancelRequestConsumer Lambda to fetch a new access_token; the OAuth access_token has expired');
        Cache.setToken(null);
        return callback(e.message);
      }

      // Recoverable Error: OAuth Service may be temporarily down; retriable error.
      if (e.type === 'oauth-service-error' && (!e.statusCode || e.statusCode >= 500)) {
        logger.notice('Restarting the CancelRequestConsumer Lambda; a 5xx or a timeout error was caught from the OAuth Service', { debugInfo: e });
        return callback(e.message);
      }

      // Recoverable Error: Checkout Service may be temporarily down; retriable error.
      if (e.type === 'checkout-service-error' && (!e.statusCode || e.statusCode >= 500)) {
        logger.notice('Restarting the CancelRequestConsumer Lambda; a 5xx or a timeout error was caught from the Checkout Service', { debugInfo: e });
        return callback(e.message);
      }

      // Recoverable Error: Checkout Service may be temporarily down; retriable error.
      if (e.type === 'checkin-service-error' && (!e.statusCode || e.statusCode >= 500)) {
        logger.notice('Restarting the CancelRequestConsumer Lambda; a 5xx or a timeout error was caught from the Checkin Service', { debugInfo: e });
        return callback(e.message);
      }

      // Recoverable Error: Recap Service may be temporarily down; retriable error.
      if (e.type === 'recap-service-error' && (!e.statusCode || e.statusCode >= 500)) {
        logger.notice('Restarting the CancelRequestConsumer Lambda; a 5xx or a timeout error was caught from the Recap Service', { debugInfo: e });
        return callback(e.message);
      }

      // Non-recoverable Error
      if (e.type === 'cancel-request-result-stream-error') {
        logger.error(
          'A fatal/non-recoverable error was obtained from the CancelRequestResultStream; the CancelRequestConsumer Lambda is unable to send POST requests to the stream; the CancelRequestConsumer Lambda will NOT restart',
          { debugInfo: e }
        );
        return false
      }

      logger.error(`a non-recoverable error occured; the Lambda will not restart; ${e.message}`, { debugInfo: e });
      return false;
    }

    if (typeof e === 'string' || e instanceof String) {
      logger.error(`a fatal error occured, the lambda will NOT restart; ${e}`, { debugInfo: e });
      return false;
    } else {
      logger.info('[handleKinesisAsyncProcessing function error]: Unhandled error occured', { debugInfo: e });
    }
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

    if (!opts.cancelRequestResultSchemaName || typeof opts.cancelRequestResultSchemaName !== 'string' || opts.cancelRequestResultSchemaName.trim() === '') {
      throw new CancelRequestConsumerError(
        'missing/undefined cancelRequestResultSchemaName configuration parameter',
        { type: 'function-parameter-error' }
      );
    }

    if (!opts.cancelRequestResultStreamName || typeof opts.cancelRequestResultStreamName !== 'string' || opts.cancelRequestResultStreamName.trim() === '') {
      throw new CancelRequestConsumerError(
        'missing/undefined cancelRequestResultStreamName configuration parameter',
        { type: 'function-parameter-error' }
      );
    }

    return exports.handleKinesisAsyncProcessing(records, opts, context, callback);
  } catch (e) {
    logger.error(`[kinesisHandler function error]: ${e.message}`, { debugInfo: e });
    return callback(e.message);
  }
};

exports.handler = (event, context, callback) => {
  if (event && Array.isArray(event.Records) && event.Records.length > 0) {
    const record = event.Records[0];
    // Handle Kinesis Stream
    if (record.kinesis && record.kinesis.data) {
      // Execute the handler in local development mode, without decryption
      if (!Cache.isProductionEnv()) {
        logger.info('executing kinesisHandler in local development mode');

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
            nyplCheckoutRequestApiUrl: process.env.NYPL_CHECKOUT_REQUEST_API_URL,
            nyplRecapRequestApiUrl: process.env.NYPL_RECAP_API_URL,
            cancelRequestResultSchemaName: process.env.CANCEL_REQUEST_RESULT_SCHEMA_NAME,
            cancelRequestResultStreamName: process.env.CANCEL_REQUEST_RESULT_STREAM_NAME
          },
          context,
          callback
        );
      }

      // Handle Production decryption and execution of kinesisHandler
      return lambdaEnvVarsClient.getCustomDecryptedValueList(
        [
          'OAUTH_CLIENT_ID',
          'OAUTH_CLIENT_SECRET',
          'OAUTH_PROVIDER_SCOPE'
        ],
        { location: 'lambdaConfig' })
        .then(resultObject => {
          return exports.kinesisHandler(
            event.Records,
            {
              nyplDataApiBaseUrl: process.env.NYPL_DATA_API_BASE_URL,
              recapCancelRequestSchema: process.env.RECAP_CANCEL_REQUEST_SCHEMA_NAME,
              nyplCheckinRequestApiUrl: process.env.NYPL_CHECKIN_REQUEST_API_URL,
              nyplCheckoutRequestApiUrl: process.env.NYPL_CHECKOUT_REQUEST_API_URL,
              cancelRequestResultSchemaName: process.env.CANCEL_REQUEST_RESULT_SCHEMA_NAME,
              cancelRequestResultStreamName: process.env.CANCEL_REQUEST_RESULT_STREAM_NAME,
              oAuthProviderUrl: process.env.OAUTH_PROVIDER_URL,
              oAuthClientId: resultObject.OAUTH_CLIENT_ID,
              oAuthClientSecret: resultObject.OAUTH_CLIENT_SECRET,
              oAuthProviderScope: resultObject.OAUTH_PROVIDER_SCOPE
            },
            context,
            callback
          );
        })
        .catch(error => {
          logger.error(
            '[handler function error]: an error occured while decrypting the Lambda ENV variables via LambdaEnvVarsClient',
            { debugInfo: error }
          );

          return callback(new Error('[handler function error]: an error occured while decrypting the Lambda ENV variables via LambdaEnvVarsClient'));
        });
    }

    logger.error('[handler function error]: the event.Records array does not contain a kinesis stream of records to process');
    return callback(new Error('the event.Records array does not contain a kinesis stream of records to process'));
  }

  logger.error('[handler function error]: the event.Records array is undefined');
  return callback(new Error('the event.Records array is undefined'));
};
