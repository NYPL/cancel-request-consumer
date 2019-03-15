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
          this.emails[0]
        ]
      },
      Message: {
        Body: {
          Text: {
            Charset: "UTF-8",
            Data: `Author: ${this.authors},Title: ${this.titles}, Patron: ${this.names[0]}, Barcode: ${this.barcode}`
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
    return axios.get('https://qa-platform.nypl.org/api/v0.1/patrons', this.patronConfig(barcode, token))
    .then((result) => {
      this.setPatronInfo(result.data.data);
    })
    .catch((error) => {
      logger.error('Error retrieving patron:', error.message);
    })
  }

  this.patronConfig = function(barcode, token) {
    let config = ApiHelper.getApiHeaders(token);
    config.params = {barcode: barcode};
    logger.info("Getting patron info for: ", barcode)
    return config;
  }

  this.setPatronInfo = function(data) {
    this.emails = data[0].emails;
    this.names = data[0].names;
    logger.info("Retrieved emails: ", this.emails, "Retrieved names: ", this.names);
  }

  this.getItemInfo = function(barcode, token) {
      return axios.get('https://qa-platform.nypl.org/api/v0.1/items', this.itemConfig(barcode, token))
      .then((result) => {
        this.setItemInfo(result.data.data);
      })
      .catch((error) => {
        logger.error('Error retrieving item: ', error.message);
      })
  }

  this.itemConfig = function(barcode, token) {
    let config = ApiHelper.getApiHeaders(token);
    config.params = {barcode: barcode};
    logger.info("Getting item info for: ", barcode)
    return config;
  }

  this.setItemInfo = function(data) {
    this.bibIds = data[0].bibIds;
    this.barcode = data[0].barcode;
    logger.info("Retrieved bibIds: ", this.bibIds, "Retrieved barcodes: ", this.barcodes);
  }

  this.getBibInfo = function(token) {
    return axios.get('https://qa-platform.nypl.org/api/v0.1/bibs', this.bibConfig("", token))
    .then((result) => {
      this.setBibInfo(result.data.data);
    })
    .catch((error) => {
      logger.error('Error retrieving bib: ', error.message);
    })
  }

  this.bibConfig = function(barcode, token) {
    const id = this.bibIds.join(",");
    let config = ApiHelper.getApiHeaders(token);
    config.params = {id: id};
    logger.info("Getting Bib Info for: ", id)
    return config;
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
  const helper = new EmailHelper();
  try {
  helper.getPatronInfo(item.patronBarcode, token)
    .then(() => helper.getItemInfo(item.itemBarcode, token))
    .then(() => helper.getBibInfo(token))
    .then(() => {logger.info("Sending email: ", JSON.stringify(helper.params()))})
    .catch(e => logger.error("Error processing email: ", e.message))
  }
  catch(err) {
    console.log(err.message)
  }
}

const sendEmail = (processedItemsToRecap, token) => {
  processedItemsToRecap.forEach(processItemAndEmail(token));
}

export default sendEmail;
