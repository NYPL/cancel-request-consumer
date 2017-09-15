/* eslint-disable semi */
import chai from 'chai';
//import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import CancelRequestConsumer from '../index.js';
import event from '../sample/sample_event.json';
chai.should();
chai.use(sinonChai);
// chai.use(chaiAsPromised);
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
    it('should throw an CancelRequestConsumerError if the config options parameter is NULL', () => {
      const result = kinesisHandlerFunc(event.Records, null);
      expect(result).to.have.property('message', 'missing/undefined opts object configuration parameter');
    });

    it('should throw an CancelRequestConsumerError if the config options parameter is UNDEFINED', () => {
      const result = kinesisHandlerFunc(event.Records, undefined);
      expect(result).to.have.property('message', 'missing/undefined opts object configuration parameter');
    });

    it('should throw an CancelRequestConsumerError if the config options parameter is an EMPTY object', () => {
      const result = kinesisHandlerFunc(event.Records, {});
      expect(result).to.have.property('message', 'missing/undefined opts object configuration parameter');
    });

    it('should throw an CancelRequestConsumerError if the oAuthProviderUrl configuration parameter is undefined', () => {
      const result = kinesisHandlerFunc(
        event.Records,
        {
          someKey: 'someValue'
        }
      );

      expect(result).to.have.property('message', 'missing/undefined oAuthProviderUrl configuration parameter');
    });

    it('should throw an CancelRequestConsumerError if the oAuthProviderUrl configuration parameter is an EMPTY string', () => {
      const result = kinesisHandlerFunc(
        event.Records,
        {
          oAuthProviderUrl: ''
        }
      );

      expect(result).to.have.property('message', 'missing/undefined oAuthProviderUrl configuration parameter');
    });

    it('should throw an CancelRequestConsumerError if the oAuthClientId configuration parameter is missing', () => {
      const result = kinesisHandlerFunc(
        event.Records,
        {
          oAuthProviderUrl: 'http://oauthurl.org'
        }
      );

      expect(result).to.have.property('message', 'missing/undefined oAuthClientId configuration parameter');
    });

    it('should throw an CancelRequestConsumerError if the oAuthClientId configuration parameter is an EMPTY string', () => {
      const result = kinesisHandlerFunc(
        event.Records,
        {
          oAuthProviderUrl: 'http://oauthurl.org',
          oAuthClientId: ''
        }
      );

      expect(result).to.have.property('message', 'missing/undefined oAuthClientId configuration parameter');
    });

    it('should throw an CancelRequestConsumerError if the oAuthClientSecret configuration parameter is missing', () => {
      const result = kinesisHandlerFunc(
        event.Records,
        {
          oAuthProviderUrl: 'http://oauthurl.org',
          oAuthClientId: 'client_id'
        }
      );

      expect(result).to.have.property('message', 'missing/undefined oAuthClientSecret configuration parameter');
    });

    it('should throw an CancelRequestConsumerError if the oAuthClientSecret configuration parameter is an EMPTY string', () => {
      const result = kinesisHandlerFunc(
        event.Records,
        {
          oAuthProviderUrl: 'http://oauthurl.org',
          oAuthClientId: 'client_id',
          oAuthClientSecret: ' '
        }
      );

      expect(result).to.have.property('message', 'missing/undefined oAuthClientSecret configuration parameter');
    });

    it('should throw an CancelRequestConsumerError if the oAuthProviderScope configuration parameter is missing', () => {
      const result = kinesisHandlerFunc(
        event.Records,
        {
          oAuthProviderUrl: 'http://oauthurl.org',
          oAuthClientId: 'client_id',
          oAuthClientSecret: 'secret'
        }
      );

      expect(result).to.have.property('message', 'missing/undefined oAuthProviderScope configuration parameter');
    });

    it('should throw an CancelRequestConsumerError if the oAuthProviderScope configuration parameter is an EMPTY string', () => {
      const result = kinesisHandlerFunc(
        event.Records,
        {
          oAuthProviderUrl: 'http://oauthurl.org',
          oAuthClientId: 'client_id',
          oAuthClientSecret: 'secret',
          oAuthProviderScope: ' '
        }
      );

      expect(result).to.have.property('message', 'missing/undefined oAuthProviderScope configuration parameter');
    });

    it('should throw an CancelRequestConsumerError if the nyplDataApiBaseUrl configuration parameter is missing', () => {
      const result = kinesisHandlerFunc(
        event.Records,
        {
          oAuthProviderUrl: 'http://oauthurl.org',
          oAuthClientId: 'client_id',
          oAuthClientSecret: 'secret',
          oAuthProviderScope: 'scope'
        }
      );

      expect(result).to.have.property('message', 'missing/undefined nyplDataApiBaseUrl configuration parameter');
    });

    it('should throw an CancelRequestConsumerError if the nyplDataApiBaseUrl configuration parameter is an EMPTY string', () => {
      const result = kinesisHandlerFunc(
        event.Records,
        {
          oAuthProviderUrl: 'http://oauthurl.org',
          oAuthClientId: 'client_id',
          oAuthClientSecret: 'secret',
          oAuthProviderScope: 'scope',
          nyplDataApiBaseUrl: ''
        }
      );

      expect(result).to.have.property('message', 'missing/undefined nyplDataApiBaseUrl configuration parameter');
    });

    it('should throw an CancelRequestConsumerError if the recapCancelRequestSchema configuration parameter is missing', () => {
      const result = kinesisHandlerFunc(
        event.Records,
        {
          oAuthProviderUrl: 'http://oauthurl.org',
          oAuthClientId: 'client_id',
          oAuthClientSecret: 'secret',
          oAuthProviderScope: 'scope',
          nyplDataApiBaseUrl: 'http://nyplbaseurl.org'
        }
      );

      expect(result).to.have.property('message', 'missing/undefined recapCancelRequestSchema configuration parameter');
    });

    it('should throw an CancelRequestConsumerError if the recapCancelRequestSchema configuration parameter is an EMPTY string', () => {
      const result = kinesisHandlerFunc(
        event.Records,
        {
          oAuthProviderUrl: 'http://oauthurl.org',
          oAuthClientId: 'client_id',
          oAuthClientSecret: 'secret',
          oAuthProviderScope: 'scope',
          nyplDataApiBaseUrl: 'http://nyplbaseurl.org',
          recapCancelRequestSchema: ''
        }
      );

      expect(result).to.have.property('message', 'missing/undefined recapCancelRequestSchema configuration parameter');
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
          recapCancelRequestSchema: 'recapSchemaName'
        }
      );

      handleKinesisAsyncProcessingStub.restore();

      expect(handleKinesisAsyncProcessingStub).to.be.called;
    });
  });

  describe('handleKinesisAsyncProcessing()', () => {

  });
});
