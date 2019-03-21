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

  this.getInfo = function(type, barcode = null) {
    const url = `${process.env.NYPL_DATA_API_BASE_URL}${type.toLowerCase()}s`
    logger.info("Getting: ", url);
    let config = this.buildAxiosConfigFor(type, barcode, token);
    return axios.get(url, config)
    .then((result) => {
      this.setInfoFor(type, result.data.data);
    })
    .catch((error) => {
      logger.error(`Error retrieving ${type}:`, error.message);
      throw error;
    })
  }

  this.buildAxiosConfigFor = function(type, barcode, token) {
    let config = ApiHelper.getApiHeaders(token);
    let params = {};
    if (barcode) {
      params.barcode = barcode;
    }
    if (type === 'Bib') {
      params.id = this.bibIds.join(",");
    }
    config.params = params;
    logger.info("Getting info for: ", type, barcode, this.bibIds);
    return config;
  }

  this.setInfoFor = function(type, data) {
    if (type === "Patron") {
      this.emails = data[0].emails;
      this.names = data[0].names;
      logger.info("Retrieved emails: ", this.emails, "Retrieved names: ", this.names);
    }
    if (type === "Item") {
      this.bibIds = data[0].bibIds;
      this.barcode = data[0].barcode;
      logger.info("Retrieved bibIds: ", this.bibIds, "Retrieved barcodes: ", this.barcodes);
    }
    if (type === "Bib") {
      this.authors = data.map(bib => bib.author);
      this.titles = data.map(bib => bib.title);
      logger.info("Retrieved authors and titles: ", this.authors, this.titles);
    }
  }

  this.sendEmailForItem = function() {
    let params = this.params();
    logger.info(`Sending email: ${JSON.stringify(params, null, 2)}`)
    const sendPromise = new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(params).promise();
    return sendPromise.then(
      (data) => {
        logger.info("SES responded with: ", data.MessageId);
      }
    ).catch(
      (err) => {
        logger.error("Error sending email with SES", err, err.stack);
        throw err;
      }
    );
  }
}

const processItemAndEmail = (item, token) => {
  logger.info('Processing Email for: ', item.patronBarcode, item.itemBarcode);
  const helper = new EmailHelper(token);
  return Promise.all([
    helper.getInfo("Patron", item.patronBarcode),
    helper.getInfo("Item", item.itemBarcode)])
    .then(() => helper.getInfo("Bib"))
    .then(() => helper.sendEmailForItem())
    .catch((e) => {
      logger.error("Error processing email: ", e.message);
      throw e
    })
}

const sendEmail = (processedItemsToRecap, token) => {
  return Promise.all(processedItemsToRecap.map(item => processItemAndEmail(item, token)));
}

export default sendEmail;
