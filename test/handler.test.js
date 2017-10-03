/* eslint-disable semi, no-unused-expressions */
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import CancelRequestConsumer from '../index.js';
import CancelRequestConsumerError from '../src/helpers/ErrorHelper';
import event from '../sample/sample_event.json';
chai.should();
chai.use(sinonChai);
chai.use(chaiAsPromised);
const expect = chai.expect;

const kinesisHandlerFunc = CancelRequestConsumer.kinesisHandler;
const handleKinesisAsyncProcessing = CancelRequestConsumer.handleKinesisAsyncProcessing;

describe('CancelRequestConsumer Lambda: Handle Kinesis Stream Input', () => {
  describe('Main Handler: exports.handler()', () => {
    let kinesisHandlerStub;

    beforeEach(() => {
      kinesisHandlerStub = sinon.stub(CancelRequestConsumer, 'kinesisHandler');
    });

    afterEach(() => {
      kinesisHandlerStub.restore();
    });

    it('should call the kinesisHandler function', () => {
      CancelRequestConsumer.handler(event);

      expect(kinesisHandlerStub).to.be.called;
    });

    it('should fire the callback function with an error if the event is NULL', () => {
      let callback = sinon.spy();

      CancelRequestConsumer.handler(null, null, callback);

      const errArg = callback.firstCall.args[0];

      expect(errArg).to.be.instanceof(Error);
      expect(errArg.message).to.equal('the event.Records array is undefined');
      expect(callback).to.be.called;
    });

    it('should fire the callback function with an error if the event.Records array is empty', () => {
      let callback = sinon.spy();

      CancelRequestConsumer.handler({
        Records: []
      }, null, callback);

      const errArg = callback.firstCall.args[0];

      expect(errArg).to.be.instanceof(Error);
      expect(errArg.message).to.equal('the event.Records array is undefined');
      expect(callback).to.be.called;
    });

    it('should fire the callback function with an error if the event.Records array does not contain Kinesis records', () => {
      let callback = sinon.spy();

      CancelRequestConsumer.handler({
        Records: [
          {
            notKinesis: []
          }
        ]
      }, null, callback);

      const errArg = callback.firstCall.args[0];

      expect(errArg).to.be.instanceof(Error);
      expect(errArg.message).to.equal('the event.Records array does not contain a kinesis stream of records to process');
      expect(callback).to.be.called;
    });
  });

  describe('Kinesis Handler: exports.kinesisHandler()', () => {
    const callbackSpy = sinon.spy();

    it('should catch a CancelRequestConsumerError and return the callback with the error message if the config options parameter is NULL', () => {

      kinesisHandlerFunc(event.Records, null, null, callbackSpy);

      expect(callbackSpy).to.be.calledWith('missing/undefined opts object configuration parameter');
    });

    it('should catch a CancelRequestConsumerError and return the callback with the error message if the config options parameter is UNDEFINED', () => {

      kinesisHandlerFunc(event.Records, undefined, null, callbackSpy);

      expect(callbackSpy).to.be.calledWith('missing/undefined opts object configuration parameter');
    });

    it('should catch a CancelRequestConsumerError and return the callback with the error message if the config options parameter is an EMPTY object', () => {

      kinesisHandlerFunc(event.Records, {}, null, callbackSpy);

      expect(callbackSpy).to.be.calledWith('missing/undefined opts object configuration parameter');
    });

    it('should catch a CancelRequestConsumerError and return the callback with the error message if the oAuthProviderUrl configuration parameter is undefined', () => {

      kinesisHandlerFunc(
        event.Records,
        {
          someKey: 'someValue'
        },
        null,
        callbackSpy
      );

      expect(callbackSpy).to.be.calledWith('missing/undefined oAuthProviderUrl configuration parameter');
    });

    it('should catch a CancelRequestConsumerError and return the callback with the error message if the oAuthProviderUrl configuration parameter is an EMPTY string', () => {
      kinesisHandlerFunc(
        event.Records,
        {
          oAuthProviderUrl: ''
        },
        null,
        callbackSpy
      );

      expect(callbackSpy).to.be.calledWith('missing/undefined oAuthProviderUrl configuration parameter');
    });

    it('should catch a CancelRequestConsumerError and return the callback with the error message if the oAuthClientId configuration parameter is missing', () => {
      kinesisHandlerFunc(
        event.Records,
        {
          oAuthProviderUrl: 'http://oauthurl.org'
        },
        null,
        callbackSpy
      );

      expect(callbackSpy).to.be.calledWith('missing/undefined oAuthClientId configuration parameter');
    });

    it('should catch a CancelRequestConsumerError and return the callback with the error message if the oAuthClientId configuration parameter is an EMPTY string', () => {
      kinesisHandlerFunc(
        event.Records,
        {
          oAuthProviderUrl: 'http://oauthurl.org',
          oAuthClientId: ''
        },
        null,
        callbackSpy
      );

      expect(callbackSpy).to.be.calledWith('missing/undefined oAuthClientId configuration parameter');
    });

    it('should catch a CancelRequestConsumerError and return the callback with the error message if the oAuthClientSecret configuration parameter is missing', () => {
      kinesisHandlerFunc(
        event.Records,
        {
          oAuthProviderUrl: 'http://oauthurl.org',
          oAuthClientId: 'client_id'
        },
        null,
        callbackSpy
      );

      expect(callbackSpy).to.be.calledWith('missing/undefined oAuthClientSecret configuration parameter');
    });

    it('should catch a CancelRequestConsumerError and return the callback with the error message if the oAuthClientSecret configuration parameter is an EMPTY string', () => {
      kinesisHandlerFunc(
        event.Records,
        {
          oAuthProviderUrl: 'http://oauthurl.org',
          oAuthClientId: 'client_id',
          oAuthClientSecret: ' '
        },
        null,
        callbackSpy
      );

      expect(callbackSpy).to.be.calledWith('missing/undefined oAuthClientSecret configuration parameter');
    });

    it('should catch a CancelRequestConsumerError and return the callback with the error message if the oAuthProviderScope configuration parameter is missing', () => {
      kinesisHandlerFunc(
        event.Records,
        {
          oAuthProviderUrl: 'http://oauthurl.org',
          oAuthClientId: 'client_id',
          oAuthClientSecret: 'secret'
        },
        null,
        callbackSpy
      );

      expect(callbackSpy).to.be.calledWith('missing/undefined oAuthProviderScope configuration parameter');
    });

    it('should catch a CancelRequestConsumerError and return the callback with the error message if the oAuthProviderScope configuration parameter is an EMPTY string', () => {
      kinesisHandlerFunc(
        event.Records,
        {
          oAuthProviderUrl: 'http://oauthurl.org',
          oAuthClientId: 'client_id',
          oAuthClientSecret: 'secret',
          oAuthProviderScope: ' '
        },
        null,
        callbackSpy
      );

      expect(callbackSpy).to.be.calledWith('missing/undefined oAuthProviderScope configuration parameter');
    });

    it('should catch a CancelRequestConsumerError and return the callback with the error message if the nyplDataApiBaseUrl configuration parameter is missing', () => {
      kinesisHandlerFunc(
        event.Records,
        {
          oAuthProviderUrl: 'http://oauthurl.org',
          oAuthClientId: 'client_id',
          oAuthClientSecret: 'secret',
          oAuthProviderScope: 'scope'
        },
        null,
        callbackSpy
      );

      expect(callbackSpy).to.be.calledWith('missing/undefined nyplDataApiBaseUrl configuration parameter');
    });

    it('should catch a CancelRequestConsumerError and return the callback with the error message if the nyplDataApiBaseUrl configuration parameter is an EMPTY string', () => {
      kinesisHandlerFunc(
        event.Records,
        {
          oAuthProviderUrl: 'http://oauthurl.org',
          oAuthClientId: 'client_id',
          oAuthClientSecret: 'secret',
          oAuthProviderScope: 'scope',
          nyplDataApiBaseUrl: ''
        },
        null,
        callbackSpy
      );

      expect(callbackSpy).to.be.calledWith('missing/undefined nyplDataApiBaseUrl configuration parameter');
    });

    it('should catch a CancelRequestConsumerError and return the callback with the error message if the recapCancelRequestSchema configuration parameter is missing', () => {
      kinesisHandlerFunc(
        event.Records,
        {
          oAuthProviderUrl: 'http://oauthurl.org',
          oAuthClientId: 'client_id',
          oAuthClientSecret: 'secret',
          oAuthProviderScope: 'scope',
          nyplDataApiBaseUrl: 'http://nyplbaseurl.org'
        },
        null,
        callbackSpy
      );

      expect(callbackSpy).to.be.calledWith('missing/undefined recapCancelRequestSchema configuration parameter');
    });

    it('should catch a CancelRequestConsumerError and return the callback with the error message if the recapCancelRequestSchema configuration parameter is an EMPTY string', () => {
      kinesisHandlerFunc(
        event.Records,
        {
          oAuthProviderUrl: 'http://oauthurl.org',
          oAuthClientId: 'client_id',
          oAuthClientSecret: 'secret',
          oAuthProviderScope: 'scope',
          nyplDataApiBaseUrl: 'http://nyplbaseurl.org',
          recapCancelRequestSchema: ''
        },
        null,
        callbackSpy
      );

      expect(callbackSpy).to.be.calledWith('missing/undefined recapCancelRequestSchema configuration parameter');
    });

    it('should catch a CancelRequestConsumerError and return the callback with the error message if the nyplCheckinRequestApiUrl configuration parameter is missing', () => {
      kinesisHandlerFunc(
        event.Records,
        {
          oAuthProviderUrl: 'http://oauthurl.org',
          oAuthClientId: 'client_id',
          oAuthClientSecret: 'secret',
          oAuthProviderScope: 'scope',
          nyplDataApiBaseUrl: 'http://nyplbaseurl.org',
          recapCancelRequestSchema: 'cancelRequestSchema'
        },
        null,
        callbackSpy
      );

      expect(callbackSpy).to.be.calledWith('missing/undefined nyplCheckinRequestApiUrl configuration parameter');
    });

    it('should catch a CancelRequestConsumerError and return the callback with the error message if the nyplCheckinRequestApiUrl configuration parameter is an EMPTY string', () => {
      kinesisHandlerFunc(
        event.Records,
        {
          oAuthProviderUrl: 'http://oauthurl.org',
          oAuthClientId: 'client_id',
          oAuthClientSecret: 'secret',
          oAuthProviderScope: 'scope',
          nyplDataApiBaseUrl: 'http://nyplbaseurl.org',
          recapCancelRequestSchema: 'cancelRequestSchema',
          nyplCheckinRequestApiUrl: ' '
        },
        null,
        callbackSpy
      );

      expect(callbackSpy).to.be.calledWith('missing/undefined nyplCheckinRequestApiUrl configuration parameter');
    });

    it('should catch a CancelRequestConsumerError and return the callback with the error message if the nyplCheckoutRequestApiUrl configuration parameter is missing', () => {
      kinesisHandlerFunc(
        event.Records,
        {
          oAuthProviderUrl: 'http://oauthurl.org',
          oAuthClientId: 'client_id',
          oAuthClientSecret: 'secret',
          oAuthProviderScope: 'scope',
          nyplDataApiBaseUrl: 'http://nyplbaseurl.org',
          recapCancelRequestSchema: 'cancelRequestSchema',
          nyplCheckinRequestApiUrl: 'http://checkinurl.org'
        },
        null,
        callbackSpy
      );

      expect(callbackSpy).to.be.calledWith('missing/undefined nyplCheckoutRequestApiUrl configuration parameter');
    });

    it('should catch a CancelRequestConsumerError and return the callback with the error message if the nyplCheckoutRequestApiUrl configuration parameter is an EMPTY string', () => {
      kinesisHandlerFunc(
        event.Records,
        {
          oAuthProviderUrl: 'http://oauthurl.org',
          oAuthClientId: 'client_id',
          oAuthClientSecret: 'secret',
          oAuthProviderScope: 'scope',
          nyplDataApiBaseUrl: 'http://nyplbaseurl.org',
          recapCancelRequestSchema: 'cancelRequestSchema',
          nyplCheckinRequestApiUrl: 'http://checkinurl.org',
          nyplCheckoutRequestApiUrl: ''
        },
        null,
        callbackSpy
      );

      expect(callbackSpy).to.be.calledWith('missing/undefined nyplCheckoutRequestApiUrl configuration parameter');
    });

    it('should catch a CancelRequestConsumerError and return the callback with the error message if the cancelRequestResultSchemaName configuration parameter is missing', () => {
      kinesisHandlerFunc(
        event.Records,
        {
          oAuthProviderUrl: 'http://oauthurl.org',
          oAuthClientId: 'client_id',
          oAuthClientSecret: 'secret',
          oAuthProviderScope: 'scope',
          nyplDataApiBaseUrl: 'http://nyplbaseurl.org',
          recapCancelRequestSchema: 'cancelRequestSchema',
          nyplCheckinRequestApiUrl: 'http://checkinurl.org',
          nyplCheckoutRequestApiUrl: 'http://checkouturl.org'
        },
        null,
        callbackSpy
      );

      expect(callbackSpy).to.be.calledWith('missing/undefined cancelRequestResultSchemaName configuration parameter');
    });

    it('should catch a CancelRequestConsumerError and return the callback with the error message if the cancelRequestResultSchemaName configuration parameter is an EMPTY string', () => {
      kinesisHandlerFunc(
        event.Records,
        {
          oAuthProviderUrl: 'http://oauthurl.org',
          oAuthClientId: 'client_id',
          oAuthClientSecret: 'secret',
          oAuthProviderScope: 'scope',
          nyplDataApiBaseUrl: 'http://nyplbaseurl.org',
          recapCancelRequestSchema: 'cancelRequestSchema',
          nyplCheckinRequestApiUrl: 'http://checkinurl.org',
          nyplCheckoutRequestApiUrl: 'http://checkouturl.org',
          cancelRequestResultSchemaName: ''
        },
        null,
        callbackSpy
      );

      expect(callbackSpy).to.be.calledWith('missing/undefined cancelRequestResultSchemaName configuration parameter');
    });

    it('should catch a CancelRequestConsumerError and return the callback with the error message if the cancelRequestResultStreamName configuration parameter is missing', () => {
      kinesisHandlerFunc(
        event.Records,
        {
          oAuthProviderUrl: 'http://oauthurl.org',
          oAuthClientId: 'client_id',
          oAuthClientSecret: 'secret',
          oAuthProviderScope: 'scope',
          nyplDataApiBaseUrl: 'http://nyplbaseurl.org',
          recapCancelRequestSchema: 'cancelRequestSchema',
          nyplCheckinRequestApiUrl: 'http://checkinurl.org',
          nyplCheckoutRequestApiUrl: 'http://checkouturl.org',
          cancelRequestResultSchemaName: 'schemaName'
        },
        null,
        callbackSpy
      );

      expect(callbackSpy).to.be.calledWith('missing/undefined cancelRequestResultStreamName configuration parameter');
    });

    it('should catch a CancelRequestConsumerError and return the callback with the error message if the cancelRequestResultStreamName configuration parameter is an EMPTY string', () => {
      kinesisHandlerFunc(
        event.Records,
        {
          oAuthProviderUrl: 'http://oauthurl.org',
          oAuthClientId: 'client_id',
          oAuthClientSecret: 'secret',
          oAuthProviderScope: 'scope',
          nyplDataApiBaseUrl: 'http://nyplbaseurl.org',
          recapCancelRequestSchema: 'cancelRequestSchema',
          nyplCheckinRequestApiUrl: 'http://checkinurl.org',
          nyplCheckoutRequestApiUrl: 'http://checkouturl.org',
          cancelRequestResultSchemaName: 'schemaName',
          cancelRequestResultStreamName: ' '
        },
        null,
        callbackSpy
      );

      expect(callbackSpy).to.be.calledWith('missing/undefined cancelRequestResultStreamName configuration parameter');
    });

    it('should call the handleKinesisAsyncProcessing function after all required parameters have been validated', () => {
      let handleKinesisAsyncProcessingStub = sinon.stub(CancelRequestConsumer, 'handleKinesisAsyncProcessing');

      // Execute the kinesisHandler
      CancelRequestConsumer.kinesisHandler(
        event.Records,
        {
          oAuthProviderUrl: 'http://oauthurl.org',
          oAuthClientId: 'client_id',
          oAuthClientSecret: 'secret',
          oAuthProviderScope: 'scope',
          nyplDataApiBaseUrl: 'http://nyplbaseurl.org',
          recapCancelRequestSchema: 'recapSchemaName',
          nyplCheckinRequestApiUrl: 'http://checkinurl.org',
          nyplCheckoutRequestApiUrl: 'http://checkouturl.org',
          cancelRequestResultSchemaName: 'resultSchemaName',
          cancelRequestResultStreamName: 'resultStreamName'
        }
      );

      handleKinesisAsyncProcessingStub.restore();

      expect(handleKinesisAsyncProcessingStub).to.be.called;
    });
  });

  describe('handleKinesisAsyncProcessing()', () => {
    let mock;

    beforeEach(() => {
      mock = new MockAdapter(axios);
    });

    afterEach(() => {
      mock.reset();
    });

    it('should be a function', () => {
      expect(handleKinesisAsyncProcessing).to.be.a('function');
    });

    it('should throw an AvroValidationError and return false (no restart) when the Schema is incorrect', () => {
      mock.onPost().reply(
        200,
        {
          access_token: 'newAccessTokenResolved'
        }
      );

      const result = handleKinesisAsyncProcessing(
        event.Records,
        {
          oAuthProviderUrl: 'http://oauthurl.org',
          oAuthClientId: 'cliendId',
          oAuthClientSecret: 'clientSecret',
          oAuthProviderScope: 'oAuthScope',
          nyplDataApiBaseUrl: 'https://api.nypltech.org/api/v0.1/',
          recapCancelRequestSchema: 'HoldRequest',
          nyplCheckinRequestApiUrl: 'https://api.nypltech.org/api/v0.1/checkin-requests',
          nyplCheckoutRequestApiUrl: 'https://api.nypltech.org/api/v0.1/checkout-requests',
          cancelRequestResultSchemaName: 'resultSchemaName',
          cancelRequestResultStreamName: 'resultStreamName'
        },
        null,
        null
      );

      expect(result).to.eventually.equal(false);
    });
  });
});
