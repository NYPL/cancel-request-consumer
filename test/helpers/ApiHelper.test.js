/* eslint-disable semi */
import axios from 'axios';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import MockAdapter from 'axios-mock-adapter';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import ApiHelper from '../../src/helpers/ApiHelper';
import CancelRequestConsumerError from '../../src/helpers/ErrorHelper';
const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
// const mockAdapterInstance = new MockAdapter(axios);

describe('CancelRequestConsumer Lambda: ApiHelper Factory', () => {
  let mock;
  let generateErrorResponseObjectStub;

  beforeEach(function() {
    generateErrorResponseObjectStub = sinon.stub(ApiHelper, 'generateErrorResponseObject');
    mock = new MockAdapter(axios);
  });

  afterEach(function() {
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

  describe('generateCheckoutApiModel(object) function', () => {
    it('should return the minimum required object properties', () => {
      const checkoutApiModel = ApiHelper.generateCheckoutApiModel({ id: 123, patronBarcode: 'pbarcode', itemBarcode: 'ibarcode' });

      return checkoutApiModel.should.deep.equal({
        cancelRequestId: 123,
        jobId: null,
        patronBarcode: 'pbarcode',
        itemBarcode: 'ibarcode',
        owningInstitutionId: null,
        desiredDateDue: null
      });
    });

    it('should return the correct object properties when the optional fields are defined', () => {
      const checkoutApiModel = ApiHelper.generateCheckoutApiModel({
        id: 123,
        jobId: 'abc',
        patronBarcode: 'pbarcode',
        itemBarcode: 'ibarcode',
        owningInstitutionId: 'NYPL',
        desiredDateDue: '20170919'
      });

      return checkoutApiModel.should.deep.equal({
        cancelRequestId: 123,
        jobId: 'abc',
        patronBarcode: 'pbarcode',
        itemBarcode: 'ibarcode',
        owningInstitutionId: 'NYPL',
        desiredDateDue: '20170919'
      });
    });
  });

  describe('generateCheckinApiModel(object) function', () => {
    it('should return the minimum required object properties', () => {
      const checkinApiModel = ApiHelper.generateCheckinApiModel({
        id: 123,
        itemBarcode: 'abc'
      });

      return checkinApiModel.should.deep.equal({
        cancelRequestId: 123,
        jobId: null,
        itemBarcode: 'abc',
        owningInstitutionId: null
      });
    });

    it('should return the correct object properties when the optional fields are defined', () => {
      const checkinApiModel = ApiHelper.generateCheckinApiModel({
        id: 123,
        itemBarcode: 'abc',
        jobId: 'exampleJobId',
        owningInstitutionId: 'NYPL'
      });

      return checkinApiModel.should.deep.equal({
        cancelRequestId: 123,
        jobId: 'exampleJobId',
        itemBarcode: 'abc',
        owningInstitutionId: 'NYPL'
      });
    });
  });

  describe('generateErrorResponseObject(object) function', () => {
    it('should return the correct properties when the object contains the response key', () => {
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
            message: 'Item not found',
            debugInfo: 'debug'
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
        errorMessage: 'Item not found',
        debug: 'debug'
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
          someKey: 'someValue'
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

    it('should return the callback with a CancelRequestConsumerError if the statusCode is NOT 404', () => {
      let cbSpy = sinon.spy();

      ApiHelper.handleApiErrors({ responseType: 'response', statusCode: 403, statusText: 'Unauthorized' }, 'checkin-service', { id: 123 }, cbSpy);

      const errArg = cbSpy.firstCall.args[0];

      expect(errArg).to.be.instanceof(CancelRequestConsumerError);
      expect(errArg.message).to.equal('An error was received from the checkin-service for Cancel Request Record (123); the service responded with a status code: (403) and status text: unauthorized');
      expect(errArg.type).to.equal('checkin-service-error');
      expect(errArg.statusCode).to.equal(403);
      expect(cbSpy).to.be.called;
    });

    it('should return the callback with a null,item if the statusCode is 404', () => {
      let cbSpy = sinon.spy();

      ApiHelper.handleApiErrors({ responseType: 'response', statusCode: 404, statusText: 'Not Found' }, 'checkin-service', { id: 123 }, cbSpy);

      expect(cbSpy).to.be.calledWith(null, { id: 123 });
    });
  });

  describe('handleCancelItemPostRequests(items, type, apiUrl) function', () => {
    it('should reject the Promise with an error if the items array parameter is NULL', () => {
      const result = ApiHelper.handleCancelItemPostRequests(null, 'checkin-service', 'http://fakeurl.org');

      return result.should.be.rejectedWith(CancelRequestConsumerError, /the items array parameter is undefined/);
    });

    it('should reject the Promise with an error if the items array parameter is UNDEFINED', () => {
      const result = ApiHelper.handleCancelItemPostRequests(undefined, 'checkin-service', 'http://fakeurl.org');

      return result.should.be.rejectedWith(CancelRequestConsumerError, /the items array parameter is undefined/);
    });

    it('should reject the Promise with an error if the items array parameter is NOT of type array', () => {
      const result = ApiHelper.handleCancelItemPostRequests({}, 'checkin-service', 'http://fakeurl.org');

      return result.should.be.rejectedWith(CancelRequestConsumerError, /the items array parameter is not of type array/);
    });

    it('should reject the Promise with an error if the items array parameter is an EMPTY array', () => {
      const result = ApiHelper.handleCancelItemPostRequests([], 'checkin-service', 'http://fakeurl.org');

      return result.should.be.rejectedWith(CancelRequestConsumerError, /the items array parameter is empty/);
    });

    it('should reject the Promise with an error if the items serviceType parameter is NULL', () => {
      const result = ApiHelper.handleCancelItemPostRequests([{}], null, 'http://fakeurl.org');

      return result.should.be.rejectedWith(CancelRequestConsumerError, /the serviceType string parameter is not defined or empty/);
    });

    it('should reject the Promise with an error if the items serviceType parameter is UNDEFINED', () => {
      const result = ApiHelper.handleCancelItemPostRequests([{}], undefined, 'http://fakeurl.org');

      return result.should.be.rejectedWith(CancelRequestConsumerError, /the serviceType string parameter is not defined or empty/);
    });

    it('should reject the Promise with an error if the items serviceType parameter is NOT of type string', () => {
      const result = ApiHelper.handleCancelItemPostRequests([{}], [], 'http://fakeurl.org');

      return result.should.be.rejectedWith(CancelRequestConsumerError, /the serviceType string parameter is not defined or empty/);
    });

    it('should reject the Promise with an error if the items serviceType parameter is an EMPTY string', () => {
      const result = ApiHelper.handleCancelItemPostRequests([{}], '', 'http://fakeurl.org');

      return result.should.be.rejectedWith(CancelRequestConsumerError, /the serviceType string parameter is not defined or empty/);
    });

    it('should reject the Promise with an error if the items apiUrl parameter is NULL', () => {
      const result = ApiHelper.handleCancelItemPostRequests([{}], 'checkin-service', null);

      return result.should.be.rejectedWith(CancelRequestConsumerError, /the apiUrl string parameter is not defined or empty/);
    });

    it('should reject the Promise with an error if the items apiUrl parameter is UNDEFINED', () => {
      const result = ApiHelper.handleCancelItemPostRequests([{}], 'checkin-service', undefined);

      return result.should.be.rejectedWith(CancelRequestConsumerError, /the apiUrl string parameter is not defined or empty/);
    });

    it('should reject the Promise with an error if the items apiUrl parameter is NOT of type string', () => {
      const result = ApiHelper.handleCancelItemPostRequests([{}], 'checkin-service', {});

      return result.should.be.rejectedWith(CancelRequestConsumerError, /the apiUrl string parameter is not defined or empty/);
    });

    it('should reject the Promise with an error if the items apiUrl parameter is an EMPTY string', () => {
      const result = ApiHelper.handleCancelItemPostRequests([{}], 'checkin-service', '');

      return result.should.be.rejectedWith(CancelRequestConsumerError, /the apiUrl string parameter is not defined or empty/);
    });


    it('should reject the Promise with an error if the token parameter is NULL', () => {
      const result = ApiHelper.handleCancelItemPostRequests([{}], 'checkin-service', 'http://apiurl.org', null);

      return result.should.be.rejectedWith(CancelRequestConsumerError, /the token string parameter is not defined or empty/);
    });

    it('should reject the Promise with an error if the token parameter is UNDEFINED', () => {
      const result = ApiHelper.handleCancelItemPostRequests([{}], 'checkin-service', 'http://apiurl.org', undefined);

      return result.should.be.rejectedWith(CancelRequestConsumerError, /the token string parameter is not defined or empty/);
    });

    it('should reject the Promise with an error if the token parameter is NOT of type string', () => {
      const result = ApiHelper.handleCancelItemPostRequests([{}], 'checkin-service', 'http://apiurl.org', {});

      return result.should.be.rejectedWith(CancelRequestConsumerError, /the token string parameter is not defined or empty/);
    });

    it('should reject the Promise with an error if the token parameter is an EMPTY string', () => {
      const result = ApiHelper.handleCancelItemPostRequests([{}], 'checkin-service', 'http://apiurl.org', ' ');

      return result.should.be.rejectedWith(CancelRequestConsumerError, /the token string parameter is not defined or empty/);
    });

    it('should call the handleBatchAsyncPostRequests when serviceType is checkin-service', () => {
      let handleBatchAsyncPostRequestsStub = sinon.stub(ApiHelper, 'handleBatchAsyncPostRequests');

      ApiHelper.handleCancelItemPostRequests([{}], 'checkin-service', 'http://checkin-service.api.org', 'token');

      expect(handleBatchAsyncPostRequestsStub).to.be.called;

      handleBatchAsyncPostRequestsStub.restore();
    });

    it('should call the handleBatchAsyncPostRequests when serviceType is checkout-service', () => {
      let handleBatchAsyncPostRequestsStub = sinon.stub(ApiHelper, 'handleBatchAsyncPostRequests');

      ApiHelper.handleCancelItemPostRequests([{}], 'checkout-service', 'http://checkout-service.api.org', 'token');

      expect(handleBatchAsyncPostRequestsStub).to.be.called;

      handleBatchAsyncPostRequestsStub.restore();
    });
  });

  describe('postCheckOutItem(apiUrl, token, item, callback, errorHandlerFn) function', () => {
    let callbackSpy = sinon.spy();
    let errorHandlerFnSpy = sinon.spy();

    it('should call the callback with a NULL value if the item (object) is NULL', () => {
      ApiHelper.postCheckOutItem(
        'https://api.nypltech.org/api/v0.1/checkout-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        errorHandlerFnSpy,
        null,
        callbackSpy
      );

      expect(callbackSpy).to.have.been.calledWith(null);
    });

    it('should call the callback with a NULL value if the item (object) is UNDEFINED', () => {
      ApiHelper.postCheckOutItem(
        'https://api.nypltech.org/api/v0.1/checkout-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        errorHandlerFnSpy,
        undefined,
        callbackSpy
      );

      expect(callbackSpy).to.have.been.calledWith(null);
    });

    it('should call the callback function with (null, item) and set checkoutProccessed to FALSE if the item is missing the patronBarcode property', () => {
      let dummyItem = { id: 123, itemBarcode: 'test' };

      ApiHelper.postCheckOutItem(
        'https://api.nypltech.org/api/v0.1/checkout-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        errorHandlerFnSpy,
        dummyItem,
        callbackSpy
      );

      expect(callbackSpy).to.have.been.calledWith(null, { id: 123, itemBarcode: 'test', checkoutProccessed: false });
    });

    it('should call the callback function with (null, item) and set checkoutProccessed to FALSE if the item patronBarcode property is NULL', () => {
      ApiHelper.postCheckOutItem(
        'https://api.nypltech.org/api/v0.1/checkout-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        errorHandlerFnSpy,
        { id: 123, patronBarcode: null, itemBarcode: 'test' },
        callbackSpy
      );

      expect(callbackSpy).to.have.been.calledWith(null, { id: 123, itemBarcode: 'test', checkoutProccessed: false });
    });

    it('should call the callback function with (null, item) and set checkoutProccessed to FALSE if the item patronBarcode property is an empty string', () => {
      ApiHelper.postCheckOutItem(
        'https://api.nypltech.org/api/v0.1/checkout-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        errorHandlerFnSpy,
        { id: 123, patronBarcode: '', itemBarcode: 'test' },
        callbackSpy
      );

      expect(callbackSpy).to.have.been.calledWith(null, { id: 123, itemBarcode: 'test', checkoutProccessed: false });
    });

    it('should call the callback function with (null, item) and set checkoutProccessed to FALSE if the item is missing the itemBarcode property', () => {
      ApiHelper.postCheckOutItem(
        'https://api.nypltech.org/api/v0.1/checkout-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        errorHandlerFnSpy,
        { id: 123, patronBarcode: 'test' },
        callbackSpy
      );

      expect(callbackSpy).to.have.been.calledWith(null, { id: 123, patronBarcode: 'test', checkoutProccessed: false });
    });

    it('should call the callback function with (null, item) and set checkoutProccessed to FALSE if the item itemBarcode property is NULL', () => {
      ApiHelper.postCheckOutItem(
        'https://api.nypltech.org/api/v0.1/checkout-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        errorHandlerFnSpy,
        { id: 123, patronBarcode: 'test', itemBarcode: null },
        callbackSpy
      );

      expect(callbackSpy).to.have.been.calledWith(null, { id: 123, patronBarcode: 'test', checkoutProccessed: false });
    });

    it('should call the callback function with (null, item) and set checkoutProccessed to FALSE if the item itemBarcode property is an empty string', () => {
      ApiHelper.postCheckOutItem(
        'https://api.nypltech.org/api/v0.1/checkout-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        errorHandlerFnSpy,
        { id: 123, patronBarcode: 'test', itemBarcode: ' ' },
        callbackSpy
      );

      expect(callbackSpy).to.have.been.calledWith(null, { id: 123, patronBarcode: 'test', checkoutProccessed: false });
    });

    it('should exectue the callback function with the second parameter being the successful item response obtained by the CheckOut Service', () => {
      let cbSpy = sinon.spy();

      mock.onPost().reply(
        200,
        {
          data: {
            patronBarcode: 'test',
            itemBarcode: 'barcode',
            success: true
          }
        }
      );

      const result = ApiHelper.postCheckOutItem(
        'https://api.nypltech.org/api/v0.1/checkout-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        null,
        { id: 123, patronBarcode: 'test', itemBarcode: 'barcode' },
        cbSpy
      );

      return result.then(data => {
        expect(cbSpy).to.have.been.calledWithMatch(
          null,
          {
            checkoutProccessed: true,
            itemBarcode: "barcode",
            patronBarcode: "test",
            success: true
          }
        );
      });

      cbSpy.restore();
    });

    it('should exectue the callback function with the second parameter being the failure item response obtained by the CheckOut Service when response.data.data is not defined', () => {
      let cbSpy = sinon.spy();

      mock.onPost().reply(
        200,
        {
          otherKey: {}
        }
      );

      const result = ApiHelper.postCheckOutItem(
        'https://api.nypltech.org/api/v0.1/checkout-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        null,
        { id: 123, patronBarcode: 'test', itemBarcode: 'barcode' },
        cbSpy
      );

      return result.then(data => {
        expect(cbSpy).to.have.been.calledWithMatch(
          null,
          {
            checkoutProccessed: false,
            itemBarcode: "barcode",
            patronBarcode: "test"
          }
        );
      });

      cbSpy.restore();
    });

    it('should exectue the errorCallback handler function on a 404 failure response', () => {
      let errorCbSpy = sinon.spy();
      let cbSpy = sinon.spy();

      mock.onPost().reply(404);

      const result = ApiHelper.postCheckOutItem(
        'https://api.nypltech.org/api/v0.1/checkout-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        errorCbSpy,
        { id: 123, patronBarcode: 'test', itemBarcode: 'barcode' },
        cbSpy
      );

      return result.catch(error => {
        expect(generateErrorResponseObjectStub).to.have.been.called;

        expect(errorCbSpy).to.have.been.calledWith(
          error,
          'checkout-service',
          {
            id: 123,
            checkoutProccessed: false,
            itemBarcode: "barcode",
            patronBarcode: "test"
          },
          cbSpy
        );
      });

      errorCbSpy.restore();
      cbSpy.restore();
    });

    it('should exectue the errorCallback handler function on a TIMEOUT failure response', () => {
      let errorCbSpy = sinon.spy();
      let cbSpy = sinon.spy();

      mock.onPost().timeout();

      const result = ApiHelper.postCheckOutItem(
        'https://api.nypltech.org/api/v0.1/checkout-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        errorCbSpy,
        { id: 123, patronBarcode: 'test', itemBarcode: 'barcode' },
        cbSpy
      );

      return result.catch(error => {
        expect(generateErrorResponseObjectStub).to.have.been.called;

        expect(errorCbSpy).to.have.been.calledWith(
          error,
          'checkout-service',
          {
            id: 123,
            checkoutProccessed: false,
            itemBarcode: "barcode",
            patronBarcode: "test"
          },
          cbSpy
        );
      });

      errorCbSpy.restore();
      cbSpy.restore();
    });
  });

  describe('postCheckinItem(apiUrl, token, errorHandlerFn, item, callback) function', () => {
    let callbackSpy = sinon.spy();
    let errorHandlerFnSpy = sinon.spy();

    it('should call the callback with the error param as NULL and result as item if the checkoutProccessed is NOT defined', () => {
      ApiHelper.postCheckInItem(
        'https://api.nypltech.org/api/v0.1/checkin-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        errorHandlerFnSpy,
        { id: 123, itemBarcode: 'abc' },
        callbackSpy
      );

      expect(callbackSpy).to.have.been.calledWith(null, { id: 123, itemBarcode: 'abc', checkinProccessed: false });
    });

    it('should call the callback with the error param as NULL and result as item if the checkoutProccessed is FALSE', () => {
      ApiHelper.postCheckInItem(
        'https://api.nypltech.org/api/v0.1/checkin-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        errorHandlerFnSpy,
        { id: 123, itemBarcode: 'abc', checkoutProccessed: false },
        callbackSpy
      );

      expect(callbackSpy).to.have.been.calledWith(null, { id: 123, itemBarcode: 'abc', checkoutProccessed: false, checkinProccessed: false });
    });

    it('should exectue the callback function with the second parameter being the successful item response obtained by the CheckIn Service', () => {
      let cbSpy = sinon.spy();

      mock.onPost().reply(
        200,
        {
          data: {
            patronBarcode: 'test',
            itemBarcode: 'barcode',
            success: true
          }
        }
      );

      const result = ApiHelper.postCheckInItem(
        'https://api.nypltech.org/api/v0.1/checkin-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        null,
        { id: 123, patronBarcode: 'test', itemBarcode: 'barcode', checkoutProccessed: true },
        cbSpy
      );

      return result.then(data => {
        expect(cbSpy).to.have.been.calledWithMatch(
          null,
          {
            checkoutProccessed: true,
            checkinProccessed: true,
            itemBarcode: "barcode",
            patronBarcode: "test",
            success: true
          }
        );
      });

      cbSpy.restore();
    });

    it('should exectue the callback function with the second parameter being the failure item response obtained by the CheckIn Service when response.data.data is not defined', () => {
      let cbSpy = sinon.spy();

      mock.onPost().reply(
        200,
        {
          otherKey: {}
        }
      );

      const result = ApiHelper.postCheckInItem(
        'https://api.nypltech.org/api/v0.1/checkout-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        function(err, item, callback) {},
        { id: 123, patronBarcode: 'test', itemBarcode: 'barcode', checkoutProccessed: true },
        cbSpy
      );

      return result.then(data => {
        expect(cbSpy).to.have.been.calledWithMatch(
          null,
          {
            checkoutProccessed: true,
            checkinProccessed: false,
            itemBarcode: "barcode",
            patronBarcode: "test",
            id: 123
          }
        );
      });

      cbSpy.restore();
    });

    it('should exectue the errorCallback handler function on a 404 failure response', () => {
      let errorCbSpy = sinon.spy();
      let cbSpy = sinon.spy();

      mock.onPost().reply(404);

      const result = ApiHelper.postCheckInItem(
        'https://api.nypltech.org/api/v0.1/checkout-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        errorCbSpy,
        { id: 123, patronBarcode: 'test', itemBarcode: 'barcode', checkoutProccessed: true },
        cbSpy
      );

      return result.catch(error => {
        expect(generateErrorResponseObjectStub).to.have.been.called;

        expect(errorCbSpy).to.have.been.calledWith(
          error,
          {
            checkoutProccessed: true,
            checkinProccessed: false,
            itemBarcode: "barcode",
            patronBarcode: "test",
            id: 123
          },
          cbSpy
        );
      });

      errorCbSpy.restore();
      cbSpy.restore();
    });
  });
});
