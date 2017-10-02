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
});
