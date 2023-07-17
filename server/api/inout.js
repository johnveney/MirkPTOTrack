const log = require("./logger.js").insertServerLogs;

async function getInOutBoard(params) {
  const date = new Date();
  log({ level: "info", message: `getInOutBoard at ${date}` });

  try {
    const collection = db.collection("INOUT");
    let matchArray = {
      date_deleted: { $eq: null },
      Location: "CORPORATE",
    };
    let projectArray = {
      UserId: 1,
      LastName: 1,
      FirstName: 1,
      Cell: 1,
      Email: 1,
      Status: 1,
      Location: 1,
      LocationSort: 1,
      Notes: 1,
      Reverse: 1,
    };
    let sortArray = {
      LocationSort: 1,
      LastName: 1,
    };
    const corp = await collection
      .find(matchArray)
      .project(projectArray)
      .sort(sortArray)
      .toArray();

    //RESET FOR ORRVILLE LOCATION
    matchArray = {
      date_deleted: { $eq: null },
      Location: "ORRVILLE OHIO",
    };

    const orrville = await collection
      .find(matchArray)
      .project(projectArray)
      .sort(sortArray)
      .toArray();

    //RESET FOR BARTOW LOCATION
    matchArray = {
      date_deleted: { $eq: null },
      Location: "BARTOW FLORIDA",
    };

    const florida = await collection
      .find(matchArray)
      .project(projectArray)
      .sort(sortArray)
      .toArray();

    //RESET FOR WAUKEGAN LOCATION
    matchArray = {
      date_deleted: { $eq: null },
      Location: "WAUKEGAN ILLINOIS",
    };

    const illinois = await collection
      .find(matchArray)
      .project(projectArray)
      .sort(sortArray)
      .toArray();

    return {
      data: corp,
      aCorp: corp,
      aOrrville: orrville,
      aFlorida: florida,
      aIllinois: illinois,
    };
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while fetching inoutboard.",
      function: "getInOutBoard",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    return null;
  }
}

async function getPersonStatus(params) {
  //retreives selected information for a user
  const date = new Date();
  log({ level: "info", message: `getPersonStatus at ${date}` });
  /* console.log(params.UserId) */
  try {
    const collection = db.collection("INOUT");
    const myDoc = await collection.findOne({ UserId: params.UserId });
    /* console.log(JSON.stringify(myDoc));  */
    return {
      data: myDoc,
      message: "ok",
    };
  } catch (err) {
    log({
      level: "error",
      message: `Error while fetching status details, UserId: ${params.UserId}.`,
      function: "getUser",
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function getInOutPerson(params) {
  try {
    const query = {
      perk_id: params.perk_id,
    };
    const collection = db.collection("perks");
    const myDoc = await collection
      .aggregate(
        [
          {
            $match: query,
          },
          {
            $lookup: {
              from: "images",
              localField: "image_id",
              foreignField: "image_id",
              as: "image",
            },
          },
          {
            $project: {
              perk_id: 1,
              expiration_date: 1,
              image_id: 1,
              image_date: "$image.date_modified",
              image_version: "$image.version",
              monitary_value: 1,
              org_id: 1,
              perk_balance: 1,
              perk_budget: 1,
              perk_description: 1,
              perk_enabled: 1,
              perk_expires: 1,
              perk_internal_notes: 1,
              perk_keywords: 1,
              perk_name: 1,
              perk_ongoing: 1,
              perk_template_id: 1,
              redeem_date: 1,
              redeem_deadline: 1,
              redeem_price: 1,
            },
          },
        ],
        {
          allowDiskUse: false,
        }
      )
      .toArray();
    return myDoc[0];
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while fetching perk.",
      function: "getPerk",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    return null;
  }
}

async function upsertInOutPerson(params, authUser) {
  try {
    const date = new Date();
       const query = { UserId: params.uid };
    const collection = db.collection("INOUT");
    let fieldArray;
    
      fieldArray = {
        Notes: params.notes_value,
        Status: params.status_value,
       // LastUpdateBy: uid,
        LastUpdate: date,
      };
    const setArray = { $set: fieldArray };
    const options = {
      upsert: true,
      // runValidators: true,
    };
    await collection.updateOne(query, setArray, options);  
    const myDoc = await collection.findOne({ UserId: params.uid });
    return myDoc;
  } catch (error) {
    log({
      level: "error",
      message: "Error occurred while updating user status.",
      function: "upsertInOutPerson",
      params: params,
      error_code: 500,
      error_stack: error.stack,
    });
    return null;
  }
}

module.exports = {
  getInOutBoard,
  getInOutPerson,
  getPersonStatus,
  upsertInOutPerson,
};
