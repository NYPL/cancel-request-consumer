/* eslint-disable semi */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { generateStreamModel, postItemsToStream } from '../../src/helpers/StreamHelper';
import CancelRequestConsumerError from '../../src/helpers/ErrorHelper';
const expect = chai.expect;
chai.should();
chai.use(chaiAsPromised);

describe('CancelRequestConsumer Lambda: StreamHelper', () => {
  describe('generateStreamModel(object) function', () => {
    it('should exist and be of type function', () => {
      expect(generateStreamModel).to.be.a('function');
    });

    it('should throw a CancelRequestConsumerError if the object is NOT defined', () => {
      expect(() => generateStreamModel()).to.throw('the cancelRequestId (type int) object property is not defined, unable to post record to stream');
    });

    it('should throw a CancelRequestConsumerError if the object does NOT contain an id property', () => {
      expect(() => generateStreamModel({})).to.throw('the cancelRequestId (type int) object property is not defined, unable to post record to stream');
    });

    it('should throw a CancelRequestConsumerError if the id object property is NOT of type Number', () => {
      expect(() => generateStreamModel({ id: ' ' })).to.throw('the cancelRequestId (type int) object property is not defined, unable to post record to stream');
    });

    it('should NOT throw a CancelRequestConsumerError if the id object property is of type Number', () => {
      expect(() => generateStreamModel({ id: 123 })).to.not.throw();
    });

    it('should return a success object if deleted boolean flag is TRUE and no jobId is defined', () => {
      const result = generateStreamModel({ id: 123, deleted: true });

      expect(result).to.deep.equal({ cancelRequestId: 123, jobId: null, success: true, error: null });
    });

    it('should return a success object if deleted flag is TRUE and jobId is defined', () => {
      const result = generateStreamModel({ id: 123, deleted: true, jobId: 'abc' });

      expect(result).to.deep.equal({ cancelRequestId: 123, success: true, error: null, jobId: 'abc' });
    });

    it('should return a failure object if deleted boolean flag is false', () => {
      const result = generateStreamModel({ id: 123, deleted: false });

      expect(result).to.deep.equal({
        cancelRequestId: 123,
        jobId: null,
        success: false,
        error: {
          type: 'cancel-request-consumer-error',
          message: 'the checkout and checkin processed failed for Cancel Request Record (123)'
        }
      });
    });

    it('should return a failure object if deleted boolean flag is false with custom error type and message', () => {
      const result = generateStreamModel({
        id: 123,
        deleted: false,
        error: {
          errorType: 'ncip-checkin-error',
          errorMessage: 'Item not found'
        }
      });

      expect(result).to.deep.equal({
        cancelRequestId: 123,
        jobId: null,
        success: false,
        error: {
          type: 'ncip-checkin-error',
          message: 'Item not found'
        }
      });
    });
  });

  describe('postItemsToStream(items, streamName, schemaName, nyplDataApiBaseUrl) function', () => {
    it('should exist and be of type function', () => {
      expect(postItemsToStream).to.be.a('function');
    });

    it('should reject the Promise if the items array parameter is not defined', () => {
      const result = postItemsToStream(null, 'streamName', 'schemaName', 'http://apiurl.org');

      return result.should.be.rejectedWith(CancelRequestConsumerError, 'the items array property not defined or empty, unable to post records to stream');
    });

    it('should reject the Promise if the items array parameter is not of type array', () => {
      const result = postItemsToStream({}, 'streamName', 'schemaName', 'http://apiurl.org');

      return result.should.be.rejectedWith(CancelRequestConsumerError, 'the items array property not defined or empty, unable to post records to stream');
    });

    it('should reject the Promise if the items array parameter is empty', () => {
      const result = postItemsToStream([], 'streamName', 'schemaName', 'http://apiurl.org');

      return result.should.be.rejectedWith(CancelRequestConsumerError, 'the items array property not defined or empty, unable to post records to stream');
    });

    it('should reject the Promise if the streamName string parameter is not defined', () => {
      const result = postItemsToStream([{}], undefined, 'schemaName', 'http://apiurl.org');

      return result.should.be.rejectedWith(CancelRequestConsumerError, 'the streamName string parameter is not defined, unable to post records to stream');
    });

    it('should reject the Promise if the streamName string parameter is NULL', () => {
      const result = postItemsToStream([{}], null, 'schemaName', 'http://apiurl.org');

      return result.should.be.rejectedWith(CancelRequestConsumerError, 'the streamName string parameter is not defined, unable to post records to stream');
    });

    it('should reject the Promise if the streamName string parameter is not of type string', () => {
      const result = postItemsToStream([{}], {}, 'schemaName', 'http://apiurl.org');

      return result.should.be.rejectedWith(CancelRequestConsumerError, 'the streamName string parameter is not defined, unable to post records to stream');
    });

    it('should reject the Promise if the streamName string parameter is an empty string', () => {
      const result = postItemsToStream([{}], ' ', 'schemaName', 'http://apiurl.org');

      return result.should.be.rejectedWith(CancelRequestConsumerError, 'the streamName string parameter is not defined, unable to post records to stream');
    });

    it('should reject the Promise if the schemaName string parameter is not defined', () => {
      const result = postItemsToStream([{}], 'streamName', undefined, 'http://apiurl.org');

      return result.should.be.rejectedWith(CancelRequestConsumerError, 'the schemaName string parameter is not defined, unable to post records to stream');
    });

    it('should reject the Promise if the schemaName string parameter is NULL', () => {
      const result = postItemsToStream([{}], 'streamName', null, 'http://apiurl.org');

      return result.should.be.rejectedWith(CancelRequestConsumerError, 'the schemaName string parameter is not defined, unable to post records to stream');
    });

    it('should reject the Promise if the schemaName string parameter is not of type string', () => {
      const result = postItemsToStream([{}], 'streamName', {}, 'http://apiurl.org');

      return result.should.be.rejectedWith(CancelRequestConsumerError, 'the schemaName string parameter is not defined, unable to post records to stream');
    });

    it('should reject the Promise if the schemaName string parameter is an empty string', () => {
      const result = postItemsToStream([{}], 'streamName', ' ', 'http://apiurl.org');

      return result.should.be.rejectedWith(CancelRequestConsumerError, 'the schemaName string parameter is not defined, unable to post records to stream');
    });

    it('should reject the Promise if the nyplDataApiBaseUrl string parameter is not defined', () => {
      const result = postItemsToStream([{}], 'streamName', 'schemaName');

      return result.should.be.rejectedWith(CancelRequestConsumerError, 'the streamsClient utility class does not contain the write() function, unable to post records to stream');
    });

    it('should reject the Promise if the streamsClient object factory parameter is NULL', () => {
      const result = postItemsToStream([{}], 'streamName', 'schemaName', null);

      return result.should.be.rejectedWith(CancelRequestConsumerError, 'the streamsClient utility class does not contain the write() function, unable to post records to stream');
    });

    it('should reject the Promise if the streamsClient does not contain the write function', () => {
      const result = postItemsToStream([{}], 'streamName', 'schemaName', {});

      return result.should.be.rejectedWith(CancelRequestConsumerError, 'the streamsClient utility class does not contain the write() function, unable to post records to stream');
    });

    it('should reject the Promise if the streamsClient is not of type object', () => {
      const result = postItemsToStream([{}], 'streamName', 'schemaName', 'client');

      return result.should.be.rejectedWith(CancelRequestConsumerError, 'the streamsClient utility class does not contain the write() function, unable to post records to stream');
    });

    it('should post the successful item to the stream and update the proccessedToResultStream boolean to true', () => {
      // mock a resolved promise
      const streamsClient = {
        write: function (streamName, item) {
          return Promise.resolve('success');
        }
      };

      const result = postItemsToStream([{ id: 123, checkoutProccessed: true, checkinProccessed: true }], 'streamName', 'schemaName', streamsClient);

      result.then(res => {
        let item = res[0];
        expect(item).to.have.property('proccessedToResultStream', true);
      });
    });

    it('should post the failed item to the stream and update the proccessedToResultStream boolean to false', () => {
      // mock a rejected promise
      const streamsClient = {
        write: function (streamName, item) {
          return Promise.reject(new Error('failed'));
        }
      };

      const result = postItemsToStream([{ id: 123, checkoutProccessed: false, checkinProccessed: true }], 'streamName', 'schemaName', streamsClient);

      expect(result).to.be.rejectedWith(Error);
    });
  });
});
