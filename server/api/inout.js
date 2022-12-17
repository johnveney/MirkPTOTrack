const log = require("./logger.js").insertServerLogs;

async function getInOutBoard(params) {
  try {
    const query = {
      org_id: params.org_id,
      date_deleted: { $eq: null },
    };
    const collection = db.collection("perks");
    const myDoc = await collection
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
      ])
      .sort({ perk_name: 1 })
      .toArray();
    return myDoc;
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while fetching perks.",
      function: "getPerks",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    return null;
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
    const perkID = params.perk_id || crypto.randomBytes(16).toString("hex");
    const query = { perk_id: perkID };
    const collection = db.collection("perks");
    let fieldArray;
    if (params.date_deleted) {
      // DELETING PERK
      fieldArray = {
        date_deleted: date,
        deleted_by: authUser.data.person_id,
      };
    } else {
      fieldArray = {
        image_id: params.image_id,
        perk_name: params.perk_name,
        perk_description: params.perk_description,
        perk_internal_notes: params.perk_internal_notes,
        perk_keywords: params.perk_keywords,
        perk_template_id: params.perk_template_id,
        perk_budget: params.perk_budget,
        perk_balance: params.perk_balance,
        perk_expires: params.perk_expires,
        expiration_date: params.expiration_date, // only if one-time perk like a data-specific concert
        perk_ongoing: params.perk_ongoing, //true if repeats monthly, false if one-time perk like a date-specific concert.
        redeem_price: params.redeem_price,
        redeem_deadline: params.redeem_deadline,
        redeem_date: params.redeem_date, // only if one-time perk like a data-specific concert
        monitary_value: params.monitary_value,
        perk_enabled: params.perk_enabled,
        modified_by: authUser.data.person_id,
        date_modified: date,
        org_id: params.org_id,
      };
    }
    if (!params.perk_id) {
      fieldArray = {
        ...fieldArray,
        perk_id: perkID,
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
    const myDoc = await collection.findOne({ perk_id: perkID });
    return myDoc;
  } catch (error) {
    log({
      level: "error",
      message: "Error occurred while updating perk.",
      function: "upsertPerk",
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
  upsertInOutPerson,
};
