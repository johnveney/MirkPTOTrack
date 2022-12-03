const log = require("./logger.js").insertServerLogs;

async function getPlaceType(params) {
  try {
    const collection = db.collection("placetypes");

    const myDoc = await collection.findOne({
      placetype_id: params.placetype_id,
    });
    return myDoc;
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while fetching place type.",
      function: "getPlaceType",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    return null;
  }
}
async function getPlaceTypes(params) {
  try {
    const collection = db.collection("placetypes");
    let query = { date_deleted: { $eq: null } };
    if (params.placetype_enabled) {
      query = {
        ...query,
        placetype_enabled: true,
      };
    }
    const myDoc = collection
      .aggregate([
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
            placetype_id: 1,
            image_id: 1,
            image_date: "$image.date_modified",
            image_version: "$image.version",
            placetype_enabled: 1,
            placetype_name: 1,
            placetype_searchstring: 1,
          },
        },
      ])
      .sort({ placetype_name: 1 })
      .toArray();
    return myDoc;
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while fetching place types.",
      function: "getPlaceTypes",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    return null;
  }
}
async function upsertPlaceType(params, authUser) {
  try {
    const date = new Date();
    const placetypeID =
      params.placetype_id || crypto.randomBytes(16).toString("hex");
    const query = { placetype_id: placetypeID };
    const collection = db.collection("placetypes");
    let fieldArray;
    if (params.date_deleted) {
      // DELETING placetype
      fieldArray = {
        date_deleted: date,
        deleted_by: authUser.data.person_id,
      };
    } else {
      fieldArray = {
        image_id: params.image_id,
        placetype_name: params.placetype_name,
        placetype_searchstring: params.placetype_searchstring,
        placetype_enabled: params.placetype_enabled,
        modified_by: authUser.data.person_id,
        date_modified: date,
      };
    }
    if (!params.placetype_id) {
      fieldArray = {
        ...fieldArray,
        placetype_id: placetypeID,
        created_by: authUser.data.person_id,
        date_created: date,
      };
    }
    const setArray = { $set: fieldArray };
    const options = {
      upsert: true,
      // runValidators: true,
    };
    await collection.updateOne(query, setArray, options);
    const myDoc = await collection.findOne({ placetype_id: placetypeID });
    return myDoc;
  } catch (error) {
    log({
      level: "error",
      message: "Error occurred while updating place type.",
      function: "upsertPlaceType",
      params: params,
      error_code: 500,
      error_stack: error.stack,
    });
    return null;
  }
}

module.exports = {
  getPlaceType,
  upsertPlaceType,
  getPlaceTypes,
};
