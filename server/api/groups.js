const crypto = require("crypto");
const tools = require("../utilities/tools.js");
const moment = require("moment-timezone");
const log = require("./logger.js").insertServerLogs;

async function validateGroupAdmin(groupID, authUser) {
  try {
    let authorized = false;
    let groups = authUser.data.groups || [];
    for (let i = 0; i < groups.length; i++) {
      if (groups[i].group_id === groupID && groups[i].role === "admin") {
        authorized = true;
      }
    }
    return authorized;
  } catch (error) {
    log({
      level: "error",
      message: `Error while validating group admin, groupID: ${groupID}.`,
      function: "validateGroupAdmin",
      error_code: 500,
      error_stack: error.stack,
    });
    return false;
  }
}

async function updateGroup(params, auth) {
  try {
    const newId = crypto.randomBytes(16).toString("hex");
    const groupID = params.group_id || newId;
    let authorized = await validateGroupAdmin(groupID, auth);
    let imageID = params.image_id;
    if (!params.group_id || authorized) {
      const date = new Date();

      const query = { group_id: groupID };
      let fieldArray = {
        group_id: groupID,
        everyone_add_friends: params.everyone_add_friends === true,
        modified_by: auth.data.person_id,
        date_modified: date,
      };

      fieldArray = !params.group_id
        ? { ...fieldArray, date_created: date, created_by: auth.data.person_id }
        : fieldArray;

      fieldArray = params.group_name
        ? { ...fieldArray, group_name: params.group_name }
        : fieldArray;
      fieldArray = params.location
        ? { ...fieldArray, location: params.location }
        : fieldArray;

      fieldArray =
        params.virtual && params.virtual !== "no"
          ? { ...fieldArray, virtual: params.virtual }
          : fieldArray;

      fieldArray = params.group_description
        ? { ...fieldArray, group_description: params.group_description }
        : fieldArray;
      fieldArray = params.everyone_add_events
        ? {
          ...fieldArray,
          everyone_add_events: params.everyone_add_events === "true",
        }
        : fieldArray;
      fieldArray = params.can_join
        ? { ...fieldArray, can_join: params.can_join }
        : fieldArray;
      fieldArray = params.discoverability
        ? { ...fieldArray, discoverability: params.discoverability }
        : fieldArray;

      if (!imageID && !params.org_id && params.group_name) {
        imageID = await tools.getSuggestedImage(params.group_name);
      }

      fieldArray = imageID ? { ...fieldArray, image_id: imageID } : fieldArray;

      let unSetArray = null;
      if (params.org_id) {
        fieldArray = {
          ...fieldArray,
          org_id: params.org_id,
        };
      } else {
        unSetArray = {
          org_id: "",
        };
      }
      if (params.virtual && params.virtual === "no") {
        unSetArray = {
          ...unSetArray,
          virtual: "",
        };
      }
      if (unSetArray) {
        unSetArray = {
          $unset: unSetArray,
        };
      }

      const setArray = { $set: fieldArray };

      const options = {
        upsert: true,
        runValidators: true,
      };
      const collection = db.collection("groups");

      await collection.updateOne(query, setArray, options);
      if (params.group_id && unSetArray) {
        await collection.updateOne(query, unSetArray, options);
      }

      if (!params.group_id) {
        // prepare to add group members
        const groupParams = {
          group_id: groupID,
          person_ids: [auth.data.person_id], // the person being added to the group
          role: "admin",
        };
        await addGroupMembers(groupParams, auth, true);
      }

      const myDoc = await getGroup({ group_id: groupID, newGroup: true }, auth); //collection.findOne({ group_id: groupID });

      return {
        data: myDoc.data,
        message: "ok",
        code: 200,
      };
    } else {
      return {
        message: "Unauthorized",
        code: 500,
      };
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error while updating group.",
      function: "updateGroup",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    return {
      data: null,
      message: "Error while updating group.",
      code: 500,
    };
  }
}

async function insertGroup(params, authUser) {
  const cid = crypto.randomBytes(16).toString("hex");
  try {
    const groupID = params.group_id || cid;
    const date = new Date();
    let imageID = params.image_id;
    const query = { group_id: groupID };
    let fieldArray = {
      group_id: groupID,
      group_name:
        params.group_name ||
        `${authUser.data.first_name}_${authUser.data.last_name}_default`,
      group_description: params.group_description,
      created_by: authUser.data.person_id,
      date_created: date,
      modified_by: authUser.data.person_id,
      date_modified: date,
      everyone_add_friends: params.everyone_add_friends === true,
      everyone_add_events: params.everyone_add_events === true,
      can_join: params.can_join || "invited",
      discoverability: params.discoverability || "none",
    };

    if (params.user_default) {
      fieldArray = {
        ...fieldArray,
        user_default: true,
      };
    }

    if (params.org_id) {
      fieldArray = {
        ...fieldArray,
        org_id: params.org_id,
      };
    }

    if (!imageID && params.group_name) {
      imageID = await tools.getSuggestedImage(params.group_name);
    }

    if (imageID) {
      fieldArray = {
        ...fieldArray,
        image_id: imageID,
      };
    }

    const setArray = { $set: fieldArray };
    const options = {
      upsert: true,
      runValidators: true,
    };
    const collection = db.collection("groups");

    await collection.updateOne(query, setArray, options);

    // prepare to add group members
    const groupParams = {
      group_id: groupID,
      person_ids: params.personIds || [authUser.data.person_id], // the person being added to the group
      role: "admin",
      default_group: params.default_group,
    };

    return await addGroupMembers(groupParams, authUser, true);

    //const myDoc = await collection.findOne({ group_id: groupID });
    //console.log(res);
    //res.json(myDoc);
  } catch (err) {
    log({
      level: "error",
      message: "Error while inserting group.",
      function: "insertGroup",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function deleteGroup(params, auth) {
  try {
    const groupID = params.group_id;
    let authorized = await validateGroupAdmin(groupID, auth);
    if (authorized) {
      const date = new Date();
      const query = { group_id: groupID };
      let fieldArray = {
        //group_id: groupID,
        deleted_by: auth.data.person_id,
        date_deleted: date,
      };

      const setArray = { $set: fieldArray };
      const options = {
        upsert: true,
        runValidators: true,
      };

      const collection = db.collection("groups");
      await collection.updateOne(query, setArray, options);

      const myDoc = await collection.findOne({ group_id: groupID });

      return myDoc;
    } else {
      return null;
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error while deleting group.",
      function: "deleteGroup",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function addGroupMembers(params, authUser, isNewGroup) {
  //NOTE: THIS FUNCTION RUNS MULTIPLE TIMES ON INVITE ACCEPT OF GROUPS
  //          BECAUSE WE ALSO ADD TO BOTH PARTIES DEFAULT GROUPS.
  try {
    const groupID = params.group_id;
    let authorized = false;
    authorized = await validateGroupAdmin(groupID, authUser);

    if (!authorized && isNewGroup) {
      //because is new group, isAdmin has to be reset to TRUE
      authorized = true;
    }

    if (authorized) {
      const date = new Date();
      const currentUserID = authUser.data.person_id;
      const personIds = params.person_ids;
      const action = params.action;
      const collection = db.collection("people");

      //DEAL WITH ALLOWING USER TO REJOIN THE GROUP IF THEY HAVE LEFT PREVIOUSLY
      // UPDATE DATE DELETED ON ANY MEMBERS WHO WERE PREVIOUSLY MEMBERS
      let unPushArray = {
        "groups.$.date_deleted": "",
        "groups.$.deleted_by": "",
      };
      let unSetArray = { $unset: unPushArray };
      let query = { person_id: { $in: personIds }, "groups.group_id": groupID };
      await collection.updateMany(query, unSetArray);

      //DEAL WITH REMOVING UNCHECKED EXISTING USERS (called only during edit group)
      if (action !== undefined && action === "edit") {
        query = { "groups.group_id": groupID };
        const allPersonsInGroup = await collection
          .find(query)
          .project({
            person_id: "$person_id",
            "groups.$": 1,
          })
          .toArray();
        let personsToBeRemoved = [];
        for (let i = 0; i < allPersonsInGroup.length; i++) {
          var matched = false;
          if (
            allPersonsInGroup[i].groups[0].date_deleted === undefined &&
            allPersonsInGroup[i].groups[0].deleted_by === undefined
          ) {
            for (let j = 0; j < personIds.length; j++) {
              if (allPersonsInGroup[i].person_id === personIds[j]) {
                matched = true;
              }
            }
            if (!matched && allPersonsInGroup[i].person_id !== currentUserID) {
              personsToBeRemoved.push(allPersonsInGroup[i].person_id);
            }
          }
        }
        if (personsToBeRemoved.length > 0) {
          query = {
            person_id: { $in: personsToBeRemoved },
            "groups.group_id": groupID,
          };
          deletedDetails = {
            groups: {
              date_deleted: date,
              deleted_by: currentUserID,
            },
          };
          let setArray = {};
          setArray = {
            $set: {
              "groups.$[element].date_deleted": date,
              "groups.$[element].deleted_by": currentUserID,
            },
          };
          let arrayFilter = {};
          arrayFilter = {
            arrayFilters: [
              {
                "element.group_id": groupID,
                "element.date_deleted": null,
              },
            ],
          };
          await collection.updateMany(query, setArray, arrayFilter);
        }
      }
      //DEAL WITH ADDING USERS NOT ALREADY IN THE GROUP.
      let pushArray = {
        groups: {
          group_id: groupID,
          date_added: date,
          added_by: currentUserID,
        },
      };
      if (params.role) {
        pushArray.groups = {
          ...pushArray.groups,
          role: params.role,
        };
      }
      if (params.default_group) {
        pushArray.groups = {
          ...pushArray.groups,
          default_group: params.default_group,
        };
      }

      //UPDATE ANY IN THE COLLECTION WHERE THE USER DOES NOT ALREADY HAVE THAT GROUP.
      await collection.updateMany(
        {
          person_id: { $in: personIds },
          "groups.group_id": { $ne: groupID },
        },
        {
          $push: pushArray,
        }
      );

      return groupID;
    } else {
      return null;
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error while adding group members.",
      function: "addGroupMembers",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function updateGroupMember(params, auth) {
  try {
    const groupID = params.group_id;
    let authorized = await validateGroupAdmin(groupID, auth);
    if (authorized) {
      const date = new Date();
      const personID = params.person_id;
      const role = params.role;
      const collection = db.collection("people");
      log({
        level: "debug",
        message: `role: ${role}`,
        function: "updateGroupMember",
      });
      const filterArray = {
        person_id: personID,
        "groups.group_id": groupID,
      };

      let setArray = {};
      let unsetArray = null;
      if (role === "remove from group") {
        setArray = {
          $set: {
            "groups.$.date_deleted": date,
            "groups.$.deleted_by": auth.data.person_id,
          },
        };
      } else {
        setArray = {
          $set: {
            "groups.$.role": role,
          },
        };

        //IF DELETED MEMBER, THEN GAVE A ROLE w/o refresh of form, need to remove these fields.
        unsetArray = {
          $unset: {
            "groups.$.date_deleted": null,
            "groups.$.deleted_by": null,
          },
        };
      }

      const options = {
        runValidators: true,
      };

      if (unsetArray) {
        await collection.updateMany(filterArray, unsetArray, options);
      }
      await collection.updateMany(filterArray, setArray, options);

      return groupID;
    } else {
      return null;
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error while updating group member.",
      function: "updateGroupMember",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      data: null,
      message: "Snap! Error removing member.",
    });
  }
}

//NOTE: "Leave Group" uses this function, passed by the user
async function leaveGroup(params, auth) {
  try {
    const groupID = params.group_id;
    const date = new Date();
    const personID = params.person_id;
    const collection = db.collection("people");

    const filterArray = {
      person_id: personID,
      "groups.group_id": groupID,
    };

    const setArray = {
      $set: {
        "groups.$.date_deleted": date,
        "groups.$.deleted_by": auth.data.person_id,
        date_modified: date,
        modified_by: personID,
      },
    };

    const options = {
      runValidators: true,
    };

    await collection.updateMany(filterArray, setArray, options);
    return groupID;
  } catch (err) {
    log({
      level: "error",
      message: "Error while leaving group.",
      function: "leaveGroup",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      data: null,
      message: "Snap! Error removing member.",
    });
  }
}

async function getMyGroups(params, authUser) {
  //USED TO RETURN GROUPS FOR USER AND CONNECTED MEMBERS
  try {
    let myGroups = [];
    let groups2 = [];
    const orgId = params.org_id;

    //AT THIS POINT THE GROUPS LIST MAY INCLUDE GROUPS YOU HAVE LEFT
    //SO WE NEED TO FILTER THEM OUT
    const cleanUser = await cleanPersonGroups(authUser.data, false, orgId);
    /* console.log('cleanUser')
    console.log(cleanUser) */
    for (let i = 0; i < cleanUser.groups.length; i++) {
      myGroups = [...myGroups, cleanUser.groups[i].group_id];
      let agroup_owner = null;
      //BUILD ARRAY OF GROUPS TO RETURN TO FRONT END

      if (cleanUser.person_id === cleanUser.groups[i].group_owner) {
        agroup_owner = "owner";
      }
      groups2 = [
        ...groups2,
        {
          group_id: cleanUser.groups[i].group_id,
          group_name: cleanUser.groups[i].group_name,
          image_id: cleanUser.groups[i].image_id,
          image_date: cleanUser.groups[i].image_date,
          image_version: cleanUser.groups[i].image_version,
          org_id: cleanUser.groups[i].org_id,
          org_name: cleanUser.groups[i].org_name,
          owner_id: cleanUser.groups[i].owner_id,
          owner_first: cleanUser.groups[i].owner_first,
          owner_last: cleanUser.groups[i].owner_last,
          group_owner: agroup_owner,
          membersCount: "0", //project as a placeholder for further down.
          group_members: [], //project as a placeholder for further down.
          isAdmin: cleanUser.groups[i].isAdmin || false,
        },
      ];
    }

    //THIS GOES TO PEOPLE AND GETS ALL THE PEOPLE IN YOUR MATCHING GROUPS
    //IT WILL FILTER OUT DELETED GROUPS, DELETED GROUP MEMBERS & USER's DEFAULT GROUPS
    const peopleCollection = db.collection("people");
    const myPeople = await peopleCollection
      .aggregate([
        {
          $match: {
            date_deleted: null, //exclude people who are deleted
          },
        },
        {
          $unwind: {
            path: "$groups", //unwind groups on people, so each group can be processed.
          },
        },
        {
          $match: {
            $and: [
              {
                "groups.group_id": {
                  $in: myGroups,
                },
              },
              { date_deleted: null },
              { "groups.date_deleted": null },
              { "groups.default_group": null },
              { person_id: { $ne: cleanUser.person_id } },
            ],
          },
        },
        {
          $project: {
            person_id: "$person_id",
            first_name: "$first_name",
            display_name: "$display_name",
            image: { $ifNull: ["$thumbnail", "$image"] },
            thumbnail: "$thumbnail",
            group_id: "$groups.group_id",
            last_active: "$last_active",
          },
        },
        {
          $sort: {
            last_active: -1.0, //Changed from first_name, last_name which won't work w/o projecting last name.
            first_name: 1.0,
          },
        },
      ])
      .toArray();

    //THIS SECTION LOOPS THROUGH THE GROUPS AND APPLIES THE MEMBERS
    //THEN RETURNS THE DATA TO THE FRONT END
    let limit = 0;

    for (let i = 0; i < groups2.length; i++) {
      limit = 0; // we are going to limit 6 members per group returned
      let membersCount = 0;

      for (let ip = 0; ip < myPeople.length; ip++) {
        // THIS LOOP APPENDS 6 FRIENDS TO EACH LIST.
        if (
          myPeople[ip].group_id &&
          myPeople[ip].group_id.indexOf(groups2[i].group_id) > -1 &&
          limit <= 5
          /*needed because we get 1 person row for each group now*/
        ) {
          limit = limit + 1;
          groups2[i].group_members = [
            ...groups2[i].group_members,
            {
              person_id: myPeople[ip].person_id,
              first_name: myPeople[ip].first_name,
              display_name: myPeople[ip].display_name,
              image: myPeople[ip].image,
            },
          ];
        }
        //THIS LOOP GETS THE COUNT OF MEMBERS FROM myPeople for each group.
        //CAN'T USE THE GROUPS DATA FOR THIS, STILL INCLUDES THOSE WHO HAVE LEFT THE GROUP
        if (
          myPeople[ip].group_id &&
          myPeople[ip].group_id.indexOf(groups2[i].group_id) > -1
        ) {
          membersCount += 1;
        }
      }
      groups2[i].membersCount = membersCount + 1; //assign members count to row and add 1 for "yourself";
    }

    //TAKE THE USERS DEFAULT GROUP OUT OF RESULT SET.  It is included above to get the users for the friends page, but can't be in the result set.  "All Users" handles that.
    for (let i = 0; i < groups2.length; i++) {
      if (groups2[i].group_name === undefined) {
        groups2.splice(i, 1);
        i -= 1;
      }
    }

    return {
      groups: groups2,
      message: "ok",
      code: 200,
    };
  } catch (err) {
    log({
      level: "error",
      message: "Error while fetching my groups.",
      function: "getMyGroups",
      params: authUser.data,
      error_code: 500,
      error_stack: err.stack,
    });
    return {
      code: 500,
      message: "Oops. Something went wrong fetching groups.",
    };
  }
}

async function cleanPersonGroups(person, keepDefaultGroups = false, orgId) {
  try {
    let myGroups = [];
    let myDefaultGroup = {};

    for (let i = 0; i < person.groups.length; i++) {
      //MAKE SURE USER IS STILL A MEMBER OF THIS GROUP (person.groups)
      if (!person.groups[i].date_deleted) {
        myGroups.push(person.groups[i].group_id);
      }

      //ADD PERSON'S DEFAULT GROUP BACK IN TO LIST
      // 1.22.2022 THIS IS ABSOLUTELY REQUIRED FOR ALL FRIENDS in app
      if (person.groups[i].default_group) {
        //myGroups.push(person.groups[i].group_id); //1.22.2022 commented out.
        myDefaultGroup = {
          group_id: person.groups[i].group_id,
          default: true,
        };
      }
    }
    let fullGroups = await getGroups(myGroups, keepDefaultGroups, orgId);
    fullGroups.push(myDefaultGroup);

    // ENHANCE FULLGROUPS WITH ISADMIN FOR THE CURRENT USER
    for (let i = 0; i < fullGroups.length; i++) {
      for (let x = 0; x < person.groups.length; x++) {
        if (
          fullGroups[i].group_id === person.groups[x].group_id &&
          person.groups[x].role === "admin"
        ) {
          fullGroups[i].isAdmin = true;
        }
      }
    }
    person.groups = fullGroups;

    return person;
  } catch (err) {
    log({
      level: "error",
      message: "Error while cleaning person groups.",
      function: "cleanPersonGroups",
      params: person,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function getGroupsExpanded(groupIds) {
  // backend helper function. do not expose to routes.
  try {
    const query = {
      $and: [
        { group_id: { $in: groupIds } },
        { user_default: null },
        { date_deleted: null },
      ],
    };

    const collection = db.collection("groups");
    let myGroups;

    myGroups = await collection
      .aggregate([
        {
          $match: query,
        },
        {
          $lookup: {
            from: "people",
            localField: "created_by",
            foreignField: "person_id",
            as: "owner",
          },
        },
        {
          $unwind: {
            path: "$owner",
          },
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
            group_id: 1,
            group_name: 1,
            group_description: 1,
            can_join: 1,
            org_id: 1,
            group_owner: "$created_by",
            //image: "$image",
            image_id: 1,
            image_date: "$image.date_modified",
            image_version: "$image.version",
            owner: {
              owner_first: `$owner.first_name`,
              owner_last: `$owner.last_name`,
              owner_image: { $ifNull: ["$owner.thumbnail", "$owner.image"] },
            },
          },
        },
      ])
      .sort({ group_name: 1 })
      .toArray();

    return myGroups;
  } catch (err) {
    log({
      level: "error",
      message: "Error while fetching groups.",
      function: "getGroups",
      params: groupIds,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function getGroups(groupIds, keepDefaultGroups = false, orgId) {
  try {

    let query = {
      $and: [
        { group_id: { $in: groupIds } },
        { user_default: null }, // eliminate default groups
        { date_deleted: null },
      ],
    };
    if (orgId) {
      query = {
        $and: [
          { group_id: { $in: groupIds } },
          { user_default: null }, // eliminate default groups
          { date_deleted: null },
          { org_id: orgId },
        ],
      };
    }
    if (keepDefaultGroups) {
      query = {
        $and: [{ group_id: { $in: groupIds } }, { date_deleted: null }],
      };
    }

    const collection = db.collection("groups");
    let myGroups;

    myGroups = await collection
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
          $lookup: {
            from: "organizations",
            localField: "org_id",
            foreignField: "org_id",
            as: "organization",
          },
        },
        {
          $lookup: {
            from: "people",
            localField: "created_by",
            foreignField: "person_id",
            as: "owner",
          },
        },
        {
          $unwind: {
            path: "$owner",
          },
        },
        {
          $project: {
            group_id: 1,
            group_name: 1,
            group_description: 1,
            can_join: 1,
            org_id: 1,
            group_owner: "$created_by",
            image_id: 1,
            image_date: "$image.date_modified",
            image_version: "$image.version",
            //image: "$image.image",
            org_name: "$organization.name",
            owner_id: "$owner.person_id",
            owner_first: "$owner.first_name",
            owner_last: "$owner.last_name",
          },
        },
      ])
      .sort({ group_name: 1 })
      .toArray();

    return myGroups;
  } catch (err) {
    log({
      level: "error",
      message: "Error while fetching groups.",
      function: "getGroups",
      params: groupIds,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function getGroup(params, auth) {
  //NOTE: Will only return a group you have an active (non-deleted) membership role
  try {
    const groupId = params.group_id;
    const justLooking = params.justLooking || false;
    const newGroup = params.newGroup || false;
    let permitted = false;
    const uid = auth.data.person_id;
    const timezone = auth.data.default_timezone || "America/New_York";
    let myGroups = [];
    const allowRejoin = params.allowRejoin || false; // Allow invited user to rejoin the group
    const fromShareLink = params.fromShareLink || false;
    if (!justLooking) {
      //CLEANS USER GROUPS FOR JUST GROUPS THEY ARE STILL A MEMBER OF.
      const cleanUser = await cleanPersonGroups(auth.data);

      for (let i = 0; i < cleanUser.groups.length; i++) {
        myGroups = [...myGroups, cleanUser.groups[i].group_id];
      }
    } else {
      // JUST LOOKING
      const peoplejs = require("./people.js");
      myGroups = await peoplejs.getSuggestedGroups({ idsOnly: true, allowRejoin: allowRejoin, fromShareLink: fromShareLink }, auth);
      myGroups = myGroups.data;
    }

    if (myGroups.indexOf(groupId) > -1 || newGroup) {
      permitted = true;
    }

    if (permitted) {
      const collection = db.collection("groups");
      const myDoc = await collection
        .aggregate([
          {
            $match: {
              $and: [{ group_id: groupId }, { date_deleted: null }], //MAKE SURE GROUP NOT DELETED
            },
          },
          {
            $lookup: {
              from: "people",
              localField: "created_by",
              foreignField: "person_id",
              as: "owner",
            },
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
            $lookup: {
              from: "organizations",
              localField: "org_id",
              foreignField: "org_id",
              as: "organization",
            },
          },
          {
            $lookup: {
              from: "people",
              as: "members",
              let: { group_id: groupId },
              pipeline: [
                {
                  $unwind: {
                    path: "$groups",
                    preserveNullAndEmptyArrays: true,
                  },
                },
                {
                  $match: {
                    "groups.group_id": groupId,
                    "groups.date_deleted": null, //have not left the group
                    date_deleted: null, // are not a deleted user
                  },
                },
                {
                  $project: {
                    person_id: 1,
                    first_name: 1,
                    last_name: 1,
                    display_name: 1,
                    open_dates: 1,
                    see_hand: 1,
                    image: { $ifNull: ["$thumbnail", "$image"] },
                    role: "$groups.role",
                  },
                },
                {
                  $sort: {
                    display_name: 1,
                    first_name: 1,
                    last_name: 1,
                  },
                },
              ],
            },
          },
          {
            $project: {
              group_id: 1,
              group_name: 1,
              group_description: 1,
              can_join: 1,
              everyone_add_friends: 1,
              org_id: 1,
              org_name: "$organization.name",
              group_owner: "$created_by",
              members: "$members",
              image_id: 1,
              image_date: "$image.date_modified",
              image_version: "$image.version",
              location: 1,
              virtual: 1,
              //image: "$image",
              owner: {
                owner_first: `$owner.first_name`,
                owner_last: `$owner.last_name`,
                owner_image: { $ifNull: ["$owner.thumbnail", "$owner.image"] },
              },
            },
          },
        ])
        .toArray();
      let groupDoc = myDoc[0];
      let isAdmin = false;
      let showInvite = false;

      // create isAdmin field in groupDoc
      for (let i = 0; i < groupDoc.members.length; i++) {
        if (
          groupDoc.members[i].person_id === uid &&
          groupDoc.members[i].role === "admin"
        ) {
          isAdmin = true;
        }
      }
      groupDoc.isAdmin = isAdmin;

      // create a canShare field in groupDoc
      if (groupDoc) {
        if (isAdmin && groupDoc.can_join !== "nobody") {
          showInvite = true;
        } else if (
          !isAdmin &&
          groupDoc.can_join !== "nobody" &&
          groupDoc.everyone_add_friends
        ) {
          showInvite = true;
        }
      }
      groupDoc.showInvite = showInvite;

      //create image link
      /*  const imageLink = `${process.env.SERVER_PATH}Graphics/ImageDB/${
        groupDoc.image_id
      }.${moment(new Date(groupDoc.image_date)).tz(timezone).format("MMDDYYYYHHmmss")}.png`;
      groupDoc.imageLink = imageLink; */

      return {
        data: groupDoc,
        message: "ok",
      };
    } else {
      return {
        data: null,
        message:
          "Authorization Error, You may not have permission to see this group.",
      };
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error while fetching group details.",
      function: "getGroup",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    return {
      data: null,
      message: "Oops. Something went wrong fetching group.",
    };
  }
}

async function getAmGroupMember(params, authUser) {
  //NOTE: Will only return a group you have an active (non-deleted) membership role
  try {
    const groupId = params.group_id;
    let myGroup = null;

    //CLEANS USER GROUPS FOR JUST GROUPS THEY ARE STILL A MEMBER OF.
    
    for (let i = 0; i < authUser.data.groups.length; i++) {
      if (groupId === authUser.data.groups[i].group_id) {        
        if (!authUser.data.groups[i].date_deleted) {
          myGroup = authUser.data.groups[i].group_id || null;
        }
      }
    }

    if (myGroup === null) {
      return {
        data: null,
        message: "You don't belong to this group",
      };
    }

    const collection = db.collection("groups");
    //Find the group
    const myDoc = await collection.findOne({
      group_id: groupId,
      date_deleted: null,
    });

    if (myDoc) {
      return {
        data: myDoc,
        message: "ok",
      };
    } else {
      return {
        data: null,
        message:
          "Authorization Error, You may not have permission to see this group.",
      };
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error while fetching group having active members.",
      function: "getAmGroupMember",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    return {
      data: null,
      message: "Oops. Something went wrong fetching group.",
    };
  }
}

async function getGroupIds(groupIds) {
  try {
    const collection = db.collection("groups");
    const groups = await collection
      .find({ group_id: { $in: groupIds } })
      .sort({ group_name: 1 })
      .project({ group_id: 1, can_join: 1, org_id: 1 })
      .toArray();

    return groups;
  } catch (err) {
    log({
      level: "error",
      message: "Error while fetching group ids.",
      function: "GetGroupIds",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

module.exports = {
  updateGroup,
  insertGroup,
  deleteGroup,
  addGroupMembers,
  updateGroupMember,
  getMyGroups,
  getGroup,
  getGroups,
  getGroupsExpanded,
  cleanPersonGroups,
  leaveGroup,
  getAmGroupMember,
  getGroupIds,
};
