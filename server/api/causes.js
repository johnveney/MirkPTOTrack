const log = require("./logger.js").insertServerLogs;

async function getCauseTypes(params, auth) {
  try {
    // Use the collection "causetypes"
    const collection = db.collection("causetypes");
    const myDoc = await collection.find().sort({ type: 1 }).toArray();
    return {
      data: myDoc,
      message: "ok",
    };
  } catch (err) {
    log({ level: "error", message: "Error occurred while fetching cause types.", function: "getCauseTypes", error_code: 500, error_stack: err.stack });
  }
}

module.exports = {
  getCauseTypes,
};
