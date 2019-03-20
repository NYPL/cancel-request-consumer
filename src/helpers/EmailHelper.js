import axios from 'axios';
import logger from './Logger';
import ApiHelper from './ApiHelper';

const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

function EmailHelper(token) {
  this.token = token;
  this.params = function () {
    return {
      Destination: {
        ToAddresses: [
          this.emails[0]
        ]
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: `
            <!DOCTYPE html>
            <html>
            <body>
              Dear ${this.names[0]},
              <br>
              <br>
              Your request for the following item has been cancelled:
              <br>
              <br>
              <b>Title</b>: ${this.titles[0]}
              <br>
              <b>Author</b>: ${this.authors[0]}
              <br>
              <b>Barcode</b>: ${this.barcode}
              <br>
              <br>
              If this cancellation request was made in error, <a href="https://gethelp.nypl.org/customer/portal/emails/new">email us</a> or call 917-ASK-NYPL (917-275-6975).
            </body>
            </html>`
          }
        },
        Subject: {
          Charset: "UTF-8",
          Data: "NYPL Request Status Update"
        },
      },
      Source: 'researchrequests@nypl.org'
    }
  }

  this.getInfo = function(type, barcode = "") {
    const url = `${process.env.NYPL_DATA_API_BASE_URL}${type.toLowerCase()}s`
    logger.info("Posting to: ", url);
    return axios.get(url, this[`set${type}Config`](barcode, this.token))
    .then((result) => {
      this[`set${type}Info`](result.data.data);
    })
    .catch((error) => {
      logger.error(`Error retrieving ${type}:`, error.message);
    })
  }

  this.setPatronConfig = function(barcode, token) {
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

  this.setItemConfig = function(barcode, token) {
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

  this.setBibConfig = function(barcode, token) {
    const id = this.bibIds.join(",");
    let config = ApiHelper.getApiHeaders(token);
    config.params = {id: id};
    logger.info("Getting Bib Info for: ", id)
    return config;
  }

  this.setBibInfo = function(data) {
    this.authors = data.map(bib => bib.author);
    this.titles = data.map(bib => bib.title);
    logger.info("Retrieved authors and titles: ", this.authors, this.titles);
  }

  this.sendEmailForItem = function() {
    let params = this.params();
    logger.info(`Sending email: ${JSON.stringify(params, null, 2)}`)
    const sendPromise = new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(params).promise();
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
  const helper = new EmailHelper(token);
  try {
  helper.getInfo("Patron", item.patronBarcode)
    .then(() => helper.getInfo("Item", item.itemBarcode))
    .then(() => helper.getInfo("Bib"))
    .then(() => helper.sendEmailForItem())
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
