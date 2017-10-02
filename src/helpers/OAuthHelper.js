/* eslint-disable semi */
import axios from 'axios';
import qs from 'qs';
import CancelRequestConsumerError from './ErrorHelper';

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
      return Promise.resolve(result.data.access_token);
    }

    return Promise.reject(
      new CancelRequestConsumerError(
        'the oAuthResponse object contained an undefined access_token property',
        { type: 'invalid-access-token-response' }
      )
    );
  }).catch(error => {
    // console.log('an error occured from the OAuth Service; received a status outside of the 2xx range');
    if (error.response) {
      const statusCode = error.response.status || '';
      return Promise.reject(
        new CancelRequestConsumerError(
          `an error occured from the OAuth Service; the service responded with status code: (${statusCode})`,
          {
            type: 'oauth-service-error',
            statusCode: error.response.status || null
          }
        )
      );
    }

    if (error.request) {
      return Promise.reject(
        new CancelRequestConsumerError(
          'an error occurred from the OAuth Service; the request was made, no response received from OAuth Service',
          {
            type: 'oauth-service-error',
            debugInfo: error.request
          }
        )
      );
    }

    if (error.type === 'invalid-access-token-response') {
      return Promise.reject(error);
    }

    return Promise.reject(
      new CancelRequestConsumerError(
        'an internal server error occurred from the OAuth Service',
        {
          type: 'oauth-service-error',
          debugInfo: error
        }
      )
    );
  });
}

const handleAuthentication = async function (cachedToken, getNewTokenFn) {
  if (cachedToken && typeof cachedToken === 'string' && cachedToken !== '') {
    // Re-use cached access token
    return {
      tokenType: 'cached-token',
      token: cachedToken
    };
  }

  try {
    // Obtain a new access token
    const accessToken = await getNewTokenFn;
    return {
      tokenType: 'new-token',
      token: accessToken
    };
  } catch (e) {
    throw e;
  }
}

export {
  getOauthConfig,
  fetchAccessToken,
  handleAuthentication
}
