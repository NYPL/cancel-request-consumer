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
      object.patronId = resp.data.id;
    })
    .catch(() => {
      logger.error(`Error finding patron from url ${apiUrl} with barcode ${object.patronBarcode} when tokenIsSet is ${!!token}`)
    })
  },
  findItemIdFromBarcode(object, token, apiUrl) {
    return axios.get(apiUrl+`items?barcode=${object.itemBarcode}`, this.getApiHeaders(token))
    .then((resp) => {
      object.itemId = resp.data.data[0].id;
    })
    .catch((resp) => {
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
        else {
          generateCancelApiModel(object, token, apiDataUrl, getHoldrequestId, generateCancelApiModel, getApiHeaders, page + 50)
          .then(() => resolve())
        }
      })
      .catch(resp => {
        if (resp.response && resp.response.statusText) {
        }
        else {
          console.log(resp)
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
    console.log(228, items)
    if (!items) {
      return Promise.reject(new CancelRequestConsumerError(
        'the items array parameter is undefined'
      ));
    }

    console.log(241)

    if (Array.isArray(items) === false) {
      return Promise.reject(new CancelRequestConsumerError(
        'the items array parameter is not of type array'
      ));
    }

    console.log(247)

    if (items.length === 0) {
      return Promise.reject(new CancelRequestConsumerError(
        'the items array parameter is empty'
      ));
    }

    console.log(253)

    if (!sierraToken || typeof sierraToken !== 'string' || sierraToken.trim() === '') {
      console.log(260)
      return Promise.reject(new CancelRequestConsumerError(
        'the token string parameter is not defined or empty'
      ));
    }

    console.log(259, this.handleBatchAsyncPostRequests, this.deleteItem)

    return this.handleBatchAsyncPostRequests(
      items,
      this.deleteItem.bind(this, sierraToken, this.handleApiErrors)
    )

  },
  handleBatchAsyncPostRequests (items, processingFn) {
    console.log(266, items, processingFn)
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
    console.log(270, sierraToken, errorHandlerFn, item, item.holdRequestId, callback)
    if (item.holdRequestId) {
      logger.info(`Deleting ${item.holdRequestId}`);
      console.log('deleting', 289)
      return axios.delete(item.holdRequestId, this.getApiHeaders(sierraToken))
      .then(result => {
        let processedItem = item;
        processedItem.cancelApiResponse = this.generateSuccessfulResponseObject(result);
        if (this.isItemPostSuccessful(result)) {
          processedItem.deleted = true;
          logger.info(`Successfully cancelled using ${item.holdRequestId}`)
          console.log(`Successfully cancelled using ${item.holdRequestId}`)
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
