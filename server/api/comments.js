const crypto = require("crypto");
const log = require("./logger.js").insertServerLogs;

async function getComments(params, authUser) {
  try {
    const personId = authUser.data.person_id;
    //TODO: Test if user is authorized against this module and module id
    const moduleName = params.module_name;
    const moduleId = params.module_id;
    const query = {
      module_id: moduleId,
      module_name: moduleName,
      date_deleted: null,
    };

    const collection = db.collection("comments");
    const results = await collection
      .aggregate([
        {
          $match: query,
        },
        {
          $lookup: {
            from: "people",
            localField: "created_by",
            foreignField: "person_id",
            as: "person",
          },
        },
        {
          $lookup: {
            from: "events",
            localField: "module_id",
            foreignField: "event_id",
            as: "event",
          },
        },
        {
          $lookup: {
            from: "groups",
            localField: "module_id",
            foreignField: "group_id",
            as: "group",
          },
        },
        {
          $project: {
            comment_id: 1,
            comment: 1,
            created_by: 1,
            date_modified: 1,
            module_name: 1,
            first_name: "$person.first_name",
            last_name: "$person.last_name",
            image: { $ifNull: ["$person.thumbnail", "$person.image"] },
            module_created_by: {
              $ifNull: ["$event.created_by", "$group.created_by"],
            },
          },
        },
        {
          $sort: {
            date_modified: -1,
          },
        },
      ])
      .toArray();

    return {
      data: results,
      code: 200,
      message: "ok",
    };
  } catch (err) {
    log({
      level: "error",
      message: `Error occurred while getting comments`,
      function: "getComments",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    return {
      data: null,
      code: 500,
      message: "Error occurred while getting comments",
    };
  }
}

async function upsertComment(params, authUser) {
  try {
    const personId = authUser.data.person_id;
    //TODO: Test if user is authorized against this module and module id
    const moduleName = params.module_name;
    const moduleId = params.module_id;
    const comment = params.comment;
    const commentId =
      params.comment_id || crypto.randomBytes(16).toString("hex");
    const deleteOnly = params.deleteOnly || false;
    const collection = db.collection("comments");
    const options = { upsert: true };
    const query = {
      comment_id: commentId,
    };
    let setArray = {};
    if (deleteOnly) {
      setArray = {
        date_deleted: new Date(),
        deleted_by: personId,
      };
    } else {
      setArray = {
        module_name: moduleName,
        module_id: moduleId,
        comment: comment,
        date_modified: new Date(),
        modified_by: personId,
      };
      if (!params.comment_id) {
        setArray = {
          ...setArray,
          comment_id: commentId,
          created_by: personId,
          date_created: new Date(),
        };
      }
    }
    setArray = { $set: setArray };
    const result = await collection.updateOne(query, setArray, options);
    return {
      data: result,
      code: 200,
      message: "ok",
    };
  } catch (err) {
    log({
      level: "error",
      message: `Error occurred while upserting comment`,
      function: "upsertComment",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    return {
      data: null,
      code: 500,
      message: "Error occurred while upserting comment",
    };
  }
}
module.exports = {
  getComments,
  upsertComment,
};
