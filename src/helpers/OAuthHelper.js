/* eslint-disable semi */
import axios from 'axios';
import qs from 'qs';
import CancelRequestConsumerError from './ErrorHelper';
import logger from './Logger';

const getOauthConfig = function (clientId, clientSecret, scope, grantType = 'client_credentials') {
  if (!clientId || typeof clientId !== 'string' || clientId.trim() === '') {
    throw new CancelRequestConsumerError('the clientId parameter is not defined or invalid; must be of type string and not empty');
  }

  if (!clientSecret || typeof clientSecret !== 'string' || clientSecret.trim() === '') {
    throw new CancelRequestConsumerError('the clientSecret parameter is not defined or invalid; must be of type string and not empty');
  }

  if (!scope || typeof scope !== 'string' || scope.trim() === '') {
    throw new CancelRequestConsumerError('the scope parameter is not defined or invalid; must be of type string and not empty');
  }

  return {
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: grantType,
    scope
  };
}

const fetchAccessToken = function (oauthUrl, clientId, clientSecret, scope, grantType) {
  if (!oauthUrl || typeof oauthUrl !== 'string' || oauthUrl.trim() === '') {
    return Promise.reject(
      new CancelRequestConsumerError('the oauthUrl function parameter is not defined or invalid; must be of type string and not empty')
    );
  }

  const oAuthConfig = getOauthConfig(clientId, clientSecret, scope, grantType);

  return axios.post(oauthUrl, qs.stringify(oAuthConfig))
  .then(result => {
    if (result.data && result.data.access_token) {
      console.log(40, oauthUrl, result.data.access_token)
      return Promise.resolve(result.data.access_token);
    }

    return Promise.reject(
      new CancelRequestConsumerError(
        'the oAuthResponse object contained an undefined access_token property',
        { type: 'invalid-access-token-response' }
      )
    );
  }).catch(error => {
    let errorMessage = 'An error occured from the OAuth Service';

    if (error.response) {
      const statusCode = error.response.status;
      const statusText = error.response.statusText;
      if (statusCode) {
        errorMessage += `; the service responded with status code: (${statusCode})`;
      }
      if (statusText) {
        errorMessage += ` and status text: (${statusText})`;
      }

      logger.error(errorMessage, { debugInfo: error.response });
      return Promise.reject(
        new CancelRequestConsumerError(
          errorMessage,
          {
            type: 'oauth-service-error',
            statusCode: error.response.status || null
          }
        )
      );
    }

    if (error.request) {
      errorMessage += '; the request was made, no response received from OAuth Service';

      logger.error(errorMessage, { debugInfo: error.request });
      return Promise.reject(
        new CancelRequestConsumerError(
          errorMessage,
          {
            type: 'oauth-service-error',
            debugInfo: error.request
          }
        )
      );
    }

    if (error.type === 'invalid-access-token-response') {
      errorMessage += `; ${error.message}`;

      logger.error(errorMessage, { debugInfo: error });
      return Promise.reject(error);
    }

    errorMessage += '; an fatal server error occurred from the OAuth Service';
    logger.error(errorMessage, { debugInfo: error });
    return Promise.reject(
      new CancelRequestConsumerError(
        errorMessage,
        {
          type: 'oauth-service-error',
          debugInfo: error
        }
      )
    );
  });
}

const getBasicAuthHeaders = function (clientId, clientSecret) {
  return {"auth" : {"username" : clientId, "password" : clientSecret } }
}

const fetchSierraToken = function (authUrl, clientId, clientSecret, scope, grantType) {
  if (!authUrl || typeof authUrl !== 'string' || authUrl.trim() === '') {
    return Promise.reject(
      new CancelRequestConsumerError('fetchSierraToken: the authUrl function parameter is not defined or invalid; must be of type string and not empty')
    );
  }

  //const oAuthConfig = getOauthConfig(clientId, clientSecret, scope, grantType);
  const headers = getBasicAuthHeaders(clientId, clientSecret);
  return axios.post(authUrl + "token", {}, headers)
  .then(result => {
    if (result.data && result.data.access_token) {
      return Promise.resolve(result.data.access_token);
    }

    return Promise.reject(
      new CancelRequestConsumerError(
        'fetchSierraToken: the AuthResponse object contained an undefined access_token property',
        { type: 'invalid-access-token-response' }
      )
    );
  })
  .catch(error => {
    let errorMessage = 'fetchSierraToken: An error occurred from the auth service';

    if (error.response) {
      const statusCode = error.response.status;
      const statusText = error.response.statusText;
      if (statusCode) {
        errorMessage += `; the service responded with status code: (${statusCode})`;
      }
      if (statusText) {
        errorMessage += ` and status text: (${statusText})`;
      }

      logger.error(errorMessage, { debugInfo: error.response });
      return Promise.reject(
        new CancelRequestConsumerError(
          errorMessage,
          {
            type: 'auth-service-error',
            statusCode: error.response.status || null
          }
        )
      );
    }

    if (error.request) {
      errorMessage += '; the request was made, no response received from Auth Service';

      logger.error(errorMessage, { debugInfo: error.request });
      return Promise.reject(
        new CancelRequestConsumerError(
          errorMessage,
          {
            type: 'auth-service-error',
            debugInfo: error.request
          }
        )
      );
    }
  });
}

const handleAuthentication = async function (cachedToken, getNewTokenFn, name) {
  if (cachedToken && typeof cachedToken === 'string' && cachedToken !== '') {
    console.log('cached', name)
    // Re-use cached access token
    return {
      tokenType: 'cached-token',
      token: cachedToken,
      tokenName: name
    };
  }

  try {
    // Obtain a new access token
    const accessToken = await getNewTokenFn;
    console.log(accessToken, name);
    return {
      tokenType: 'new-token',
      token: accessToken,
      tokenName: name
    };
  } catch (e) {
    throw e;
  }
}

export {
  getOauthConfig,
  fetchAccessToken,
  handleAuthentication,
  fetchSierraToken,
  getBasicAuthHeaders
}
