const winston = require('winston'); 
require('winston-mongodb');

/* LOCAL DATABASE */
//const connectstring = "mongodb://127.0.0.1:27017/MirkData?readPreference=primary&appname=MongoDB%20Compass&ssl=false";

const connectstring ="mongodb+srv://jveney:Mirk8069@cluster0.te39hd1.mongodb.net/MirkPTO?retryWrites=true&w=majority";

// CONNECT TO THE SERVER USING A CONNECTION STRING FROM ABOVE
const DB_URL = (process.env.MONGODB_URI || connectstring);

const timezoned = () => {
    return new Date().toLocaleString('en-US', {
        timeZone: 'UTC'
    });
}


const LogConfig = {
    transports: [
        new winston.transports.Console({
            format :   winston.format.combine(
                winston.format.timestamp({
                    format : timezoned
                }),
                winston.format.metadata({fillExcept: ['message', 'level', 'timestamp']}),
                winston.format.json(),
                winston.format.prettyPrint(),
            ), 
        }),
        new winston.transports.MongoDB({
            //mongo database connection link
            db : DB_URL,
            // A collection to save json formatted logs
            collection: 'applogs',
            expireAfterSeconds: 2592000, // 2592000 seconds = 30 days 
            options: {
                useUnifiedTopology: true
            },
            format :   winston.format.combine(
                winston.format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss.SSS'
                }),
                winston.format.metadata({fillExcept: ['message', 'level', 'timestamp']}),
                winston.format.json(),
                winston.format.prettyPrint(),
            ), 
        }),
    ]
};

const debugLogConfig = {
    transports: [
        new winston.transports.Console({
            level: 'debug',
            format :   winston.format.combine(
                winston.format.timestamp({
                    format : timezoned
                }),
                winston.format.metadata({fillExcept: ['message', 'level', 'timestamp']}),
                winston.format.json(),
                winston.format.prettyPrint(),
            ), 
        }),
        new winston.transports.MongoDB({
            level: 'debug',
            //mongo database connection link
            db : DB_URL,
            // A collection to save json formatted logs
            collection: 'applogs',
            expireAfterSeconds: 2592000, // 2592000 seconds = 30 days 
            options: {
                useUnifiedTopology: true
            },
            format :   winston.format.combine(
                winston.format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss.SSS'
                }),
                winston.format.metadata({fillExcept: ['message', 'level', 'timestamp']}),
                winston.format.json(),
                winston.format.prettyPrint(),
            ), 
        }),
    ]
};

const logger = winston.createLogger(LogConfig);
const debugLogger = winston.createLogger(debugLogConfig);

module.exports = {
    logger,
    debugLogger,
}
