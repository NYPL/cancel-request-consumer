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

  beforeEach(function() {
    mock = new MockAdapter(axios);
  });

  afterEach(function() {
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
      const checkoutApiModel = ApiHelper.generateCheckoutApiModel({ patronBarcode: 'pbarcode', itemBarcode: 'ibarcode' });

      return checkoutApiModel.should.deep.equal({
        patronBarcode: 'pbarcode',
        itemBarcode: 'ibarcode',
        owningInstitutionId: null,
        desiredDateDue: null
      });
    });

    it('should return the correct object properties when the optional fields are defined', () => {
      const checkoutApiModel = ApiHelper.generateCheckoutApiModel({
        patronBarcode: 'pbarcode',
        itemBarcode: 'ibarcode',
        owningInstitutionId: 'NYPL',
        desiredDateDue: '20170919'
      });

      return checkoutApiModel.should.deep.equal({
        patronBarcode: 'pbarcode',
        itemBarcode: 'ibarcode',
        owningInstitutionId: 'NYPL',
        desiredDateDue: '20170919'
      });
    });
  });

  describe('generateCheckinApiModel(object) function', () => {

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

  describe('postCheckinItem(apiUrl, token, errorHandlerFn, item, callback) function', () => {
    it('should reject the Promise if the item (object) is NULL', () => {
      const result = ApiHelper.postCheckInItem(
        'https://api.nypltech.org/api/v0.1/checkout-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        null,
        null
      );

      return result.should.be.rejectedWith(CancelRequestConsumerError, /unable to execute POST request to checkin-service; itemBarcode must be defined and checkoutProccessed must be true/);
    });

    it('should reject the Promise if the item (object) is UNDEFINED', () => {
      const result = ApiHelper.postCheckInItem(
        'https://api.nypltech.org/api/v0.1/checkout-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        null,
        undefined
      );

      return result.should.be.rejectedWith(CancelRequestConsumerError, /unable to execute POST request to checkin-service; itemBarcode must be defined and checkoutProccessed must be true/);
    });

    it('should reject the Promise if the item (object) is missing the itemBarcode property', () => {
      const result = ApiHelper.postCheckInItem(
        'https://api.nypltech.org/api/v0.1/checkout-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        null,
        { patronBarcode: 'test' }
      );

      return result.should.be.rejectedWith(CancelRequestConsumerError, /unable to execute POST request to checkin-service; itemBarcode must be defined and checkoutProccessed must be true/);
    });

    it('should reject the Promise if the item (object) itemBarcode property is NULL', () => {
      const result = ApiHelper.postCheckInItem(
        'https://api.nypltech.org/api/v0.1/checkout-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        null,
        { patronBarcode: 'test', itemBarcode: null }
      );

      return result.should.be.rejectedWith(CancelRequestConsumerError, /unable to execute POST request to checkin-service; itemBarcode must be defined and checkoutProccessed must be true/);
    });

    it('should reject the Promise if the item (object) itemBarcode property is an empty string', () => {
      const result = ApiHelper.postCheckInItem(
        'https://api.nypltech.org/api/v0.1/checkout-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        null,
        { patronBarcode: 'test', itemBarcode: ' ' }
      );

      return result.should.be.rejectedWith(CancelRequestConsumerError, /unable to execute POST request to checkin-service; itemBarcode must be defined and checkoutProccessed must be true/);
    });

    it('should reject the Promise if the item (object) checkoutProccessed property is NULL', () => {
      const result = ApiHelper.postCheckInItem(
        'https://api.nypltech.org/api/v0.1/checkout-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        null,
        { itemBarcode: 'barcode', checkoutProccessed: null }
      );

      return result.should.be.rejectedWith(CancelRequestConsumerError, /unable to execute POST request to checkin-service; itemBarcode must be defined and checkoutProccessed must be true/);
    });

    it('should reject the Promise if the item (object) checkoutProccessed property is undefined', () => {
      const result = ApiHelper.postCheckInItem(
        'https://api.nypltech.org/api/v0.1/checkout-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        null,
        { itemBarcode: 'barcode', checkoutProccessed: undefined }
      );

      return result.should.be.rejectedWith(CancelRequestConsumerError, /unable to execute POST request to checkin-service; itemBarcode must be defined and checkoutProccessed must be true/);
    });

    it('should reject the Promise if the item (object) checkoutProccessed property is false', () => {
      const result = ApiHelper.postCheckInItem(
        'https://api.nypltech.org/api/v0.1/checkout-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        null,
        { itemBarcode: 'barcode', checkoutProccessed: false }
      );

      return result.should.be.rejectedWith(CancelRequestConsumerError, /unable to execute POST request to checkin-service; itemBarcode must be defined and checkoutProccessed must be true/);
    });

    it('should exectue the callback function with the second parameter being the successful item response obtained by the CheckIn Service', () => {
      let callbackSpy = sinon.spy();

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
        'https://api.nypltech.org/api/v0.1/checkout-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        function(err, item, callback) {},
        { patronBarcode: 'test', itemBarcode: 'barcode', checkoutProccessed: true },
        callbackSpy
      );

      return result.then(data => {
        expect(callbackSpy).to.have.been.calledWith(
          null,
          {
            checkoutProccessed: true,
            checkinProcessed: true,
            itemBarcode: "barcode",
            patronBarcode: "test",
            success: true
          }
        );
      });
    });

    it('should exectue the callback function with the second parameter being the failure item response obtained by the CheckIn Service when response.data.data is not defined', () => {
      let callbackSpy = sinon.spy();

      mock.onPost().reply(
        200,
        {
          otherKey: {}
        }
      );

      const result = ApiHelper.postCheckInItem(
        'https://api.nypltech.org/api/v0.1/checkout-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        function(err, item, callback) {},
        { patronBarcode: 'test', itemBarcode: 'barcode', checkoutProccessed: true },
        callbackSpy
      );

      return result.then(data => {
        expect(callbackSpy).to.have.been.calledWith(
          null,
          {
            checkoutProccessed: true,
            checkinProcessed: false,
            itemBarcode: "barcode",
            patronBarcode: "test"
          }
        );
      });
    });

    it('should exectue the errorCallback handler function on a failure response', () => {
      let errorCallbackSpy = sinon.spy();
      let callbackSpy = sinon.spy();

      mock.onPost().reply(404);

      const result = ApiHelper.postCheckInItem(
        'https://api.nypltech.org/api/v0.1/checkout-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        errorCallbackSpy,
        { patronBarcode: 'test', itemBarcode: 'barcode', checkoutProccessed: true },
        callbackSpy
      );

      return result.catch(error => {
        expect(errorCallbackSpy).to.have.been.calledWith(
          error,
          {
            checkoutProccessed: true,
            checkinProcessed: false,
            itemBarcode: "barcode",
            patronBarcode: "test"
          },
          callbackSpy
        );
      });
    });
  });

  describe('postCheckOutItem(apiUrl, token, item, callback, errorHandlerFn) function', () => {
    it('should reject the Promise if the item (object) is NULL', () => {
      const result = ApiHelper.postCheckOutItem(
        'https://api.nypltech.org/api/v0.1/checkout-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        null
      );

      return result.should.be.rejectedWith(CancelRequestConsumerError, /unable to execute POST request to checkout-service; patronBarcode and itemBarcode must be defined/);
    });

    it('should reject the Promise if the item (object) is UNDEFINED', () => {
      const result = ApiHelper.postCheckOutItem(
        'https://api.nypltech.org/api/v0.1/checkout-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        undefined
      );

      return result.should.be.rejectedWith(CancelRequestConsumerError, /unable to execute POST request to checkout-service; patronBarcode and itemBarcode must be defined/);
    });

    it('should reject the Promise if the item (object) is missing the patronBarcode property', () => {
      const result = ApiHelper.postCheckOutItem(
        'https://api.nypltech.org/api/v0.1/checkout-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        { itemBarcode: 'test' }
      );

      return result.should.be.rejectedWith(CancelRequestConsumerError, /unable to execute POST request to checkout-service; patronBarcode and itemBarcode must be defined/);
    });

    it('should reject the Promise if the item (object) patronBarcode property is NULL', () => {
      const result = ApiHelper.postCheckOutItem(
        'https://api.nypltech.org/api/v0.1/checkout-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        { patronBarcode: null, itemBarcode: 'test' }
      );

      return result.should.be.rejectedWith(CancelRequestConsumerError, /unable to execute POST request to checkout-service; patronBarcode and itemBarcode must be defined/);
    });

    it('should reject the Promise if the item (object) patronBarcode property is an empty string', () => {
      const result = ApiHelper.postCheckOutItem(
        'https://api.nypltech.org/api/v0.1/checkout-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        { patronBarcode: ' ', itemBarcode: 'test' }
      );

      return result.should.be.rejectedWith(CancelRequestConsumerError, /unable to execute POST request to checkout-service; patronBarcode and itemBarcode must be defined/);
    });

    it('should reject the Promise if the item (object) is missing the itemBarcode property', () => {
      const result = ApiHelper.postCheckOutItem(
        'https://api.nypltech.org/api/v0.1/checkout-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        { patronBarcode: 'test' }
      );

      return result.should.be.rejectedWith(CancelRequestConsumerError, /unable to execute POST request to checkout-service; patronBarcode and itemBarcode must be defined/);
    });

    it('should reject the Promise if the item (object) itemBarcode property is NULL', () => {
      const result = ApiHelper.postCheckOutItem(
        'https://api.nypltech.org/api/v0.1/checkout-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        { patronBarcode: 'test', itemBarcode: null }
      );

      return result.should.be.rejectedWith(CancelRequestConsumerError, /unable to execute POST request to checkout-service; patronBarcode and itemBarcode must be defined/);
    });

    it('should reject the Promise if the item (object) itemBarcode property is an empty string', () => {
      const result = ApiHelper.postCheckOutItem(
        'https://api.nypltech.org/api/v0.1/checkout-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        { patronBarcode: 'test', itemBarcode: ' ' }
      );

      return result.should.be.rejectedWith(CancelRequestConsumerError, /unable to execute POST request to checkout-service; patronBarcode and itemBarcode must be defined/);
    });

    it('should exectue the callback function with the second parameter being the successful item response obtained by the CheckOut Service', () => {
      let callbackSpy = sinon.spy();

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
        function(err, item, callback) {},
        { patronBarcode: 'test', itemBarcode: 'barcode' },
        callbackSpy
      );

      return result.then(data => {
        expect(callbackSpy).to.have.been.calledWith(
          null,
          {
            checkoutProccessed: true,
            itemBarcode: "barcode",
            patronBarcode: "test",
            success: true
          }
        );
      });
    });

    it('should exectue the callback function with the second parameter being the failure item response obtained by the CheckOut Service when response.data.data is not defined', () => {
      let callbackSpy = sinon.spy();

      mock.onPost().reply(
        200,
        {
          otherKey: {}
        }
      );

      const result = ApiHelper.postCheckOutItem(
        'https://api.nypltech.org/api/v0.1/checkout-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        function(err, item, callback) {},
        { patronBarcode: 'test', itemBarcode: 'barcode' },
        callbackSpy
      );

      return result.then(data => {
        expect(callbackSpy).to.have.been.calledWith(
          null,
          {
            checkoutProccessed: false,
            itemBarcode: "barcode",
            patronBarcode: "test"
          }
        );
      });
    });

    it('should exectue the errorCallback handler function on a failure response', () => {
      let errorCallbackSpy = sinon.spy();
      let callbackSpy = sinon.spy();

      mock.onPost().reply(404);

      const result = ApiHelper.postCheckOutItem(
        'https://api.nypltech.org/api/v0.1/checkout-requests', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpc3NvLm55cGwub3JnIiwic3ViIjpudWxsLCJhdWQiOiJjYW5jZWxfcmVxdWVzdF9jb25zdW1lciIsImlhdCI6MTUwNTgyODc1MywiZXhwIjoxNTA1ODMyMzUzLCJhdXRoX3RpbWUiOjE1MDU4Mjg3NTMsInNjb3BlIjoid3JpdGU6Y2hlY2tpbl9yZXF1ZXN0IHdyaXRlOmNoZWNrb3V0X3JlcXVlc3QifQ.mc6pvnU-jBfaaE9uVjG8UNMg0XqV2e6Gz1NndeNeUT-A_Lh9ZeJCsEWDOh7D0lCfx5IlghyNVwMa98PLIz05ylzIEl0EzUYrCg5D5HjCpZZb7x72ZkjhpTeQX7mhnGzssjvYuK6TEbPNGoGO1KiiYP9lRNa4g08EY6thx7U5tiJUCE2vUvSLbsdtppBfa5cJam5oopYnYBN4nxkIlwcuXH9PL8HwvkgJG60R0JHvIK1tN-izHOUkwYMgBBgzxMJVPhN7roYskeKnF9C_5oX95m4dhuTgOdRtmq18X19VaOdx28rb7_jE4XaDuMTB0uSAQyVTEQZMR2HWIOfN5CwkMQ',
        errorCallbackSpy,
        { patronBarcode: 'test', itemBarcode: 'barcode' },
        callbackSpy
      );

      return result.catch(error => {
        expect(errorCallbackSpy).to.have.been.calledWith(
          error,
          {
            checkoutProccessed: false,
            itemBarcode: "barcode",
            patronBarcode: "test"
          },
          callbackSpy
        );
      });
    });
  });
});
