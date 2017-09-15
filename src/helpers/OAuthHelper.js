/* eslint-disable semi */
import axios from 'axios';
import qs from 'qs';

const getOauthConfig = function (clientId, clientSecret, scope, grantType = 'client_credentials') {
  if (!clientId || typeof clientId !== 'string' || clientId.trim() === '') {
    throw new Error('the clientId parameter is not defined or invalid; must be of type string and not empty');
  }

  if (!clientSecret || typeof clientSecret !== 'string' || clientSecret.trim() === '') {
    throw new Error('the clientSecret parameter is not defined or invalid; must be of type string and not empty');
  }

  if (!scope || typeof scope !== 'string' || scope.trim() === '') {
    throw new Error('the scope parameter is not defined or invalid; must be of type string and not empty');
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
    return Promise.reject(new Error('the oauthUrl function parameter is not defined or invalid; must be of type string and not empty'));
  }

  const oAuthConfig = getOauthConfig(clientId, clientSecret, scope, grantType);

  return axios.post(oauthUrl, qs.stringify(oAuthConfig))
    .then(result => {
      if (!result.data || !result.data.access_token) {
        return Promise.reject(new Error('the oAuthResponse object contained an undefined access_token property'));
      }

      return Promise.resolve(result.data.access_token);
    }).catch(error => {
      const errorResponse = error.response || error.request || error;
      return Promise.reject(errorResponse);
    })
}

const handleAuthentication = async function (cachedToken, getNewTokenFn) {
  if (cachedToken && typeof cachedToken === 'string' && cachedToken !== '') {
    // Re-use cached access token
    return Promise.resolve({
      tokenType: 'cached-token',
      token: cachedToken
    });
  }

  try {
    // Obtain a new access token
    const accessToken = await getNewTokenFn;
    return {
      tokenType: 'new-token',
      token: accessToken
    };
  } catch (e) {
    return Promise.reject(e);
  }
}

export {
  getOauthConfig,
  fetchAccessToken,
  handleAuthentication
}
