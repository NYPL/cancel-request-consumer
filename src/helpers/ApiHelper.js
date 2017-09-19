/* eslint-disable semi */
import async from 'async';
import axios from 'axios';
import CancelRequestConsumerError from './ErrorHelper';

const ApiHelper = {
  getApiHeaders(token = '', contentType = 'application/json', timeOut = 10000) {
    return {
      headers: {
        'Content-Type': contentType,
        Authorization: `Bearer ${token}`
      },
      timeout: timeOut
    };
  },
  generateCheckoutApiModel(object) {
    const {
      patronBarcode,
      itemBarcode,
      owningInstitutionId = null,
      desiredDateDue = null,
    } = object;

    return {
      patronBarcode,
      itemBarcode,
      owningInstitutionId,
      desiredDateDue
    };
  },
  generateCheckinApiModel(object) {
    const {
      itemBarcode,
      owningInstitutionId = null,
    } = object;

    return {
      itemBarcode,
      owningInstitutionId
    };
  },
  handleApiErrors(errorObject, item, callback) {
    console.log('ERROR Object: ', errorObject);
  },
  handleCancelItemPostRequests(items, serviceType, apiUrl, token) {
    if (!items) {
      return Promise.reject(new CancelRequestConsumerError(
        'the items array parameter is undefined'
      ));
    }

    if (Array.isArray(items) === false) {
      return Promise.reject(new CancelRequestConsumerError(
        'the items array parameter is not of type array'
      ));
    }

    if (items.length === 0) {
      return Promise.reject(new CancelRequestConsumerError(
        'the items array parameter is empty'
      ));
    }

    if (!serviceType || typeof serviceType !== 'string' || serviceType.trim() === '') {
      return Promise.reject(new CancelRequestConsumerError(
        'the serviceType string parameter is not defined or empty'
      ));
    }

    if (!apiUrl || typeof apiUrl !== 'string' || apiUrl.trim() === '') {
      return Promise.reject(new CancelRequestConsumerError(
        'the apiUrl string parameter is not defined or empty'
      ));
    }

    if (!token || typeof token !== 'string' || token.trim() === '') {
      return Promise.reject(new CancelRequestConsumerError(
        'the token string parameter is not defined or empty'
      ));
    }

    if (serviceType === 'checkin-service') {
      return this.handleBatchAsyncPostRequests(
        items,
        ApiHelper.postCheckInItem.bind(this, apiUrl, token, this.handleApiErrors)
      );
    }

    if (serviceType === 'checkout-service') {
      return this.handleBatchAsyncPostRequests(
        items,
        ApiHelper.postCheckOutItem.bind(this, apiUrl, token, this.handleApiErrors)
      );
    }
  },
  handleBatchAsyncPostRequests(items, processingFn) {
    return new Promise((resolve, reject) => {
      return async.mapSeries(
        items,
        processingFn,
        // ApiHelper.postCheckOutItem.bind(this, apiUrl, token, ApiHelper.handleApiErrors),
        (err, results) => {
          // return (err) ? reject(err) : resolve(results.filter(n => n));
          if (err) {
            console.log('checkout-service error in async callback', err);
            return reject(err);
          }

          if (results) {
            // console.log('results in async callback', results);
            return resolve(results);
          }
        }
      );
    });
  },
  postCheckOutItem(apiUrl, token, errorHandlerFn, item, callback) {
    if (item && typeof item.patronBarcode === 'string' && item.patronBarcode.trim() !== '' && typeof item.itemBarcode === 'string' && item.itemBarcode.trim() !== '') {
      console.log(`Posting Cancel Request Item (${item.id}) to checkout-service`);
      return axios.post(apiUrl, this.generateCheckoutApiModel(item), this.getApiHeaders(token))
      .then(result => {
        const processedItem = (result.data && result.data.data) ?
          Object.assign({ checkoutProccessed: true }, result.data.data, item) : Object.assign({ checkoutProccessed: false }, item);

        return callback(null, processedItem);
      })
      .catch(error => {
        const unprocessedItem = Object.assign({ checkoutProccessed: false}, item);
        // Handle retries or fatal errors by error status code
        return errorHandlerFn(error, unprocessedItem, callback);
      });
    }

    return Promise.reject(
      new CancelRequestConsumerError('unable to execute POST request to checkout-service; patronBarcode and itemBarcode must be defined')
    );
  },
  postCheckInItem(apiUrl, token, errorHandlerFn, item, callback) {
    if (item && typeof item.itemBarcode === 'string' && item.itemBarcode !== '' && item.checkoutProccessed === true) {
      console.log(`Posting Cancel Request Item (${item.id}) to checkin-service`);
      return axios.post(apiUrl, this.generateCheckinApiModel(item), this.getApiHeaders(token))
      .then(result => {
        const processedItem = (result.data && result.data.data) ?
          Object.assign({ checkinProcessed: true }, result.data.data, item) : Object.assign({ checkinProcessed: false }, item);

        return callback(null, processedItem);
      })
      .catch(error => {
        const unprocessedItem = Object.assign({ checkinProcessed: false}, item);
        // Handle retries or fatal errors by error status code
        return errorHandlerFn(error, unprocessedItem, callback);
      });
    }

    return Promise.reject(
      new CancelRequestConsumerError('unable to execute POST request to checkin-service; itemBarcode must be defined and checkoutProccessed must be true')
    );
  }
};

export default ApiHelper;
