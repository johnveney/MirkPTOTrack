const { MongoClient } = require("mongodb");
const log = require("./api/logger").insertServerLogs;

/* **** REMEMBER TO FIX IN winston.js **** */

/* MIRKPTO */
const connectstring ="mongodb+srv://jveney:Mirk8069@cluster0.te39hd1.mongodb.net/MirkPTO?retryWrites=true&w=majority";

/* LOCAL DATABASE */
//const connectstring = "mongodb://127.0.0.1:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false";

// CONNECT TO THE SERVER USING A CONNECTION STRING FROM ABOVE
const url = process.env.MONGODB_URI || connectstring;

// Replace the following with your Atlas connection string...d
/* SERVER CONNECTION STRING(S) */
/* const url =
  process.env.MONGODB_URI || 
  "mongodb+srv://avaeth:Monkeyisland911!@cluster0.h9z4r.mongodb.net/radish1?retryWrites=true&w=majority"; */

/* LOCAL CONNECTION STRING */
/*  const url =
  process.env.MONGODB_URI || 
  "mongodb://127.0.0.1:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false"; */

const client = new MongoClient(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// The database to use on server

const dbName = "MirkData";
global.db = null;
async function connectMongo() {
  try {
    await client.connect();
    const date = new Date();
    log({ level: "info", message: `Connected correctly to server ${dbName} at ${date}` });
    // console.log("serverURL: "+url);
    db = client.db(dbName);
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while connecting to server.",
      function: "connectMongo",
      error_code: 500,
      error_stack: err.stack,
    });
  }
}
module.exports = {
  connectMongo,
};
