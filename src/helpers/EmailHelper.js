import axios from 'axios';
import logger from './Logger';
import ApiHelper from './ApiHelper';

const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

function EmailHelper() {
  this.params = function () {
    return {
      Destination: {
        ToAddresses: [
          this.recipientEmail
        ]
      },
      Message: {
        Body: {
          Text: {
            Charset: "UTF-8",
            Data: `Author: ${this.authors},Title: ${this.titles}, Patron: ${this.name}, Barcode: ${this.barcode}`
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

  this.getPatronInfo = function(barcode, token) {
    let config = ApiHelper.getApiHeaders(token);
    config.params = {barcode: barcode};
    logger.info("Getting patron info for: ", barcode)
    return axios.get('https://qa-platform.nypl.org/api/v0.1/patrons', config)
    .then(result => {
      logger.info("Retrieved emails: ", result.data.data[0].emails, "Retrieved names: ", result.data.data[0].names);
      this.setPatronInfo(result.data.data[0].emails[0], result.data.data[0].names[0]);
    })
    .catch((error) => {
      logger.error('Error retrieving patron');
      logger.error(error.message);
    })
  }

  this.setPatronInfo = function(email, name) {
    this.email = email;
    this.name = name;
  }

  this.getItemInfo = function(barcode, token) {
      let config = ApiHelper.getApiHeaders(token);
      config.params = {barcode: barcode};
      logger.info("Getting item info for: ", barcode)
      return axios.get('https://qa-platform.nypl.org/api/v0.1/items', config)
      .then(result => {
        logger.info("Retrieved bibIds: ", result.data.data[0].bibIds);
        this.setItemInfo(result.data.data[0].bibIds, barcode);
      })
      .catch((error) => {
        logger.error('Error retrieving item');
        logger.error(error.message);
      })
  }

  this.setItemInfo = function(bibIds, barcode) {
    this.bibIds = bibIds;
    this.barcode = barcode;
  }

  this.getBibInfo = function(token) {
    const id = this.bibIds.join(",");
    let config = ApiHelper.getApiHeaders(token);
    config.params = {id: id};
    logger.info("Getting Bib Info for: ", id)
    return axios.get('https://qa-platform.nypl.org/api/v0.1/bibs', config)
    .then(result => {
      this.setBibInfo(result.data.data);
    })
    .catch((error) => {
      logger.error('Error retrieving item');
      logger.error(error.message);
    })
  }

  this.setBibInfo = function(data) {
    this.authors = data.map(bib => bib.author).join(",");
    this.titles = data.map(bib => bib.title).join(",");
    logger.info("Retrieved authors and titles: ", this.authors, this.titles);
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



}

const processItemAndEmail = (token) => (item) => {
  logger.info('Processing Email for: ', item.patronBarcode, item.itemBarcode, token);
  try {
    const helper = new EmailHelper();
    helper.getPatronInfo(item.patronBarcode, token)
      .then(() => helper.getItemInfo(item.itemBarcode, token))
      .then(() => helper.getBibInfo(token))
      .then(logger.info("Sending email: ", JSON.stringify(helper.params())))
      .catch(e => console.log(e))
    }

    catch(err) {
        console.log(err.message)
    }
      // .then(email => sendEmailForItem(email))
}

const sendEmail = (processedItemsToRecap, token) => {
  processedItemsToRecap.forEach(processItemAndEmail(token));
}

export default sendEmail;
