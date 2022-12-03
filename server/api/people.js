const groups = require("./groups.js");
const organizations = require("./organizations.js");
/* const events = require("./events.js"); */
const log = require("./logger.js").insertServerLogs;
//const events = require("./events.js");

async function logSupportMessage(params, authUser) {
  try {
    const message = params.message;
    const orgId = params.org_id;
    const senderId = authUser.data.person_id;
    const collection = db.collection("support_messages");
    const result = await collection.insertOne({
      message: message,
      org_id: orgId,
      created_by: senderId,
      date_created: new Date(),
    });

    // SEND EMAIL TO SUPPORT
    const sendgrid = require("./sendgrid.js");
    const messageId = result.insertedId;
    const emailParams = {
      to: ["support@radishapp.io"],
      from: "support@radishapp.io",
      replyTo: authUser.data.user_id,
      subject: "New Radish Support Message",
      emailTemplate: "supportMsg",
      emailLink: "",
      emailHeading: `New support message from ${authUser.data.first_name} ${authUser.data.last_name} (${authUser.data.user_id})`,
      emailBody: message,
      eventName: "",
      senderPersonId: senderId,
      moduleId: "",
      moduleName: "",
      type: "email",
      peopleIds: [senderId],
    };
    await sendgrid.sendMyMail(emailParams, async (resp) => {
      if (resp.code !== 202) {
        log({
          level: "error",
          message: "Error sending support message via email.",
          function: "logSupportMessage",
          params: params,
          error_code: 500,
          error_stack: resp.message,
        });
      }
    });

    return {
      data: result,
      message: "ok",
      code: 200,
    };
  } catch (err) {
    log({
      level: "error",
      message: "Error while logging support message.",
      function: "logSupportMessage",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    return {
      code: 500,
      message: "Snap! Error logging support message.",
    };
  }
}

async function joinGroup(params, authUser) {
  // assume user joining suggested group they discovered on their own
  try {
    const person = authUser.data;
    const personID = person.person_id;
    const groupID = params.group_id;
    let isPermitted = false;
    let result = {
      message: "Error joining group",
      code: 500,
    };

    // make sure group is permissable to join
    const allowedGroups = await getSuggestedGroups({ idsOnly: true }, authUser);
    if (allowedGroups.data) {
      const groups = allowedGroups.data;
      groups.map((groupItem) => {
        if (groupItem === groupID) {
          isPermitted = true;
        }
      });
    }

    if (isPermitted) {
      // update the person record with the approved group
      const personCollection = db.collection("people");

      // Deal with allowing user to rejoin the group if they have left previously
      let unPushArray = {
        "groups.$.date_deleted": "",
        "groups.$.deleted_by": "",
      };
      let unSetArray = { $unset: unPushArray };
      let query = { person_id: personID, "groups.group_id": groupID };
      await personCollection.updateOne(query, unSetArray);

      // Deal with joining in a new group
      const updatedPerson = await personCollection.updateOne(
        { person_id: personID, "groups.group_id": { $ne: groupID } },
        {
          $push: {
            groups: {
              group_id: groupID,
              date_added: new Date(),
              added_by: personID,
            },
          },
        }
      );
      result = {
        data: updatedPerson,
        message: "ok",
        code: 200,
      };
    }

    return result;
  } catch (err) {
    log({
      level: "error",
      message: "Error while joining group.",
      function: "joinGroup",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    return {
      data: null,
      message: "Snap! Error joining group.",
    };
  }
}

async function getDefaultGroup(person) {
  try {
    let groupID = null;
    if (person.groups) {
      for (let i = 0; i < person.groups.length; i++) {
        if (person.groups[i].default_group) {
          groupID = person.groups[i].group_id;
        }
      }
    }
    return groupID;
  } catch (err) {
    log({
      level: "error",
      message: "Error while fetching default group details.",
      function: "getDefaultGroup",
      params: person,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function importPeople(params, authUser) {
  try {
    /* 
    1. Find matches in people collection based on params.emailArray. $Project person_id, user_id, matched email
    2. Remove matchedPeople from params.saveArray based on user_id (email).
    3. Bulk write newSaveArray as insert to people collection (all new people). $project person_id's
    4. [EMBEDED in #2 and #3 above] Create a combined people_id array based on combined array of poeple_ids returned from both #1 and #3 above.
    5. Insert new combined people results from #4 above into params.moduleName based on params.moduleId, i.e. events / event_id
    */

    const today = new Date();
    let combinedIDs = [];

    /* 1. Find matches in people collection based on params.emailArray. $Project person_id, user_id, matched email */
    const peopleCollection = db.collection("people");
    const matchedPeople = await peopleCollection
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
            "emails.email": { $in: params.emailArray },
            "emails.date_deleted": null,
          },
        },
        {
          $project: {
            person_id: 1,
            user_id: 1,
            email: "$emails.email",
          },
        },
      ])
      .toArray();
    /* 	If the users google contacts list has duplicate email entries, then import the first instance of the email. */
    const saveArray = params.saveArray;
    let newSaveArray = [];
    for (let i = 0; i < saveArray.length; i++) {
      let emailAlreadyExists = false;
      for (let x = 0; x < newSaveArray.length; x++) {
        if (saveArray[i].user_id === newSaveArray[x].user_id) {
          emailAlreadyExists = true;
        }
      }
      if (!emailAlreadyExists) {
        newSaveArray.push(saveArray[i]);
      }
    }
    /* 2. Remove matchedPeople from params.saveArray based on user_id (email) or based on matched email. */
    if (matchedPeople && matchedPeople.length > 0) {
      for (let x = 0; x < matchedPeople.length; x++) {
        //Check for duplicate invitees id
        if (combinedIDs && combinedIDs.length > 0) {
          if (!(combinedIDs.indexOf(matchedPeople[x].person_id) > -1)) {
            // this is a brand new user
            combinedIDs.push(matchedPeople[x].person_id);
          }
        } else {
          combinedIDs.push(matchedPeople[x].person_id);
        }
        for (let i = 0; i < newSaveArray.length; i++) {
          if (
            newSaveArray[i].user_id === matchedPeople[x].user_id ||
            newSaveArray[i].user_id === matchedPeople[x].email
          ) {
            newSaveArray.splice(i, 1);
            i -= 1;
          }
        }
      }
    }


    /* 3. Bulk write newSaveArray as insert to people collection (all new people). $project person_id's */
    for (let i = 0; i < newSaveArray.length; i++) {
      let cid = crypto.randomBytes(16).toString("hex");
      combinedIDs.push(cid);
      newSaveArray[i].person_id = cid;
      newSaveArray[i].created_by = authUser.data.person_id;
      newSaveArray[i].date_created = today;
      newSaveArray[i].modified_by = authUser.data.person_id;
      newSaveArray[i].date_modified = today;
      newSaveArray[i].invite_link = `${newSaveArray[i].first_name}-${crypto
        .randomBytes(4)
        .toString("hex")}`;
    }

    if (newSaveArray && newSaveArray.length > 0) {
      await peopleCollection.insertMany(newSaveArray);
    }

    /* 4.5 Insert friends into freind groups if needed */
    if (params.makeFriends) {

      //get default groupID for authUser
      let groupID = await getDefaultGroup(authUser.data);

      if (!groupID) {
        // inviter does not yet have a default group
        groupID = await groups.insertGroup(
          {
            group_description: "My default friend group",
            default_group: true,
            user_default: true,
          },
          authUser
        );
      }
      //add new people to inviter's default group
      let groupParams = {
        group_id: groupID,
        person_ids: combinedIDs,
      };
      groupID = await groups.addGroupMembers(groupParams, authUser);
    }

    /* 5. Insert new combined people results from #4 above into params.moduleName based on params.moduleId, i.e. events / event_id */
    let moduleCollection = null;
    let query = null;
    let pushArray = [];
    let invitees = null;
    switch (params.moduleName) {
      case "event":
        moduleCollection = db.collection("eventpeople");
        query = { event_id: params.moduleId, invited_id: { $in: combinedIDs } };
        // return and purge people who may have already been invited
        const existingInvitees = await moduleCollection
          .find(query)
          .project({ invited_id: 1 })
          .toArray();
        if (existingInvitees.length > 0) {
          for (let i = 0; i < existingInvitees.length; i++) {
            combinedIDs = combinedIDs.filter(
              (e) => e !== existingInvitees[i].invited_id
            );
          }
        }
        // TODO: [RAD-419] Edge case, if pulling contacts in from Google or other sources, need to handle dateDeleted
        for (let i = 0; i < combinedIDs.length; i++) {
          const tempArray = {
            eventpeople_id: crypto.randomBytes(16).toString("hex"),
            event_id: params.moduleId,
            date_modified: today,
            date_created: today,
            modified_by: authUser.data.person_id,
            created_by: authUser.data.person_id,
            inviter_id: authUser.data.person_id,
            invited_id: combinedIDs[i],
          };
          pushArray.push(tempArray);
        }
        if (combinedIDs.length > 0) {
          invitees = await moduleCollection.insertMany(pushArray);
        }

        break;
      default:
        log({ level: "debug", message: `nothing`, function: "importPeople" });
        break;
    }

    return invitees ? invitees.insertedIds : [];
  } catch (error) {
    log({
      level: "error",
      message: "Error while importing people.",
      function: "importPeople",
      params: params,
      error_code: 500,
      error_stack: error.stack,
    });
    return "error inserting contacts at at server.";
  }
}

async function saveOrgAdmin(params, auth) {
  try {
    const personID = params.person_id;
    const orgID = params.org_id;
    const isAdmin = params.isAdmin || false;
    const collection = db.collection("people");
    // test if auth user is allowed to save this data
    let authorized = false;
    const authDoc = await collection.findOne(
      {
        person_id: auth.data.person_id,
      },
      {
        projection: {
          organizations: 1,
        },
      }
    );
    for (let i = 0; i < authDoc.organizations.length; i++) {
      if (
        authDoc.organizations[i].admin &&
        authDoc.organizations[i].org_id === orgID
      ) {
        authorized = true;
      }
    }

    if (authorized) {
      await collection.updateOne(
        { person_id: personID, "organizations.org_id": orgID },
        {
          $set: {
            "organizations.$.admin": isAdmin,
          },
        }
      );

      const responseDoc = await getOrgAdminPeople(params, auth);
      return {
        data: responseDoc.data,
        message: responseDoc.message,
      };
    } else {
      return {
        data: null,
        message: "unauthorized",
      };
    }
  } catch (error) {
    log({
      level: "error",
      message: "Error while saving org admin.",
      function: "saveOrgAdmin",
      params: params,
      error_code: 500,
      error_stack: error.stack,
    });
  }
}

async function getOrgAdminPeople(params, auth) {
  try {
    const orgID = params.org_id;
    let authorized = false;
    const collection = db.collection("people");

    // test if auth user is allowed to have this data
    const authDoc = await collection.findOne(
      {
        person_id: auth.data.person_id,
      },
      {
        projection: {
          organizations: 1,
        },
      }
    );
    for (let i = 0; i < authDoc.organizations.length; i++) {
      if (
        authDoc.organizations[i].admin &&
        authDoc.organizations[i].org_id === orgID
      ) {
        authorized = true;
      }
    }

    if (authorized) {
      const myDoc = await collection
        .aggregate([
          {
            $match: {
              date_deleted: null, //don't return any people who are deleted
            },
          },
          {
            $unwind: {
              path: "$organizations",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: {
              "organizations.org_id": orgID,
              "organizations.date_deleted": null,
              "people.date_deleted": null,
            },
          },
          {
            $sort: {
              last_name: 1,
              first_name: 1,
            },
          },
          {
            $project: {
              person_id: 1.0,
              first_name: 1.0,
              last_name: 1.0,
              date_created: 1.0,
              date_added: 1.0,
              open_dates: 1,
              hand_tz: 1,
              see_hand: 1,
              image: { $ifNull: ["$thumbnail", "$image"] },
              last_active: 1.0,
              admin: "$organizations.admin",
            },
          },
        ])
        .toArray();

      return {
        data: myDoc,
        message: "ok",
      };
    } else {
      return {
        data: null,
        message: "unauthorized",
      };
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error while fetching org admin people.",
      function: "getOrgAdminPeople",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function getPerson(id, authUser, testConnection = false) {
  try {
    // let's make sure user has right to retrieve this person
    const mutedPeople = authUser.data.muted_people || [];
    let myGroups = [];
    for (let i = 0; i < authUser.data.groups.length; i++) {
      if (!authUser.data.groups[i].date_deleted) {
        myGroups.push({
          group_id: authUser.data.groups[i].group_id,
          default_group: authUser.data.groups[i].default_group,
        });
      }
    }

    const peopleCollection = db.collection("people");
    const myPerson = await peopleCollection.findOne({
      person_id: id,
      date_deleted: null,
    });

    if (!myPerson) {
      // not a real person or is deleted
      return null;
    }

    let commonGroups = [];

    // test for valid connection
    let isValid = false;
    let personGroupIDs = [];
    if (myPerson.groups) {
      for (var i = 0; i < myPerson.groups.length; i++) {
        if (!myPerson.groups[i].date_deleted) {
          personGroupIDs.push({
            group_id: myPerson.groups[i].group_id,
            default_group: myPerson.groups[i].default_group,
          });
        }
      }
    }

    //this section walks through my groups, and the users groups, and return an array of the ones we have in common.
    for (var i = 0; i < personGroupIDs.length; i++) {
      for (var g = 0; g < myGroups.length; g++) {
        if (personGroupIDs[i].group_id === myGroups[g].group_id) {
          isValid = true;
          if (!personGroupIDs[i].default_group && !myGroups[g].default_group) {
            commonGroups = [...commonGroups, personGroupIDs[i].group_id];
          }
        }
      }
    }

    //TEST TO SEE IF VALID CONNECTION (For Events Visibility)  Can return at this point because there is o addiitional work needed.
    if (isValid) {
      if (testConnection) {
        return true;
      }
    }

    // get common group records
    const myCommonGroups = await groups.getGroups(commonGroups);

    let isAdminofCommonGroup = false;
    //Add admin role flag to any groups that "current user" is an admin of.
    if (myCommonGroups && myCommonGroups.length > 0) {
      for (var i = 0; i < authUser.data.groups.length; i++) {
        for (var x = 0; x < myCommonGroups.length; x++) {
          if (authUser.data.groups[i].group_id === myCommonGroups[x].group_id) {
            if (authUser.data.groups[i].role === "admin") {
              myCommonGroups[x].role = "admin";
              isAdminofCommonGroup = true;
            }
          }
        }
      }
    }

    // clean up projected fields
    let cleanPerson = {};

    cleanPerson = {
      ...cleanPerson,
      first_name: myPerson.first_name,
      last_name: myPerson.last_name,
      display_name: myPerson.display_name,
      image: myPerson.image,
      badges: myPerson.badges,
      open_dates: myPerson.open_dates,
      see_hand: myPerson.see_hand,
      isAdminofCommonGroup: isAdminofCommonGroup,
      commonGroups: myCommonGroups,
    };

    if (mutedPeople.length > 0) {
      if (mutedPeople.indexOf(myPerson.person_id) > -1) {
        cleanPerson.isMuted = true;
      }
    }

    //Just trying to load UserCardAbstract or FriendProfile  (uses group info, but not required to see the person)
    if (cleanPerson) {
      return cleanPerson;
    } else {
      return null;
    }
  } catch (err) {
    log({
      level: "error",
      message: `Error while fetching person details ${id}`,
      function: "getPerson",
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function getInviter(id) {
  try {
    // do NOT put auth code here. is public page calling this
    const collection = db.collection("people");
    const myDoc = await collection
      .find({ invite_link: id })
      .project({ person_id: 1, first_name: 1, last_name: 1 })
      .toArray();

    return {
      data: myDoc[0],
      message: "ok",
    };
  } catch (err) {
    log({
      level: "error",
      message: `Error while fetching inviter details ${id}`,
      function: "getInviter",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      data: null,
      message: "Oops! An error occurred with this invitation.",
    });
  }
}

async function getSuggestedGroups(params, authUser) {
  try {
    let myFriendsIds = [];
    let myCleanGroupIds = [];
    const orgId = params.org_id;
    const allowRejoin = params.allowRejoin || false; // Allow invited user to rejoin the group
    const fromShareLink = params.fromShareLink || false;

    let myOrgIds = [];
    let person = authUser.data;
    const idsOnly = params.idsOnly || false; // used when joining group to test if permitted

    for (let i = 0; i < person.groups.length; i++) {
      //FILTER OUT GROUPS I'VE LEFT
      if (!person.groups[i].date_deleted) {
        if (person.groups[i].group_id) {
          myCleanGroupIds.push(person.groups[i].group_id);
        }
      }
    }
    if (person.organizations) {
      for (let i = 0; i < person.organizations.length; i++) {
        //FILTER OUT ORGS I'VE LEFT
        if (!person.organizations[i].date_deleted) {
          if (person.organizations[i].org_id) {
            myOrgIds.push(person.organizations[i].org_id);
          }
        }
      }
    }

    myFriendsIds = await getMyFriendIDs(person, true); // TODO: fails when 2nd param (cleanGroups) is true;

    /* person.groups = myCleanGroupIds;
    const myFriendsOfFriendsIds = await getMyFriendIDs(person, false); // TODO: fails when 2nd param (cleanGroups) is true; */
    //swiched to method below 2-2-22 JEV to fix that some friends didn't see suggest groups. (not enough groups included in above response)
    const myFriendsGroups = await getMyFriendsGroups(
      myFriendsIds.data,
      false,
      true
    ); // changed to include GroupAdmins Only in record set.  That causes only groups your friends admin to be included.
    //update person record with those groups so we can get all friends.
    let person1 = authUser.data;
    person1.groups = myFriendsGroups.data;
    const myFriendsOfFriendsIds = await getMyFriendIDs(person1, false);

    const myFriendGroups = await getMyFriendsGroups(
      myFriendsIds.data,
      true,
      true
    );

    const myFriendsOfFriendsGroups = await getMyFriendsGroups(
      myFriendsOfFriendsIds.data,
      true,
      true
    );

    let macroGroupIds = [];
    if (allowRejoin) {
      for (let i = 0; i < myFriendGroups.data.length; i++) {
        macroGroupIds.push(myFriendGroups.data[i]);
      }
      for (let i = 0; i < myFriendsOfFriendsGroups.data.length; i++) {
        macroGroupIds.push(myFriendsOfFriendsGroups.data[i]);
      }
    } else {
      // GET CLEAN ARRAY OF GROUP ID'S EXCLUDING GROUPS I'M ALREADY A MEMBER OF
      for (let i = 0; i < myFriendGroups.data.length; i++) {
        if (myCleanGroupIds.indexOf(myFriendGroups.data[i]) === -1) {
          macroGroupIds.push(myFriendGroups.data[i]);
        }
      }
      for (let i = 0; i < myFriendsOfFriendsGroups.data.length; i++) {
        if (myCleanGroupIds.indexOf(myFriendsOfFriendsGroups.data[i]) === -1) {
          macroGroupIds.push(myFriendsOfFriendsGroups.data[i]);
        }
      }
    }

    let macroGroupList;

    if (idsOnly) {
      macroGroupList = await groups.getGroupIds(macroGroupIds);
    } else {
      macroGroupList = await groups.getGroupsExpanded(macroGroupIds);
    }

    // ELIMINATE GROUPS BASED ON CAN_JOIN PERMISSIONS
    let suggestedFriendGroups = [];
    let suggestedFriendOfFriendsGroups = [];
    let suggestedOrgGroups = [];
    let allGroups = [];
    let permissions = [
      "friends",
      "friends of friends",
      "organization followers",
      "anyone with link",
    ];
    if (!fromShareLink) {
      permissions = [
        "friends",
        "friends of friends",
        "organization followers",
      ];
    }
    let mutedPeople = authUser.data.muted_people;
    for (let i = 0; i < macroGroupList.length; i++) {
      if (permissions.indexOf(macroGroupList[i].can_join) > -1) {
        if (macroGroupList[i].can_join === "organization followers") {
          if (myOrgIds.indexOf(macroGroupList[i].org_id) > -1) {
            // we have org in common
            if (idsOnly) {
              allGroups.push(macroGroupList[i].group_id);
            } else {
              suggestedOrgGroups.push(macroGroupList[i]);
            }
          }
        } else {
          // parse master list into two sub lists, i.e. 1)friends and 2)friends of friends
          if (!orgId) {
            if (myFriendGroups.data.indexOf(macroGroupList[i].group_id) > -1) {
              if (mutedPeople && mutedPeople.length > 0) {
                if (mutedPeople.indexOf(macroGroupList[i].group_owner) === -1) {
                  suggestedFriendGroups.push(macroGroupList[i]);
                  allGroups.push(macroGroupList[i].group_id);
                }
              } else {
                suggestedFriendGroups.push(macroGroupList[i]);
                allGroups.push(macroGroupList[i].group_id);
              }
            } else {
              if (
                myFriendsOfFriendsGroups.data.indexOf(
                  macroGroupList[i].group_id.toString()
                ) > -1
              ) {
                if (
                  fromShareLink ? ["friends of friends", "anyone with link"].indexOf(
                    macroGroupList[i].can_join
                  ) > -1 : ["friends of friends"].indexOf(
                    macroGroupList[i].can_join
                  ) > -1
                ) {
                  if (mutedPeople && mutedPeople.length > 0) {
                    if (
                      mutedPeople.indexOf(macroGroupList[i].group_owner) === -1
                    ) {
                      suggestedFriendOfFriendsGroups.push(macroGroupList[i]);
                      allGroups.push(macroGroupList[i].group_id);
                    }
                  } else {
                    suggestedFriendOfFriendsGroups.push(macroGroupList[i]);
                    allGroups.push(macroGroupList[i].group_id);
                  }
                }
              }
            }
          }
        }
      }
    }

    return {
      data: idsOnly ? allGroups : null,
      friendGroups: suggestedFriendGroups,
      friendsOfFriendGroups: suggestedFriendOfFriendsGroups,
      orgGroups: suggestedOrgGroups,
      message: "ok",
      code: 200,
    };
  } catch (err) {
    log({
      level: "error",
      message: "Error while getting suggested groups.",
      function: "getSuggestedGroups",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    return {
      data: null,
      message: "Snap! Error while getting suggested groups.",
    };
  }
}

async function lowerHands(params) {
  try {
    let peopleIds = params.people_Ids;
    const collection = db.collection("people");
    const myDoc = await collection.updateMany(
      { person_id: { $in: peopleIds } },
      {
        $unset: {
          see_hand: "",
          open_dates: "",
        },
      }
    );
    return {
      data: myDoc,
      message: "ok",
      code: 200,
    };
  } catch (err) {
    log({
      level: "error",
      message: "Error while lowering hands.",
      function: "lowerHands",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    return {
      code: 500,
      message: "Snap! Error while lowering hands.",
    };
  }
}

async function getMyFriends(params, auth) {
  try {
    const id = params.id || auth.data.person_id;
    const handsOnly = params.handsOnly;
    const mutedPeople = auth.data.muted_people || [];
    let groupIds = [];

    if (!params.group_id) {
      //CLEAN GROUPS REMOVES ALL THE "DEFAULT" and "DELETED" GROUPS FROM THE LIST
      const cleanUser = await groups.cleanPersonGroups(auth.data);

      for (let i = 0; i < cleanUser.groups.length; i++) {
        groupIds = [...groupIds, cleanUser.groups[i].group_id];
      }
    } else {
      groupIds = [...groupIds, params.group_id];
    }

    let sortBy = { last_name: 1, first_name: 1 };
    if (params.sortBy) {
      sortBy = params.sortBy;
    }
    const collection = db.collection("people");
    let myDoc = null;
    let query = {
      person_id: { $ne: id },
      "groups.group_id": { $in: groupIds },
      "groups.date_deleted": { $eq: null },
      date_deleted: null,
    };
    if (handsOnly) {
      query = {
        ...query,
        open_dates: { $ne: null },
      };
    }

    let projectArray = {
      $project: {
        person_id: 1,
        first_name: 1,
        last_name: 1,
        display_name: 1,
        user_id: 1,
        date_created: 1,
        last_active: 1,
        open_dates: 1,
        see_hand: 1,
        image: { $ifNull: ["$thumbnail", "$image"] },
        group_id: "$groups.group_id",
      },
    };

    let groupArray = {
      $group: {
        //group puts each users individual rows back together into a single user row.
        _id: "$person_id",
        person_id: {
          $first: "$person_id",
        },
        first_name: {
          $first: "$first_name",
        },
        last_name: {
          $first: "$last_name",
        },
        display_name: {
          $first: "$display_name",
        },
        user_id: {
          $first: "$user_id",
        },
        date_created: {
          $first: "$date_created",
        },
        last_active: {
          $first: "$last_active",
        },
        open_dates: {
          $first: "$open_dates",
        },
        see_hand: {
          $first: "$see_hand",
        },
        image: {
          $first: "$image",
        },
        group_id: {
          $first: "$group_id",
        },
      },
    };

    if (params.id_only) {
      projectArray = {
        $project: {
          person_id: 1,
          _id: -1,
        },
      };

      groupArray = {
        $group: {
          //group puts each users individual rows back together into a single user row.
          _id: "$person_id",
          /* person_id: {
            $first: "$person_id",
          }, */
        },
      };

      sortBy = { person_id: 1 };
    }

    myDoc = await collection

      .aggregate([
        {
          $unwind: {
            path: "$groups", //must unwind the groups in people to be able to test each group for the person.
          },
        },
        {
          $match: {
            $and: [query],
          },
        },
        projectArray,
        groupArray,
        {
          $sort: sortBy,
        },
      ])
      .toArray();

    if (mutedPeople.length > 0) {
      myDoc.map((person) => {
        if (mutedPeople.indexOf(person.person_id) > -1) {
          person.isMuted = true;
        }
      });
    }

    return {
      data: myDoc,
      groupIds: groupIds,
      message: "ok",
      code: 200,
    };
  } catch (err) {
    log({
      level: "error",
      message: "Error while fetching my friends.",
      function: "getMyFriends",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    return {
      data: null,
      message: err.stack,
    };
  }
}

async function countMyFriends(params, auth) {
  try {
    const id = params.id;
    let groupIds = [];

    if (!params.group_id) {
      //CLEAN GROUPS REMOVES ALL THE "DEFAULT" and "DELETED" GROUPS FROM THE LIST
      const cleanUser = await groups.cleanPersonGroups(auth.data);
      for (let i = 0; i < cleanUser.groups.length; i++) {
        groupIds = [...groupIds, cleanUser.groups[i].group_id];
      }
    } else {
      groupIds = [...groupIds, params.group_id];
    }

    const collection = db.collection("people");
    let myDoc = null;
    const query = {
      person_id: { $ne: id },
      "groups.group_id": { $in: groupIds },
      "groups.date_deleted": null,
      date_deleted: null,
    };

    myDoc = await collection

      .aggregate([
        {
          $unwind: {
            path: "$groups", //must unwind the groups in people to be able to test each group for the person.
          },
        },
        {
          $match: {
            $and: [query],
          },
        },
        {
          $project: {
            person_id: 1,
          },
        },
        {
          $group: {
            //group puts each users individual rows back together into a single user row.
            _id: "$person_id",
            person_id: {
              $first: "$person_id",
            },
          },
        },
      ])
      .toArray();

    const FriendsCount = myDoc.length;

    return {
      data: FriendsCount,
      message: "ok",
    };
  } catch (err) {
    log({
      level: "error",
      message: "Error while fetching my friends count.",
      function: "countMyFriends",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      data: null,
      message: err.stack,
    });
  }
}

//RETURNS JUST THE PERSON_ID OF MY FRIENDS
//INTERNAL HELPER FUNCTION USED ON GetEvents
async function getMyFriendIDs(
  person,
  cleanGroups = true,
  keepDefaultGroups = false
) {
  // if cleanGroups, get just person's friends. else get members of all groups
  try {
    const id = person.person_id;
    let groupIds = [];

    if (cleanGroups) {
      //CLEAN GROUPS REMOVES ALL THE "DEFAULT" and "DELETED" GROUPS FROM THE LIST
      const cleanUser = await groups.cleanPersonGroups(
        person,
        keepDefaultGroups
      );
      for (let i = 0; i < cleanUser.groups.length; i++) {
        groupIds = [...groupIds, cleanUser.groups[i].group_id];
      }
    } else {
      // NOTE: person.groups is already passed in as a clean array of groupIds
      groupIds = person.groups;
    }
    const collection = db.collection("people");

    const myFriendsIds = await collection.distinct("person_id", {
      person_id: { $ne: id },
      "groups.group_id": { $in: groupIds },
      "groups.date_deleted": null,
      date_deleted: null,
    });

    return {
      data: myFriendsIds,
      message: "ok",
    };
  } catch (err) {
    log({
      level: "error",
      message: "Error while fetching my friend ids.",
      function: "getMyFriendIDs",
      params: person,
      error_code: 500,
      error_stack: err.stack,
    });
    return {
      data: null,
      message: err.stack,
    };
  }
}

//RETURNS THE GROUPS OF ALL MY FRIENDS
//INTERNAL HELPER FUNCTION USED ON GetEvents
async function getMyFriendsGroups(
  myFriendIDs,
  deleteDefault = false,
  groupAdminsOnly = false
) {
  // groupAdminsOnly returns just friendgroups where friend is an admin of that group
  try {
    const collection = db.collection("people");
    let myDoc = null;

    let matchArray = {
      date_deleted: null,
      person_id: {
        $in: myFriendIDs,
      },
    };

    let groupMatchArray = {
      $match: {
        "groups.date_deleted": null,
      },
    };
    if (groupAdminsOnly) {
      groupMatchArray = {
        $match: {
          "groups.date_deleted": null,
          "groups.role": "admin",
        },
      };
    }

    myDoc = await collection

      .aggregate([
        {
          $match: matchArray,
        },
        {
          $project: {
            person_id: 1.0,
            groups: 1.0,
          },
        },
        {
          $unwind: {
            path: "$groups",
          },
        },
        groupMatchArray,
        {
          $project: {
            group_id: "$groups.group_id",
          },
        },
        {
          $group: {
            _id: "$group_id",
            group_id: {
              $first: "$group_id",
            },
          },
        },
      ])
      .toArray();

    //create simple array of just group id's
    let myFriendGroupIDs = [];
    for (let i = 0; i < myDoc.length; i++) {
      myFriendGroupIDs = [...myFriendGroupIDs, myDoc[i].group_id];
    }

    //CLEAN FRIENDS GROUPS TO BE JUST NON-DELETED GROUPS
    const collection1 = db.collection("groups");

    let query = { group_id: { $in: myFriendGroupIDs }, date_deleted: null };
    if (deleteDefault) {
      query = {
        ...query,
        user_default: null,
      };
    }
    const myDoc1 = await collection1
      .find(query)
      .project({ group_id: 1, date_deleted: 1 })
      .toArray();

    //create simple array of clean group id's
    let myCleanFriendGroups = [];
    for (let i = 0; i < myDoc1.length; i++) {
      myCleanFriendGroups = [...myCleanFriendGroups, myDoc1[i].group_id];
    }

    return {
      data: myCleanFriendGroups,
      message: "ok",
    };
  } catch (err) {
    log({
      level: "error",
      message: "Error while fetching my friends groups.",
      function: "getMyFriendsGroups",
      params: myFriendIDs,
      error_code: 500,
      error_stack: err.stack,
    });
    return {
      data: null,
      message: err.stack,
    };
  }
}

async function getPersonGroupIds(personID) {
  try {
    const collection = db.collection("people");
    const myDoc = await collection
      .aggregate([
        {
          $match: {
            person_id: personID,
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
            "groups.date_deleted": null,
          },
        },
        {
          $lookup: {
            from: "groups",
            localField: "groups.group_id",
            foreignField: "group_id",
            as: "group",
          },
        },
        {
          $match: {
            $or: [
              {
                "group.date_deleted": null, //exclude deleted groups
                "group.user_default": { $in: [false, null] }, //exclude user default groups
              },
              {
                "group.user_default": true, //is my user default group
                "group.created_by": personID,
              },
            ],
          },
        },
        {
          $project: {
            group_id: "$groups.group_id",
          },
        },
      ])
      .toArray();
    let returnArray = [];

    for (let i = 0; i < myDoc.length; i++) {
      returnArray = [...returnArray, myDoc[i].group_id];
    }

    return returnArray;
  } catch (err) {
    log({
      level: "error",
      message: `Error while fetching person group ids ${personID}.`,
      function: "getPersonGroupIds",
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function getFriendsOfFriends(params) {
  try {
    const person_id1 = params.person_id1;
    const person_id2 = params.person_id2;

    let groupIds1 = await getPersonGroupIds(person_id1);
    let groupIds2 = await getPersonGroupIds(person_id2);

    const collection = db.collection("people");
    let myDoc = null;
    const query1 = {
      //person_id: { $ne: id },
      "groups.group_id": { $in: groupIds1 },
      "groups.date_deleted": null,
      date_deleted: null,
    };

    const query2 = {
      //person_id: { $ne: id },
      "groups.group_id": { $in: groupIds2 },
      "groups.date_deleted": null,
      date_deleted: null,
    };

    myDoc = await collection

      .aggregate(
        [
          {
            $unwind: {
              path: "$groups",
            },
          },
          {
            $match: {
              $and: [query1],
            },
          },
          {
            $project: {
              person_id: 1.0,
              my_id: "1",
            },
          },
          {
            $group: {
              _id: "$person_id",
              person_id: {
                $first: "$person_id",
              },
              my_id: {
                $first: "$my_id",
              },
            },
          },
          {
            $unionWith: {
              coll: "people",
              pipeline: [
                {
                  $unwind: {
                    path: "$groups",
                  },
                },
                {
                  $match: {
                    $and: [query2],
                  },
                },
                {
                  $project: {
                    person_id: 1.0,
                    my_id: "2",
                  },
                },
                {
                  $group: {
                    _id: "$person_id",
                    person_id: {
                      $first: "$person_id",
                    },
                    my_id: {
                      $first: "$my_id",
                    },
                  },
                },
                {
                  $match: {},
                },
              ],
            },
          },
          {
            $group: {
              _id: "$person_id",
              person_id: {
                $first: "$person_id",
              },
              count: {
                $sum: 1,
              },
            },
          },
          {
            $match: {
              count: 2,
            },
          },
        ],
        {
          allowDiskUse: false,
        }
      )
      .toArray();

    return myDoc;
  } catch (err) {
    log({
      level: "error",
      message: "Error while fetching friends of friends.",
      function: "getFriendsOfFriends",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

/* SAMPLE OF RETURING WITH DETAILS */

/*db = db.getSiblingDB("radish1");
db.getCollection("people").aggregate(
    [
        { 
            "$unwind" : { 
                "path" : "$groups"
            }
        }, 
        { 
            "$match" : { 
                "groups.group_id" : "34093a19854826038e2e425cacd1d01c", 
                "groups.date_deleted" : null, 
                "date_deleted" : null
            }
        }, 
        { 
            "$project" : { 
                "person_id" : 1.0, 
                "my_id" : "1", 
                "first_name" : 1.0, 
                "last_name" : 1.0, 
                "image" : 1.0
            }
        }, 
        { 
            "$group" : { 
                "_id" : "$person_id", 
                "person_id" : { 
                    "$first" : "$person_id"
                }, 
                "my_id" : { 
                    "$first" : "$my_id"
                }, 
                "first_name" : { 
                    "$first" : "$first_name"
                }, 
                "last_name" : { 
                    "$first" : "$last_name"
                }, 
                "image" : { 
                    "$first" : "$image"
                }
            }
        }, 
        { 
            "$unionWith" : { 
                "coll" : "people", 
                "pipeline" : [
                    { 
                        "$unwind" : { 
                            "path" : "$groups"
                        }
                    }, 
                    { 
                        "$match" : { 
                            "groups.group_id" : "0e4b7af3ea1eed1cddd717a726149fb3", 
                            "groups.date_deleted" : null, 
                            "date_deleted" : null
                        }
                    }, 
                    { 
                        "$project" : { 
                            "person_id" : 1.0, 
                            "my_id" : "2", 
                            "first_name" : 1.0, 
                            "last_name" : 1.0, 
                            "image" : 1.0
                        }
                    }, 
                    { 
                        "$group" : { 
                            "_id" : "$person_id", 
                            "person_id" : { 
                                "$first" : "$person_id"
                            }, 
                            "my_id" : { 
                                "$first" : "$my_id"
                            }, 
                            "first_name" : { 
                                "$first" : "$first_name"
                            }, 
                            "last_name" : { 
                                "$first" : "$last_name"
                            }, 
                            "image" : { 
                                "$first" : "$image"
                            }
                        }
                    }, 
                    { 
                        "$match" : { 

                        }
                    }
                ]
            }
        }, 
        { 
            "$group" : { 
                "_id" : "$person_id", 
                "person_id" : { 
                    "$first" : "$person_id"
                }, 
                "count" : { 
                    "$count" : { 

                    }
                }, 
                "first_name" : { 
                    "$first" : "$first_name"
                }, 
                "last_name" : { 
                    "$first" : "$last_name"
                }, 
                "image" : { 
                    "$first" : "$image"
                }
            }
        }, 
        { 
            "$match" : { 
                "count" : 2.0
            }
        }
    ], 
    { 
        "allowDiskUse" : false
    }
);*/

async function acceptOrgUser(personID, orgID) {
  try {
    const today = new Date();
    const collection = db.collection("people");
    let query = { person_id: personID, "organizations.org_id": orgID };
    const personProjection = { projection: { person_id: 1 } };
    const person = await collection.findOne(query, personProjection);

    //Add the fields to the people.organizations array to add the organization to this users
    let fieldArray = {
      "organizations.$.org_id": orgID,
      "organizations.$.date_added": today,
      "organizations.$.added_by": personID,
    };

    //If user previously left the organization, have to removed this when attempting to add
    let fieldArray2 = {
      "organizations.$.date_deleted": "",
      "organizations.$.deleted_by": "",
    };

    let setArray = { $set: fieldArray };
    let unSetArray = { $unset: fieldArray2 };

    if (!person) {
      // this person does not yet have this org. Insert (push) it.
      query = { person_id: personID };
      fieldArray = {
        organizations: {
          org_id: orgID,
          date_added: today,
          added_by: personID,
        },
      };
      setArray = { $push: fieldArray };
      unSetArray = null; // don't want to try and remove if user never added the fields.
    }
    const options = {
      upsert: true,
      runValidators: true,
    };

    let resp = null;
    if (unSetArray) {
      //Remove the fields if previously left the org.
      resp = await collection.updateOne(query, unSetArray, options);
    }
    //Add the fields to the array in the database.
    resp = await collection.updateOne(query, setArray, options);

    return resp;
  } catch (error) {
    log({
      level: "error",
      message: `Error while accepting org user ${personID}.`,
      function: "acceptOrgUser",
      error_code: 500,
      error_stack: error.stack,
    });
    return null;
  }
}

//API to mute friends suggested events and groups
async function muteFriend(params, authUser) {
  try {
    const mutedPersonId = params.friend_person_id;
    const currentUserId = authUser.data.person_id;
    const mute = params.mute; // true or false
    let mutedPeople = authUser.data.muted_people || [];
    const collection = db.collection("people");

    if (mutedPeople.length > 0) {
      const index = mutedPeople.indexOf(mutedPersonId);
      if (mute) {
        if (index > -1) {
          //person already muted
          return {
            data: [],
            message: "ok",
            code: 200,
          };
        } else {
          // add person to muted array
          mutedPeople.push(mutedPersonId);
        }
      } else {
        if (index > -1) {
          // remove person from muted array
          mutedPeople.splice(index, 1);
        }
      }
    } else {
      if (mute) {
        // add person to muted array
        mutedPeople.push(mutedPersonId);
      }
    }

    const response = await collection.updateOne(
      { person_id: currentUserId },
      {
        $set: {
          muted_people: mutedPeople,
        },
      }
    );

    return {
      data: response,
      message: "ok",
      code: 200,
    };
  } catch (error) {
    log({
      level: "error",
      message: `Error while muting friend.`,
      function: "muteFriend",
      error_code: 500,
      error_stack: error.stack,
    });
    return null;
  }
}

//API to remove friend from all group lists
async function removeFriend(params, auth, res) {
  try {
    const date = new Date();
    const friendId = params.friend_person_id;
    const currentUserID = auth.data.person_id;
    const groupId = params.group_id;
    var groupExists = false;

    //Query to retrieve the groups created by current user
    const query = {
      $and: [{ created_by: currentUserID }, { date_deleted: null }],
    };
    const groupCollection = db.collection("groups");
    let myGroups;
    myGroups = await groupCollection
      .find(query)
      .project({
        group_id: "$group_id",
        group_name: "$group_name",
      })
      .toArray();

    let groupIds = [];
    myGroups.forEach((myGroup) => {
      groupIds.push(myGroup.group_id);
    });

    if (groupId === "all") {
      groupExists = true;
    } else {
      groupIds.forEach((id) => {
        if (id === groupId) groupExists = true;
      });
    }
    if (groupExists === true) {
      const options = {
        runValidators: true,
      };
      //Map the current user's groups to the friend and use this set the delete info
      const filterArray = {
        person_id: friendId,
        "groups.group_id": { $in: groupIds },
        "groups.date_deleted": null,
        date_deleted: null,
      };
      //Update delete info against the friend's groups
      let setArray = {};
      setArray = {
        $set: {
          "groups.$[element].date_deleted": date,
          "groups.$[element].deleted_by": currentUserID,
        },
      };
      //Match the friend's groups to the groups owned by the current user
      let arrayFilter = {};
      arrayFilter = {
        arrayFilters: [
          {
            "element.group_id": { $in: groupIds },
            "element.date_deleted": null,
          },
        ],
      };

      const peopleCollection = db.collection("people");
      await peopleCollection.updateMany(
        filterArray,
        setArray,
        arrayFilter,
        options
      );
      res.send({
        code: 200,
        message:
          "Friend removed successfully from group(s) administered by you.",
      });
    } else {
      res.send({
        code: 403,
        message:
          "Friend is not a member of any group(s) you administer, so they can not be removed.",
      });
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error while removing friend.",
      function: "removeFriend",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error removing friend.",
    });
  }
}

async function getOrgAdmins(orgId) {
  try {
    const collection = db.collection("people");
    const query = {
      "organizations.org_id": orgId,
      "organizations.admin": true,
    };
    const admins = await collection
      .find(query)
      .project({ person_id: 1 })
      .toArray();
    return admins;
  } catch (err) {
    log({
      level: "error",
      message: "Error while getting org admins.",
      function: "getOrgAdmins",
      params: orgId,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

// API to remove org from user profile
async function removeOrgForUser(params, auth, res) {
  try {
    const personId = params.person_id || auth.data.person_id;
    const orgId = params.org_id;
    const date = new Date();
    let setArray = {};
    const orgAdmins = await getOrgAdmins(orgId);

    if (orgAdmins && orgAdmins.length === 1) {
      if (orgAdmins[0].person_id === personId) {
        //CAN'T DELELETE YOURSELF BECAUSE YOU ARE LAST ADMIN
        res.send({
          code: 500,
          message: "You are the only org admin.",
        });
        return;
      }
    }

    setArray = {
      $set: {
        "organizations.$[element].date_deleted": date,
        "organizations.$[element].deleted_by": personId,
      },
    };
    const updateResponse = await updatePeopleCollection(
      personId,
      orgId,
      setArray
    );
    res.send(updateResponse);
  } catch (err) {
    log({
      level: "error",
      message: "Error while removing org for user.",
      function: "removeOrgForUser",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error removing organization.",
    });
  }
}

// API to favorite or unfavorite an organizarion
async function updateOrgFavorite(params, auth, res) {
  try {
    const personId = auth.data.person_id;
    const orgId = params.org_id;
    const isFavorite = params.favorite;
    let setArray = {};
    if (isFavorite) {
      setArray = {
        $set: { "organizations.$[element].favorite": true },
      };
    } else {
      setArray = {
        $unset: { "organizations.$[element].favorite": "" },
      };
    }
    const updateResponse = await updatePeopleCollection(
      personId,
      orgId,
      setArray
    );
    res.send(updateResponse);
  } catch (err) {
    log({
      level: "error",
      message: "Error while updating org favorite.",
      function: "updateOrgFavorite",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error updating favorite status.",
    });
  }
}

async function getPrimaryEmails(ids) {
  // returns object array of perons_ids, names and primary emails
  try {
    const collection = db.collection("people");
    const responseDoc = collection
      .find({
        person_id: { $in: ids },
      })
      .project({
        person_id: 1,
        first_name: 1,
        last_name: 1,
        display_name: 1,
        emails: { $elemMatch: { primary: true } },
      })
      .toArray();
    return responseDoc;
  } catch (err) {
    log({
      level: "error",
      message: "Error while fetching primary emails.",
      function: "getPrimaryEmails",
      params: ids,
      error_code: 500,
      error_stack: err.stack,
    });
    return null;
  }
}

// API to get nonprofits details
async function getNonProfits(params, auth, res) {
  try {
    const personId = auth.data.person_id; // Currently logged in user
    let collection = db.collection("people");
    let query = {
      person_id: personId,
    };
    const people = await collection.findOne(query);
    let nonDeletedOrganizations = [];
    //checking gems count
    if (people && people.gem_bank && people.gem_bank > 0) {
      let nonprofits = people.nonprofits;
      if (nonprofits && nonprofits.length > 0) {
        let favoriteOrgs = [];
        let nonFavoriteOrgs = [];
        //Fetching favorite & nonfavorite nonprofits ids
        for (let i = 0; i < nonprofits.length; i++) {
          if (
            nonprofits[i].date_deleted === undefined &&
            nonprofits[i].favorite
          ) {
            favoriteOrgs.push(nonprofits[i].org_id);
          } else if (
            nonprofits[i].date_deleted === undefined &&
            !nonprofits[i].favorite
          ) {
            nonFavoriteOrgs.push(nonprofits[i].org_id);
          }
        }
        //Fetching sorted favorite & nonfavorite orgs details
        const favoriteOrgsDetails =
          await organizations.getNonDeletedOrganizations(favoriteOrgs);
        const nonFavoriteOrgsDetails =
          await organizations.getNonDeletedOrganizations(nonFavoriteOrgs);
        if (favoriteOrgsDetails !== null && nonFavoriteOrgsDetails !== null) {
          if (favoriteOrgsDetails.length > 0) {
            favoriteOrgsDetails.forEach((favoriteOrg) => {
              nonDeletedOrganizations.push(favoriteOrg);
            });
          }
          if (nonFavoriteOrgsDetails.length > 0) {
            nonFavoriteOrgsDetails.forEach((nonFavoriteOrg) => {
              nonDeletedOrganizations.push(nonFavoriteOrg);
            });
          }
        } else {
          res.send({
            code: 500,
            message: "Error fetching nonprofits details.",
          });
        }
      }
    }
    res.send({
      code: 200,
      data: nonDeletedOrganizations,
      message: "Nonprofits details fetched successfully",
    });
  } catch (err) {
    log({
      level: "error",
      message: "Error while fetching nonprofits.",
      function: "getNonProfits",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error fetching nonprofits details.",
    });
  }
}

// API to remove nonprofit from user profile
async function removeNonProfitForUser(params, auth, res) {
  try {
    const personId = auth.data.person_id;
    const orgId = params.org_id;
    const date = new Date();
    let setArray = {};
    setArray = {
      $set: {
        "nonprofits.$[element].date_deleted": date,
        "nonprofits.$[element].deleted_by": personId,
      },
    };
    const updateResponse = await updatePeopleCollection(
      personId,
      orgId,
      setArray
    );
    res.send(updateResponse);
  } catch (err) {
    log({
      level: "error",
      message: "Error while removing nonprofit for user.",
      function: "removeNonProfitForUser",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error removing nonprofit.",
    });
  }
}

// API to favorite or unfavorite a nonprofit
async function updateNonprofitFavorite(params, auth, res) {
  try {
    const personId = auth.data.person_id;
    const orgId = params.org_id;
    const isFavorite = params.favorite;
    let setArray = {};
    if (isFavorite) {
      setArray = {
        $set: { "nonprofits.$[element].favorite": true },
      };
    } else {
      setArray = {
        $unset: { "nonprofits.$[element].favorite": "" },
      };
    }
    const updateResponse = await updatePeopleCollection(
      personId,
      orgId,
      setArray
    );
    res.send(updateResponse);
  } catch (err) {
    log({
      level: "error",
      message: "Error while updating nonprofit favorite.",
      function: "updateNonprofitFavorite",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error updating favorite status.",
    });
  }
}

// API to get nonprofit details
async function getNonprofitDetails(params, auth, res) {
  try {
    const personId = auth.data.person_id; // Currently logged in user
    const orgId = params.id;
    const collection = db.collection("people");
    let query = {
      person_id: personId,
      "nonprofits.org_id": orgId,
    };
    const projection = { projection: { "nonprofits.$": 1 } };
    // Fetching matched organization from people collection for the current
    const organization = await collection.findOne(query, projection);
    res.send({
      code: 200,
      data: organization,
      message: "Nonprofit details fetched successfully",
    });
  } catch (err) {
    log({
      level: "error",
      message: "Error while fetching nonprofit details.",
      function: "getNonprofitDetails",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error fetching nonprofit details.",
    });
  }
}

//Function to update people collection
async function updatePeopleCollection(personId, orgId, setArray) {
  let response = {};
  try {
    const collection = db.collection("people");
    let query = { person_id: personId };
    let arrayFilter = {};
    arrayFilter = {
      arrayFilters: [
        {
          "element.org_id": orgId,
          "element.date_deleted": null,
          "element.deleted_by": null,
        },
      ],
    };
    const options = {
      upsert: true,
      runValidators: true,
    };
    await collection.updateOne(query, setArray, arrayFilter, options);
    response = {
      code: 200,
      message: "Success",
    };
  } catch (err) {
    log({
      level: "error",
      message: `Error while update people collection, personid: ${personId}, orgid: ${orgId}.`,
      function: "updatePeopleCollection",
      error_code: 500,
      error_stack: err.stack,
    });
    response = {
      code: 500,
      message: "An error occurred.",
    };
  }
  return response;
}

//API to add new org to an user
async function addOrgToUser(params, auth, res) {
  try {
    const today = new Date();
    const collection = db.collection("people");
    const query = { person_id: auth.data.person_id };
    const fieldArray = {
      organizations: {
        org_id: params.orgId,
        date_added: today,
        added_by: auth.data.person_id,
        admin: true,
      },
    };
    const setArray = { $push: fieldArray };

    const options = {
      upsert: true,
      runValidators: true,
    };
    resp = await collection.updateOne(query, setArray, options);
    res.send({
      code: 200,
      message: "Organization successully added to the user.",
    });
  } catch (error) {
    log({
      level: "error",
      message: "Error while adding org to user.",
      function: "addOrgToUser",
      params: params,
      error_code: 500,
      error_stack: error.stack,
    });
    res.send({
      code: 500,
      message: "Error while adding organizationadded to the user.",
    });
  }
}

//API to get recommended friends
async function RecommendedFriends(auth, res) {
  try {
    //Get My friend ids
    let myFriendIds = await getMyFriendIDs(auth.data, true);
    if (myFriendIds.data) {
      let friendIds = [];
      friendIds = [...myFriendIds.data, auth.data.person_id]; // adding logged in user's id
      //Get My past events
      const eventIds = await getMyPastEvents(auth, friendIds);
      if (eventIds && eventIds.length > 0) {
        //Get recommended friends from above fetched past events
        const event = await getRecommendedFriendsFromEvents(
          eventIds,
          friendIds
        );
        res.send({
          code: 200,
          data: event,
          message: "Recommended friends fetched successfully.",
        });
      } else {
        res.send({
          code: 200,
          data: [],
          message: "Recommended friends fetched successfully.",
        });
      }
    } else {
      res.send({
        code: 500,
        message: "Error while fetching recommended friends.",
      });
    }
  } catch (error) {
    log({
      level: "error",
      message: "Error while fetching recommended friends.",
      function: "RecommendedFriends",
      error_code: 500,
      error_stack: error.stack,
    });
    res.send({
      code: 500,
      message: "Error while fetching recommended friends.",
    });
  }
}

//TODO - refactor to use getMyEvents and not duplicate.  Created as part of getMeFriends
async function getMyPastEvents(authUser) {
  try {
    const events = db.collection("events");
    const limit = 50;
    const today = new Date();
    let matchArray = {
      //$and: [
      status: { $ne: "Draft" },
      date_deleted: { $eq: null },
      $or: [
        //Checking for past events
        {
          //There is a final date, and it is less than today.
          final_start_date: { $ne: null },
          final_start_date: { $lt: today },
        },
        {
          //There is not a final date, but both proposed dates exist and are in the past.
          final_start_date: null,
          proposed_date2: { $ne: null },
          proposed_date1: { $lt: today },
          proposed_date2: { $lt: today },
        },
        //There is not a final date, There is not a proposed date 2, and proposed date 1 is in the past.
        {
          final_start_date: null,
          proposed_date2: null,
          proposed_date1: { $lt: today },
        },
      ],
    };
    const myDoc = await events
      .aggregate(
        [
          {
            $match: matchArray,
          },
          {
            $lookup: {
              from: "eventpeople",
              localField: "event_id",
              foreignField: "event_id",
              as: "inviteeRec",
            },
          },
          {
            $unwind: {
              //unwind is needed to exclude you if you've deleted yourself from the event.
              path: "$inviteeRec",
            },
          },
          {
            $match: {
              //Events where I exist in the inviter table, and am not deleted.
              "inviteeRec.date_deleted": null,
              "inviteeRec.invited_id": authUser.data.person_id,
            },
          },
          {
            $project: {
              event_id: 1,
              date_created: 1,
            },
          },
          {
            $sort: {
              date_created: -1,
            },
          },
        ],
        {
          allowDiskUse: false,
        }
      )
      .limit(limit)
      .toArray();
    //create simple array of just event id's
    let eventIDs = [];
    for (let i = 0; i < myDoc.length; i++) {
      eventIDs = [...eventIDs, myDoc[i].event_id];
    }
    return eventIDs;
  } catch (error) {
    log({
      level: "error",
      message: "Error while fetching past events.",
      function: "getMyPastEvents",
      error_code: 500,
      error_stack: error.stack,
    });
    return null;
  }
}
async function getRecommendedFriendsFromEvents(eventIDs, myFriendIds) {
  try {
    const eventPeople = db.collection("eventpeople");
    let matchArray = {
      event_id: { $in: eventIDs },
      invited_id: { $nin: myFriendIds },
      date_deleted: { $eq: null },
    };
    const recommendedFriends = await eventPeople
      .aggregate([
        {
          $match: matchArray,
        },
        {
          // Lookup for event details
          $lookup: {
            from: "events",
            localField: "event_id",
            foreignField: "event_id",
            as: "events",
          },
        },
        {
          $unwind: {
            path: "$events", // Must unwind to get event details
          },
        },
        {
          $sort: {
            "events.date_created": -1, // sort based on event created date
          },
        },
        {
          // Lookup for person's details
          $lookup: {
            from: "people",
            localField: "invited_id",
            foreignField: "person_id",
            as: "people",
          },
        },
        {
          $unwind: {
            path: "$people", //Must unwind to get person's details
          },
        },
        {
          $project: {
            "people.person_id": 1,
            "people.first_name": 1,
            "people.last_name": 1,
            "people.display_name": 1,
            "people.user_id": 1,
            "people.date_created": 1,
            "people.last_active": 1,
            "people.image": 1,
            "events.date_created": 1,
          },
        },
        {
          $group: {
            //group puts each users individual rows back together into a single user row.
            _id: "$people.person_id",
            person_id: {
              $first: "$people.person_id",
            },
            first_name: {
              $first: "$people.first_name",
            },
            last_name: {
              $first: "$people.last_name",
            },
            display_name: {
              $first: "$people.display_name",
            },
            user_id: {
              $first: "$people.user_id",
            },
            date_created: {
              $first: "$people.date_created",
            },
            last_active: {
              $first: "$people.last_active",
            },
            image: {
              $first: "$people.image",
            },
            event_created_dates: { $push: "$events.date_created" },
            recent_event_created_date: { $first: "$events.date_created" },
            matches: { $sum: 1 },
          },
        },
        {
          $sort: {
            matches: -1, // sort based on maximum number of events attended
            recent_event_created_date: -1, // sort based on event created date
          },
        },
      ])
      .toArray();
    return recommendedFriends;
  } catch (error) {
    log({
      level: "error",
      message: "Error while fetching recommended friends from events.",
      function: "getRecommendedFriendsFromEvents",
      error_code: 500,
      error_stack: error.stack,
    });
    return null;
  }
}

//API to check the the given user is friend or not
async function checkUserIsFriendOrNot(params, auth) {
  try {
    //Get My friend ids
    const friendPersonId = params.friend_person_id;
    let myFriendIds = await getMyFriendIDs(auth.data, true);
    let userIsAFriend = false;
    if (myFriendIds.data) {
      let friendIds = myFriendIds.data;
      // Check if the user matches with friends list
      if (friendIds && friendIds.length > 0) {
        if (friendIds.indexOf(friendPersonId) > -1) {
          userIsAFriend = true;
        }
      }
      return {
        code: 200,
        data: userIsAFriend,
        message: "Ok",
      }
    } else {
      return {
        code: 500,
        message: "Error while checking the given user is friend or not.",
      }
    }
  } catch (error) {
    log({
      level: "error",
      message: "Error while checking the given user is friend or not.",
      function: "checkUserIsFriendOrNot",
      error_code: 500,
      error_stack: error.stack,
    });
    return {
      code: 500,
      message: "Error while checking the given user is friend or not.",
    }
  }
}

async function updateHints(params) {
  try {
    const hintId = params.hint_id;
    const collection = db.collection('people');
    const results = await collection.updateMany(
      {},
      {
        $push: {
          hints: hintId,
        },
      },
    )
    console.log(results);
    return {
      data: results,
      message: 'ok',
      code: 200,
    }
  } catch (error) {
    log({
      level: "error",
      message: "Error while updating hints.",
      function: "updateHints",
      params: params,
      error_code: 500,
      error_stack: error.stack,
    });
    return {
      data: null,
      code: 500,
      message: "Error while updating hints",
    }
  }
}

module.exports = {
  //  getPeople,
  logSupportMessage,
  joinGroup,
  getDefaultGroup,
  importPeople,
  saveOrgAdmin,
  getOrgAdminPeople,
  getPerson,
  lowerHands,
  getMyFriends,
  countMyFriends,
  getMyFriendIDs,
  getFriendsOfFriends,
  getMyFriendsGroups,
  getInviter,
  acceptOrgUser,
  muteFriend,
  removeFriend,
  removeOrgForUser,
  updateOrgFavorite,
  getPrimaryEmails,
  getNonProfits,
  removeNonProfitForUser,
  updateNonprofitFavorite,
  getNonprofitDetails,
  addOrgToUser,
  getSuggestedGroups,
  RecommendedFriends,
  checkUserIsFriendOrNot,
  updateHints,
};
