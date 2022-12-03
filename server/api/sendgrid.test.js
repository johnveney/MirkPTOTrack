require("dotenv").config({ path: '/Users/pegasus/Dev/e2is/Radish/code/RadishApp/.env' });
const originalEnv = process.env;
const expectedSuccessCode = 202;
const expectedFailureCode = 400;
const testErrorCode = 999;

let html = `
         <!DOCTYPE html>
         <html>
         <body style=\"margin:auto;border-top:16px solid #d6e3f6;border-bottom:16px solid #d6e3f6;text-align:center;background-color:#d6e3f6;\">
         
             <div style=\"text-align:left;padding:2rem;\">
               <div>From: dummyFrom@dummyemail.com</div>
               <div>To: dummyTo@dummyemail.com</div>
               <div>Subject: Dummy Subject</div>
               <div style=\"margin-bottom:16px;\">-------------------------</div>
             </div>
           
           <div style=\"background-color:#ffffff;border-radius:20px;width:200px;max-width:200px;display:inline-block;margin:auto;border:30px solid #ffffff;box-shadow:1px 3px 4px #c0c0c0;font-family:sans-serif;\">
             <p><img src=https://app.radishapp.io/static/media/RadishAppIconRound.c26dd7a5.png alt=\"Radish\" with=\"100\" height=\"100\" style=\"width:100px;height:100px;border:0;\" /></p>        
             <h1>Dummy Heading</h1>
             <a style=\"display:block;font-size:larger;background-color:#55C3AC;border:16px solid #55C3AC;border-radius:5px;color:white;text-decoration:none;\" href=Dummy Link>
               Dummy Name
             </a>
             <p>Dummy body</p>
             <p><a href=Dummy Link>Click here...</a></p>
           </div></body></html>
     `
const testServer = 'https://radish-e2.herokuapp.com/';
const prodServer = 'https://somedomain.app.radishapp.io';
const localServer = 'https://localhost';

beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
});

afterEach(() => {
    process.env = originalEnv;
});

describe("Emails via sendgrid", () => {
    function mockSendgridCalls(){
        jest.mock("@sendgrid/mail", () => {
            return {
                setApiKey: jest.fn().mockReturnValue('mocked-key'),
                sendMultiple: jest.fn( () => {return Promise.resolve([{statusCode: 202}]); }),
            };
        });
    }
    const emailTemplate = require("../utilities/emailTemplates.js");

    test("Should send email when on prod server", async () => {
        process.env = { ...originalEnv, 
            SERVER_PATH: `${prodServer}`, 
            SENDGRID_API_KEY: 'some-key',
            PORT: 'some-port',
        };
        const sendEmail = require('./sendgrid');
        mockSendgridCalls();
        const mailTool = require("@sendgrid/mail");
        const expectedEmailParams = {
            from: 'from@dummyemail.com',
            replyTo: 'dummyReplyTo@dummyemail.com',
            subject: 'Dummy Subject',
            text: 'Dummy body',
            to: [ "to@dummyemail.com"]
          };
        let actualResult;
        try{
            await sendEmail.sendMyMail(expectedEmailParams, async (resp) => { 
                actualResult = resp;
            });
        } catch(error) {
            actualResult.code = testErrorCode;
            console.log(error);
        }
        expect(mailTool.setApiKey).toHaveBeenCalledTimes(1);
        expect(mailTool.sendMultiple).toHaveBeenCalledTimes(1);
        expect(actualResult.code).toBe(expectedSuccessCode);   
        expect(mailTool.sendMultiple).toBeCalledWith(expect.objectContaining({to: expect.arrayContaining([ "to@dummyemail.com"]) }));
    
    });

    test("Should send email with login code content when login code template is requested", async () => {
        process.env = { ...originalEnv, 
            SERVER_PATH: `${prodServer}`, 
            SENDGRID_API_KEY: 'some-key',
            PORT: 'some-port',
        };
        const sendEmail = require('./sendgrid');
        mockSendgridCalls();
        const mailTool = require("@sendgrid/mail");
        
        const expectedEmailParams = {
            from: 'from@dummyemail.com',
            replyTo: 'dummyReplyTo@dummyemail.com',
            subject: 'Dummy Subject',
            text: 'Dummy body',
            to: [ "to@dummyemail.com"],
            emailTemplate: "logincode1",
            emailHeading: "",
            emailLink: "http://dummyDomain.gap",
            emailBody: "",
            data: ""
          };
        let expectedLoginCodeText = emailTemplate.logincode1({
            heading: expectedEmailParams.emailHeading,
            body: expectedEmailParams.emailBody,
            link: expectedEmailParams.emailLink,
            toHTML: `<span></span>`,
            code: expectedEmailParams.data,
        });
        let actualResult;
        try{
            await sendEmail.sendMyMail(expectedEmailParams, async (resp) => { 
                actualResult = resp;
            });
        } catch(error) {
            actualResult.code = testErrorCode;
            console.log(error);
        }
        expect(mailTool.setApiKey).toHaveBeenCalledTimes(1);
        expect(mailTool.sendMultiple).toHaveBeenCalledTimes(1);
        expect(actualResult.code).toBe(expectedSuccessCode);   
        expect(mailTool.sendMultiple).toBeCalledWith(expect.objectContaining({html: expect.stringContaining(expectedLoginCodeText) }));
    
    });


    test("Should send email with default content when no template is specified", async () => {
        process.env = { ...originalEnv, 
            SERVER_PATH: `${prodServer}`, 
            SENDGRID_API_KEY: 'some-key',
            PORT: 'some-port',
        };
        const sendEmail = require('./sendgrid');
        mockSendgridCalls();
        const mailTool = require("@sendgrid/mail");
        
        const expectedEmailParams = {
            from: 'from@dummyemail.com',
            replyTo: 'dummyReplyTo@dummyemail.com',
            subject: 'Dummy Subject',
            text: 'Dummy body',
            to: [ "to@dummyemail.com"],
            emailHeading: "",
            emailLink: "http://dummyDomain.gap",
            emailBody: "",
            data: "",
            eventName:""
          };
        let expectedDefaultText = emailTemplate.email1(expectedEmailParams.emailHeading,"",expectedEmailParams.emailLink,expectedEmailParams.eventName, `<span></span>`);
        let actualResult;
        try{
            await sendEmail.sendMyMail(expectedEmailParams, async (resp) => { 
                actualResult = resp;
            });
        } catch(error) {
            actualResult.code = testErrorCode;
            console.log(error);
        }
        expect(mailTool.setApiKey).toHaveBeenCalledTimes(1);
        expect(mailTool.sendMultiple).toHaveBeenCalledTimes(1);
        expect(actualResult.code).toBe(expectedSuccessCode);   
        expect(mailTool.sendMultiple).toBeCalledWith(expect.objectContaining({html: expect.stringContaining(expectedDefaultText) }));
    
    });

    test("Should send email with Authorization Code content when authorizationCode template is specified", async () => {
        process.env = { ...originalEnv, 
            SERVER_PATH: `${prodServer}`, 
            SENDGRID_API_KEY: 'some-key',
            PORT: 'some-port',
        };
        const sendEmail = require('./sendgrid');
        mockSendgridCalls();
        const mailTool = require("@sendgrid/mail");
        
        const expectedEmailParams = {
            from: 'from@dummyemail.com',
            replyTo: 'dummyReplyTo@dummyemail.com',
            subject: 'Dummy Subject',
            text: 'Dummy body',
            to: [ "to@dummyemail.com"],
            emailTemplate: "authorizationCode",
            emailHeading: "",
            emailLink: "http://dummyDomain.gap",
            emailBody: "",
            data: "",
            eventName:""
          };
        let expectedAuthorizationCodeText = emailTemplate.authorizationCode(expectedEmailParams.emailLink, expectedEmailParams.data);
        let actualResult;
        try{
            await sendEmail.sendMyMail(expectedEmailParams, async (resp) => { 
                actualResult = resp;
            });
        } catch(error) {
            actualResult.code = testErrorCode;
            console.log(error);
        }
        expect(mailTool.setApiKey).toHaveBeenCalledTimes(1);
        expect(mailTool.sendMultiple).toHaveBeenCalledTimes(1);
        expect(actualResult.code).toBe(expectedSuccessCode);   
        expect(mailTool.sendMultiple).toBeCalledWith(expect.objectContaining({html: expect.stringContaining(expectedAuthorizationCodeText) }));
    
    });

    test("Should send email with welcome content when welcomeEmail template is specified", async () => {
        process.env = { ...originalEnv, 
            SERVER_PATH: `${prodServer}`, 
            SENDGRID_API_KEY: 'some-key',
            PORT: 'some-port',
        };
        const sendEmail = require('./sendgrid');
        mockSendgridCalls();
        const mailTool = require("@sendgrid/mail");
        
        const expectedEmailParams = {
            from: 'from@dummyemail.com',
            replyTo: 'dummyReplyTo@dummyemail.com',
            subject: 'Dummy Subject',
            text: 'Dummy body',
            to: [ "to@dummyemail.com"],
            emailTemplate: "welcomeEmail",
            emailHeading: "",
            emailLink: "http://dummyDomain.gap",
            emailBody: "",
            data: "",
            eventName:""
          };
        let expectedWelcomeEmailText = emailTemplate.welcomeEmail(expectedEmailParams.emailLink, `<span></span>`);
        let actualResult;
        try{
            await sendEmail.sendMyMail(expectedEmailParams, async (resp) => { 
                actualResult = resp;
            });
        } catch(error) {
            actualResult.code = testErrorCode;
            console.log(error);
        }
        expect(mailTool.setApiKey).toHaveBeenCalledTimes(1);
        expect(mailTool.sendMultiple).toHaveBeenCalledTimes(1);
        expect(actualResult.code).toBe(expectedSuccessCode);   
        expect(mailTool.sendMultiple).toBeCalledWith(expect.objectContaining({html: expect.stringContaining(expectedWelcomeEmailText) }));
    
    });

    test("Should send email with password change content when changePasswordConfirm template is specified", async () => {
        process.env = { ...originalEnv, 
            SERVER_PATH: `${prodServer}`, 
            SENDGRID_API_KEY: 'some-key',
            PORT: 'some-port',
        };
        const sendEmail = require('./sendgrid');
        mockSendgridCalls();
        const mailTool = require("@sendgrid/mail");
        
        const expectedEmailParams = {
            from: 'from@dummyemail.com',
            replyTo: 'dummyReplyTo@dummyemail.com',
            subject: 'Dummy Subject',
            text: 'Dummy body',
            to: [ "to@dummyemail.com"],
            emailTemplate: "changePasswordConfirm",
            emailHeading: "",
            emailLink: "http://dummyDomain.gap",
            emailBody: "",
            data: "",
            eventName:""
          };
        let expectedChangePasswordConfirmText = emailTemplate.changePasswordConfirm(expectedEmailParams.emailLink, `<span></span>`);
        let actualResult;
        try{
            await sendEmail.sendMyMail(expectedEmailParams, async (resp) => { 
                actualResult = resp;
            });
        } catch(error) {
            actualResult.code = testErrorCode;
            console.log(error);
        }
        expect(mailTool.setApiKey).toHaveBeenCalledTimes(1);
        expect(mailTool.sendMultiple).toHaveBeenCalledTimes(1);
        expect(actualResult.code).toBe(expectedSuccessCode);   
        expect(mailTool.sendMultiple).toBeCalledWith(expect.objectContaining({html: expect.stringContaining(expectedChangePasswordConfirmText) }));
    
    });

    test("Should send email with removing email confirmation content when removeEmailConfirm template is specified", async () => {
        process.env = { ...originalEnv, 
            SERVER_PATH: `${prodServer}`, 
            SENDGRID_API_KEY: 'some-key',
            PORT: 'some-port',
        };
        const sendEmail = require('./sendgrid');
        mockSendgridCalls();
        const mailTool = require("@sendgrid/mail");
        
        const expectedEmailParams = {
            from: 'from@dummyemail.com',
            replyTo: 'dummyReplyTo@dummyemail.com',
            subject: 'Dummy Subject',
            text: 'Dummy body',
            to: [ "to@dummyemail.com"],
            emailTemplate: "removeEmailConfirm",
            emailHeading: "",
            emailLink: "http://dummyDomain.gap",
            emailBody: "",
            data: "",
            eventName:""
          };
        let expectedRemoveEmailConfirmText = emailTemplate.removeEmailConfirm(expectedEmailParams, expectedEmailParams.emailLink, `<span></span>`);
        let actualResult;
        try{
            await sendEmail.sendMyMail(expectedEmailParams, async (resp) => { 
                actualResult = resp;
            });
        } catch(error) {
            actualResult.code = testErrorCode;
            console.log(error);
        }
        expect(mailTool.setApiKey).toHaveBeenCalledTimes(1);
        expect(mailTool.sendMultiple).toHaveBeenCalledTimes(1);
        expect(actualResult.code).toBe(expectedSuccessCode);   
        expect(mailTool.sendMultiple).toBeCalledWith(expect.objectContaining({html: expect.stringContaining(expectedRemoveEmailConfirmText) }));
    
    });

    test("Should send email with add email confirmation content when addEmailConfirm template is specified", async () => {
        process.env = { ...originalEnv, 
            SERVER_PATH: `${prodServer}`, 
            SENDGRID_API_KEY: 'some-key',
            PORT: 'some-port',
        };
        const sendEmail = require('./sendgrid');
        mockSendgridCalls();
        const mailTool = require("@sendgrid/mail");
        
        const expectedEmailParams = {
            from: 'from@dummyemail.com',
            replyTo: 'dummyReplyTo@dummyemail.com',
            subject: 'Dummy Subject',
            text: 'Dummy body',
            to: [ "to@dummyemail.com"],
            emailTemplate: "addEmailConfirm",
            emailHeading: "",
            emailLink: "http://dummyDomain.gap",
            emailBody: "",
            data: "",
            eventName:""
          };
        let expectedAddEmailConfirmText = emailTemplate.addEmailConfirm(expectedEmailParams, expectedEmailParams.emailLink, `<span></span>`);
        let actualResult;
        try{
            await sendEmail.sendMyMail(expectedEmailParams, async (resp) => { 
                actualResult = resp;
            });
        } catch(error) {
            actualResult.code = testErrorCode;
            console.log(error);
        }
        expect(mailTool.setApiKey).toHaveBeenCalledTimes(1);
        expect(mailTool.sendMultiple).toHaveBeenCalledTimes(1);
        expect(actualResult.code).toBe(expectedSuccessCode);   
        expect(mailTool.sendMultiple).toBeCalledWith(expect.objectContaining({html: expect.stringContaining(expectedAddEmailConfirmText) }));
    
    });

    test("Should send email with primary email changed content when primaryEmailChanged template is specified", async () => {
        process.env = { ...originalEnv, 
            SERVER_PATH: `${prodServer}`, 
            SENDGRID_API_KEY: 'some-key',
            PORT: 'some-port',
        };
        const sendEmail = require('./sendgrid');
        mockSendgridCalls();
        const mailTool = require("@sendgrid/mail");
        
        const expectedEmailParams = {
            from: 'from@dummyemail.com',
            replyTo: 'dummyReplyTo@dummyemail.com',
            subject: 'Dummy Subject',
            text: 'Dummy body',
            to: [ "to@dummyemail.com"],
            emailTemplate: "primaryEmailChanged",
            emailHeading: "",
            emailLink: "http://dummyDomain.gap",
            emailBody: "",
            data: "",
            eventName:""
          };
        let expectedPrimaryEmailChangedText = emailTemplate.primaryEmailChanged(expectedEmailParams.emailLink, expectedEmailParams.to, `<span></span>`);
        let actualResult;
        try{
            await sendEmail.sendMyMail(expectedEmailParams, async (resp) => { 
                actualResult = resp;
            });
        } catch(error) {
            actualResult.code = testErrorCode;
            console.log(error);
        }
        expect(mailTool.setApiKey).toHaveBeenCalledTimes(1);
        expect(mailTool.sendMultiple).toHaveBeenCalledTimes(1);
        expect(actualResult.code).toBe(expectedSuccessCode);   
        expect(mailTool.sendMultiple).toBeCalledWith(expect.objectContaining({html: expect.stringContaining(expectedPrimaryEmailChangedText) }));
    
    });

    test("Should send email with password reset content when reset template is requested", async () => {
        process.env = { ...originalEnv, 
            SERVER_PATH: `${prodServer}`, 
            SENDGRID_API_KEY: 'some-key',
            PORT: 'some-port',
        };
        const sendEmail = require('./sendgrid');
        mockSendgridCalls();
        const mailTool = require("@sendgrid/mail");
        
        const expectedEmailParams = {
            from: 'from@dummyemail.com',
            replyTo: 'dummyReplyTo@dummyemail.com',
            subject: 'Dummy Subject',
            text: 'Dummy body',
            to: [ "to@dummyemail.com"],
            emailTemplate: "reset1",
            emailHeading: "",
            emailLink: "http://dummyDomain.gap",
            emailBody: "",
            data: ""
          };
        let expectedPasswordResetText = emailTemplate.reset1(expectedEmailParams.emailHeading,"",expectedEmailParams.emailLink, `<span></span>`);
        let actualResult;
        try{
            await sendEmail.sendMyMail(expectedEmailParams, async (resp) => { 
                actualResult = resp;
            });
        } catch(error) {
            actualResult.code = testErrorCode;
            console.log(error);
        }
        expect(mailTool.setApiKey).toHaveBeenCalledTimes(1);
        expect(mailTool.sendMultiple).toHaveBeenCalledTimes(1);
        expect(actualResult.code).toBe(expectedSuccessCode);   
        expect(mailTool.sendMultiple).toBeCalledWith(expect.objectContaining({html: expect.stringContaining(expectedPasswordResetText) }));
    
    });


    test("Should send email with account removal content when removeAccountConfirm template is requested", async () => {
        process.env = { ...originalEnv, 
            SERVER_PATH: `${prodServer}`, 
            SENDGRID_API_KEY: 'some-key',
            PORT: 'some-port',
        };
        const sendEmail = require('./sendgrid');
        mockSendgridCalls();
        const mailTool = require("@sendgrid/mail");
        
        const expectedEmailParams = {
            from: 'from@dummyemail.com',
            replyTo: 'dummyReplyTo@dummyemail.com',
            subject: 'Dummy Subject',
            text: 'Dummy body',
            to: [ "to@dummyemail.com"],
            emailTemplate: "removeAccountConfirm",
            emailHeading: "",
            emailLink: "http://dummyDomain.gap",
            emailBody: "",
            data: ""
          };
        let expectedRemoveAccountText = emailTemplate.removeAccountConfirm(expectedEmailParams.emailLink);
        let actualResult;
        try{
            await sendEmail.sendMyMail(expectedEmailParams, async (resp) => { 
                actualResult = resp;
            });
        } catch(error) {
            actualResult.code = testErrorCode;
            console.log(error);
        }
        expect(mailTool.setApiKey).toHaveBeenCalledTimes(1);
        expect(mailTool.sendMultiple).toHaveBeenCalledTimes(1);
        expect(actualResult.code).toBe(expectedSuccessCode);   
        expect(mailTool.sendMultiple).toBeCalledWith(expect.objectContaining({html: expect.stringContaining(expectedRemoveAccountText) }));
    
    });

    test("Should send email to dev email account when on test server", async () => {
        process.env = { ...originalEnv, 
            SERVER_PATH: `${testServer}`, 
            SENDGRID_API_KEY: 'some-key',
            PORT: 'some-port',
        };
        const sendEmail = require('./sendgrid');
        mockSendgridCalls();
        const mailTool = require("@sendgrid/mail");
        const expectedEmailParams = {
            from: 'dummyFrom@dummyemail.com',
            replyTo: 'dummyReplyTo@dummyemail.com',
            subject: 'Dummy Subject',
            text: 'Dummy body',
            to: [ "developer@radishapp.io"]
          };
        let actualResult;
        try{
            await sendEmail.sendMyMail(expectedEmailParams, async (resp) => { 
                actualResult = resp;
            });
        } catch(error) {
            console.log(error);
        }
        expect(actualResult.code).toBe(expectedSuccessCode);
        expect(mailTool.sendMultiple).toBeCalledWith(expect.objectContaining({to: expect.arrayContaining([ "developer@radishapp.io"]) }));
    });

    test("Should check for directory access when on local server", async () => {
        process.env = { ...originalEnv, 
            SERVER_PATH: `${localServer}`, 
            SENDGRID_API_KEY: 'some-key',
            PORT: '3001',
        };
        const sendEmail = require('./sendgrid');
        jest.mock("@sendgrid/mail", () => {
            return {
                setApiKey: jest.fn(),
                sendMultiple: jest.fn(),
            };
        });
        const writeEmailToFile = require('fs');
        jest.mock("fs", () => {
            return {
                writeFile: jest.fn(),
                access: jest.fn(),
                mkdir: jest.fn(),
            }
        });
        const mailTool = require("@sendgrid/mail");
        const emptyParams = {};
        let actualResult;
        try{
            await sendEmail.sendMyMail(emptyParams, async (resp) => { 
                actualResult = resp;
            });
        } catch(error) {
            console.log("In error ", error);
        }
        expect(writeEmailToFile.access).toHaveBeenCalledTimes(1);
        expect(mailTool.setApiKey).toHaveBeenCalledTimes(0);
        expect(mailTool.sendMultiple).toHaveBeenCalledTimes(0);
    });

    test("Should respond with error code when an error occurs with sending email", async () => {
        process.env = { ...originalEnv, 
            SERVER_PATH: `${prodServer}`, 
            SENDGRID_API_KEY: 'some-key',
            PORT: 'some-port',
        };
        const sendEmail = require('./sendgrid');
        jest.mock("@sendgrid/mail", () => {
            return {
                setApiKey: jest.fn().mockReturnValue('mocked-key'),
                sendMultiple: jest.fn( () => {return Promise.reject({code: 400}); }),
            };
        });
        const mailTool = require("@sendgrid/mail");
        const expectedEmailParams = {
            from: 'from@dummyemail.com',
            replyTo: 'dummyReplyTo@dummyemail.com',
            subject: 'Dummy Subject',
            text: 'Dummy body',
            to: [ "to@dummyemail.com"]
          };
        let actualResult;
        try{
            await sendEmail.sendMyMail(expectedEmailParams, async (resp) => { 
                actualResult = resp;
            });
        } catch(error) {
            actualResult.code = testErrorCode;
            console.log(error);
        }
        expect(mailTool.setApiKey).toHaveBeenCalledTimes(1);
        expect(mailTool.sendMultiple).toHaveBeenCalledTimes(1);
        expect(actualResult.code).toBe(expectedFailureCode);   
        expect(mailTool.sendMultiple).toBeCalledWith(expect.objectContaining({to: expect.arrayContaining([ "to@dummyemail.com"]) }));
    });


    test("Should respond with error code when an error occurs with sending email", async () => {
        process.env = { ...originalEnv, 
            SERVER_PATH: `${prodServer}`, 
            SENDGRID_API_KEY: 'some-key',
            PORT: 'some-port',
        };
        const sendEmail = require('./sendgrid');
        jest.mock("@sendgrid/mail", () => {
            return {
                setApiKey: jest.fn().mockImplementation(() => {
                    throw new Error('Dummy error message - It is good to show this message, it means the test is working well');
                  }),
                sendMultiple: jest.fn( () => {return Promise.resolve({code: 202}); }),
            };
        });
        const mailTool = require("@sendgrid/mail");
        const expectedEmailParams = {
            from: 'from@dummyemail.com',
            replyTo: 'dummyReplyTo@dummyemail.com',
            subject: 'Dummy Subject',
            text: 'Dummy body',
            to: [ "to@dummyemail.com"]
          };
        let actualResult;
        try{
            await sendEmail.sendMyMail(expectedEmailParams, async (resp) => { 
                actualResult = resp;
            });
        } catch(error) {
            actualResult.code = testErrorCode;
            console.log(error);
        }
        expect(mailTool.setApiKey).toHaveBeenCalledTimes(1);
        expect(mailTool.sendMultiple).toHaveBeenCalledTimes(0);
        expect(actualResult.code).toBe(expectedFailureCode);
    });

});