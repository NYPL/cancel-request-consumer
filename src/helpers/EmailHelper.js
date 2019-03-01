const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

const params = {
  Destination: {
    ToAddresses: [
      'danielappel@nypl.org'
    ]
  },
  Message: {
    Body: {
      Text: {
        Charset: "UTF-8",
        Data: "Success!"
      }
    },
    Subject: {
      Charset: "UTF-8",
      Data: "Success!"
    },
  },
  Source: 'danielappel@nypl.org'
}

const sendEmail = () => {
  const sendPromise = new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(params).promise();
  sendPromise.then(
    function(data){
      console.log(data.MessageId);
    }
  ).catch(
    function(err){
      console.error(err, err.stack);
    }
  );
}

export default sendEmail;
