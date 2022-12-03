const { GenerateAuthToken, ValidHash } = require("./auth.js");
const jwt = require("jsonwebtoken");
const groups = require("./groups.js");
const people = require("./people.js");
const sendgrid = require("./sendgrid.js");
const organizations = require("./organizations.js");
const events = require("./events.js");
const log = require("./logger.js").insertServerLogs;
const JWTID = process.env.JWTID;

const from = "RadishApp";

async function clearHint(params, authUser) {
  try {
    const hintId = params.hint_id;
    const personId = authUser.data.person_id;
    let hintsArray = authUser.data.hints || [];
    if (hintsArray.indexOf(hintId) === -1) {
      hintsArray.push(hintId);
    }

    const collection = db.collection("people");
    const response = collection.updateOne(
      {
        person_id: personId,
      },
      {
        $set: {
          hints: hintsArray,
        },
      }
    );
    return {
      data: response,
      message: "ok",
      code: 200,
    };
  } catch (err) {
    log({
      level: "error",
      message: "Error while clearing user hint.",
      function: "clearHint",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function raiseHand(params, authUser) {
  try {
    const openDates = params.openDates;
    const seeHand = params.see_hand;
    const timezone = params.hand_tz;
    const personID = authUser.data.person_id;
    const people = db.collection("people");
    let actionArray;

    if (openDates === "none") {
      actionArray = {
        $unset: {
          open_dates: "",
          see_hand: "",
          hand_tz: "",
        },
      };
    } else {
      let savedDates = [];
      if (openDates !== "any") {
        for (i = 0; i < openDates.length; i++) {
          savedDates.push(openDates[i]);
        }
      }
      actionArray = {
        $set: {
          open_dates: savedDates.length > 0 ? savedDates : openDates,
          see_hand: seeHand,
          hand_tz: timezone,
        },
      };
    }

    const responseDoc = await people.updateOne(
      { person_id: personID },
      actionArray
    );

    return {
      data: responseDoc,
      message: "ok",
      code: 200,
    };
  } catch (err) {
    log({
      level: "error",
      message: "Error while raising user hand.",
      function: "raiseHand",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    return {
      data: null,
      message: "Error while raising user hand.",
      code: 500,
    };
  }
}

async function getInvited(params) {
  try {
    const connection = db.collection("people");
    const user = await connection.findOne(
      { person_id: params.person_id },
      { projection: { first_name: 1, last_name: 1, user_id: 1 } }
    );
    return {
      data: user,
      message: "ok",
      code: 200,
    };
  } catch (err) {
    log({
      level: "error",
      message: "Error while fetching invited user.",
      function: "getInvited",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    return {
      data: null,
      message: "Error while fetching invited user.",
      code: 500,
    };
  }
}

async function getCurrentUser(auth) {
  // retrieves single user
  try {
    const id = auth.data.person_id;

    const collection = db.collection("radishadmins");
    const admins = await collection.findOne({
      admin_id: id,
      date_deleted: null,
    });

    const isRadishAdmin = admins ? true : false;
    auth.data.isRadmin = isRadishAdmin;
    let isOrgAdmin = false;
    // get rid of deleted orgs
    if (auth.data.organizations) {
      let myOrgs = auth.data.organizations;
      let tempOrgs = [];
      myOrgs.map((org) => {
        if (!org.date_deleted) {
          tempOrgs.push(org);
        }
        if (org.admin) {
          isOrgAdmin = true;
          auth.data.isOrgAdmin = true;
        }
      });

      if (tempOrgs.length > 0) {
        auth.data.organizations = tempOrgs;
      } else {
        delete auth.data.organizations;
      }
    }

    // determine if has password
    auth.data.hasPwd = false;
    if (auth.data.salt) {
      auth.data.hasPwd = true;
    }

    // do not pass unnecessary fields to front end
    delete auth.data.created_by;
    delete auth.data.date_created;
    delete auth.data.date_modified;
    delete auth.data.modified_by;
    delete auth.data.salt;
    delete auth.data.hash;
    delete auth.data.cache_ttl;
    delete auth.data.reset_pwd_req;
    delete auth.data.temp_code_req;
    auth.data.last_fetched = new Date();
    return {
      data: auth.data,
      isRadmin: isRadishAdmin,
      isOrgAdmin: isOrgAdmin,
      message: "ok",
      code: 200,
    };
  } catch (err) {
    log({
      level: "error",
      message: "Error while fetching current user.",
      function: "getCurrentUser",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    return {
      data: null,
      isRadishAdmin: false,
      code: 500,
    };
  }
}

async function getUser(id) {
  // retrieves single user
  try {
    // const id = req.params.id;
    const collection = db.collection("people");
    const myDoc = await collection.findOne({ person_id: id });
    //res.json(myDoc);
    return {
      data: myDoc,
      message: "ok",
    };
  } catch (err) {
    log({
      level: "error",
      message: `Error while fetching user details, id: ${id}.`,
      function: "getUser",
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function getUsersRadmin(params, auth) {
  // Gets Users for Radmin Section > Users List
  try {
    if (auth.isRadishAdmin) {
      let searchInput = params.searchInput;
      let pageNumber = params.pageNumber || 1;
      let rowsPerPage = params.rowsPerPage || 100;
      const skip = (pageNumber - 1) * rowsPerPage;
      const limit = rowsPerPage;
      let matchArray = {
        last_active: { $ne: null },
      };
      if (searchInput) {
        const regex = new RegExp(searchInput, "i"); // Creating regex based on search input // i represents case insensitive
        matchArray = {
          ...matchArray,
          $or: [
            // match search value in first name and last name
            { first_name: { $regex: regex } },
            { last_name: { $regex: regex } },
          ],
        };
      }
      const collection = db.collection("people");
      const myDoc = await collection
        .aggregate(
          [
            {
              $match: matchArray,
            },
            {
              $project: {
                people: "$$ROOT",
              },
            },
            {
              $lookup: {
                localField: "people.person_id",
                from: "radishadmins",
                foreignField: "admin_id",
                as: "radishadmins",
              },
            },
            {
              $unwind: {
                path: "$radishadmins",
                preserveNullAndEmptyArrays: true,
              },
            },

            {
              $sort: {
                "people.last_name": 1,
                "people.first_name": 1,
              },
            },
            {
              $project: {
                person_id: "$people.person_id",
                first_name: "$people.first_name",
                last_name: "$people.last_name",
                user_id: "$people.user_id",
                date_created: "$people.date_created",
                last_active: "$people.last_active",
                admin_id: "$radishadmins.admin_id",
                admin_deleted: "$radishadmins.date_deleted",
                user_deleted: "$people.date_deleted",
              },
            },
            { $skip: skip },
            { $limit: limit },
          ],
          {
            allowDiskUse: true,
          }
        )
        .toArray();
      const count = await collection.countDocuments(matchArray);
      return {
        users: myDoc,
        count: count,
      };
    } else {
      log({
        level: "debug",
        message: "Not a Radmin",
        function: "getUsersRadmin",
      });
      const myDoc = "";
      return {
        users: myDoc,
        count: 0,
      };
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error while fetching users for Radmin.",
      function: "getUsersRadmin",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function getRadmins(params, auth) {
  try {
    if (auth.isRadishAdmin) {
      const collection = db.collection("radishadmins");

      const myDoc = await collection
        .aggregate(
          [
            {
              $project: {
                radishadmins: "$$ROOT",
              },
            },
            {
              $lookup: {
                localField: "radishadmins.admin_id",
                from: "people",
                foreignField: "person_id",
                as: "people",
              },
            },
            {
              $unwind: {
                path: "$people",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                "radishadmins.date_deleted": null,
                "people.date_deleted": null,
              },
            },
            {
              $sort: {
                "people.last_name": 1,
                "people.first_name": 1,
              },
            },
            {
              $project: {
                person_id: "$radishadmins.admin_id",
                user_id: "$people.user_id",
                first_name: "$people.first_name",
                last_name: "$people.last_name",
                last_active: "$people.last_active",
                date_added_as_admin: "$radishadmins.date_created",
              },
            },
          ],
          {
            allowDiskUse: true,
          }
        )
        .toArray();

      return myDoc;
    } else {
      log({ level: "debug", message: "Not a Radmin", function: "getRadmins" });
      const myDoc = "";
      return myDoc;
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error while fetching Radmins.",
      function: "getRadmins",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function insertUser(params, auth) {
  let response = {};
  try {
    const collection = db.collection("people");
    const date = new Date();
    let code = 200;
    let sendWelcomeEmail = false;

    //see if already a people doc for this person
    const myPerson = await collection
      .find({ user_id: params.email })
      .project({
        person_id: 1,
        user_id: 1,
        hash: 1,
        invite_link: 1,
        groups: 1,
        last_active: 1,
      })
      .toArray();

    // this block below needed if we ONLY want to insert. If
    // we leave it commented out, we are UPSERTING...
    /* if (myPerson.length > 0 && myPerson[0].hash) {
      res.send(false);
      return;
    } */

    const cid = crypto.randomBytes(16).toString("hex");
    const friendLink = `${params.first_name}-${crypto
      .randomBytes(4)
      .toString("hex")}`;

    const password = params.password;
    const salt = crypto.randomBytes(16).toString("hex");
    let fieldArray = {
      first_name: params.first_name,
      last_name: params.last_name,
      user_id: params.email,
      display_name: params.first_name + " " + params.last_name,
      emails: [
        {
          email: params.email,
          type: "Other",
          primary: true,
          date_validated: params.validEmail ? new Date() : null,
        },
      ],
      date_modified: date,
      modified_by: auth.data.person_id,
      default_timezone: params.default_timezone,
    };
    if (password) {
      fieldArray = {
        ...fieldArray,
        salt: salt,
        hash: crypto
          .pbkdf2Sync(password, salt, 1000, 64, `sha512`)
          .toString(`hex`),
      };
    }
    if (params.is_temp) {
      fieldArray = {
        ...fieldArray,
        is_temp: params.is_temp,
      };
    }
    // Test for existing invite link
    if (myPerson.length > 0) {
      myPersonInvLink = myPerson[0].invite_link || null;
      //A user with out a last_active date has never logged in.
      code = myPerson[0].last_active ? 403 : 200;

      //Users created through manual creation or google import don't have a last active date.
      //All users are assigned a last active through a login, and other app usage.
      //Therefore no-last active is indicitive of never logged in.
      sendWelcomeEmail = myPerson[0].last_active ? false : true;
    }
    if (myPerson.length > 0 && myPersonInvLink === null) {
      //person needs an invite_link
      fieldArray = {
        ...fieldArray,
        invite_link: friendLink,
      };
    }

    // Test for phone param
    if (params.phone) {
      fieldArray = {
        ...fieldArray,
        phones: [
          {
            phone: params.phone,
            type: "Other",
            primary: true,
            date_validated: date,
          },
        ],
      };
    }

    // Assign person_id if this is new user
    if (myPerson.length === 0) {
      //person does not already exist so create id and invite_link
      fieldArray = {
        ...fieldArray,
        person_id: cid,
        invite_link: friendLink,
        created_by: cid,
        date_created: date,
      };
      sendWelcomeEmail = true;
    }
    if (sendWelcomeEmail) {
      // CREATE LINK
      const link = `${process.env.SERVER_PATH}login`;
      // SEND EMAIL
      const personId =
        myPerson[0] && myPerson[0].person_id ? myPerson[0].person_id : cid;
      const emailParams = {
        to: [params.email],
        from: params.inviter_name + " <info@radishapp.io>",
        subject: "Welcome to Radish", // params.inviter_name + " has invited you!",
        emailTemplate: "welcomeEmail",
        emailBody: "Your Radish account has been created.",
        emailLink: link,
        type: "email",
        moduleName: "welcomeEmail",
        peopleIds: [personId],
      };
      await sendgrid.sendMyMail(emailParams, async (resp) => {
        if (resp.code === 202) {
          log({
            level: "debug",
            message: "Welcome email generated successfully.",
            function: "insertUser",
          });
        } else {
          log({
            level: "error",
            message: "Error while generating welcome email.",
            function: "insertUser",
            params: "", //do not log params here. Security breach
            error_code: resp.code,
            error_stack: resp,
          });
        }
      });
    }

    if (code !== 403) {
      // upsert user
      await collection.updateOne(
        { user_id: params.email },
        { $set: fieldArray },
        { upsert: true, runValidators: true }
      );
    } else if (params.is_temp) {
      // setting existing users to is_temp in the event that
      // they are attempting to vote or rsvp on event w/out logging in first.
      await collection.updateOne(
        { user_id: params.email },
        { $set: { is_temp: params.is_temp } },
        { upsert: true, runValidators: true }
      );
    }

    // fetch the newly upserted doc
    let myUser = await collection.findOne({ user_id: params.email });
    // Test and upsert if creating Radish Admin
    const admins = db.collection("radishadmins");
    if (params.radishadmin === true) {
      await admins.updateOne(
        { admin_id: myUser.person_id },
        {
          $set: {
            admin_id: myUser.person_id,
            date_created: date,
            date_modified: date,
            created_by: auth.data.person_id,
            modified_by: auth.data.person_id,
            deleted_by: null,
            date_deleted: null,
          },
        },
        { upsert: true, runValidators: true }
      );
    }

    // Create default friend group for new user
    const tempAuth = {
      data: myUser,
    };
    let hasDefaultGroup = false;

    if (myPerson && myPerson.length > 0 && myPerson[0].groups) {
      for (let i = 0; i < myPerson[0].groups.length; i++) {
        if (myPerson[0].groups[i].default_group) {
          hasDefaultGroup = true;
        }
      }
    }
    if (!hasDefaultGroup) {
      await groups.insertGroup(
        {
          group_description: "My default friend group",
          default_group: true,
          user_default: true,
        },
        tempAuth
      );
    }
    // fetch user again now that default group exists
    myUser = await collection.findOne({ user_id: params.email });
    response = {
      code: code,
      data: myUser,
    };
    return response;
    // return myUser;
  } catch (err) {
    response = {
      code: 500,
      data: null,
    };
    log({
      level: "error",
      message: "Error while insert user details",
      function: "insertUser",
      params: "", //do not log params here. Security breach
      error_code: 500,
      error_stack: err.stack,
    });
    return response;
  }
}

async function insertAccept(params) {
  let response = {}; 
  try {
    const iGroupId = params.group_id;
    const iEventId = params.event_id;
    const iOrgId = params.org_id;
    let code = 200;
    const inviteLink = params.invite_link;
    const created_by = params.created_by; // invited_by person_id passed if no invite link
    let inviterQuery;
    let userAlreadyExists = false;
    if (inviteLink) {
      inviterQuery = {
        invite_link: inviteLink,
      };
    } else if (created_by) {
      inviterQuery = {
        person_id: created_by,
      };
    } else {
      return {
        code: 401,
        data: null,
        message: "Invalid authorization.",
      };
    }

    //make sure we have a valid invitation link
    const collection = db.collection("people");
    const inviter = await collection.findOne(inviterQuery, {
      $project: { person_id: 1, date_deleted: 1, groups: 1 },
    });

    let dtDeleted = null;
    if (inviter) {
      dtDeleted = inviter.date_deleted || null;
    }

    // make sure we have a valid inviter...
    if (!inviter || inviter.length === 0 || dtDeleted !== null) {
      return {
        code: 500,
        data: null,
        message: "Invalid invitation.",
      };
    }
    let enforceDomains = false;
    if (iOrgId) {
      // fetch if domains enforced
      const orgCollection = db.collection("organizations");
      const myOrg = await orgCollection.findOne(
        { org_id: iOrgId },
        {
          projection: {
            org_id: 1,
            name: 1,
            enforce_domains: 1,
          },
        }
      );
      if (myOrg.enforce_domains) {
        enforceDomains = true;
      }
    }
    const rapidAccept = params.rapidAccept === "true";

    let invitedUser = null;
    let invitedFirstName = null;
    const tempAuth = {
      data: inviter,
    };
    if (!rapidAccept) {
      // upsert new user

      let fieldArray = {
        first_name: params.first_name,
        last_name: params.last_name,
        email: params.email,
        password: params.password,
        inviter_name: inviter.display_name,
        default_timezone: params.default_timezone,
        is_temp: params.tempStatus === "no" ? false : true,
        validEmail: params.validEmail,
      };
      /*  if (iEventId) {
        fieldArray = {
          ...fieldArray,
          is_temp: true,
        };
      } */

      const userDetails = await insertUser(fieldArray, tempAuth);

      invitedUser = userDetails.data;
      code = userDetails.code;
      if (code === 403) {
        // make it 200 if this is an event invite
        // because we allow existing users to vote or RSVP without logging in
        if (iEventId) {
          userAlreadyExists = true;
          code = 200;
        } else {
          log({
            level: "debug",
            message: "User Already Exists.",
            function: "insertAccept",
          });
          return {
            code: 403,
            data: null,
            message: "User Already Exists.",
          };
        }
      }
      invitedFirstName = invitedUser.first_name;

      // if (!iEventId) {        
      if (!userDetails.data.digest_preferences) {
        //set default digest preferences
        const digestPreferences = {
          digest_on: true,
          invited_on: true,
          organized_on: true,          
          friends_on: true,
          friends_of_friends_on: true,
          group_events_on: true,
          org_events_on: true,
          added_group_on: true,
          org_activity_on: true,
        };

        const notificationData = {
          person_id: userDetails.data.person_id,
          digest_preferences: digestPreferences,
        };
        await updateCurrentUser(notificationData, userDetails);
      }
      //}
    } else {
      // RAPID ACCEPT
      invitedUser = await collection
        .find({ person_id: params.person_ids[0] })
        .project({ person_id: 1, first_name: 1, groups: 1, organizations: 1 })
        .toArray();
      invitedFirstName = invitedUser[0].first_name;
      invitedUser = invitedUser[0];
    }

    // insert into invited group (if any)
    let iGroupName = null;
    if (iGroupId) {
      let groupParams = {
        group_id: iGroupId,
        person_ids: [invitedUser.person_id],
        justLooking: true,
        allowRejoin: true,
      };
      const tempAuthUser = {
        data: invitedUser,
      };
      let permissionParams = {
        groupId: iGroupId,
        authUser: tempAuthUser,
        groupParams: groupParams,
        invitedUser: invitedUser,
        fromShareLink: true,
      };

      // Check group permission
      const invitedGroup = await checkGroupPermission(permissionParams);

      if (invitedGroup) {
        // authorised to jpin the group
        iGroupName = invitedGroup.group_name;
        // insert into invited group
        let groupdId = await groups.addGroupMembers(groupParams, tempAuth);
        if (!groupdId) {
          log({
            level: "debug",
            message:
              "Inviter might not be the group admin or may not have permission to invite user.",
            params: groupParams,
            function: "insertAccept",
          });
          return {
            code: 401,
            data: null,
            message:
              "Inviter might not be the group admin or may not have permission to invite user.",
          };
        }
      } else {
        log({
          level: "debug",
          message: "User can not join due to group invite permissions.",
          params: groupParams,
          function: "insertAccept",
        });
        return {
          code: 401,
          data: null,
          message: "User can not join due to group invite permissions.",
        };
      }
    }

    if (iEventId) {
      const tempAuthUser = {
        data: invitedUser
      }
      /* let eventParams = {
        eventId: iEventId,
        authUser: tempAuthUser,
        inviter: inviter,
        userAlreadyExists: userAlreadyExists,
      } */
      // Check event permission
      // const invitedEvent = await events.checkEventPermission(eventParams);
      const eventCollection = db.collection("events");
      const eventRec = await eventCollection.findOne({ event_id: iEventId });
      const invitePermitted = await events.invitePermitted({
        eventRec: eventRec,
        friendInviteId: inviteLink,
        authUser: tempAuthUser,
        boolOnly: false,
        fromInvite: true,
      })

      if (invitePermitted.message !== 'ok') {
        log({
          level: "debug",
          message: "User can not respond to event due to invite permissions.",
          params: iEventId,
          function: "insertAccept",
        });
        return {
          code: 401,
          userAlreadyExists: userAlreadyExists,
          data: null,
          message: "User can not respond to event due to invite permissions.",
        };
      }
    }

    // insert user into inviter's default group   
    let defaultGroupID = await people.getDefaultGroup(inviter);

    if (!defaultGroupID) {
      // inviter does not yet have a default group
      defaultGroupID = await groups.insertGroup(
        {
          group_description: "My default friend group",
          default_group: true,
          user_default: true,
          everyone_add_friends: false,
          everyone_add_events: false,
        },
        tempAuth
      );
    }
    let groupParams = {
      group_id: defaultGroupID,
      person_ids: params.person_ids || [invitedUser.person_id],
    };   
    await groups.addGroupMembers(groupParams, tempAuth);
    // insert inviter into user's new default group
    defaultGroupID = await people.getDefaultGroup(invitedUser);
    //console.log('getDefaultGroupId: ' + defaultGroupID);
    groupParams = {
      group_id: defaultGroupID,
      person_ids: [inviter.person_id],
    };
    await groups.addGroupMembers(groupParams, tempAuth, true);

    // log acceptance in the invites collection
    const invitedBy = inviter.person_id;
    let invArray = {
      invite_type: iGroupId ? "group" : iEventId ? "event" : "friend",
      invited_by: invitedBy,
    };
    if (iGroupId) {
      invArray = {
        ...invArray,
        group_id: iGroupId,
      };
    }
    if (iOrgId) {
      invArray = {
        ...invArray,
        org_id: iOrgId,
      };
    }
    await logInvite(invArray);


    if (iOrgId && !enforceDomains) {
      // make user member of org if no domain enforcement required.
      await people.acceptOrgUser(invitedUser.person_id, iOrgId);
    }

    const returnArray = {
      invitedFirst: invitedFirstName,
      inviterFirst: inviter.first_name,
      groupName: iGroupName,
      inviterName: inviter.display_name,
    };
    response = {
      code: code,
      data: returnArray,
    };
    // return returnArray;
    return response;
  } catch (err) {
    response = {
      code: 500,
      data: null,
    };
    log({
      level: "error",
      message: "Error while register user details",
      function: "insertAccept",
      params: "", // do not log user params here. Security breach.
      error_code: 500,
      error_stack: err.stack,
    });
    return response;
  }
}

async function checkGroupPermission(params) {
  try {
    let authorized = false;
    const groupId = params.groupId;
    const authUser = params.authUser;
    const groupParams = params.groupParams;
    const invitedUser = params.invitedUser;
    const groupCollection = db.collection("groups");
    const testGroup = await groupCollection.findOne(
      { group_id: groupId },
      {
        projection: {
          can_join: 1,
          group_name: 1,
        },
      }
    );
    // Check group permission
    if (testGroup.can_join === "anyone with link") {
      authorized = true;
    } else if (testGroup.can_join === "invited") {
      const invitedUserGroups = invitedUser.groups;
      if (invitedUserGroups) {
        invitedUserGroups.forEach((group) => {
          if (group.group_id === groupId) {
            authorized = true;
          }
        });
      }
    } else {
      const tempGroup = await groups.getGroup(groupParams, authUser);
      if (tempGroup.data) {
        authorized = true;
      }
    }
    if (authorized) {
      return testGroup;
    } else {
      return;
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error while checking group permission",
      function: "checkGroupPermission",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    return;
  }
}

async function logInvite(params) {
  try {
    const date = new Date();
    const invitedBy = params.invited_by;
    const inviteType = params.invite_type;
    const groupId = params.group_id;
    const eventId = params.event_id;
    const invID = crypto.randomBytes(16).toString("hex");
    const invites = db.collection("acceptancelog");
    let invArray = {
      invite_id: invID,
      invite_type: inviteType,
      invited_by: invitedBy,
      date_created: date,
      date_accepted: date,
    };
    if (groupId) {
      invArray = {
        ...invArray,
        group_id: groupId,
      };
    }
    if (eventId) {
      invArray = {
        ...invArray,
        event_id: eventId,
      };
    }
    // console.log(invArray);

    await invites.insertOne(invArray, { runValidators: true });
    return true;
  } catch (err) {
    log({
      level: "error",
      message: "Error while log invite details.",
      function: "logInvite",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

/* async function getDefaultGroup(person) {
  try {
    let groupID = null;
    for (let i = 0; i < person.groups.length; i++) {
      if (person.groups[i].default_group) {
        groupID = person.groups[i].group_id;
      }
    }
    return groupID;
  } catch (err) {
    console.log(err.stack);
  }
} */

async function changePassword(req, res) {
  try {
    const id = req.body.person_id;
    const tid = req.body.tid; // forgot pwd does not require auth
    let doEmailValidation = true;
    let query = {
      user_id: req.body.user_id,
    };
    if (!tid) {
      doEmailValidation = false;
      const authUser = await Auth2(
        req,
        false,
        res,
        (allowTempUser = false),
        (bypassCache = true)
      );
      if (!authUser.data || !authUser.person_id === id) {
        // User has invalid token OR not an authorized radish admin.
        // AuthUser contains an error message we send back to client.
        res.send({
          data: null,
          message: authUser.message,
        });
        return;
      }
    } else {
      // VALIDATE tid (temp key)
      query = {
        ...query,
        temp_key: tid,
      };
    }
    const password = req.body.currentPassword;
    const collection = db.collection("people");
    await collection.findOne(query, async function (err, user) {
      if (user === null) {
        const response = {
          message: "Error validating user.",
          data: null,
        };
        return res.status(400).send(response);
      } else {
        if (tid || ValidHash(password, user.salt, user.hash)) {
          // SUCCESS
          const salt = crypto.randomBytes(16).toString("hex");

          await collection.updateOne(
            { user_id: req.body.user_id },
            {
              $set: {
                salt: salt,
                hash: crypto
                  .pbkdf2Sync(req.body.newPassword, salt, 1000, 64, `sha512`)
                  .toString(`hex`),
              },
            },
            { runValidators: true }
          );

          if (doEmailValidation) {
            // SET EMAIL AS VALIDATED
            await setValidEmail(req.body.user_id);
          }

          // CREATE LINK
          const link = `${process.env.SERVER_PATH}forgotpwd`;

          // SEND EMAIL
          const emailParams = {
            to: [user.user_id],
            from: `${from} <info@radishapp.io>`,
            subject: "Account Password Changed",
            emailTemplate: "changePasswordConfirm",
            emailBody: "Account Password Changed",
            emailLink: link,
            type: "email",
            moduleName: "changePasswordConfirm",
            peopleIds: [user.person_id],
          };
          await sendgrid.sendMyMail(emailParams, async (resp) => {
            if (resp.code === 202) {
              log({
                level: "debug",
                message:
                  "Account Password Changed email generated successfully.",
                function: "changePassword",
              });
            } else {
              log({
                level: "error",
                message:
                  "Error while generating account password changed email.",
                function: "changePassword",
                params: "", //do not log params here. Security breach,
                error_code: resp.code,
                error_stack: resp,
              });
            }
          });
          const response = {
            message: "ok",
            data: null,
          };
          return res.status(201).send(response);
        } else {
          const response = {
            message: "Error validating user.",
            data: null,
          };
          return res.status(400).send(response);
        }
      }
    });

    //res.json(myDoc);
  } catch (err) {
    log({
      level: "error",
      message: "Error while change password.",
      function: "changePassword",
      params: "", // do not log params here. security breach.
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function checkEmailCode(params) {
  try {
    const tempCode = parseInt(params.code);
    const personID = params.person_id;
    const email = params.email;
    const type = params.type;
    const orgID = params.orgID;
    const emails = {
      email: email,
      type: type,
      date_validated: new Date(),
      type: type,
    };
    let response = { message: "fail", code: 500 };
    const collection = db.collection("people");
    const myPerson = await collection.findOne(
      { person_id: personID, temp_email_code: `${tempCode}|${email}` },
      {
        projection: {
          person_id: 1,
          emails: 1,
          user_id: 1,
          organizations: 1,
        },
      }
    );

    if (myPerson) {
      // tempcode passed. insert email (if needed). unset temp_email_code.
      let addNeeded = true;
      let dbArray = {
        $push: {
          emails: emails,
        },
        $set: {
          last_login: new Date(),
        },
        $unset: {
          temp_email_code: "",
          is_temp: "",
        },
      };
      for (let i = 0; i < myPerson.emails.length; i++) {
        if (myPerson.emails[i].email === email) {
          // email already exists. Don't add it. Just unset the temp_email_code
          setString = `emails.${i}.date_validated`;
          setTypeString = `emails.${i}.type`;
          addNeeded = false;
          dbArray = {
            $set: {
              [setString]: new Date(),
              [setTypeString]: type,
              last_login: new Date(),
            },
            $unset: {
              temp_email_code: "",
              is_temp: "",
            },
          };
        }
      }

      if (orgID) {
        // add org to user record if not exits
        await people.acceptOrgUser(personID, orgID);
      }

      const updatedUser = await collection.updateOne(
        { person_id: personID },
        dbArray,
        { runValidators: true }
      );

      if (updatedUser && updatedUser.modifiedCount === 1) {
        const newToken = GenerateAuthToken(personID);
        response = {
          message: "ok",
          data: myPerson.person_id,
          token: newToken,
          code: 200,
        };
      }
      if (addNeeded) {
        // CREATE LOGIN LINK
        const link = `${process.env.SERVER_PATH}login`;
        // SEND EMAIL TO PRIMARY USER EMAIL
        const emailParams = {
          to: [myPerson.user_id],
          from: `${from} <info@radishapp.io>`,
          subject: "Email address added to your Radish account",
          emailTemplate: "addEmailConfirm",
          emailBody: `Email Address Added`,
          //confirmCode: confirmCode,
          emailLink: link,
          first_name: myPerson.first_name,
          last_name: myPerson.last_name,
          new_email: email,
          type: "email",
          moduleName: "addEmailConfirm",
          peopleIds: [myPerson.person_id],
        };
        await sendgrid.sendMyMail(emailParams, async (resp) => {
          if (resp.code === 202) {
            log({
              level: "debug",
              message:
                "Email address added to Radish account information email generated successfully.",
              function: "insertUserEmail",
            });
          } else {
            log({
              level: "error",
              message:
                "Error while generating primary email address added to Radish account information email.",
              function: "insertUserEmail",
              params: params,
              error_code: resp.code,
              error_stack: resp,
            });
            resposne = {
              message:
                "Error while generating primary email address added to Radish account information email.",
              code: 500,
              data: null,
            };
          }
        });
      }
    }
    return response;
  } catch (error) {
    log({
      level: "error",
      message: "Error while check email confirm code.",
      function: "checkEmailCode",
      params: params,
      error_code: 500,
      error_stack: error.stack,
    });
  }
}

async function checkTempCode(req, res) {
  try {
    const tempCode = parseInt(req.body.temp_code);
    const userID = req.body.user_id;
    let response = { message: "fail", data: null };
    let status = 400;
    const date = new Date();
    const ttlTest = date.getTime();
    const collection = db.collection("people");
    const myPerson = await collection.findOne(
      { temp_code: tempCode, user_id: userID },
      {
        projection: {
          user_id: 1,
          person_id: 1,
          temp_ttl: 1,
          created_by: 1,
          default_timezone: 1,
          first_name: 1,
          last_name: 1,
        },
      }
    );

    if (myPerson) {
      // tempcode passed
      if (ttlTest < myPerson.temp_ttl) {
        const userToken = await GenerateAuthToken(myPerson.person_id);
        let setArray = {
          last_login: date,
        };
        if (!myPerson.default_timezone && req.body.default_timezone) {
          setArray = {
            ...setArray,
            default_timezone: req.body.default_timezone,
          };
        }

        const updatedUser = await collection.updateOne(
          { person_id: myPerson.person_id },
          {
            $set: setArray,
            $unset: {
              temp_ttl: "",
              temp_hash: "",
              temp_salt: "",
              temp_key: "",
              temp_code: "",
              is_temp: "",
            },
          },
          { runValidators: true },
          { upsert: true }
        );

        await setValidEmail(myPerson.user_id);

        if (!myPerson.last_active) {
          //run the insert accept stuff.
          let insertAcceptParams = {
            first_name: myPerson.first_name,
            last_name: myPerson.last_name,
            email: myPerson.user_id,
            created_by: myPerson.created_by,
            default_timezone: req.body.default_timezone,
            validEmail: true,
            tempStatus: "no",
          };
          const insertAcceptResult = await insertAccept(insertAcceptParams);
        }

        response = {
          message: "ok",
          token: userToken,
          data: myPerson,
        };
        status = 201;
      }
    }
    return res.status(status).send(response);
  } catch (error) {
    log({
      level: "error",
      message: "Error while check temp code.",
      function: "checkTempCode",
      params: req.body,
      error_code: 500,
      error_stack: error.stack,
    });
  }
}

async function sendTempCode(req, res) {
  try {
    const uid = req.body.temp_email;
    const date = new Date();
    const ttl = date.getTime() + 600000; // ttl = 10 min.
    const token = Math.floor(Math.random() * 90000) + 10000; // 5-digit random nbr

    const collection = db.collection("people");
    const updatedPerson = await collection.updateOne(
      { user_id: uid, date_deleted: null },
      {
        $set: {
          temp_code_req: new Date(),
          temp_ttl: ttl,
          temp_code: token,
        },
      }
    );
    const personRec = await collection.findOne(
      { user_id: uid, date_deleted: null },
      {
        projection: {
          person_id: 1,
        },
      }
    );

    if (updatedPerson.modifiedCount > 0) {
      // CREATE LINK
      const link = `${process.env.SERVER_PATH}login`;
      // SEND EMAIL W/TEMPCODE
      const emailParams = {
        to: [uid],
        from: `${from} <info@radishapp.io>`,
        subject: "Radish Login Code",
        emailTemplate: "logincode1",
        emailHeading: "Temporary Login Code",
        emailLink: link,
        emailBody: "Please submit this code on Radish. Code lasts 10 min.",
        data: token,
        type: "email",
        moduleName: "tempcode",
        peopleIds: [personRec.person_id],
      };
      await sendgrid.sendMyMail(emailParams, async (resp) => {
        res.send(resp);
      });
    } else {
      res.send({
        code: 500,
        message: "Error sending temp code.",
      });
    }
  } catch (error) {
    log({
      level: "error",
      message: "Error while send temp code.",
      function: "sendTempCode",
      params: req.body,
      error_code: 500,
      error_stack: error.stack,
    });
    res.send({
      code: 400,
      message: "Error sending temp code.",
    });
  }
}

async function getTempUser(req, res) {
  try {
    const tempid = req.body.temp_id;
    let response = { message: "fail", data: null };
    let status = 400;
    const date = new Date();
    const ttlTest = date.getTime();
    const collection = db.collection("people");
    const myPerson = await collection.findOne(
      { temp_key: tempid },
      {
        projection: {
          user_id: 1,
          person_id: 1,
          temp_ttl: 1,
          temp_salt: 1,
          temp_hash: 1,
        },
      }
    );
    if (myPerson) {
      if (ttlTest < myPerson.temp_ttl) {
        if (
          ValidHash(myPerson.user_id, myPerson.temp_salt, myPerson.temp_hash)
        ) {
          const tempResponse = {
            person_id: myPerson.person_id,
            user_id: myPerson.user_id,
          };
          response = {
            data: tempResponse,
            message: "ok",
          };
          status = 201;
        }
      }
    }
    return res.status(status).send(response);
  } catch (error) {
    log({
      level: "error",
      message: "Error while fetch temp user details.",
      function: "getTempUser",
      params: req.body,
      error_code: 500,
      error_stack: error.stack,
    });
  }
}

async function resetPwd(req, res) {
  try {
    const uid = req.body.user_id;
    const date = new Date();
    const ttl = date.getTime() + 5400000; // ttl = 90 min.
    const token = GenerateAuthToken(uid);
    const tempKey = crypto.randomBytes(16).toString("hex");
    const decodedToken = jwt.verify(token, JWTID);
    const result = {
      user_id: decodedToken.personID,
      salt: decodedToken.salt,
      hash: decodedToken.hash,
    };

    const collection = db.collection("people");
    const updatedPerson = await collection.updateOne(
      { user_id: uid, date_deleted: null },
      {
        $set: {
          reset_pwd_req: new Date(),
          temp_salt: result.salt,
          temp_hash: result.hash,
          temp_ttl: ttl,
          temp_key: tempKey,
        },
      }
    );

    const personRec = await collection.findOne(
      { user_id: uid, date_deleted: null },
      {
        projection: {
          person_id: 1,
        },
      }
    );

    if (updatedPerson.modifiedCount > 0) {
      // CREATE LINK
      const link = `${process.env.SERVER_PATH}forgotpwd?tid=${tempKey}`;
      // SEND EMAIL Reset Password
      const emailParams = {
        to: [uid],
        from: `${from} <info@radishapp.io>`,
        subject: "Reset Password",
        emailTemplate: "reset1",
        emailHeading: "Reset Your Radish Password",
        emailLink: link,
        emailBody:
          "A request to reset your Radish password has been submitted.",
        type: "email",
        moduleName: "reset1",
        peopleIds: [personRec.person_id],
      };
      await sendgrid.sendMyMail(emailParams, async (resp) => {
        res.send(resp);
      });
    } else {
      // Check if the user entered email matches with any one of the non-primary emails of any one of the users.
      const matchedPerson = await collection
        .aggregate([
          {
            $match: {
              date_deleted: null, //don't return any people who are deleted
            },
          },
          {
            $unwind: {
              path: "$emails",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: {
              "emails.email": uid,
              "emails.date_deleted": null,
              $or: [
                { "emails.primary": { $exists: false } },
                { "emails.primary": false },
              ],
            },
          },
          {
            $project: {
              person_id: 1,
            },
          },
        ])
        .toArray();
      if (matchedPerson && matchedPerson.length > 0) {
        // SEND EMAIL to the matched email address
        const emailParams = {
          to: [uid],
          from: `${from} <info@radishapp.io>`,
          subject: "Password Reset Request",
          emailTemplate: "resetRequestToNonPrimaryEmail",
          emailHeading: "Password Reset Request",
          emailBody:
            "You recently requested to change your password with this email address. Unfortunately this is not your accounts primary emai. Please try again using your primary email account.",
          type: "email",
          moduleName: "resetRequestToNonPrimaryEmail",
          peopleIds: [matchedPerson[0].person_id],
        };
        await sendgrid.sendMyMail(emailParams, async (resp) => {
          res.send(resp);
        });
      } else {
        res.send({
          code: 400,
          message: "failure",
        });
      }
    }
  } catch (error) {
    log({
      level: "error",
      message: "Error while reset password.",
      function: "resetPwd",
      params: "", // do not log params here. Security breach.
      error_code: 500,
      error_stack: error.stack,
    });
    res.send({
      code: 400,
      message: "failure",
    });
  }
}

async function clearTempUser(authUser) {
  try {
    const user = authUser.data;
    if (user.is_temp && user.last_login) {
      const collection = db.collection("people");
      const unsetArray = {
        $unset: { is_temp: "" },
      };
      await collection.updateOne({ person_id: user.person_id }, unsetArray);
    }
    return {
      code: 200,
      message: "ok",
    };
  } catch (error) {
    log({
      level: "error",
      message: "Error while clearing temp user.",
      function: "clearTempUser",
      params: "",
      error_code: 500,
      error_stack: error.stack,
    });
    return {
      code: 400,
      message: "failure",
    };
  }
}

async function setValidEmail(email) {
  try {
    // set email as validated
    let returnArray = {
      code: 200,
      message: "ok",
    };

    const collection = db.collection("people");
    const updatedDoc = await collection.updateOne(
      { user_id: email, "emails.email": email },
      {
        $set: { "emails.$.date_validated": new Date() },
      },
      { runValidators: true }
    );

    if (!updatedDoc || updatedDoc.matchedCount === 0) {
      log({
        level: "error",
        message:
          "Error matching user record with email address. No validation.",
        function: "setValidEmail",
        params: email,
        error_code: 500,
        error_stack: error.stack,
      });
      returnArray = {
        code: 500,
        message:
          "Error matching user record with email address. No validation.",
      };
    }
    return returnArray;
  } catch (error) {
    log({
      level: "error",
      message: "Error while setting valid email.",
      function: "setValidEmail",
      params: email,
      error_code: 500,
      error_stack: error.stack,
    });
    return {
      code: 400,
      message: "Failure setting valid email.",
    };
  }
}

async function login(req, res) {
  try {
    const date = new Date();
    const password = req.body.password;
    const collection = db.collection("people");
    const tempUser = req.body.tempUser || false;

    let API_request_header = req.headers.host + req.url;
    let request_payload = {
      email: req.body.email,
    };
    await collection.findOne(
      { user_id: req.body.email },
      async function (err, user) {
        if (user === null) {
          //User does not exist
          log({
            level: "info",
            message: `Incorrect User or Password - ${req.body.email}`,
            API_request_header: API_request_header,
            request_payload: "", //do not log payload here. Security breach
          });

          const response = {
            message: "Incorrect User or Password",
            token: null,
          };
          return res.status(400).send(response);
        } else {
          if (
            !tempUser &&
            !user.is_temp &&
            (!user.salt || !user.hash) &&
            !user.last_login
          ) {
            // USER HAS BEEN CREATED BY IMPORT CODE OR SIMILAR AND HAS NEVER LOGGED IN
            log({
              level: "debug",
              message: `User has been created by import code or similar and has never logged in - ${req.body.email}`,
              API_request_header: API_request_header,
              request_payload: "", //do not log payload here. Security breach
            });
            const response = {
              message: "neverloggedin",
              token: null,
              data: user,
            };
            return res.status(403).send(response);
          }

          if (
            tempUser ||
            ValidHash(password, user.salt || "", user.hash || "")
          ) {
            // SUCCESS LOG IN
            req.body;
            const token = await GenerateAuthToken(user.person_id, tempUser);

            let unsetArray = {
              temp_ttl: "",
              temp_hash: "",
              temp_salt: "",
              temp_key: "",
              temp_code: "",
            };
            if (!tempUser) {
              unsetArray = {
                ...unsetArray,
                is_temp: "",
              };
            }
            let setArray = {};
            if (!tempUser) {
              setArray = {
                ...setArray,
                last_login: date,
              };
            }
            if (!user.default_timezone && req.body.default_timezone) {
              setArray = {
                ...setArray,
                default_timezone: req.body.default_timezone,
              };
            }
            await collection.updateOne(
              { user_id: req.body.email },
              {
                $set: setArray,
                $unset: unsetArray,
              },
              { runValidators: true }
            );

            //User has deleted themselves
            if (user.date_deleted) {
              log({
                level: "info",
                message: `User Account deleted - ${req.body.email}`,
                API_request_header: API_request_header,
                request_payload: request_payload,
              });
              const response = {
                message: "User Account Deleted",
                token: null,
              };
              const params = {
                person_id: user.person_id,
              };
              const auth = {
                data: {
                  person_id: user.person_id,
                },
              };
              const restoreResponse = await unDeleteMyUser(params, auth);
              if (restoreResponse.code === 200) {
                const response = {
                  message: "",
                  token: token,
                  data: user,
                };
                return res.status(201).send(response);
              } else {
                const response = {
                  message: restoreResponse.message,
                  data: user,
                };
                return res.status(restoreResponse.code).send(response);
              }
            } else {
              log({
                level: "info",
                message: `User logged in successfully - ${req.body.email}`,
                API_request_header: API_request_header,
                request_payload: "", //do not log payload here. Security breach
              });
              const response = {
                message: "",
                token: token,
                data: user,
              };
              return res.status(201).send(response);
            }
          } else {
            log({
              level: "info",
              message: `Wrong password - ${req.body.email}`,
              API_request_header: API_request_header,
              request_payload: "", //do not log payload here. Security breach
            });
            const response = {
              message: "Incorrect User or Password",
              token: null,
            };
            return res.status(400).send(response);
          }
        }
      }
    );

    //res.json(myDoc);
  } catch (err) {
    log({
      level: "error",
      message: `Error occurred while doing login by - ${req.body.email}`,
      error_code: 500,
      error_stack: err.stack,
      API_request_header: API_request_header,
      request_payload: "", //do not log payload here. Security breach,
    });
  }
}

async function updateUserImage(params, auth) {
  try {
    const date = new Date();
    const collection = db.collection("people");
    let fieldArray = {};
    const img = params.image;
    const thumbnail = params.thumbnail;
    if (img) {
      fieldArray = {
        ...fieldArray,
        date_modified: date,
        modified_by: auth.data.person_id,
        image: img,
        thumbnail: thumbnail,
      };
    }

    await collection.updateOne(
      { person_id: params.person_id },
      {
        $set: fieldArray,
      },
      { runValidators: true }
    );
    const myUser = await collection.findOne({ person_id: params.person_id });
    return myUser;
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while updating user image.",
      function: "updateUserImage",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function deleteMyUser(params, auth) {
  try {
    const userID = auth.data.person_id;
    const userToDelete = params.person_id;
    const userEmailId = params.email_id;
    const isRadmin = params.is_radmin;
    const date = new Date();
    const selectedNonProfit = params.selectedNonProfit;

    //NOTE: YOU ARE ONLY ALLOWED TO DELETED YOURSELF
    if (userID == userToDelete) {
      /* Deleted User Record */
      const query = { person_id: userID };
      let fieldArray = null;
      if (selectedNonProfit) {
        fieldArray = {
          deleted_by: userID,
          date_deleted: date,
          modified_by: userID,
          date_modified: date,
          donate_remaining_gems: selectedNonProfit,
        };
      } else {
        fieldArray = {
          deleted_by: userID,
          date_deleted: date,
          modified_by: userID,
          date_modified: date,
        };
      }
      let setArray = { $set: fieldArray };
      let options = {
        upsert: true,
        runValidators: true,
      };
      const collection = db.collection("people");
      await collection.updateOne(query, setArray, options);

      /* Delete all GROUPS where CurrentUser is the only Admin */
      // Fetching the groups where current user is an admin
      const currentUserAdminGroups = await collection
        .aggregate([
          {
            $match: {
              person_id: userID,
            },
          },
          {
            $unwind: {
              path: "$groups", //must unwind the groups in people to be able to test each group for the person.
            },
          },
          {
            $match: {
              "groups.date_deleted": null,
              "groups.role": "admin",
            },
          },
          {
            $project: {
              group_id: "$groups.group_id",
            },
          },
        ])
        .toArray();

      let currentUserAdminGroupsIds = [];
      options = {
        runValidators: true,
      };
      if (currentUserAdminGroups.length > 0) {
        // Separating the group ids
        currentUserAdminGroups.forEach((currentUserAdminGroup) => {
          currentUserAdminGroupsIds.push(currentUserAdminGroup.group_id);
        });
        // Matching & Fetching the groups where other users as also an admin
        const otherUsersAdminGroups = await collection
          .aggregate([
            {
              $match: {
                person_id: { $ne: userID },
                date_deleted: null,
              },
            },
            {
              $unwind: {
                path: "$groups", //must unwind the groups in people to be able to test each group for the person.
              },
            },
            {
              $match: {
                "groups.group_id": { $in: currentUserAdminGroupsIds },
                "groups.date_deleted": null,
                "groups.role": "admin",
              },
            },
            {
              $project: {
                group_id: "$groups.group_id",
              },
            },
          ])
          .toArray();
        let otherUsersAdminGroupsIds = [];
        otherUsersAdminGroups.forEach((otherUsersAdminGroup) => {
          let idAlreadyExists = false;
          otherUsersAdminGroupsIds.forEach((id) => {
            if (id === otherUsersAdminGroup.group_id) {
              idAlreadyExists = true;
            }
          });
          if (!idAlreadyExists) {
            otherUsersAdminGroupsIds.push(otherUsersAdminGroup.group_id);
          }
        });
        let groupsToBeRemoved = [];
        // Separating all GROUPS where CurrentUser is the only Admin
        currentUserAdminGroupsIds.forEach((currentUserAdminGroupsId) => {
          let idAlreadyExists = false;
          otherUsersAdminGroupsIds.forEach((otherUsersAdminGroupsId) => {
            if (currentUserAdminGroupsId === otherUsersAdminGroupsId) {
              idAlreadyExists = true;
            }
          });
          if (!idAlreadyExists) {
            groupsToBeRemoved.push(currentUserAdminGroupsId);
          }
        });
        if (groupsToBeRemoved.length > 0) {
          const groupCollection = db.collection("groups");
          setArray = {
            $set: {
              date_deleted: date,
              deleted_by: userID,
            },
          };
          await groupCollection.updateMany(
            { group_id: { $in: groupsToBeRemoved }, date_deleted: null },
            setArray,
            options
          );
        }
      }

      /* Delete all future EVENTS where CurrentUser is the creator */
      let eventsToBeDeleted = [];
      let eventQuery = {
        created_by: userID,
        date_deleted: null,
      };
      const eventCollection = db.collection("events");
      const events = await eventCollection.find(eventQuery).toArray();
      let currentDate = new Date();
      currentDate.setUTCHours(0, 0, 0, 0);
      events.forEach((event) => {
        let isFutureEvent = false;
        if (event.proposed_date1 || event.proposed_date2) {
          if (event.proposed_date1) {
            let eventDate = new Date(event.proposed_date1);
            eventDate.setUTCHours(0, 0, 0, 0);
            isFutureEvent = eventDate > currentDate ? true : false;
          }
          if (event.proposed_date2) {
            let eventDate = new Date(event.proposed_date2);
            eventDate.setUTCHours(0, 0, 0, 0);
            isFutureEvent = eventDate > currentDate ? true : isFutureEvent;
          }
        } else {
          isFutureEvent = true;
        }
        if (isFutureEvent) {
          eventsToBeDeleted.push(event.event_id);
        }
      });
      if (eventsToBeDeleted.length > 0) {
        const eventFilter = { event_id: { $in: eventsToBeDeleted } };
        setArray = {
          $set: {
            date_deleted: date,
            deleted_by: userID,
          },
        };
        await eventCollection.updateMany(eventFilter, setArray, options);
      }

      /* Delete all PLACES where CurrentUser is the creator */
      const placeCollection = db.collection("places");
      let placeQuery = {
        created_by: userID,
        date_deleted: null,
      };
      setArray = {
        $set: {
          date_deleted: date,
          deleted_by: userID,
        },
      };
      await placeCollection.updateMany(placeQuery, setArray, options);

      /* Delete Radmin Record if CurrentUser isRadim */
      //USE: users.toggleRadmin, don't pass "add_radmin" param should unset.

      // CREATE LINK
      const link = `${process.env.SERVER_PATH}login`;
      // SEND EMAIL
      const emailParams = {
        to: [userEmailId],
        from: `${from} <info@radishapp.io>`,
        subject: "Your Radish Account Has Been Deleted!",
        emailTemplate: "removeAccountConfirm",
        emailBody: "Your Radish Account Has Been Deleted!",
        emailLink: link,
        type: "email",
        moduleName: "removeAccountConfirm",
        peopleIds: [userID],
      };
      await sendgrid.sendMyMail(emailParams, async (resp) => {
        if (resp.code === 202) {
          log({
            level: "debug",
            message: "Account removed info email generated successfully.",
            function: "deleteMyUser",
          });
        } else {
          log({
            level: "error",
            message: "Error while generating account removed info email.",
            function: "deleteMyUser",
            params: params,
            error_code: resp.code,
            error_stack: resp,
          });
        }
      });
      const myDoc = "account deleted";

      if (isRadmin) {
        const radishadminCollection = db.collection("radishadmins");
        await radishadminCollection.updateOne(
          { admin_id: userID },
          setArray,
          options
        );
      }
      log({
        level: "info",
        message: `${userEmailId} has deleted their account`,
      });
      return myDoc;
    } else {
      const myDoc = "you don not have permission to delete this user";
      return myDoc;
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while deleting user.",
      function: "deleteMyUser",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

//Un-Delete my user account.
async function unDeleteMyUser(params, auth) {
  let response = {};
  try {
    const userID = auth.data.person_id;
    const userToUnDeleteDelete = params.person_id;
    const date = new Date();

    //NOTE: YOU ARE ONLY ALLOWED TO RESORE YOURSELF
    if (userID == userToUnDeleteDelete) {
      /* Deleted User Record */
      const collection = db.collection("people");
      const deletedUserDetails = await collection
        .find({
          person_id: userID,
        })
        .toArray();
      /* Set the people record to not deleted */
      let updateArray = {
        $set: {
          date_modified: date,
          modified_by: auth.data.person_id,
        },
        $unset: {
          deleted_by: "",
          date_deleted: "",
        },
      };
      let options = {
        upsert: true,
        runValidators: true,
      };
      const query = { person_id: userID };
      const result = await collection.updateOne(query, updateArray, options);
      /* Undelete all GROUPS where date_deleted & deleted_by match the user being restored */
      const deletedDate = deletedUserDetails[0].date_deleted;
      const groupCollection = db.collection("groups");
      const deletedGroups = await groupCollection
        .find({ date_deleted: deletedDate, deleted_by: userID })
        .project({
          group_id: 1,
        })
        .toArray();
      options = {
        runValidators: true,
      };
      let groupsToBeUndeleted = [];
      deletedGroups.forEach((group) => {
        groupsToBeUndeleted.push(group.group_id);
      });
      if (groupsToBeUndeleted.length > 0) {
        await groupCollection.updateMany(
          { group_id: { $in: groupsToBeUndeleted } },
          updateArray,
          options
        );
      }

      /* Undelete all future EVENTS date_deleted & deleted_by match the user being restored */
      let eventsToBeUnDeleted = [];
      let eventQuery = {
        date_deleted: deletedDate,
        deleted_by: userID,
      };
      const eventCollection = db.collection("events");
      const events = await eventCollection.find(eventQuery).toArray();
      let currentDate = new Date();
      currentDate.setUTCHours(0, 0, 0, 0);
      events.forEach((event) => {
        let isFutureEvent = false;
        if (event.proposed_date1 || event.proposed_date2) {
          if (event.proposed_date1) {
            let eventDate = new Date(event.proposed_date1);
            eventDate.setUTCHours(0, 0, 0, 0);
            isFutureEvent = eventDate > currentDate ? true : false;
          }
          if (event.proposed_date2) {
            let eventDate = new Date(event.proposed_date2);
            eventDate.setUTCHours(0, 0, 0, 0);
            isFutureEvent = eventDate > currentDate ? true : isFutureEvent;
          }
        } else {
          isFutureEvent = true;
        }
        if (isFutureEvent) {
          eventsToBeUnDeleted.push(event.event_id);
        }
      });
      if (eventsToBeUnDeleted.length > 0) {
        const eventFilter = { event_id: { $in: eventsToBeUnDeleted } };
        await eventCollection.updateMany(eventFilter, updateArray, options);
      }
      /* Undelete all PLACES where date_deleted & deleted_by match the user being restored */
      const placeCollection = db.collection("places");
      let placeQuery = {
        date_deleted: deletedDate,
        deleted_by: userID,
      };
      await placeCollection.updateMany(placeQuery, updateArray, options);
      /* Undelete Radmin Record if user being restored was a Radish Admin */
      const radishadminCollection = db.collection("radishadmins");
      await radishadminCollection.updateOne(
        { admin_id: userID },
        updateArray,
        options
      );
      /* Send Welcome Back do Radish Email */
      // CREATE LINK
      const link = `${process.env.SERVER_PATH}login`;
      // SEND EMAIL
      const emailParams = {
        to: [deletedUserDetails[0].user_id],
        from: `${from} <info@radishapp.io>`,
        subject: " Your Radish Account Has Been Restored!",
        emailTemplate: "welcomeBackEmail",
        emailBody: "Your Radish Account Has Been Restored!",
        emailLink: link,
        type: "email",
        moduleName: "welcomeBackEmail",
        peopleIds: [deletedUserDetails[0].person_id],
      };
      await sendgrid.sendMyMail(emailParams, async (resp) => {
        if (resp.code === 202) {
          log({
            level: "debug",
            message: "Wecome back email generated successfully.",
            function: "unDeleteMyUser",
          });
        } else {
          log({
            level: "error",
            message: "Error while generating welcome back email.",
            function: "unDeleteMyUser",
            params: params,
            error_code: resp.code,
            error_stack: resp,
          });
        }
      });
      response = {
        code: 200,
        message: "Account restored",
      };
      log({
        level: "info",
        message: `${deletedUserDetails[0].user_id} has restored their account`,
      });
      return response;
    } else {
      response = {
        code: 403,
        message: "Not having permission to restore the account",
      };
      return response;
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while restoring account.",
      function: "unDeleteMyUser",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    response = {
      code: 500,
      message: "Error occurred while restoring account",
    };
    return response;
  }
}

async function deleteAccountInfo(params, authUser) {
  try {
    const collection = db.collection("people");

    const filterArray = {
      person_id: params.person_id,
    };

    const pullArray = {
      $pull: {
        [params.collection]: { [params.match_field]: params.match_value },
      },
    };

    await collection.updateOne(filterArray, pullArray);

    myDoc = await getUserDetails(params.person_id);
    let emailsArray = [];
    emailsArray.push(myDoc[0].user_id);
    if (params.match_field === "email") {
      emailsArray.push(params.match_value);
      // CREATE LINK
      const link = `${process.env.SERVER_PATH}login`;
      // SEND EMAIL
      const emailParams = {
        to: emailsArray,
        from: `${from} <info@radishapp.io>`,
        subject: "Email removed from your Radish account",
        emailTemplate: "removeEmailConfirm",
        emailBody: "Email Address Removed",
        emailLink: link,
        first_name: myDoc[0].first_name,
        last_name: myDoc[0].last_name,
        removed_email: params.match_value,
        type: "email",
        moduleName: "removeEmailConfirm",
        peopleIds: [params.person_id],
      };
      await sendgrid.sendMyMail(emailParams, async (resp) => {
        if (resp.code === 202) {
          log({
            level: "debug",
            message:
              "Email address removed information email generated successfully.",
            function: "deleteAccountInfo",
          });
        } else {
          log({
            level: "error",
            message:
              "Error while generating email address removed information email.",
            function: "deleteAccountInfo",
            params: params,
            error_code: resp.code,
            error_stack: resp,
          });
        }
      });
    }

    return { data: myDoc, message: "ok" };
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while deleting account info.",
      function: "deleteAccountInfo",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    return null;
  }
}

async function updateAccountInfo(params, authUser) {
  try {
    const collection = db.collection("people");
    let changeValue = params.change_value;
    if (changeValue === "on") {
      changeValue = true;
    }
    const matchWhat = params.collection + "." + params.match_field; // i.e. "emails.email" or "phones.phone"

    const saveWhat = params.collection + ".$." + params.change_field; // i.e. "emails.$.type" or "phones.$.type"

    const filterArray = {
      person_id: params.person_id,
      [matchWhat]: params.match_value,
    };

    if (params.change_field === "primary") {
      changeValue = true; //have to force the change value to be a bool, not a string
    }

    const setArray = {
      $set: {
        [saveWhat]: changeValue,
      },
    };

    if (params.change_field === "primary") {
      // if changing Primary, reset all to false first
      const primaryFilter = { person_id: params.person_id };
      const primarySave = params.collection + ".$[].primary";
      let primarySetArray = {
        $set: {
          [primarySave]: false,
        },
      };
      if (params.match_field === "email") {
        const date = new Date();
        primarySetArray = {
          $set: {
            [primarySave]: false,
            user_id: params.match_value,
            date_modified: date,
            modified_by: params.person_id,
          },
        };
      }
      // console.log('primaryFilter ' + JSON.stringify(primaryFilter) + ' primarySave ' + JSON.stringify(primarySave));
      let existingData = await getUserDetails(params.person_id);
      let emailsArray = [];
      let existingEmails = existingData[0].emails;
      existingEmails.forEach((email) => {
        if (email.primary && email.primary === true) {
          emailsArray.push(email.email);
        }
      });
      emailsArray.push(params.match_value);
      await collection.updateOne(primaryFilter, primarySetArray, {
        multi: true,
      });
      // CREATE LINK
      const link = `${process.env.SERVER_PATH}login`;
      // SEND EMAIL
      const emailParams = {
        to: emailsArray,
        from: `${from} <info@radishapp.io>`,
        subject: "Radish Primary Email Changed",
        emailTemplate: "primaryEmailChanged",
        emailBody: "Radish Primary Email Changed",
        emailLink: link,
        type: "email",
        moduleName: "primaryEmailChanged",
        peopleIds: [params.person_id],
      };
      await sendgrid.sendMyMail(emailParams, async (resp) => {
        if (resp.code === 202) {
          log({
            level: "debug",
            message:
              "Primary email address changed information email generated successfully.",
            function: "updateAccountInfo",
          });
        } else {
          log({
            level: "error",
            message:
              "Error while generating primary email address changed information email.",
            function: "updateAccountInfo",
            params: params,
            error_code: resp.code,
            error_stack: resp,
          });
        }
      });
    }
    await collection.updateOne(filterArray, setArray, { runValidators: true });
    const userDetails = await getUserDetails(params.person_id);
    return { data: userDetails, message: "ok" };
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while updating account info.",
      function: "updateAccountInfo",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    return {
      data: null,
      message: "Snap! Error saving change.",
    };
  }
}

async function getUserDetails(id) {
  // retrieves single user
  try {
    const collection = db.collection("people");
    const myDoc = await collection
      .find({ person_id: id })
      .project({
        person_id: 1,
        first_name: 1,
        last_name: 1,
        display_name: 1,
        emails: 1,
        phones: 1,
        email_code: 1,
      })
      .toArray();
    return myDoc;
  } catch (err) {
    log({
      level: "error",
      message: `Error occurred while fetching user details, id: ${id}.`,
      function: "getUserDetails",
      error_code: 500,
      error_stack: err.stack,
    });
    return null;
  }
}

async function insertUserEmail(params, authUser) {
  try {
    log({ level: "info", message: "insertUserEmail" });
    const collection = db.collection("people");
    const emailAddress = params.email;

    const orgID = params.org_id;
    let myOrg;
    if (orgID) {
      // making sure email address matches approved org domain(s)
      let matched = false;
      myOrg = await organizations.getOrganization(orgID, authUser);
      for (let i = 0; i < myOrg.domains.length; i++) {
        if (myOrg.domains[i] === emailAddress.split("@")[1]) {
          matched = true;
        }
      }
      if (!matched) {
        return {
          code: 500,
          errmessage: `Invalid email domain. Must match an approved domain for ${myOrg.name}.`,
        };
      }
    }

    // TEST FOR DUPLICATE. EMAIL ALREADY IN USE
    //if (!orgID) {
    const myUser = await collection
      .find({
        // searching entire collection
        "emails.email": emailAddress,
      })
      .project({ person_id: 1 })
      .toArray();

    if (myUser.length > 0) {
      // we have a duplicate email already in use
      if (orgID) {
        // test if email belongs to the user. If so, that's okay.
        if (myUser[0].person_id !== authUser.data.person_id) {
          // send message and bail out.
          //const errorMsg = "Email already in use.";
          return {
            code: 500,
            errmessage: "Email already in use by another user.",
          };
        }
      } else {
        // send message and bail out.
        //const errorMsg = "Email already in use.";
        return {
          code: 500,
          errmessage: "Email already in use.",
        };
      }
    }
    //}

    const confirmCode = Math.floor(Math.random() * 90000) + 10000; // 5-digit random nbr;
    const user = authUser.data;
    await collection.updateOne(
      { person_id: user.person_id },
      {
        $set: { temp_email_code: `${confirmCode}|${emailAddress}` },
      }
    );

    // SEND EMAIL TO ADDED EMAIL ADDRESS WITH CONFIRMATION CODE
    const emailParams2 = {
      to: [emailAddress],
      from: `${from} <info@radishapp.io>`,
      subject: "Confirm new email address in Radish.",
      emailTemplate: "addEmailCode",
      emailBody: `Confirm Email Address`,
      confirmCode: confirmCode,
      //emailLink: link,
      first_name: user.first_name,
      last_name: user.last_name,
      new_email: emailAddress,
      type: "email",
      moduleName: "addEmailCode",
      peopleIds: [params.person_id],
    };
    await sendgrid.sendMyMail(emailParams2, async (resp) => {
      if (resp.code === 202) {
        log({
          level: "debug",
          message:
            "Confirm code Email address added to Radish account email generated successfully.",
          function: "insertUserEmail",
        });
      } else {
        log({
          level: "error",
          message:
            "Error while generating email confirm code email added to Radish account email.",
          function: "insertUserEmail",
          params: params,
          error_code: resp.code,
          error_stack: resp,
        });
      }
    });
    return user.person_id;
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while inserting user email.",
      function: "insertUserEmail",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function getUserDetails(id) {
  // retrieves single user
  try {
    const collection = db.collection("people");
    const myDoc = await collection
      .find({ person_id: id })
      .project({
        person_id: 1,
        user_id: 1,
        first_name: 1,
        last_name: 1,
        display_name: 1,
        emails: 1,
        phones: 1,
      })
      .toArray();
    return myDoc;
  } catch (err) {
    log({
      level: "error",
      message: `Error occurred while fetching user details, id: ${id}.`,
      function: "getUserDetails",
      error_code: 500,
      error_stack: err.stack,
    });
    return null;
  }
}

async function insertUserPhone(params, auth) {
  try {
    const collection = db.collection("people");

    // TEST FOR DUPLICATE. PHONE ALREADY IN USE
    const phoneNumber = params.phones.phone;
    const myUser = await collection
      .find({
        // searching entire collection
        "phones.phone": phoneNumber,
      })
      .project({ person_id: 1 })
      .toArray();

    if (myUser.length > 0) {
      // we have a duplicate phone already in use
      // send message and bail out.
      return {
        data: null,
        errmessage: "Phone already in use.",
      };
    }

    await collection.updateOne(
      { person_id: params.person_id },
      {
        $push: {
          phones: params.phones,
        },
      },
      { runValidators: true }
    );
    const user = await collection
      .find({ person_id: params.person_id })
      .project({
        person_id: 1,
        first_name: 1,
        last_name: 1,
        display_name: 1,
        emails: 1,
        phones: 1,
      })
      .toArray();
    return user;
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while inserting user phone.",
      function: "insertUserPhone",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function updateCurrentUser(params, auth) {
  try {
    const date = new Date();
    const collection = db.collection("people");
    let fieldArray = {};

    for (let key in params) {
      // build fieldArray from req.body
      if (params.hasOwnProperty(key)) {
        if (key !== "person_id") {
          let myKey = key;
          let value = params[key];
          let obj = {};
          obj[myKey] = value;
          fieldArray = {
            ...fieldArray,
            [myKey]: value,
          };
        }
      }
    }
    fieldArray = {
      ...fieldArray,
      date_modified: date,
      modified_by: auth.data.person_id,
    };

    const updatedUser = await collection.updateOne(
      { person_id: params.person_id },
      {
        $set: fieldArray,
      },
      { runValidators: true }
    );

    // just return the fields that were saved
    let projectArry = { person_id: 1 };
    for (let key in fieldArray) {
      if (fieldArray.hasOwnProperty(key)) {
        let myKey = key;
        projectArry = {
          ...projectArry,
          [myKey]: 1,
        };
      }
    }

    const myUser = await collection
      .find({ person_id: params.person_id })
      .project(projectArry)
      .toArray();

    log({
      level: "info",
      message: `${auth.data.user_id} updated User Account Data`,
      function: "updateCurrentUser",
      params: params,
    });
    return myUser;
  } catch (err) {
    log({
      level: "error",
      message: "Error while update User Account Data",
      function: "updateCurrentUser",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    return null;
  }
}

async function toggleRadmin(params, auth) {
  try {
    if (auth.isRadishAdmin) {
      const date = new Date();
      const admins = db.collection("radishadmins");

      if (params.add_radmin) {
        //SET RADMIN
        await admins.updateOne(
          { admin_id: params.person_id },
          {
            $set: {
              admin_id: params.person_id,
              date_created: date,
              date_modified: date,
              created_by: auth.data.person_id,
              modified_by: auth.data.person_id,
            },
            $unset: {
              deleted_by: "",
              date_deleted: "",
            },
          },
          { upsert: true, runValidators: true }
        );
      } else {
        //UNSET RADMIN
        await admins.updateOne(
          { admin_id: params.person_id },
          {
            $set: {
              deleted_by: auth.data.person_id,
              date_deleted: date,
              date_modified: date,
              modified_by: auth.data.person_id,
            },
          },
          { upsert: true, runValidators: true }
        );
      }

      const myUser = "Radmin Set";

      return myUser;
    } else {
      log({
        level: "debug",
        message: "Not an Radminsadmin",
        function: "toggleRadmin",
      });
      const myUser = "Not a Radmin";
      return myUser;
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while toggling radmin.",
      function: "toggleRadmin",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      data: null,
      message: err.message,
    });
  }
}

//API to send authorization code
async function sendAuthorizationCode(params, authUser, res) {
  try {
    const email = params.email;
    const code = params.code;
    const orgId = params.org_id;
    // CREATE LINK
    const link = `${process.env.SERVER_PATH}login`;
    //GET THE RELATED ORG NAME
    const orgName = await organizations.getOrganization(orgId, authUser, true);
    const emailParams = {
      to: [email],
      from: `${from} <info@radishapp.io>`,
      subject: "Radish Authorization Code",
      emailTemplate: "authorizationCode",
      emailHeading: "Authorization Code",
      emailBody: "Authorization Code",
      emailLink: link,
      data: code,
      orgName: orgName,
      type: "email",
      moduleName: "authorizationCode",
      peopleIds: [authUser.data.person_id],
    };
    await sendgrid.sendMyMail(emailParams, async (resp) => {
      res.send(resp);
    });
  } catch (error) {
    log({
      level: "error",
      message: "Error occurred while sending authorization code.",
      function: "sendAuthorizationCode",
      params: params,
      error_code: 500,
      error_stack: error.stack,
    });
    response = {
      code: 400,
      message: "Snap! Error sending authorization code.",
    };
    return response;
  }
}

//API to get notification preferences
async function getNotificationPrefernces(person_id, res) {
  try {
    const collection = db.collection("people");
    const myDoc = await collection.findOne(
      { person_id: person_id },
      { projection: { digest_preferences: 1 } }
    );
    res.send({
      data: myDoc,
      message: "ok",
      code: 200,
    });
  } catch (err) {
    log({
      level: "error",
      message: `Error while fetching notification prefernces, person_id: ${person_id}.`,
      function: "getNotificationPrefernces",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error while fetching notification prefernces.",
    });
  }
}

//API to update notification preferences
async function updateNotificationPreferences(params, res) {
  try {
    const date = new Date();
    const collection = db.collection("people");
    let fieldArray = {
      notification_preferences: params.notification_preferences,
      date_modified: date,
      modified_by: params.person_id,
    };

    await collection.updateOne(
      { person_id: params.person_id },
      {
        $set: fieldArray,
      },
      { runValidators: true }
    );
    const myUser = await collection.findOne(
      { person_id: params.person_id },
      { projection: { notification_preferences: 1 } }
    );
    res.send({
      data: myUser,
      message: "ok",
      code: 200,
    });
  } catch (err) {
    log({
      level: "error",
      message: "Error while updating user notification preferences",
      function: "updateNotificationPreferences",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error while updating user notification preferences.",
    });
  }
}

//Function to get users having digest preferences
async function getDailyDigestEnabledUsers() {
  try {
    const collection = db.collection("people");
    const digestPreferences = await collection
      .aggregate([
        {
          $match: {
            date_deleted: null,
          },
        },
        {
          $unwind: {
            path: "$digest_preferences",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            "digest_preferences.digest_on": true,
          },
        },
        {
          $project: {
            person_id: 1,
            first_name: 1,
            last_name: 1,
            user_id: 1,
          },
        },
      ])
      .toArray();
    return digestPreferences;
  } catch (err) {
    log({
      level: "error",
      message: `Error while fetching digest enabled users.`,
      function: "getDailyDigestEnabledUsers",
      params: condition,
      error_code: 500,
      error_stack: err.stack,
    });
    return;
  }
}

//Function to get all active users
async function getAllActiveUsers() {
  try {
    const collection = db.collection("people");
    const persons = await collection
      .aggregate([
        {
          $match: {
            date_deleted: null,
          },
        },
        {
          $project: {
            person_id: 1,
            first_name: 1,
            last_name: 1,
            user_id: 1,
            default_timezone: 1,
          },
        },
      ])
      .toArray();
    return persons;
  } catch (err) {
    log({
      level: "error",
      message: `Error while fetching all active users.`,
      function: "getAllActiveUsers",
      params: condition,
      error_code: 500,
      error_stack: err.stack,
    });
    return;
  }
}

//Function to get users having digest preferences
async function getUsersHavingHandRaisedData() {
  try {
    const collection = db.collection("people");
    const persons = await collection
      .aggregate([
        {
          $match: {
            date_deleted: null,
            open_dates: { $ne: null },
          },
        },
        {
          $project: {
            person_id: 1,
            default_timezone: 1,
            open_dates: 1,
            see_hand: 1,
            hand_tz: 1,
          },
        },
      ])
      .toArray();
    return persons;
  } catch (err) {
    log({
      level: "error",
      message: `Error while fetching users having hand raised data.`,
      function: "getUsersHavingHandRaisedData",
      error_code: 500,
      error_stack: err.stack,
    });
    return;
  }
}

module.exports = {
  clearHint,
  raiseHand,
  getCurrentUser,
  getUser,
  getRadmins,
  insertUser,
  insertAccept,
  checkTempCode,
  sendTempCode,
  getTempUser,
  resetPwd,
  login,
  updateUserImage,
  updateCurrentUser,
  insertUserEmail,
  updateAccountInfo,
  insertUserPhone,
  deleteMyUser,
  deleteAccountInfo,
  changePassword,
  toggleRadmin,
  sendAuthorizationCode,
  getUsersRadmin,
  clearTempUser,
  setValidEmail,
  checkEmailCode,
  getInvited,
  getNotificationPrefernces,
  updateNotificationPreferences,
  getDailyDigestEnabledUsers,
  getUsersHavingHandRaisedData,
  getAllActiveUsers,
};
