// using Twilio SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs
const emailTemplate = require("../utilities/emailTemplates.js");
const crypto = require("crypto");
const PORT = process.env.PORT || 3001;
//const path = require("path");
const sgKey = process.env.SENDGRID_API_KEY;
const server = process.env.SERVER_PATH;
const isProductionServer =
  server.indexOf("app.radishapp.io") > -1 ? true : false; //Test to see if running on production server.  Otherwise capture the mail.
const isE2 = server.indexOf("radish-e2.herokuapp.com") > -1 ? true : false;
const isUat = server.indexOf("radish-uat.herokuapp.com") > -1 ? true : false;
const log = require("./logger.js").insertServerLogs;

//POSSIBLE UPGRADES
// USE A PRE-Header
{
  /* <span class="preheader" style="color: transparent; display: none; height: 0; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; mso-hide: all; visibility: hidden; width: 0;"><the quick brown fox></span> */
}

const insertNotifications = async ({
  toArray,
  senderPersonId,
  moduleId,
  moduleName,
  type,
  peopleIds,
  from,
}) => {
  try {
    let pushArray = [];
    const today = new Date();
    for (let i = 0; i < toArray.length; i++) {
      const insertArray = {
        notification_id: crypto.randomBytes(16).toString("hex"),
        to_person_id: peopleIds[i],
        date_created: today,
        created_by: senderPersonId || "system",
        module: moduleName || "system",
        module_id: moduleId || "system",
        status: "sent",
        type: type,
        sent_to: toArray[i],
        from: from,
      };
      pushArray.push(insertArray);
    }
    log({
      level: "info",
      message: "Engaged insertNotifications",
      function: "insertNotifications",
    });
    const collection = db.collection("notifications");
    const notices = await collection.insertMany(pushArray);
    return {
      data: notices.insertedIds,
      message: "ok",
    };
  } catch (error) {
    log({
      level: "error",
      message: "Error while inserting email notifications",
      function: "insertNotifications",
      error_code: error_code,
      error_stack: error.stack,
    });
  }
};

const htmlContent = (params, isServerPathExists, emailAddr, peopleID) => {
  const template = params.emailTemplate || "email1";
  const heading = params.emailHeading || "";
  const link = params.emailLink || "";
  const body = params.emailBody || "";
  const data = params.data || "";
  const orgName = params.orgName || "";
  const peopleIds = params.peopleIds || [];
  const eventName = params.eventName;
  const peopleId = peopleID || "";
  let html = "";
  let toHTML = `<span></span>`;
  let recipientEmail = emailAddr ? emailAddr : params.to;
  if (isServerPathExists && !isProductionServer) {
    let msg = setMsgDefaults(params, html);
    toHTML = `
            <div style="text-align:left;padding:2rem;">
              <div>From: ${msg.from}</div>
              <div>To: ${recipientEmail}</div>
              <div>Subject: ${msg.subject}</div>
              <div>Server: ${server}</div>
              <div style="margin-bottom:16px;">-------------------------</div>
            </div>
          `;
  }
  switch (template) {
    case "reset1":
      html = emailTemplate.reset1(heading, body, link, toHTML);
      break;
    case "resetRequestToNonPrimaryEmail":
      html = emailTemplate.resetRequestToNonPrimaryEmail(body, toHTML);
      break;
    case "logincode1":
      html = emailTemplate.logincode1({
        heading: heading,
        body: body,
        link: link,
        toHTML: toHTML,
        code: data,
      });
      break;
    case "removeAccountConfirm":
      html = emailTemplate.removeAccountConfirm(link, toHTML);
      break;
    case "authorizationCode":
      html = emailTemplate.authorizationCode(link, data, orgName, toHTML);
      break;
    case "welcomeEmail":
      html = emailTemplate.welcomeEmail(body, link, toHTML, peopleIds);
      break;
    case "changePasswordConfirm":
      html = emailTemplate.changePasswordConfirm(link, toHTML);
      break;
    case "removeEmailConfirm":
      html = emailTemplate.removeEmailConfirm(params, link, toHTML);
      break;
    case "addEmailConfirm":
      html = emailTemplate.addEmailConfirm(params, link, toHTML);
      break;
    case "addEmailCode":
      html = emailTemplate.addEmailCode(params, link, toHTML);
      break;
    case "primaryEmailChanged":
      html = emailTemplate.primaryEmailChanged(link, params.to, toHTML);
      break;
    case "welcomeBackEmail":
      html = emailTemplate.welcomeBackEmail(link, toHTML, peopleIds);
      break;
    case "addOrgConfirm":
      html = emailTemplate.addOrgConfirm(params, toHTML);
      break;
    case "supportMsg":
      html = emailTemplate.supportMsg({
        heading: heading,
        body: body,
        toHTML: toHTML,
      });
      break;
    case "deleteEvent":
      html = emailTemplate.deleteEvent({
        heading: heading,
        body: body,
        toHTML: toHTML,
      });
      break;
    case "ics1":
      html = emailTemplate.ics1(
        heading,
        body,
        toHTML,
        peopleIds,
        peopleId
      );
      break;
    default:
      html = emailTemplate.email1(
        heading,
        body,
        link,
        eventName,
        toHTML,
        peopleIds,
        peopleId
      );
      break;
  }

  return html;
};

const setMsgDefaults = (params, html) => {
  let msg = {};
  msg.from = params.from || "Radish <info@radishapp.io>";
  msg.to = params.to;
  msg.replyTo = params.replyTo;
  msg.subject = params.subject;
  msg.text = params.emailBody || "";
  msg.html = html;
  if (params.ics) {
    msg.attachments = [
      {
        content: params.ics,
        filename: 'radish.ics',
        type: 'plain/text',
        disposition: 'attachment',
        content_id: 'myics',
      }
    ]
  }
  return msg;
};

const isLocalhost = () => {
  return PORT === 3001 || process.env.SERVER_PATH.indexOf("localhost") > -1
    ? true
    : false;
};
const writeContentToFile = (params, msg, callBack) => {
  // LOCALHOST INTERRUPT WRITES HTLM FILE TO FOLDER c:/RadishMail
  const fs = require("fs");
  let iCallback = 0;
  let response = {};
  let logMetaData = {};
  const saveEmailToRadishMail = async () => {
    // write html file AFTER directory checked / created
    const writeEmail = (emailAddr, peopleId) => {
      const content = htmlContent(params, true, emailAddr, peopleId);
      if (params.ics) {
        fs.writeFile(
          `c:/RadishMail/${crypto.randomBytes(16).toString("hex")}.ics`,
          params.ics,
          (err) => {
            //do nothing
          })
      }
      fs.writeFile(
        `c:/RadishMail/${crypto.randomBytes(16).toString("hex")}.html`,
        content,
        (err) => {
          if (err) {
            log({
              level: "error",
              message: `Error occurred while writing email to file on local directory`,
              function: "writeEmail",
              error_code: error.code || 400,
              error_stack: error.stack,
            });
            response = {
              code: 400,
              message: "failure",
            };
            callBack(response);
          } else {
            if (iCallback === 0) {
              // limits writes to db on callback function for localhost
              response = {
                code: 202,
                message: "success",
              };
              insertNotifications({
                toArray: params.to,
                senderPersonId: params.senderPersonId,
                moduleId: params.moduleId,
                moduleName: params.moduleName,
                type: params.type,
                peopleIds: params.peopleIds,
                from: params.from,
              });
              callBack(response);
            }
            iCallback += 1;
          }
        }
      );
    };

    const peopleIds = params.peopleIds;
    // write a file for each recipient up to 10
    for (let i = 0; i < msg.to.length; i++) {
      if (i < 10) {
        writeEmail(msg.to[i], peopleIds[i]);
      }
    }
  };

  //Create dir in case not found
  const dir = "c:/RadishMail";
  fs.access(dir, function (err) {
    if (err && err.code === "ENOENT") {
      fs.mkdir(dir, (error) => {
        if (error) {
          response = {
            code: 400,
            message: "failure",
          };
          log({
            level: "error",
            message: `Error occurred while sending email`,
            function: "writeContentToFile",
            error_code: 400,
            error_stack: error.stack,
          });
          callBack(response);
        } else {
          saveEmailToRadishMail();
        }
      });
    } else {
      saveEmailToRadishMail();
    }
  });
  log({
    level: "info",
    message: "On localhost, writing email to file on local directory",
    function: "writeContentToFile",
  });
};

async function sendMyMail(params, callBack) {
  try {
    var response = {};
    let msg = setMsgDefaults(params, htmlContent(params));
    // LOCALHOST TEST
    if (isLocalhost()) {
      writeContentToFile(params, msg, callBack);
    } else {
      let sgMail = require("@sendgrid/mail");
      sgMail.setApiKey(sgKey);
      // Set mail receipients for test server
      msg.to = setMailReceipients(msg.to);
      msg.html = htmlContent(params, true, params.to);
      let contentToBeEmailed = msg;
      let personalizationArray = [];
      //Customizing event invite and notification preferences link
      if (params.emailTemplate === "email1") {
        if (params.to) {
          let recipients = params.to;
          let recipientIds = params.peopleIds;
          let recipientNames = params.recipientNames;
          for (let i = 0; i < recipients.length; i++) {
            let personalizationData = {
              to: !isProductionServer && !isUat ? msg.to : [recipients[i]], // On test server, send emails to msg.to instead of actual recipients
              subject: !isProductionServer && !isUat
                ? msg.subject + "-" + recipientNames[i] + "-" + i
                : msg.subject, // On test server, append display name and index in subject
              substitutions: {
                link: params.emailLink + "&pid=" + recipientIds[i], // adding person_id to event invite link
                peopleId: recipientIds[i], //adding person_id to manage notifications
              },
            };
            personalizationArray.push(personalizationData);
          }
          contentToBeEmailed = {
            from: msg.from,
            subject: msg.subject,
            personalizations: personalizationArray,
            html: msg.html,
          };
          if (params.ics) {
            contentToBeEmailed = {
              ...contentToBeEmailed,
              attachments: [
                {
                  content: params.ics,
                  filename: 'radish.ics',
                  type: 'plain/text',
                  disposition: 'attachment',
                  content_id: 'myics',
                }
              ]
            }
          }
        }
      }
      let retryCount = 0;
      //console.log(contentToBeEmailed)
      await sendMailWithRetriesAsNecessary(
        true, // This boolean flag true represents send multiple emails at a time
        sgMail,
        contentToBeEmailed,
        retryCount,
        async (response) => {
          callBack(response);
        }
      );
      insertNotifications({
        toArray: params.to,
        senderPersonId: params.senderPersonId,
        moduleId: params.moduleId,
        moduleName: params.moduleName,
        type: params.type,
        peopleIds: params.peopleIds,
        from: params.from,
      });
    }
  } catch (error) {
    log({
      level: "error",
      message: `Error occurred while sending email`,
      function: "sendMyMail",
      error_code: error.code || 400,
      error_stack: error.stack,
    });
    response = {
      code: 400,
      message: "failure",
    };
    callBack(response);
  }
}

const shouldRetry = (errorCode, retryCount) => {
  if (
    retryCount &&
    retryCount > 0 &&
    retryCount < 3 &&
    errorCode &&
    errorCode === 500
  ) {
    log({
      level: "warn",
      message: `Error occurred while sending email. Retry attempt ${retryCount}`,
      function: "shouldRetry",
    });
  }
  return errorCode && errorCode === 500 ? true : false;
};

async function sendMailWithRetriesAsNecessary(
  sendMultipleEmails,
  sgMail,
  msg,
  retryCount,
  callBack
) {
  try {
    // Try to send mail first time
    let response = await sendMail(sendMultipleEmails, sgMail, msg);
    retryCount = retryCount + 1;
    let logMetaData = {};
    logMetaData.level = "debug";
    logMetaData.category = "server";
    if (shouldRetry(response.code, retryCount)) {
      // If 500 error, need to retry
      if (retryCount < 3) {
        // Retry for 2 times when error code is 500
        sendMailWithRetriesAsNecessary(sgMail, msg, retryCount, callBack);
      } else {
        // After 2 retries, stop retrying
        log({
          level: "debug",
          message: `Error in Email. Error code is ${response.code
            }. Message is ${JSON.stringify(msg)}.`,
          function: "sendMailWithRetriesAsNecessary",
        });
        log({
          level: "error",
          message: `Error occurred while sending email. Error is ${JSON.stringify(
            response
          )}`,
          function: "sendMailWithRetriesAsNecessary",
        });
        callBack(response);
      }
    } else if (response.code >= 400) {
      log({
        level: "debug",
        message: `Error in Email. Error code is ${response.code
          }. Message is ${JSON.stringify(msg)}.`,
        function: "sendMailWithRetriesAsNecessary",
      });
      log({
        level: "error",
        message: `Error occurred while sending email. ${JSON.stringify(
          response
        )}`,
        function: "sendMailWithRetriesAsNecessary",
      });
      callBack(response);
    } else {
      // If no error, do not retry
      log({
        level: "debug",
        message: `Tried sending email. Response code is ${response.code
          }. Message is ${JSON.stringify(msg)}.`,
        function: "sendMailWithRetriesAsNecessary",
      });
      callBack(response);
    }
  } catch (error) {
    log({
      level: "debug",
      message: `Error in Email. Error code is ${error.code
        }. Message is ${JSON.stringify(msg)}.`,
      function: "sendMailWithRetriesAsNecessary",
    });
    log({
      level: "error",
      message: `Error occurred while sending email`,
      function: "sendMailWithRetriesAsNecessary",
      error_code: error.code || 400,
      error_stack: error.stack,
    });
    let errorResponse = {
      code: error.code || 400,
      error: error.stack,
      status: "failure",
    };
    callBack(errorResponse);
  }
}

async function sendMail(sendMultipleEmails, sgMail, msg) {
  let response = {};
  try {
    // sendMultipleEmails - false represents send one email at a time.
    // sendMultipleEmails - true represents send multiple emails at a time.
    if (sendMultipleEmails) {
      await sgMail
        .sendMultiple(msg)
        .then(([res]) => {
          response = {
            code: res.statusCode,
            status: "success",
          };
        })
        .catch((error) => {
          response = {
            code: error.code || 400,
            error: error.stack,
            status: "failure",
          };
        });
    } else {
      await sgMail
        .send(msg)
        .then(([res]) => {
          response = {
            code: res.statusCode,
            status: "success",
          };
        })
        .catch((error) => {
          response = {
            code: error.code || 400,
            error: error.stack,
            status: "failure",
          };
        });
    }
  } catch (error) {
    response = {
      code: error.code || 400,
      error: error.stack,
      status: "failure",
    };
  }
  return response;
}

async function sendEmailNotification(emailParams, callBack) {
  // LOCALHOST TEST
  if (isLocalhost()) {
    writeDigestContentToFile(emailParams, callBack);
  } else {
    let sgMail = require("@sendgrid/mail");
    let response = { code: 200, status: "no email attempted" };
    // Send email notification to app owner and dev when notifyAppOwner = true  
    if (!emailParams.notifyAppOwner) {
      emailParams.subject = emailParams.subject || `Radish Daily Digest for ${emailParams.mail_to}`;
      // Set mail receipients for test server
      emailParams.mail_to = setMailReceipients(emailParams.mail_to);
    }
    let msg = {
      to: emailParams.mail_to,
      from: "Radish <info@radishapp.io>",
      replyTo: "info@radishapp.io",
      subject: emailParams.subject,
      html: emailParams.message,
    };
    const sgKey = process.env.SENDGRID_API_KEY;
    sgMail.setApiKey(sgKey);
    let retryCount = 0;
    await sendMailWithRetriesAsNecessary(
      false, // This boolean flag false represents send one email at a time
      sgMail,
      msg,
      retryCount,
      async (response) => {
        callBack(response);
      }
    );
  }

}

const setMailReceipients = (receipients) => {
  // NOT localhost. Send real emails via SendGrid
  // We are NOT on the production server, so caputure the email and send to developer@radishapp.io account.
  let mailReceipients = receipients;
  if (!isProductionServer && !isUat) {
    if (!isE2) {
      mailReceipients = ["developer@radishapp.io"];
    } else {
      //When messages sent on e2Server, also send message to them.
      mailReceipients = [
        "developer@radishapp.io",
        "shalini.s@e2infosystems.com",
        "dayanithi.s@e2infosystems.com",
      ];
    }
  }
  return mailReceipients;
}

const writeDigestContentToFile = (emailParams, callBack) => {
  // LOCALHOST INTERRUPT WRITES HTLM FILE TO FOLDER c:/RadishMail
  const fs = require("fs");
  const content = emailParams.message;
  const writeDigestEmail = () => {
    log({
      level: "info",
      message: "On localhost, writing digest email to file on local directory",
      function: "writeDigestContentToFile",
    });
    fs.writeFile(
      `c:/RadishMail/${crypto.randomBytes(16).toString("hex")}.html`,
      content,
      (err) => {
        if (err) {
          log({
            level: "error",
            message: `Error occurred while writing digest email to file on local directory`,
            function: "writeDigestEmail",
            error_code: error.code || 400,
            error_stack: error.stack,
          });
          response = {
            code: 400,
            message: "failure",
          };
          callBack(response);
        } else {
          response = {
            code: 202,
            message: "success",
          };
          callBack(response);
        }
      }
    );
  };
  //Create dir in case not found
  const dir = "c:/RadishMail";
  fs.access(dir, function (err) {
    if (err && err.code === "ENOENT") {
      fs.mkdir(dir, (error) => {
        if (error) {
          response = {
            code: 400,
            message: "failure",
          };
          log({
            level: "error",
            message: `Error occurred while accessing/creating local directory ${dir}`,
            function: "writeDigestContentToFile",
            error_code: 400,
            error_stack: error.stack,
          });
          callBack(response);
        } else {
          writeDigestEmail();
        }
      });
    } else {
      writeDigestEmail();
    }
  });

}

module.exports = {
  sendMyMail,
  sendEmailNotification,
};
