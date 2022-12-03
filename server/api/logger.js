const logger = require("../config/winston.js").logger;
const debugLogger = require("../config/winston.js").debugLogger;

async function insertServerLogs(logMetaData) {
    try {
        logMetaData.category = "server";
        writeLogsintoDB(logMetaData);
    } catch (err) {
        console.log(err.stack);
    }
}

async function writeLogsintoDB(logMetaData) {
    try {
        switch (logMetaData.level) {
            case "debug": debugLogger.debug(logMetaData); break;
            case "warn": logger.warn(logMetaData); break;
            case "error": logger.error(logMetaData); break;
            default: logger.info(logMetaData); break;
        }
    } catch (err) {
        console.log(err.stack);
    }
}

module.exports = {
    insertServerLogs,
    writeLogsintoDB
}