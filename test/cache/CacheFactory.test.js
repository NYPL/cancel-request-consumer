/* eslint-disable semi */
import chai from 'chai';
import Cache from '../../src/cache/CacheFactory';
chai.should();
const expect = chai.expect;

describe('CancelRequestConsumer Lambda: Cache Factory', () => {
  it('should be an object', () => {
    expect(Cache).to.be.an('object');
  });

  it('should initialize the token property to NULL', () => {
    expect(Cache.token).to.be.null;
    expect(Cache.getToken()).to.be.null;
  });

  it('should have a getToken function', () => {
    expect(Cache.getToken).to.be.a('function');
  });

  it('should return the token value when using getToken() function', () => {
    const newToken = 'testtoken';
    Cache.setToken(newToken);
    expect(Cache.getToken()).to.equal(newToken);
  });

  it('should set the token value when using setToken(token) function', () => {
    const newToken = 'testtoken';
    Cache.setToken(newToken);
    expect(Cache.token).to.equal(newToken);
  });

  it('should have a filterProcessedRecords function', () => {
    expect(Cache.filterProcessedRecords).to.be.a('function');
  });

  it('should reject if the records array parameter is undefined', () => {
    const result = Cache.filterProcessedRecords(undefined);
    return result.catch(e => {
      expect(e.message).to.equal('the Cancel Request Records have been filtered resulting in an empty array; no records remain to be processed');
    });
  });

  it('should reject if the records array parameter is null', () => {
    const result = Cache.filterProcessedRecords(null);
    return result.catch(e => {
      expect(e.message).to.equal('the Cancel Request Records have been filtered resulting in an empty array; no records remain to be processed');
    });
  });

  it('should filter records that contain the processed boolean set to true and resolve the array', () => {
    const result = Cache.filterProcessedRecords([{ id: 123, processed: false }, { id: 456, processed: true }]);
    return result.then(res => {
      expect(res).to.deep.equal([{ id: 123, processed: false }]);
    });
  });

  it('should reject with an error if no records exist after filtering', () => {
    const result = Cache.filterProcessedRecords([{ id: 123, processed: true }, { id: 456, processed: true }]);
    return result.catch(e => {
      expect(e.message).to.equal('the Cancel Request Records have been filtered resulting in an empty array; no records remain to be processed');
    });
  });
});
