/* eslint-disable semi */
import async from 'async';
import axios from 'axios';
import CancelRequestConsumerError from './ErrorHelper';
import logger from './Logger';

const ApiHelper = {
  getApiHeaders (token = '', contentType = 'application/json', timeOut = 10000) {
    return {
      headers: {
        'Content-Type': contentType,
        Authorization: `Bearer ${token}`
      },
      timeout: timeOut
    };
  },
  isItemPostSuccessful (responseObject, flag) {
    return responseObject && responseObject.data && responseObject.data.data && responseObject.data.data[flag] === true;
  },
  findPatronIdFromBarcode(object, token, apiUrl) {
    console.log(JSON.stringify(object), token, apiUrl)
    console.log(this.getApiHeaders)
    console.log(22, apiUrl + `patrons/find?varFieldTag=b&varFieldContent=${object.patronBarcode}`, this.getApiHeaders(token))
    return axios.get(apiUrl + `patrons/find?varFieldTag=b&varFieldContent=${object.patronBarcode}`, this.getApiHeaders(token))
    .then((resp) => {
      object.patronId = resp.data.id;
    })
    .catch(() => {
      console.log(`Error finding patron from url ${apiUrl} with barcode ${object.patronBarcode} when token is ${token}`)
      logger.error(`Error finding patron from url ${apiUrl} with barcode ${object.patronBarcode} when tokenIsSet is ${!!token}`)
    })
  },
  findItemIdFromBarcode(object, token, apiUrl) {
    console.log(34, apiUrl+`items?barcode=${object.itemBarcode}`, this.getApiHeaders(token));
    return axios.get(apiUrl+`items?barcode=${object.itemBarcode}`, this.getApiHeaders(token))
    .then((resp) => {
      console.log(37, resp.data, resp.data.data, resp.data.data[0], resp.data.data[0].id);
      object.itemId = resp.data.data[0].id;
    })
    .catch((resp) => {
      console.log(`Error finding item from url ${apiUrl} with barcode ${object.itemBarcode} when tokenIsSet is ${token}`)
      console.log(apiUrl+`items?barcode=${object.itemBarcode}`, this.getApiHeaders(token))
      logger.error(`Error finding item from url ${apiUrl} with barcode ${object.itemBarcode} when tokenIsSet is ${!!token}`)
    })
  },
  getHoldrequestId(resp, itemId) {
    let cb = (acc, entry) => {
      if (entry.record.includes(itemId)) {
        return entry.id
      }
      else {
        return acc
      }
    }
    resp.data.entries.reduce(cb, null)
  },
  generateCancelApiModel (object, token, apiDataUrl, getHoldrequestId, generateCancelApiModel, page = 0) {
    const {
      id,
      patronId,
      itemId,
      patronBarcode,
      itemBarcode,
      holdRequestId = null
    } = object;

    console.log(61, JSON.stringify(object,null,2))

    return new Promise((resolve, reject) => {
      axios.get(apiDataUrl + `patrons/${patronId}/holds?offset=${page}&limit=50`, getApiHeaders(token))
      .then((resp) => {
        let holdRequestIdGotten = getHoldrequestId(resp, itemId)
        if (holdRequestIdGotten) {
          item.holdRequestId = holdRequestIdGotten
          resolve()
        }
        else {
          generateCancelApiModel(object, token, apiDataUrl, getHoldrequestId, generateCancelApiModel, page + 50)
          .then(() => resolve())
        }
      })

    });
  },

  generateErrorResponseObject (obj) {
    const responseObject = obj || {};
    const errorObject = {};

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
          const payload = apiConfigResponse.data;
          if (typeof payload === 'string' && payload.charAt(0) === '{' && payload.charAt(payload.length - 1) === '}') {
            errorObject.payload = JSON.parse(payload);
          } else {
            errorObject.payload = apiConfigResponse.data;
          }
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
      }
    } else if (responseObject.request) {
      errorObject.responseType = 'request';
      errorObject.debug = responseObject.request;
    } else {
      errorObject.responseType = 'malformed';
      errorObject.debug = responseObject.message || 'malformed request';
    }

    return errorObject;
  },
  generateSuccessfulResponseObject (responseObject) {
    const {
      data: {
        data: dataResponse,
        statusCode,
        debugInfo
      }
    } = responseObject;

    return Object.assign({}, dataResponse, { statusCode: statusCode }, { debugInfo: debugInfo });
  },
  handleApiErrors (errorObj, serviceType, item, callback) {
    const errorObject = errorObj || {};
    let errorType = 'service-error';
    let errorMessage = 'An error was received';

    if (typeof serviceType === 'string' && serviceType !== '') {
      errorMessage += ` from the ${serviceType}`;
      errorType = `${serviceType}-error`;
    }

    if (item && item.id) {
      errorMessage += ` for Cancel Request Record (${item.id})`;
    }

    if (errorObject.responseType === 'response') {
      const statusCode = errorObject.statusCode;
      const statusText = errorObject.statusText.toLowerCase();
      if (statusCode) {
        errorMessage += `; the service responded with a status code: (${statusCode})`;
      }
      if (statusText) {
        errorMessage += ` and status text: ${statusText}`;
      }

      if (statusCode === 401) {
        logger.warning(errorMessage, { cancelRequestId: item.id, debugInfo: errorObject });

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

      if (statusCode >= 500) {
        logger.warning(errorMessage, { cancelRequestId: item.id, debugInfo: errorObject });

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

      logger.error(errorMessage, { cancelRequestId: item.id, debugInfo: errorObject });
      // Only skip item when status is NOT 5xx or 401
      return callback(null, item);
    }

    logger.error(errorMessage, { debugInfo: errorObject });
    return callback(
      new CancelRequestConsumerError(
        errorMessage,
        { type: errorType, debugInfo: errorObject }
      )
    );
  },
  handleCancelItemsDeleteRequests (items, sierraToken) {
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

    if (!token || typeof token !== 'string' || token.trim() === '') {
      return Promise.reject(new CancelRequestConsumerError(
        'the token string parameter is not defined or empty'
      ));
    }

    return this.handleBatchAsyncPostRequests(
      items,
      ApiHelper.deleteItem.bind(this, sierraToken, this.handleApiErrors)
    )

  },
  handleBatchAsyncPostRequests (items, processingFn) {
    return new Promise((resolve, reject) => {
      return async.mapSeries(
        items,
        processingFn,
        // Reject the error to main handler or filter out NULL items and resolve
        (err, results) => (err) ? reject(err) : resolve(results.filter(n => n))
      );
    });
  },
  deleteItem (sierraToken, errorHandlerFn, item, callback) {
    if (item.holdRequestId) {
      logger.info(`Deleting ${item.holdRequestId}`);

      return axios.delete(item.holdRequestId, this.getApiHeaders(sierraToken))
      .then(result => {
        let processedItem = item;
        proccessedItem.cancelApiResponse = this.generateSuccessfulResponseObject(result);
        if (this.isItemPostSuccessful(result, 'success')) {
          logger.info(`Successfully cancelled using ${item.holdRequestId}`)
        }

        return callback(null, processedItem)
      })
      .catch(error => {
        const errorResponse = this.generateErrorResponseObject(error);
        item.error = errorResponse;
        return errorHandlerFn(errorResponse, 'delete', item, callback);
      });
    }

    logger.warning(`Unable to send delete request for item with missing holdRequestId. Available information: ${JSON.stringify(item)}`);
    return callback(null)
  },
  postCheckOutItem (apiUrl, token, errorHandlerFn, item, callback) {
    if (item && typeof item === 'object' && item.id) {
      // initialize the boolean flag to false until a successful post updates to true
      item.checkoutProccessed = false;

      if (typeof item.patronBarcode === 'string' && item.patronBarcode.trim() !== '' && typeof item.itemBarcode === 'string' && item.itemBarcode.trim() !== '') {
        logger.info(`Posting Cancel Request Record (${item.id}) to checkout-service`);

        return axios.post(apiUrl, this.generateCheckoutApiModel(item), this.getApiHeaders(token))
        .then(result => {
          let proccessedItem = item;
          proccessedItem.checkoutApiResponse = this.generateSuccessfulResponseObject(result);

          if (this.isItemPostSuccessful(result, 'success')) {
            logger.info(`Successfully posted Cancel Request Record (${item.id}) to checkout-service; assigned response to record`);
            proccessedItem = Object.assign(proccessedItem, { checkoutProccessed: true }, { success: true });
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
      logger.warning(`Unable to sent POST request for Cancel Request Record (${item.id}); patronBarcode or itemBarcode are not defined`, { cancelRequestId: item.id });
      return callback(null, item);
    }

    // Item is not defined, skip to the next item and async callback will filter undefined elements
    logger.warning(`Unable to sent POST request for Cancel Request Record; the item object is not defined`);
    return callback(null);
  },
  postCheckInItem (apiUrl, token, errorHandlerFn, item, callback) {
    // initialize the boolean flag to false until a successful post updates to true
    item.checkinProccessed = false;

    if (item.checkoutProccessed === true) {
      logger.info(`Posting Cancel Request Record (${item.id}) to checkin-service`);

      return axios.post(apiUrl, this.generateCheckinApiModel(item), this.getApiHeaders(token))
      .then(result => {
        let proccessedItem = item;
        proccessedItem.checkinApiResponse = this.generateSuccessfulResponseObject(result);

        if (this.isItemPostSuccessful(result, 'success')) {
          logger.info(`Successfully posted Cancel Request Record (${item.id}) to checkin-service; assigned response to record`);
          proccessedItem = Object.assign(proccessedItem, { checkinProccessed: true }, { success: true });
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
    logger.info(`Unable to sent POST request to checkin-service for Cancel Request Record (${item.id}); checkoutProccessed is false which indicates this item was not checked out`);
    return callback(null, item);
  }
};

export default ApiHelper;
