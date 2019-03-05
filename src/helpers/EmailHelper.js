import axios from 'axios';
import logger from './Logger';
import ApiHelper from './ApiHelper';

const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

const params = (recipientEmail) => {
  return {
    Destination: {
      ToAddresses: [
        recipientEmail
      ]
    },
    Message: {
      Body: {
        Text: {
          Charset: "UTF-8",
          Data: "Success with params!"
        }
      },
      Subject: {
        Charset: "UTF-8",
        Data: "Success with params!"
      },
    },
    Source: 'researchrequests@nypl.org'
  }
}

const getPatronEmail = (barcode, token) => {
  let config = ApiHelper.getApiHeaders(token);
  config.params = {barcode: barcode};
  return axios.get('https://qa-platform.nypl.org/api/v0.1/patrons', config)
    .then(result => result.data.data[0].emails[0])
    .catch((error) => {
      logger.error('Error retrieving email');
      logger.error(error.message);
    })
}

const sendEmailForItem = (patronEmail) => {
  const sendPromise = new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(params(patronEmail)).promise();
  sendPromise.then(
    function(data){
      logger.info(data.MessageId);
    }
  ).catch(
    function(err){
      logger.error(err, err.stack);
    }
  );

}


const processItemAndEmail = (token) => (item) => {
  logger.info('Processing Email for: ', item.patronBarcode, item.itemBarcode, token);
  getPatronEmail(item.patronBarcode, token)
    .then(email => sendEmailForItem(email))
}

const sendEmail = (processedItemsToRecap, token) => {
  processedItemsToRecap.forEach(processItemAndEmail(token));
}

export default sendEmail;
