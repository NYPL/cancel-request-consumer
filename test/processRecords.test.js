/* eslint-disable semi, no-unused-expressions */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { processRecords } from '../index.js';
import ApiHelper from '../src/helpers/ApiHelper';

chai.should();
chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('processRecords successful call', () => {
  let records = [{}, {}, {}]
  it('should call findPatronIdFromBarcode', () => {
    let findItemIdFromBarcodeStub = sinon.stub(ApiHelper, 'findItemIdFromBarcode').callsFake(() => { return Promise.resolve() })
    let findPatronIdFromBarcodeStub = sinon.stub(ApiHelper, 'findPatronIdFromBarcode').callsFake(() => { return Promise.resolve() })
    let generateCancelApiModelStub = sinon.stub(ApiHelper, 'generateCancelApiModel').callsFake(() => { return Promise.resolve() })
    let opts = {
      oAuthProviderUrl: null,
      oAuthClientId: null,
      oAuthClientSecret: null,
      oAuthProviderScope: null,
      nyplDataApiBaseUrl: null,
      recapCancelRequestSchema: null,
      nyplCheckinRequestApiUrl: null,
      nyplCheckoutRequestApiUrl: null,
      cancelRequestResultSchemaName: null,
      cancelRequestResultStreamName: null,
      sierraUrl: null,
      sierraId: null,
      sierraSecret: null
    }
    let promise = processRecords(records, opts).then(() => {
      let val = findPatronIdFromBarcodeStub.called
      findItemIdFromBarcodeStub.restore()
      findPatronIdFromBarcodeStub.restore()
      generateCancelApiModelStub.restore()
      return val
    })

    return promise.should.eventually.equal(true)
  });
  it('should call findItemIdFromBarcode', () => {
    let findItemIdFromBarcodeStub = sinon.stub(ApiHelper, 'findItemIdFromBarcode').callsFake(() => { return Promise.resolve() })
    let findPatronIdFromBarcodeStub = sinon.stub(ApiHelper, 'findPatronIdFromBarcode').callsFake(() => { return Promise.resolve() })
    let generateCancelApiModelStub = sinon.stub(ApiHelper, 'generateCancelApiModel').callsFake(() => { return Promise.resolve() })
    let opts = {
      oAuthProviderUrl: null,
      oAuthClientId: null,
      oAuthClientSecret: null,
      oAuthProviderScope: null,
      nyplDataApiBaseUrl: null,
      recapCancelRequestSchema: null,
      nyplCheckinRequestApiUrl: null,
      nyplCheckoutRequestApiUrl: null,
      cancelRequestResultSchemaName: null,
      cancelRequestResultStreamName: null,
      sierraUrl: null,
      sierraId: null,
      sierraSecret: null
    }
    let promise = processRecords(records, opts).then(() => {
      let val = findItemIdFromBarcodeStub.called
      findItemIdFromBarcodeStub.restore()
      findPatronIdFromBarcodeStub.restore()
      generateCancelApiModelStub.restore()
      return val
    })

    return promise.should.eventually.equal(true)
  });
  it('should call generateCancelApiModel', () => {
    let findItemIdFromBarcodeStub = sinon.stub(ApiHelper, 'findItemIdFromBarcode').callsFake(() => { return Promise.resolve() })
    let findPatronIdFromBarcodeStub = sinon.stub(ApiHelper, 'findPatronIdFromBarcode').callsFake(() => { return Promise.resolve() })
    let generateCancelApiModelStub = sinon.stub(ApiHelper, 'generateCancelApiModel').callsFake(() => { return Promise.resolve() })
    let opts = {
      oAuthProviderUrl: null,
      oAuthClientId: null,
      oAuthClientSecret: null,
      oAuthProviderScope: null,
      nyplDataApiBaseUrl: null,
      recapCancelRequestSchema: null,
      nyplCheckinRequestApiUrl: null,
      nyplCheckoutRequestApiUrl: null,
      cancelRequestResultSchemaName: null,
      cancelRequestResultStreamName: null,
      sierraUrl: null,
      sierraId: null,
      sierraSecret: null
    }
    let promise = processRecords(records, opts).then(() => {
      let val = generateCancelApiModelStub.called
      findItemIdFromBarcodeStub.restore()
      findPatronIdFromBarcodeStub.restore()
      generateCancelApiModelStub.restore()
      return val
    })

    return promise.should.eventually.equal(true)
  });
});

describe('processedRecords unsuccessful call', () => {
  let records = [{}, {}, {}]
  it('should return an error', () => {
    let findItemIdFromBarcodeStub = sinon.stub(ApiHelper, 'findItemIdFromBarcode').callsFake(() => { return Promise.reject() })
    let findPatronIdFromBarcodeStub = sinon.stub(ApiHelper, 'findPatronIdFromBarcode').callsFake(() => { return Promise.resolve() })
    let generateCancelApiModelStub = sinon.stub(ApiHelper, 'generateCancelApiModel').callsFake(() => { return Promise.resolve() })
    let opts = {
      oAuthProviderUrl: null,
      oAuthClientId: null,
      oAuthClientSecret: null,
      oAuthProviderScope: null,
      nyplDataApiBaseUrl: null,
      recapCancelRequestSchema: null,
      nyplCheckinRequestApiUrl: null,
      nyplCheckoutRequestApiUrl: null,
      cancelRequestResultSchemaName: null,
      cancelRequestResultStreamName: null,
      sierraUrl: null,
      sierraId: null,
      sierraSecret: null
    }
    let promise = processRecords(records, opts)
    return promise.should.be.rejected
  });
})
