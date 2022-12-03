const log = require("./logger.js").insertServerLogs;

async function myFullBadgeList(params, auth) {
  try {
    const id = params.id;
    const collection = db.collection("badges");

    let mBadgeIds = params.badgeIds; // the values we're matching on

    const query = {
      $or: [{ level: "0" }, { badge_id: { $in: mBadgeIds } }],
    };

    const myDoc = await collection
      .find(query)
      .sort({ level: -1, badge_name: 1 })
      .toArray();
    return myDoc;
  } catch (err) {
    log({ level: "error", message: "Error occurred while fetching my badge list.", function: "myFullBadgeList", params: params, error_code: 500, error_stack: err.stack });
  }
}

async function getBadges(params, auth) {
  try {
    const collection = db.collection("badges");
    let myKey = params.myKey; // the field we're filtering on
    let myFilter = params.myFilter; // the values we're matching on
    let fetchFields = params.fetchFields; // the fields to return (project)
    let sortOrder = params.sortOrder;
    let query = null;
    let project = null;
    let sort = { level: -1, badge_name: 1 };
    if (myKey && myFilter) {
      query = {
        [myKey]: { $in: myFilter },
      };
    }
    if (fetchFields) {
      project = {};
      for (let i = 0; i < fetchFields.length; i++) {
        project = {
          ...project,
          [fetchFields[i]]: 1,
        };
      }
    }

    if (sortOrder) {
      sort = {};
      for (let i = 0; i < sortOrder.length; i++) {
        sort = {
          ...sort,
          [sortOrder[i]]: 1,
        };
      }
    }
    const myDoc = await collection
      .find(query ? query : null)
      .project(project)
      .sort(sort)
      .toArray();
    return myDoc;
  } catch (err) {
    log({ level: "error", message: "Error occurred while fetching badges.", function: "getBadges", params: params, error_code: 500, error_stack: err.stack });
  }
}

async function getBadge(id) {
  //note: No auth or parms passed in this get.   
  //Auth was checked at router.
  //only param used is "badgid" - passed directly.
  try {
    // Use the collection "badges"
    const collection = db.collection("badges");
    const myDoc = await collection.findOne({ badge_id: id });
    return myDoc;
  } catch (err) {
    log({ level: "error", message: `Error occurred while fetching badge, id: ${id}.`, function: "getBadge", error_code: 500, error_stack: err.stack });
  }
}
module.exports = {
  myFullBadgeList,
  getBadges,
  getBadge,
};
