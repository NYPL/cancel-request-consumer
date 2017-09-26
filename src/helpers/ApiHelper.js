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
  isItemPostSuccessful(responseObject, flag) {
    return responseObject && responseObject.data && responseObject.data.data && responseObject.data.data[flag] === true;
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
  generateErrorResponseObject(responseObject) {
    const errorObject = {};

    if (responseObject) {
      if (responseObject.response) {
        errorObject.responseType = 'response';
        // Get relevant configuration data
        if (responseObject.response.config) {
          const apiConfigResponse = responseObject.response.config;
          if (apiConfigResponse.method) {
            errorObject.method = apiConfigResponse.method;
          }

          if (apiConfigResponse.url) {
            errorObject.url = apiConfigResponse.url;
          }

          if (apiConfigResponse.data) {
            errorObject.payload = apiConfigResponse.data;
          }
        }
        // Get status code
        if (responseObject.response.status) {
          errorObject.statusCode = responseObject.response.status;
        }
        // Get status text
        if (responseObject.response.statusText) {
          errorObject.statusText = responseObject.response.statusText;
        }

        // Get API data specific info
        if (responseObject.response.data) {
          const apiDataResponse = responseObject.response.data;

          if (apiDataResponse.type) {
            errorObject.errorType = apiDataResponse.type;
          }

          if (apiDataResponse.message) {
            errorObject.errorMessage = apiDataResponse.message;
          }

          if (apiDataResponse.debugInfo) {
            errorObject.debug = apiDataResponse.debugInfo;
          }
        }
      } else if (responseObject.request) {
        errorObject.responseType = 'request';
        errorObject.debug = responseObject.request._headers;
      } else {
        errorObject.responseType = 'malformed';
        errorObject.debug = responseObject.message;
      }
    }

    return errorObject;
  },
  generateSuccessfulResponseObject(responseObject) {
    const {
      data: {
        data: dataResponse,
        statusCode: statusCode,
        debugInfo: debugInfo
      }
    } = responseObject;

    return Object.assign({}, dataResponse, { statusCode: statusCode }, { debugInfo: debugInfo });
  },
  handleApiErrors(errorObject, serviceType, item, callback) {
    const errorType = `${serviceType.toLowerCase()}-error`;
    let errorMessage = `An error was received from the ${serviceType} for Cancel Request Record (${item.id})`;

    if (errorObject.responseType === 'response') {
      const statusCode = errorObject.statusCode;
      const statusText = errorObject.statusText.toLowerCase() || '';
      errorMessage += `; service responded with a status code: (${statusCode}) and status text: ${statusText}`;

      console.log(errorMessage);

      if (statusCode === 401) {
        return callback(
          new CancelRequestConsumerError(
            errorMessage,
            {
              type: 'access-token-invalid',
              statusCode: statusCode,
              debugInfo: errorObject
            }
          )
        );
      }

      if (statusCode === 403) {
        return callback(
          new CancelRequestConsumerError(
            errorMessage,
            {
              type: 'access-forbidden-for-scopes',
              statusCode: statusCode,
              debugInfo: errorObject
            }
          )
        );
      }

      if (statusCode >= 500) {
        return callback(
          new CancelRequestConsumerError(
            errorMessage,
            {
              type: errorType,
              statusCode: statusCode,
              debugInfo: errorObject
            }
          )
        );
      }

      return callback(null, item);
    }

    // if (errorObject.responseType === 'request') {
    //   // TODO: Add Logging
    //
    //   return callback(new CancelRequestConsumerError(
    //     errorMessage, { type: errorType, debugInfo: errorObject }
    //   ));
    // }

    // TODO: Add Logging
    return callback(new CancelRequestConsumerError(
      errorMessage, { type: errorType, debugInfo: errorObject }
    ));
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
        // Reject the error to main handler or filter out NULL items and resolve
        (err, results) => (err) ? reject(err) : resolve(results.filter(n => n))
      );
    });
  },
  postCheckOutItem(apiUrl, token, errorHandlerFn, item, callback) {
    if (item && typeof item === 'object' && item.id) {
      // initialize the boolean flag to false until a successful post updates to true
      item.checkoutProccessed = false;

      if (typeof item.patronBarcode === 'string' && item.patronBarcode.trim() !== '' && typeof item.itemBarcode === 'string' && item.itemBarcode.trim() !== '') {
        console.log(`Posting Cancel Request Item (${item.id}) to checkout-service`);

        return axios.post(apiUrl, this.generateCheckoutApiModel(item), this.getApiHeaders(token))
        .then(result => {
          let proccessedItem = item;
          proccessedItem.checkoutApiResponse = this.generateSuccessfulResponseObject(result);

          if (this.isItemPostSuccessful(result, 'success')) {
            proccessedItem = Object.assign(proccessedItem, { checkoutProccessed: true }, { success : true });
          }

          return callback(null, proccessedItem);
        })
        .catch(error => {
          const errorResponse = this.generateErrorResponseObject(error);
          // Assign the error clean error object to the item
          item.error = errorResponse;
          // Handle retries or fatal errors by error status code
          return errorHandlerFn(errorResponse, 'checkout-service', item, callback);
        });
      }

      // Skip over item since patronBarcode and itemBarcode are not defined
      // TODO: Add logging
      console.log(`Unable to sent POST request for Cancel Request Item (${item.id}); patronBarcode or itemBarcode are not defined`);
      return callback(null, item);
    }

    // Item is not defined, skip to the next item and async callback will filter undefined elements
    // TODO: Add logging
    console.log(`Unable to sent POST request for Cancel Request Item; the item object is not defined`);
    return callback(null);
  },
  postCheckInItem(apiUrl, token, errorHandlerFn, item, callback) {
    // initialize the boolean flag to false until a successful post updates to true
    item.checkinProccessed = false;

    if (item.checkoutProccessed === true) {
      console.log(`Posting Cancel Request Item (${item.id}) to checkin-service`);

      return axios.post(apiUrl, this.generateCheckinApiModel(item), this.getApiHeaders(token))
      .then(result => {
        let proccessedItem = item;
        proccessedItem.checkinApiResponse = this.generateSuccessfulResponseObject(result);

        if (this.isItemPostSuccessful(result, 'success')) {
          proccessedItem = Object.assign(proccessedItem, { checkinProccessed: true }, { success : true });
        }

        return callback(null, proccessedItem);
      })
      .catch(error => {
        const errorResponse = this.generateErrorResponseObject(error);
        // Assign the error clean error object to the item
        item.error = errorResponse;
        // Handle retries or fatal errors by error status code
        return errorHandlerFn(errorResponse, 'checkin-service', item, callback);
      });
    }

    // Skip over item since itemBarcode is not defined and checkoutProccessed is false
    // TODO: Add logging
    console.log(`Unable to sent POST request to checkin-service for Cancel Request Item (${item.id}); checkoutProccessed is false which indicates this item was not checked out`);
    return callback(null, item);
  }
};

export default ApiHelper;
