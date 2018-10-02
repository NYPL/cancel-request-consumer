/* eslint-disable semi, no-unused-expressions */
import axios from 'axios';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import MockAdapter from 'axios-mock-adapter';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import ApiHelper from '../../src/helpers/ApiHelper';
import CancelRequestConsumerError from '../../src/helpers/ErrorHelper';
import logger from '../../src/helpers/Logger'
const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
// const mockAdapterInstance = new MockAdapter(axios);

describe('CancelRequestConsumer Lambda: ApiHelper Factory', () => {
  let mock;
  let generateErrorResponseObjectStub;

  beforeEach(() => {
    generateErrorResponseObjectStub = sinon.stub(ApiHelper, 'generateErrorResponseObject');
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    generateErrorResponseObjectStub.restore();
    mock.reset();
  });

  describe('getApiHeaders(token, contentType, timeOut) function', () => {
    it('should return an object with default parameters', () => {
      const headers = ApiHelper.getApiHeaders();

      return headers.should.deep.equal({
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer '
        },
        timeout: 10000
      });
    });

    it('should return the correct object with defined function parameters', () => {
      const headers = ApiHelper.getApiHeaders('tokenvalue', 'text', 25000);

      return headers.should.deep.equal({
        headers: {
          'Content-Type': 'text',
          Authorization: 'Bearer tokenvalue'
        },
        timeout: 25000
      });
    });
  });


  describe('generateErrorResponseObject(object) function', () => {
    it('should return the correct properties when the object contains the response key and the payload is not a string object', () => {
      generateErrorResponseObjectStub.restore();
      const errorResponseObject = ApiHelper.generateErrorResponseObject({
        response: {
          config: {
            method: 'POST',
            url: 'http://apiurl.org',
            data: 'patron'
          },
          status: 404,
          statusText: 'Not Found',
          data: {
            type: 'ncip-error',
            message: 'Item not found'
          }
        }
      });

      return errorResponseObject.should.deep.equal({
        responseType: 'response',
        method: 'POST',
        url: 'http://apiurl.org',
        payload: 'patron',
        statusCode: 404,
        statusText: 'Not Found',
        errorType: 'ncip-error',
        errorMessage: 'Item not found'
      });
    });

    it('should return the correct properties when the object contains the response key and the payload is a string object', () => {
      generateErrorResponseObjectStub.restore();
      const errorResponseObject = ApiHelper.generateErrorResponseObject({
        response: {
          config: {
            method: 'POST',
            url: 'http://apiurl.org',
            data: '{"name":"John", "age":30, "city":"New York"}'
          },
          status: 404,
          statusText: 'Not Found',
          data: {
            type: 'ncip-error',
            message: 'Item not found'
          }
        }
      });

      return errorResponseObject.should.deep.equal({
        responseType: 'response',
        method: 'POST',
        url: 'http://apiurl.org',
        payload: { name: 'John', age: 30, city: 'New York' },
        statusCode: 404,
        statusText: 'Not Found',
        errorType: 'ncip-error',
        errorMessage: 'Item not found'
      });
    });

    it('should return the correct properties when the object contains the request key', () => {
      generateErrorResponseObjectStub.restore();
      const errorResponseObject = ApiHelper.generateErrorResponseObject({
        request: {
          _headers: {
            someKey: 'someValue'
          }
        }
      });

      return errorResponseObject.should.deep.equal({
        responseType: 'request',
        debug: {
          _headers: {
            someKey: 'someValue'
          }
        }
      });
    });

    it('should return the default properties when the object does NOT contain a response or request property but, contains a message property', () => {
      generateErrorResponseObjectStub.restore();
      const errorResponseObject = ApiHelper.generateErrorResponseObject({ message: 'API error' });

      return errorResponseObject.should.deep.equal({
        responseType: 'malformed',
        debug: 'API error'
      });
    });

    it('should return the default properties when the object does NOT contain a response, request or message property', () => {
      generateErrorResponseObjectStub.restore();
      const errorResponseObject = ApiHelper.generateErrorResponseObject({});

      return errorResponseObject.should.deep.equal({
        responseType: 'malformed',
        debug: 'malformed request'
      });
    });

    it('should return the default properties when the object is NULL', () => {
      generateErrorResponseObjectStub.restore();
      const errorResponseObject = ApiHelper.generateErrorResponseObject(null);

      return errorResponseObject.should.deep.equal({
        responseType: 'malformed',
        debug: 'malformed request'
      });
    });
  });

  describe('handleApiErrors(errorObject, serviceType, item, callback) function', () => {
    it('should return the callback with a CancelRequestConsumerError if the errorObject.responseType is NOT response', () => {
      let cbSpy = sinon.spy();

      ApiHelper.handleApiErrors(null, 'checkin-service', null, cbSpy);

      const errArg = cbSpy.firstCall.args[0];

      expect(errArg).to.be.instanceof(CancelRequestConsumerError);
      expect(errArg.message).to.equal('An error was received from the checkin-service');
      expect(errArg.type).to.equal('checkin-service-error');
      expect(cbSpy).to.be.called;
    });

    it('should return the callback with a CancelRequestConsumerError if the statusCode is 401', () => {
      let cbSpy = sinon.spy();

      ApiHelper.handleApiErrors({ responseType: 'response', statusCode: 401, statusText: 'token-invalid' }, 'checkin-service', { id: 123 }, cbSpy);

      const errArg = cbSpy.firstCall.args[0];

      expect(errArg).to.be.instanceof(CancelRequestConsumerError);
      expect(errArg.message).to.equal('An error was received from the checkin-service for Cancel Request Record (123); the service responded with a status code: (401) and status text: token-invalid');
      expect(errArg.type).to.equal('access-token-invalid');
      expect(cbSpy).to.be.called;
    });

    it('should return the callback with a CancelRequestConsumerError if the statusCode is 500', () => {
      let cbSpy = sinon.spy();

      ApiHelper.handleApiErrors({ responseType: 'response', statusCode: 500, statusText: 'internal-server-error' }, 'checkin-service', { id: 123 }, cbSpy);

      const errArg = cbSpy.firstCall.args[0];

      expect(errArg).to.be.instanceof(CancelRequestConsumerError);
      expect(errArg.message).to.equal('An error was received from the checkin-service for Cancel Request Record (123); the service responded with a status code: (500) and status text: internal-server-error');
      expect(errArg.type).to.equal('checkin-service-error');
      expect(errArg.statusCode).to.equal(500);
      expect(cbSpy).to.be.called;
    });

    it('should return the callback with (null, item) for statusCode 403', () => {
      let cbSpy = sinon.spy();

      ApiHelper.handleApiErrors({ responseType: 'response', statusCode: 403, statusText: 'internal-server-error' }, 'checkin-service', { id: 123 }, cbSpy);

      expect(cbSpy).to.be.calledWith(null, { id: 123 });
    });

    it('should return the callback with (null, item) for statusCode 404', () => {
      let cbSpy = sinon.spy();

      ApiHelper.handleApiErrors({ responseType: 'response', statusCode: 404, statusText: 'internal-server-error' }, 'checkin-service', { id: 123 }, cbSpy);

      expect(cbSpy).to.be.calledWith(null, { id: 123 });
    });

    it('should return the callback with a CancelRequestConsumerError as a general-service-error if the serviceType is not defined', () => {
      let cbSpy = sinon.spy();

      ApiHelper.handleApiErrors({ responseType: 'response', statusCode: 500, statusText: 'internal-server-error' }, null, { id: 123 }, cbSpy);

      const errArg = cbSpy.firstCall.args[0];

      expect(errArg).to.be.instanceof(CancelRequestConsumerError);
      expect(errArg.message).to.equal('An error was received for Cancel Request Record (123); the service responded with a status code: (500) and status text: internal-server-error');
      expect(errArg.type).to.equal('service-error');
      expect(errArg.statusCode).to.equal(500);
      expect(cbSpy).to.be.called;
    });

    it('should return the callback with a null,item if the statusCode is 404', () => {
      let cbSpy = sinon.spy();

      ApiHelper.handleApiErrors({ responseType: 'response', statusCode: 404, statusText: 'Not Found' }, 'checkin-service', { id: 123 }, cbSpy);

      expect(cbSpy).to.be.calledWith(null, { id: 123 });
    });
  });



  describe('handleBatchAsyncPostRequests(items, processingFn) function', () => {
    const dummyRecords = [
      {
        id: 40,
        jobId: '07a09c62-3e41-4c55-a08f-a85c8d541941',
        trackingId: '661',
        patronBarcode: '23333080894825',
        itemBarcode: '33433005936434',
        owningInstitutionId: 'NYPL',
        processed: false,
        success: false,
        createdDate: '2017-09-20T16:07:43-04:00',
        updatedDate: null
      },
      {
        id: 41,
        jobId: '9012daa3-fea2-4731-9731-a9e9e1ed99cd',
        trackingId: '668',
        patronBarcode: '23333080894825',
        itemBarcode: '33433000948152',
        owningInstitutionId: 'NYPL',
        processed: false,
        success: false,
        createdDate: '2017-09-20T16:08:16-04:00',
        updatedDate: null
      },
      {
        id: 42,
        jobId: '77c7f97a-9ac4-4b27-a77f-24811b32aa7c',
        trackingId: '687',
        patronBarcode: '23333080894825',
        itemBarcode: '33433000829295',
        owningInstitutionId: 'NYPL',
        processed: false,
        success: false,
        createdDate: '2017-09-20T16:08:50-04:00',
        updatedDate: null
      }
    ];

    it('should take in N items and apply the processingFn to fire a callback with an error and rejects', () => {
      const dummyRejectFn = function (item, callback) {
        return callback(new Error('error'));
      };

      const result = ApiHelper.handleBatchAsyncPostRequests(dummyRecords, dummyRejectFn);

      expect(result).to.be.rejectedWith('error');
    });

    it('should take in N items and apply the processingFn to fire a callback with the items and resolve', () => {
      const dummyResolveFn = function (item, callback) {
        return callback(null, item);
      };

      const result = ApiHelper.handleBatchAsyncPostRequests(dummyRecords, dummyResolveFn);

      expect(result).to.be.fulfilled;
    });
  })

  describe('deleteItem', ()=> {
    it('should update item.deleted to true when it receives a 204 for a valid item', () => {
      var item = {holdRequestId: 1};
      mock.onDelete().reply(() => {
        return [204, {
          data: {
            data: '',
            statusCode: 204,
            debugInfo: ''
          }
        }]
      }
      )
      let promise = Promise.resolve()
        .then(() => ApiHelper.deleteItem(null, (a,b) => {return null}, item, (a,b) => {return null}))
        .then(() => item)

      return promise.should.eventually.have.property('deleted', true)
    });

    it('should not update item.deleted for an invalid item', () => {
      var item = {};
      mock.onDelete().reply(() => {
        return [204, {
          data: {
            data: '',
            statusCode: 204,
            debugInfo: ''
          }
        }]
      }
      )
      let promise = Promise.resolve()
        .then(() => ApiHelper.deleteItem(null, (a,b) => {return null}, item, (a,b) => {return null}))
        .then(() => item).catch(() => item)

      return promise.should.eventually.not.have.property('deleted')
    })
    it('should call the callback for an invalid item', () => {
      var item = {};
      mock.onDelete().reply(() => {
        return [204, {
          data: {
            data: '',
            statusCode: 204,
            debugInfo: ''
          }
        }]
      }
      )
      let promise = Promise.resolve()
        .then(() => ApiHelper.deleteItem(null, (a,b) => {return null}, item, (a,b) => {return 'called'}))

      return promise.should.eventually.equal('called')
    })
    it('should not update item.deleted for non-204 response', () => {
      var item = {holdRequestId: 1};
      mock.onDelete().reply(() => {
        return [401, {
          data: {
            data: '',
            statusCode: 401,
            debugInfo: ''
          }
        }]
      }
      )
      let promise = Promise.resolve()
        .then(() => ApiHelper.deleteItem(null, (a,b) => {return null}, item, (a,b) => {return 'called'}))
        .then(() => item).catch(() => item)

      return promise.should.eventually.not.have.property('deleted')
    })
    it('should update item.error for non-204 response', () => {
      var item = {holdRequestId: 1};
      mock.onDelete().reply(() => {
        return [401, {
          data: {
            data: '',
            statusCode: 401,
            debugInfo: ''
          }
        }]
      }
      )
      let promise = Promise.resolve()
        .then(() => ApiHelper.deleteItem(null, (a,b) => {return null}, item, (a,b) => {return 'called'}))
        .then(() => item).catch(() => item)

      return promise.should.eventually.have.property('error')
    })
    it('should call errorHandlerFn for non-204 response', () => {
      var item = {holdRequestId: 1};
      mock.onDelete().reply(() => {
        return [401, {
          data: {
            data: '',
            statusCode: 401,
            debugInfo: ''
          }
        }]
      }
      )
      let promise = Promise.resolve()
        .then(() => ApiHelper.deleteItem(null, (a,b) => {return 'errorHandlerFn'}, item, (a,b) => {return 'called'}))

      return promise.should.eventually.equal('errorHandlerFn')
    })
  })

  describe('getHoldrequestId', () => {
    it('should return the id of a hold with the matching itemId', () => {
      let itemId = 111;
      let resp = {
        data: {
          entries: [
            {record: 'https://platform.nypl.org/api/v0.1/patrons/424/holds/222', id: 'b'},
            {record: 'https://platform.nypl.org/api/v0.1/patrons/424/holds/333', id: 'c'},
            {record: 'https://platform.nypl.org/api/v0.1/patrons/424/holds/111', id: 'a'},
          ]
        }
      }
      let id = ApiHelper.getHoldrequestId(resp, itemId);
      return id.should.equal('a')
    })
    it('should return null if there is no item with matching itemId', () => {
      let itemId = 111;
      let resp = {
        data: {
          entries: [
            {record: 'https://platform.nypl.org/api/v0.1/patrons/424/holds/222', id: 'b'},
            {record: 'https://platform.nypl.org/api/v0.1/patrons/424/holds/333', id: 'c'}
          ]
        }
      }
      let id = ApiHelper.getHoldrequestId(resp, itemId);
      return (id === null).should.equal(true)
    })
  });

  describe('handleCancelItemsDeleteRequests(items, sierraToken) function', () => {
  it('should reject the Promise with an error if the items array parameter is NULL', () => {
    const result = ApiHelper.handleCancelItemsDeleteRequests(null, 'hgljhgljjlgjg');

    return result.should.be.rejectedWith(CancelRequestConsumerError, /the items array parameter is undefined/);
  });

  it('should reject the Promise with an error if the items array parameter is UNDEFINED', () => {
    const result = ApiHelper.handleCancelItemsDeleteRequests(undefined, 'jakjvakawjkfaw');

    return result.should.be.rejectedWith(CancelRequestConsumerError, /the items array parameter is undefined/);
  });

  it('should reject the Promise with an error if the items array parameter is NOT of type array', () => {
    const result = ApiHelper.handleCancelItemsDeleteRequests({}, 'ajkflsdjkfahekhawe');

    return result.should.be.rejectedWith(CancelRequestConsumerError, /the items array parameter is not of type array/);
  });

  it('should reject the Promise with an error if the items array parameter is an EMPTY array', () => {
    const result = ApiHelper.handleCancelItemsDeleteRequests([], 'tokentokentokentoken');

    return result.should.be.rejectedWith(CancelRequestConsumerError, /the items array parameter is empty/);
  });

  it('should reject the Promise with an error if the token parameter is NULL', () => {
    const result = ApiHelper.handleCancelItemsDeleteRequests([{}], null);

    return result.should.be.rejectedWith(CancelRequestConsumerError, /the token string parameter is not defined or empty/);
  });

  it('should reject the Promise with an error if the token parameter is UNDEFINED', () => {
    const result = ApiHelper.handleCancelItemsDeleteRequests([{}], undefined);

    return result.should.be.rejectedWith(CancelRequestConsumerError, /the token string parameter is not defined or empty/);
  });

  it('should reject the Promise with an error if the token parameter is NOT of type string', () => {
    const result = ApiHelper.handleCancelItemsDeleteRequests([{}], {});

    return result.should.be.rejectedWith(CancelRequestConsumerError, /the token string parameter is not defined or empty/);
  });

  it('should reject the Promise with an error if the token parameter is an EMPTY string', () => {
    const result = ApiHelper.handleCancelItemsDeleteRequests([{}], ' ');

    return result.should.be.rejectedWith(CancelRequestConsumerError, /the token string parameter is not defined or empty/);
  });

  it('should call the handleBatchAsyncPostRequests when given valid inputs', () => {
    let handleBatchAsyncPostRequestsStub = sinon.stub(ApiHelper, 'handleBatchAsyncPostRequests');

    ApiHelper.handleCancelItemsDeleteRequests([{}], 'token');

    expect(handleBatchAsyncPostRequestsStub).to.be.called;

    handleBatchAsyncPostRequestsStub.restore();
  });
});

describe('findPatronIdFromBarcode', () => {
  it('should update the patronId property for a successful call', () => {
    mock.onGet().reply(200, {id: 11111})
    let object = {}
    let promise = ApiHelper.findPatronIdFromBarcode(object, null, null).then(() => object)
    return promise.should.eventually.have.property('patronId', 11111)
  });
  it('should log an error for an unsuccessful call', () => {
    let loggerStub = sinon.stub(logger, 'error')
    let object = {}
    mock.onGet().reply(200, {})
    let promise = ApiHelper.findPatronIdFromBarcode(object, null, null).then(() => {
      let val  = loggerStub.called
      loggerStub.restore()
      return val
    })
    return promise.should.eventually.equal(true)
  });
  it('should not update patronId property for an unsuccessful call', () => {
    let object = {}
    mock.onGet().reply(200, {})
    let promise = ApiHelper.findPatronIdFromBarcode(object, null, null).then(() => object)
    return promise.should.eventually.not.have.property('patronId')
  });
  it('should not update patronId in case of an error', () => {
    let object = {}
    mock.onGet().reply(401, {id: 11111})
    let promise = ApiHelper.findPatronIdFromBarcode(object, null, null).then(() => object)
    return promise.should.eventually.not.have.property('patronId')
  });
  it('should log an error in case of an error', () => {
    let loggerStub = sinon.stub(logger, 'error')
    let object = {}
    mock.onGet().reply(401, {id: 11111})
    let promise = ApiHelper.findPatronIdFromBarcode(object, null, null).then(() => {
      let val  = loggerStub.called
      loggerStub.restore()
      return val
    })
    return promise.should.eventually.equal(true)
  })
});

describe('findItemIdFromBarcode', () => {
  it('should update the itemId property for a successful call', () => {
    mock.onGet().reply(200, {data:[{id: 11111}]})
    let object = {}
    let promise = ApiHelper.findItemIdFromBarcode(object, null, null).then(() => object)
    return promise.should.eventually.have.property('itemId', 11111)
  });
  it('should log an error for an unsuccessful call', () => {
    let loggerStub = sinon.stub(logger, 'error')
    let object = {}
    mock.onGet().reply(200, {})
    let promise = ApiHelper.findItemIdFromBarcode(object, null, null).then(() => {
      let val  = loggerStub.called
      loggerStub.restore()
      return val
    })
    return promise.should.eventually.equal(true)
  });
  it('should not update patronId property for an unsuccessful call', () => {
    let object = {}
    mock.onGet().reply(200, {})
    let promise = ApiHelper.findItemIdFromBarcode(object, null, null).then(() => object)
    return promise.should.eventually.not.have.property('patronId')
  });
  it('should not update patronId in case of an error', () => {
    let object = {}
    mock.onGet().reply(401, {data:[{id: 11111}]})
    let promise = ApiHelper.findItemIdFromBarcode(object, null, null).then(() => object)
    return promise.should.eventually.not.have.property('itemId')
  });
  it('should log an error in case of an error', () => {
    let loggerStub = sinon.stub(logger, 'error')
    let object = {}
    mock.onGet().reply(401, {data:[{id: 11111}]})
    let promise = ApiHelper.findItemIdFromBarcode(object, null, null).then(() => {
      let val  = loggerStub.called
      loggerStub.restore()
      return val
    })
    return promise.should.eventually.equal(true)
  })
});

describe('generateCancelApiModel', () => {
  it('should update the holdRequestId in case of a successful request', () => {
    var count = 0;
    let entries = () => {
      if (count < 10) {
        count += 1
        return [{record:'https://fakeapiurl.org/11111' , id: 'aaaa'}]
      }
      else if (count === 10) {
        return [{record:'https://fakeapiurl.org/22222' , id: 'bbbbb'}]
        count += 1
      }
      else {
        return []
      }
    }
    let replyMethod = () => {
      return [200, {
          entries: entries(),
          statusCode: 200,
          debugInfo: ''
        }
      ]
    }
    mock.onGet().reply(replyMethod)
    let object = {
      id: null,
      patronId: null,
      itemId: 22222,
      patronBarcode: null,
      itemBarcode: null,
      holdRequestId: null
    }
    let promise = ApiHelper
      .generateCancelApiModel(object, null, 'https://fake.org', ApiHelper.getHoldrequestId, ApiHelper.generateCancelApiModel, ApiHelper.getApiHeaders)
      .then(() => object)
    return promise.should.eventually.have.property('holdRequestId', 'bbbbb')
  });
  it('should not update the holdRequestId in case of an unsuccessful request', () => {
    var count = 0;
    let entries = () => {
      if (count < 10) {
        count += 1
        return [{record:'https://fakeapiurl.org/11111' , id: 'aaaa'}]
      }
      else if (count === 10) {
        return []
        count += 1
      }
      else {
        return []
      }
    }
    let replyMethod = () => {
      return [200, {
          entries: entries(),
          statusCode: 200,
          debugInfo: ''
        }
      ]
    }
    mock.onGet().reply(replyMethod)
    let object = {
      id: null,
      patronId: null,
      itemId: 22222,
      patronBarcode: null,
      itemBarcode: null,
      holdRequestId: null
    }
    let promise = ApiHelper
      .generateCancelApiModel(object, null, 'https://fake.org', ApiHelper.getHoldrequestId, ApiHelper.generateCancelApiModel, ApiHelper.getApiHeaders)
      .then(() => object)
    return promise.should.eventually.have.property('holdRequestId', null)
  });
  it('should log an error in case of an error', () => {
    mock.onGet().reply(401)
    let object = {
      id: null,
      patronId: null,
      itemId: 22222,
      patronBarcode: null,
      itemBarcode: null,
      holdRequestId: null
    }
    let loggerStub =  sinon.stub(logger, 'error')
    let promise = ApiHelper
      .generateCancelApiModel(object, null, 'https://fake.org', ApiHelper.getHoldrequestId, ApiHelper.generateCancelApiModel, ApiHelper.getApiHeaders)
      .catch(() => {
        let val= loggerStub.called
        loggerStub.restore()
        return val
      })
    return promise.should.eventually.equal(true)
  })
})


});
