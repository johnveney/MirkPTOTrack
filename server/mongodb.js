const { MongoClient } = require("mongodb");
const log = require("./api/logger").insertServerLogs;

/* RADISH PRODUCTION  (RadishProd) */
// const connectstring = "mongodb+srv://radish:Monkeyisland@cluster0.hdnlb.mongodb.net/radish1?retryWrites=true&w=majority";
//// compass admin login: mongodb+srv://admin:monkeyisland@cluster0.hdnlb.mongodb.net
/* MAINTENANCE: */  //const connectstring = "mongodb+srv://admin:monkeyisland@cluster0.hdnlb.mongodb.net/radish1?retryWrites=true&w=majority";

/* PREPRODUCTION */
//const connectstring = "mongodb+srv://radish:Monkeyisland@cluster0.zbmwc.mongodb.net/radish1?retryWrites=true&w=majority";

/* STAGING*/
//const connectstring = "mongodb+srv://radish:Monkeyisland@cluster0.tlyyf.mongodb.net/radish1?retryWrites=true&w=majority";

/* DEMO  | RADISH DEMO */
//const connectstring = "mongodb+srv://admin:monkeyisland@radish.xg5ze.mongodb.net/radish1?retryWrites=true&w=majority";
//// compass admin login: mongodb+srv://admin:monkeyisland@radish.xg5ze.mongodb.net/radish1?retryWrites=true&w=majority";
////  SERVER: const connectstring = "mongodb+srv://radish_app:Monkeyisland@radish.xg5ze.mongodb.net/radish1?retryWrites=true&w=majority";

/* e2Systems Cluster [Google, Iowa] */
//const connectstring = "mongodb+srv://radish:Monkeyisland@cluster0.5a2pz.mongodb.net/radish1?retryWrites=true&w=majority";

/* UAT Server */
//const connectstring = "mongodb+srv://radish:Monkeyisland@cluster0.sup90.mongodb.net/radish1?retryWrites=true&w=majority";  // CORRECT
//const connectstring = "mongodb+srv://radish:Monkeyisland@cluster0.llcuv.mongodb.net/radish1?retryWrites=true&w=majority";  // OLD

/* LOCAL DATABASE */
const connectstring = "mongodb://127.0.0.1:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false";

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

const dbName = "radish1";
global.db = null;
async function connectMongo() {
  try {
    await client.connect();
    const date = new Date();
    log({ level: "info", message: `Connected correctly to server ${date}` });
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
