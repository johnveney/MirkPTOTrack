// server/index.js
const mongo = require("./mongodb.js");
const routes = require("./routes");
//global.crypto = require("crypto");
//global.auth = require("./api/auth");
const log = require("./api/logger").insertServerLogs;
//const scheduler = require('./scheduler/cronService');

const path = require("path");
const express = require("express");

const PORT = process.env.PORT || 3001;

const app = express();
// Parse JSON bodies (as sent by API clients)
app.use(express.json({ limit: "16mb", extended: true }));
app.use(express.urlencoded({ limit: "16mb", extended: true }));

mongo.connectMongo();

// Have Node serve the files for our built React app
app.use(express.static(path.resolve(__dirname, "../client/build")));

app.use('/', routes);

app.listen(PORT, () => {
  log({ level: "info", message: `Server started and listening on ${PORT}` });
 // scheduler.triggerScheduler();
});

