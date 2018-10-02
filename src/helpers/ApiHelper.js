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
  isItemPostSuccessful (responseObject) {
    return responseObject && responseObject.status === 204
  },
  findPatronIdFromBarcode(object, token, apiUrl) {
    return axios.get(apiUrl + `patrons/find?varFieldTag=b&varFieldContent=${object.patronBarcode}`, this.getApiHeaders(token))
    .then((resp) => {
      if (resp.data && resp.data.id) {
        object.patronId = resp.data.id;
      }
      else {
        logger.error(`No patron id returned from url ${apiUrl} with barcode ${object.patronBarcode} when tokenIsSet is ${!!token}`)
      }
    })
    .catch(() => {
      logger.error(`Error finding patron from url ${apiUrl} with barcode ${object.patronBarcode} when tokenIsSet is ${!!token}`)
    })
  },
  findItemIdFromBarcode(object, token, apiUrl) {
    return axios.get(apiUrl+`items?barcode=${object.itemBarcode}`, this.getApiHeaders(token))
    .then((resp) => {
      if (resp.data && resp.data.data && resp.data.data[0] && resp.data.data[0].id){
        object.itemId = resp.data.data[0].id;
      }
      else {
        logger.error(`Error finding item from url ${apiUrl} with barcode ${object.itemBarcode} when tokenIsSet is ${!!token}`)
      }
    })
    .catch((resp) => {
      logger.error(`Error finding item from url ${apiUrl} with barcode ${object.itemBarcode} when tokenIsSet is ${!!token}`)
    })
  },
  getHoldrequestId(resp, itemId) {
    let cb = (acc, entry) => {
      let splitPath = entry.record.split("/")
      let suffix = splitPath[splitPath.length-1]
      if (suffix.includes(itemId)) {
        return entry.id
      }
      else {
        return acc
      }
    }
    return resp.data.entries.reduce(cb, null)
  },
  generateCancelApiModel (object, token, apiDataUrl, getHoldrequestId, generateCancelApiModel, getApiHeaders, page = 0) {
    const {
      id,
      patronId,
      itemId,
      patronBarcode,
      itemBarcode,
      holdRequestId = null
    } = object;

    return new Promise((resolve, reject) => {
      axios.get(apiDataUrl + `patrons/${patronId}/holds?offset=${page}&limit=50`, getApiHeaders(token))
      .then((resp) => {
        let holdRequestIdGotten = getHoldrequestId(resp, itemId)
        if (holdRequestIdGotten) {
          object.holdRequestId = holdRequestIdGotten
          resolve()
        }
        else if (resp.data && resp.data.entries && resp.data.entries.length !== 0) {
          generateCancelApiModel(object, token, apiDataUrl, getHoldrequestId, generateCancelApiModel, getApiHeaders, page + 50)
          .then(() => resolve())
        }
        else {
          resolve()
        }
      })
      .catch(resp => {
        if (resp.response && resp.response.statusText) {
          logger.error(resp.response.statusText)
          reject(new CancelRequestConsumerError(resp.response.statusText, {response: resp}))
        }
        else {
          logger.error('problem generating CancelApiModel')
          reject(new CancelRequestConsumerError('problem generating CancelApiModel', {response: resp}))
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

    if (!sierraToken || typeof sierraToken !== 'string' || sierraToken.trim() === '') {
      return Promise.reject(new CancelRequestConsumerError(
        'the token string parameter is not defined or empty'
      ));
    }


    return this.handleBatchAsyncPostRequests(
      items,
      this.deleteItem.bind(this, sierraToken, this.handleApiErrors)
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
        processedItem.cancelApiResponse = this.generateSuccessfulResponseObject(result);
        if (this.isItemPostSuccessful(result)) {
          processedItem.deleted = true;
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
  }
};

export default ApiHelper;
