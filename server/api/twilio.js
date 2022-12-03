// Download the helper library from https://www.twilio.com/docs/node/install
// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);
const log = require("./logger.js").insertServerLogs;

async function sendSMS(message, to, callBack) {
  try {
    client.messages
      .create({
        body: message, //'This is the ship that made the Kessel Run in fourteen parsecs?',
        from: '+16606281615',
        to: to, //'+13304664104'
      })
      .then(message => {
        log({
          level: "debug", message: `Message sid: ${message.sid}`, function: "sendSMS"
        });
        callBack();
      });
  } catch (error) {
    log({
      level: "error", message: `There was a problem sending SMS`, function: "sendSMS", error_code: 500, error_stack: error.stack
    });
  }
}

module.exports = {
  sendSMS,
}