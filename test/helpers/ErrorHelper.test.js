/* eslint-disable semi */
import chai from 'chai';
import CancelRequestConsumerError from '../../src/helpers/ErrorHelper';
const expect = chai.expect;
chai.should();

describe('CancelRequestConsumer Lambda: ErrorHelper Factory', () => {
  it('should throw an error if no message parameter was passed', () => {
    expect(() => new CancelRequestConsumerError()).to.throw(/an error message is required/);
    expect(() => new CancelRequestConsumerError(null, {})).to.throw(/an error message is required/);
    expect(() => new CancelRequestConsumerError({})).to.throw(/an error message is required/);
  });

  it('should contain a message property if the message parameter is passed', () => {
    const error = new CancelRequestConsumerError('dummy error message');
    expect(error).to.have.property('name', 'CancelRequestConsumerError');
    expect(error).to.have.property('message', 'dummy error message');
  });

  it('should contain a statusCode property if the optional statusCode parameter is passed', () => {
    const error = new CancelRequestConsumerError('dummy error message', { statusCode: 400 });
    expect(error).to.have.property('message', 'dummy error message');
    expect(error).to.have.property('statusCode', 400);
  });

  it('should contain a type property if the optional type parameter is passed', () => {
    const error = new CancelRequestConsumerError('dummy error message', { type: 'undefined-function-parameter' });
    expect(error).to.have.property('message', 'dummy error message');
    expect(error).to.have.property('type', 'undefined-function-parameter');
  });

  it('should contain a debugInfo property if the type parameter is passed', () => {
    const error = new CancelRequestConsumerError('dummy error message', { debugInfo: { error: {} } });
    expect(error).to.have.property('message', 'dummy error message');
    expect(error).to.have.deep.property('debugInfo', { error: {} });
  });
});
