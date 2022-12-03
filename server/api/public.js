let contactWaiting = false;
const contactInterval = 1000;
let contactTimer;
async function ContactUs(params) {
  try {
    if (!contactWaiting) {
      const collection = db.collection("contactus");
      await collection.insertOne({
        first_name: params.first_name,
        last_name: params.last_name,
        email: params.email,
        company: params.company,
        comment: params.comment,
        interest: params.interest,
      });

      const message = `
        FROM: <br />${params.first_name} ${params.last_name} <br /><br />
        EMAIL: <br />${params.email} <br /><br />
        COMPANY: <br />${params.company} <br /><br />
        COMMENT: <br />${params.comment} <br /><br />
        INTEREST: <br />${params.interest} <br /><br />
        `

      // SEND EMAIL TO SUPPORT
      const sendgrid = require("./sendgrid.js");
      const emailParams = {
        to: ["support@radishapp.io"],
        from: "support@radishapp.io",
        replyTo: "support@radishapp.io",
        subject: "New Radish Website Contact Us",
        emailTemplate: "supportMsg",
        emailLink: "",
        emailHeading: `New contact us from ${params.first_name} ${params.last_name}`,
        emailBody: message,
        eventName: "",
        senderPersonId: '3a68320c355df8b2a61327b88290d920',
        moduleId: "",
        moduleName: "",
        type: "email",
        peopleIds: ['3a68320c355df8b2a61327b88290d920'],
      };
      await sendgrid.sendMyMail(emailParams, async (resp) => {
        if (resp.code !== 202) {
          log({
            level: "error",
            message: "Error sending support message via email.",
            function: "logSupportMessage",
            params: params,
            error_code: 500,
            error_stack: resp.message,
          });
        }
      });

      //RESET THROTTLE
      contactWaiting = true;
      contactTimer = setTimeout(() => {
        contactWaiting = false;
      }, contactInterval);

      return {
        code: 200,
      }
    } else {
      clearTimeout(contactTimer);
      contactWaiting = true;
      contactTimer = setTimeout(() => {
        contactWaiting = false;
      }, contactInterval);
      return {
        code: 500,
        message: "Throttle error."
      }
    }
  } catch (error) {
    console.log(error.stack);
    return {
      code: 500,
      message: "Error saving contact-us record."
    }
  }
}
module.exports = {
  ContactUs,
}