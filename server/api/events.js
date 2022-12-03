const crypto = require("crypto");
const moment = require("moment-timezone");
const groups = require("./groups.js");
const people = require("./people.js");
const organizations = require("./organizations.js");
const tools = require("../utilities/tools.js");
const sendgrid = require("./sendgrid.js");
const twilio = require("./twilio.js");
const log = require("./logger.js").insertServerLogs;
const NodeCache = require("node-cache");

async function eventsAtGlance(params, authUser) {
  // used to fetch minimal data to populate "at a glance" notification abstract cards
  try {
    const orgID = params.org_id;
    const groupID = params.group_id;
    const tz = params.tz; // timezone from client

    let startDate = new Date(params.start_date);
    let endDate = new Date(params.end_date);
    let testStart = moment(startDate).tz(tz).format();

    let dateArray = [];
    const authUser2 = JSON.parse(JSON.stringify(authUser)); // because myEvents funges up authUser. So make a copy.

    let query = {
      view: "future",
      minimal: true,
      start_date: startDate,
      end_date: endDate,
      //limit: 4,
    };

    orgID ? (query = { ...query, org_id: orgID }) : query;
    groupID ? (query = { ...query, group_id: groupID }) : query;

    const myEvents = await getMyEvents(query, authUser);

    const myFriends = await people.getMyFriends({ handsOnly: true }, authUser2);

    let finalDate = new Date();
    let propDate1 = new Date();
    let propDate2 = new Date();

    for (
      let d = new Date(testStart);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      dateArray.push({
        date: new Date(d),
        event_ids: [],
      });
    }

    for (let i = 0; i < dateArray.length; i++) {
      let myTestDate = moment(new Date(dateArray[i].date))
        .tz(tz)
        .format("MM.DD.YYYY");

      for (n = 0; n < myEvents.length; n++) {
        if (myEvents[n].final_start_date) {
          finalDate = moment(new Date(myEvents[n].final_start_date))
            .tz(tz)
            .format("MM.DD.YYYY");
        } else {
          propDate1 = moment(new Date(myEvents[n].proposed_date1))
            .tz(tz)
            .format("MM.DD.YYYY");
          propDate2 = myEvents[n].proposed_date2
            ? new moment(new Date(myEvents[n].proposed_date2))
              .tz(tz)
              .format("MM.DD.YYYY")
            : null;
        }

        if (finalDate === myTestDate) {
          dateArray[i].event_ids.push(myEvents[n].event_id);
        } else {
          if (propDate1 === myTestDate) {
            dateArray[i].event_ids.push(myEvents[n].event_id);
          }
          if (propDate2 === myTestDate && propDate2 !== propDate1) {
            dateArray[i].event_ids.push(myEvents[n].event_id);
          }
        }

        finalDate = null;
        propDate1 = null;
        propDate2 = null;
      }
    }
    return {
      data: dateArray,
      myFriends: myFriends.data,
      message: "ok",
      code: 200,
    };
  } catch (err) {
    log({
      level: "error",
      message: `Error occurred while fetching events`,
      function: "eventsAtGlance",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function eventInPast(final_start_date, proposed_date1, proposed_date2) {
  try {
    let eventInPast = false;
    const today = new Date();
    //Does Event Have Final Date & Is Final Date Less than today?
    if (final_start_date && final_start_date !== undefined) {
      if (final_start_date < today) {
        eventInPast = true;
      }
    } else {
      //No Final Dates, but propsed date 1 is in the future (future event)
      if (proposed_date1 && proposed_date1 !== undefined) {
        if (proposed_date1 > today) {
          eventInPast = false;
        } else {
          //proposed date 1 in past, check for proposed date2 in past
          if (proposed_date2 && proposed_date2 !== undefined) {
            if (proposed_date2 < today) {
              eventInPast = true;
            } else {
              //proposed date 1 in past, but 2 in future, so not in past.
              eventInPast = false;
            }
          } else {
            //no event 2, but event 1 in past, still past...
            eventInPast = true;
          }
        }
      }
    }

    return eventInPast;
  } catch {
    //return ??
  }
}

async function getEvent(id, authUser, editing = false) {
  //NOTE: Authorization to see this event is handled lower in this function.
  try {
    //const timezone = authUser.data.default_timezone || "America/New_York";
    const collection = db.collection("events");
    const myDoc = await collection
      .aggregate([
        {
          $match: {
            event_id: id,
          },
        },
        {
          $lookup: {
            from: "people",
            localField: "created_by",
            foreignField: "person_id",
            as: "organizer",
          },
        },
        {
          $lookup: {
            from: "comments",
            localField: "event_id",
            foreignField: "module_id",
            as: "comments",
          },
        },
        {
          $lookup: {
            from: "organizations",
            localField: "org_id",
            foreignField: "org_id",
            as: "eventorg",
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
            localField: "nonprofit_id",
            foreignField: "org_id",
            as: "eventnonprofit",
          },
        },
        {
          $lookup: {
            from: "groups",
            localField: "group_id",
            foreignField: "group_id",
            as: "eventgroup",
          },
        },
        {
          $project: {
            event_id: 1,
            event_name: 1,
            event_description: 1,
            image_id: 1,
            image_date: "$image.date_modified",
            image_version: "$image.version",
            visibility: 1,
            proposed_date1: 1,
            proposed_end_date1: 1,
            proposed_date2: 1,
            proposed_end_date2: 1,
            proposed_general1: 1,
            proposed_general2: 1,
            proposed_place_id1: 1,
            proposed_place_id2: 1,
            proposed_place1_type: 1,
            proposed_place2_type: 1,
            nonprofit_id: 1,
            org_id: 1,
            rsvp_deadline: 1,
            attendee_limit: 1,
            image_id: 1,
            status: 1,
            group_id: 1,
            hybrid_place_id: 1,
            final_start_date: 1,
            final_end_date: 1,
            final_place_id: 1,
            final_place_type: 1,
            created_by: 1,
            date_created: 1,
            org_name: "$eventorg.name",
            org_image: "$eventorg.image",
            org_city: "$eventorg.city",
            org_state: "$eventorg.state",
            org_country: "$eventorg.country",
            org_website: "$eventorg.website",
            nonprofit_name: "$eventnonprofit.name",
            nonprofit_image: "$eventnonprofit.image",
            nonprofit_website: "$eventnonprofit.website",
            nonprofit_city: "$eventnonprofit.city",
            nonprofit_state: "$eventnonprofit.state",
            nonprofit_country: "$eventnonprofit.country",
            group_name: "$eventgroup.group_name",
            organizer_person_id: "$organizer.person_id",
            organizer_first_name: "$organizer.first_name",
            organizer_last_name: "$organizer.last_name",
            organizer_invite_link: "$organizer.invite_link",
            comments: "$comments",
          },
        },
      ])
      .toArray();

    if (myDoc[0].comments) {
      let icount = 0;
      for (let i = 0; i < myDoc[0].comments.length; i++) {
        if (!myDoc[0].comments[i].date_deleted) {
          icount += 1;
        }
      }
      myDoc[0].comment_count = icount;
    }

    //see if authUser allowed to open group (if any)
    if (myDoc[0].group_id) {
      let groupMember = false;
      authUser.data.groups.map((group) => {
        if (group.group_id === myDoc[0].group_id && !group.date_deleted) {
          groupMember = true;
        }
      });
      myDoc[0].groupMember = groupMember;
    }

    //see if authUser allowed to open organization (if any)
    if (myDoc[0].org_id) {
      let orgMember = false;
      if (authUser.data.organizations) {
        authUser.data.organizations.map((org) => {
          if (org.org_id === myDoc[0].org_id && !org.date_deleted) {
            orgMember = true;
          }
        });
      }
      myDoc[0].orgMember = orgMember;
    }

    //TEST FOR EVENT IN THE PAST
    let pastEvent = false;
    //const today = new Date().getTime();
    //Draft Events are never in the pasts
    //if (myDoc[0].status !== "Draft") {

    pastEvent = await eventInPast(
      myDoc[0].final_start_date,
      myDoc[0].proposed_date1,
      myDoc[0].proposed_date2
    );
    //}
    myDoc[0].pastEvent = pastEvent;

    //create image link
    /*  const imageLink = `${process.env.SERVER_PATH}Graphics/ImageDB/${
       myDoc[0].image_id
     }.${moment(new Date(myDoc[0].image_date)).tz(timezone).format("MMDDYYYYHHmmss")}.png`;
     myDoc[0].imageLink = imageLink; */

    // get invitees
    const inviteParams = {
      event_id: id,
      no_deleted: true,
      bypassCache: true,
    };
    const invitees = await getEventInvitees(inviteParams, authUser);

    if (myDoc && myDoc[0] && invitees && invitees.data) {
      const inviteesResult = invitees.data;
      const uid = authUser.data.person_id;
      let inviteeRec;
      let ratingCount = 0; // Number of ratings
      let eventRating = 0; // Average of all ratings
      // get organizer & inviteeRec
      for (let i = 0; i < inviteesResult.length; i++) {
        if (inviteesResult[i].invited_id === uid) {
          inviteeRec = inviteesResult[i];
        }
      }
      let organizerDisplayName = `${myDoc[0].organizer_first_name} ${myDoc[0].organizer_last_name}`;
      if (uid === myDoc[0].created_by) {
        organizerDisplayName = "You";
      }
      let acceptedCount = 0;

      // FIND OUT HOW MANY DECLINED
      for (let i = 0; i < invitees.data.length; i++) {
        if (invitees.data[i].rsvp_status === "yes") {
          acceptedCount += 1;
        }
        if (invitees.data[i].rating) {
          ratingCount = ratingCount + 1;
          eventRating = eventRating + invitees.data[i].rating;
        }
      }

      myDoc[0].inviteeRec = inviteeRec;
      myDoc[0].invitee_email = authUser.data.user_id;
      myDoc[0].invitee_full_name = `${authUser.data.first_name} ${authUser.data.last_name}`;
      myDoc[0].organizer_display_name = organizerDisplayName;
      myDoc[0].invite_count = invitees.data.length;
      myDoc[0].invitees = invitees.data;
      myDoc[0].accepted_count = acceptedCount;
      myDoc[0].rating_count = ratingCount;
      if (eventRating != 0) {
        let average = eventRating / ratingCount;
        let roundedValue = Math.round(average * 100) / 100;
        myDoc[0].event_rating = roundedValue;
      } else {
        myDoc[0].event_rating = null;
      }
    }

    //check all permissions and bail if fail
    let isValid = false;

    if (myDoc[0].created_by === authUser.data.person_id) {
      isValid = {
        message: "ok",
      };
      myDoc[0].eventAdmin = true;
    } else {
      /* if (myDoc[0].inviteeRec) {
        isValid = {
          message: "ok",
        };
      } else { */
      if (!editing) {
        isValid = await invitePermitted({
          eventRec: myDoc[0],
          friendInviteId: myDoc[0].organizer_invite_link[0],
          authUser: authUser,
          boolOnly: true,
          fromInvite: false,
        });
        if (isValid) {
          isValid = {
            message: "ok",
          };
        }
      }
      //}
    }

    if (!isValid || isValid.message !== "ok") {
      return null;
    }

    //determine if rating needed
    //================================
    const today = new Date();
    let startDate = new Date(today.setDate(today.getDate() - 30));
    const today2 = new Date();
    let endDate = new Date(today2.setDate(today2.getDate() - 1)); // should be the day after the event occurrence (24 hours)
    if (
      myDoc[0].status !== "Draft" &&
      myDoc[0].final_start_date &&
      new Date(myDoc[0].final_start_date) < endDate &&
      new Date(myDoc[0].final_start_date) > startDate &&
      myDoc[0].inviteeRec &&
      !myDoc[0].inviteeRec.rating &&
      myDoc[0].inviteeRec.rsvp_status &&
      myDoc[0].inviteeRec.rsvp_status !== "no" &&
      myDoc[0].inviteeRec.rsvp_status !== "absent"
    ) {
      myDoc[0].needsRated = true;
    }
    //================================

    // TEST IF WE HAVE A VISIBILITY MISS MATCH, I.E. ORG VISIBILITY WHEN NO ORG_ID
    if (!myDoc[0].org_id && myDoc[0].visibility === "organization") {
      const permParams = {
        event_id: id,
        visibility: "friends",
        visibilityOnly: true,
      }
      await insertEvent(permParams, authUser);
      myDoc[0].visibility = "friends";
      myDoc[0].permissionWarn = true;
    }

    return myDoc[0];
  } catch (err) {
    log({
      level: "error",
      message: `Error occurred while fetching event, id: ${id}`,
      function: "getEvent",
      error_code: 500,
      error_stack: err.stack,
    });
    return null;
  }
}

async function getMyEvents(params, authUser) {
  try {
    const view = params.view; //past/draft/future
    const today = new Date();
    const groupId = params.group_id;
    const orgId = params.org_id;
    const limit = params.limit || 50;
    const minimal = params.minimal || false;
    const filter = params.filter;
    let friend_filter = params.friend_filter
      ? params.friend_filter.toString()
      : false; //used from notifications.  "Friends", "Friends-of-Friends", "Both", "Invited", "Managed"

    let person1 = JSON.parse(JSON.stringify(authUser.data)); // because myEvents funges up authUser. So make a copy.

    //Because we pass in startdate and enddate, this function is already
    //time zone aware, and seems to return properly to front end.
    let startDate = new Date();
    startDate = params.start_date || today.setDate(today.getDate() - 1);
    startDate = new Date(startDate);
    let testStartDate = new Date(startDate);
    let endDate = new Date();
    endDate =
      params.end_date || testStartDate.setDate(testStartDate.getDate() + 180);
    endDate = new Date(endDate);
    const events = db.collection("events");

    let matchArray = {};
    let projectArray = {
      event_id: 1,
      event_name: 1,
      event_description: 1,
      image_id: 1,
      image_date: "$image.date_modified",
      image_version: "$image.version",
      //imageLink: { $concat: [process.env.SERVER_PATH, "Graphics/ImageDB/", "$image_id", ".", "$image_version", ".png"] },
      status: 1,
      visibility: 1,
      created_by: 1,
      hybrid_place_id: 1,
      owner_first: "$owner.first_name",
      owner_last: "$owner.last_name",
      proposed_date1: 1,
      proposed_end_date1: 1,
      proposed_general1: 1,
      proposed_date2: 1,
      proposed_end_date2: 1,
      proposed_general2: 1,
      final_start_date: 1,
      final_end_date: 1,
      rsvp_deadline: 1,
      group_id: "$eventgroup.group_id",
      group_name: "$eventgroup.group_name",
      org_name: "$eventorg.name",
      "inviteeRec.rsvp_status": "$inviteeRec.rsvp_status",
      sort: { $ifNull: ["$final_start_date", "$proposed_date1"] },
    };

    if (minimal) {
      // for use in minimal calls as in for NotificationCards
      projectArray = {
        event_id: 1,
        proposed_date1: 1,
        proposed_date2: 2,
        final_start_date: 1,
        hybrid_place_id: 1,
        created_by: 1,
        "inviteeRec.rsvp_status": "$inviteeRec.rsvp_status",
        sort: { $ifNull: ["$final_start_date", "$proposed_date1"] },
      };
    }

    //*********************************************************************
    //"YOUR PAST EVENTS"   *************************************************
    //*********************************************************************
    //FOR PAST EVENTS WILL ONLY RETURN IF YOU EXIST IN THE EVENTPEOPLE FOR THE EVENT OR YOU CREATED THE EVENT
    if (view === "past") {
      projectArray = {
        ...projectArray,
        pastEvent: 1,
      };
      matchArray = {
        //$and: [
        status: { $ne: "Draft" },
        date_deleted: { $eq: null },
        $or: [
          //All most be in past based on AV conversation
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

      if (groupId && groupId !== null) {
        matchArray = {
          ...matchArray,
          group_id: groupId,
        };
      }

      if (orgId && orgId !== null) {
        matchArray = {
          ...matchArray,
          org_id: orgId,
        };
      }

      /* sortArray = {    
        final_start_date: -1,    
        proposed_date1: -1,
        event_name: 1,
      }; */

      //GET PAST DATA
      const myDoc = await events
        .aggregate(
          [
            {
              $match: matchArray,
            },
            {
              $lookup: {
                from: "groups",
                localField: "group_id",
                foreignField: "group_id",
                as: "eventgroup",
              },
            },
            {
              $lookup: {
                from: "organizations",
                localField: "org_id",
                foreignField: "org_id",
                as: "eventorg",
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
                from: "eventpeople",
                localField: "event_id",
                foreignField: "event_id",
                as: "inviteeRec",
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
                $or: [
                  {
                    "inviteeRec.rsvp_status": {
                      $in: ["yes", "present", "remote"],
                    },
                  },
                  { created_by: authUser.data.person_id },
                ],
              },
            },
            {
              $addFields: { pastEvent: true },
            },
            {
              $project: projectArray,
            },
            {
              $sort: {
                sort: -1,
                event_name: 1,
              },
            },
          ],
          {
            allowDiskUse: false,
          }
        )
        /* .sort(sortArray) */
        .limit(limit)
        .toArray();
      let inviteeMatchArray = {
        "inviteeRec.date_deleted": null,
      };
      // Fetch Event Invitees
      let eventsInvitedTo = await getEventsInvitedTo(
        matchArray,
        inviteeMatchArray
      );
      eventsInvitedTo = eventsInvitedTo ? eventsInvitedTo : [];
      let myDoc2 = [];
      // Calculate average of all ratings and number of ratings for the event.
      for (let i = 0; i < myDoc.length; i++) {
        let eventRating = 0; // average of all ratings
        let ratingCount = 0; // number of ratings
        for (let n = 0; n < eventsInvitedTo.length; n++) {
          if (myDoc[i].event_id === eventsInvitedTo[n].event_id) {
            if (eventsInvitedTo[n].rating) {
              ratingCount = ratingCount + 1;
              eventRating = eventRating + eventsInvitedTo[n].rating;
            }
          }
        }
        if (eventRating != 0) {
          let average = eventRating / ratingCount;
          let roundedValue = Math.round(average * 100) / 100;
          myDoc[i].event_rating = roundedValue;
        } else {
          myDoc[i].event_rating = null;
        }
        myDoc[i].rating_count = ratingCount;
        myDoc2.push(myDoc[i]);
      }
      return myDoc2;
    }

    //*********************************************************************
    //"YOUR FUTURE EVENTS"   **********************************************
    //*********************************************************************
    if (view === "future") {
      // -- GET MY CLEAN GROUPS.
      let myGroups = []; // hold array of my groups.
      if (!groupId) {
        // Didn't pass a specific group to the funtion
        const cleanUser = await groups.cleanPersonGroups(authUser.data, true);
        for (let i = 0; i < cleanUser.groups.length; i++) {
          myGroups = [...myGroups, cleanUser.groups[i].group_id];
        }
      } else {
        myGroups = [groupId];
      }

      // -- GET MY CLEAN ORGS.
      const myCleanOrgs = await organizations.cleanUserOrgs(authUser.data);

      // -- GET MY FRIENDS.   || 2/22/22 - returns right record set for "Friends"
      //let person1 = authUser.data;  //declared above
      let myCleanGroupIds = [];
      for (let i = 0; i < person1.groups.length; i++) {
        //FILTER OUT GROUPS I'VE LEFT
        if (!person1.groups[i].date_deleted) {
          if (person1.groups[i].group_id) {
            myCleanGroupIds.push(person1.groups[i].group_id);
          }
        }
      }
      const myFriends = await people.getMyFriendIDs(person1, true); //2-2-22 - Chaged from data, true, true to exclude users default groups (causes events to show to more than just friends in "your" list.)

      // -- GET MY FRIENDS OF FRIENDS.   || 2/22/22 - returns right record set for "Friends of Friends"
      const myFriendsGroups = await people.getMyFriendsGroups(
        myFriends.data,
        false,
        true
      ); // changed to include GroupAdmins Only in record set.  That causes only groups your friends admin to be included.
      //update person record with those groups so we can get all friends.
      let person = authUser.data;
      person.groups = myFriendsGroups.data;
      //Get my friends friends
      const myFriendsFriends = await people.getMyFriendIDs(person, false);

      // -- GET EVENTS I AM INVITED TO.
      matchArrayEvents = {
        status: { $ne: "Draft" },
        date_deleted: { $eq: null },

        // NOTE: AV commented out the line below on 3.23.2022 re: RAD-815
        // visibility: { $ne: "anyone" }, //will get public in next data call, can exclude here.
        $or: [
          {
            //There is a final date, and it is greather than today.
            //{createdAt:{$gte:ISODate("2021-01-01"),$lt:ISODate("2020-05-01"}}
            final_start_date: { $ne: null },
            final_start_date: { $gt: startDate, $lt: endDate },
          },
          //If there is not a final date (and it is in the future), we will return events where either of the proposed dates is in the future.
          {
            //There is not a final date, but the proposed date 1 is greater than today
            final_start_date: null,
            proposed_date1: { $gt: startDate, $lt: endDate },
          },
          //There is not a final date, but the proposed date 2 is greater than today
          {
            final_start_date: null,
            proposed_date2: { $gt: startDate, $lt: endDate },
          },
        ],
      };

      let inviteeMatchArray = {
        "inviteeRec.date_deleted": null,
        "inviteeRec.invited_id": authUser.data.person_id,
      };
      if (filter === "yes" || filter == "maybe" || filter === "no") {
        inviteeMatchArray = {
          ...inviteeMatchArray,
          "inviteeRec.rsvp_status": filter,
        };
      }
      if (filter === "action") {
        // take action either vote or rsvpt as long as you're not already "yes" or "no"
        inviteeMatchArray = {
          ...inviteeMatchArray,
          "inviteeRec.rsvp_status": { $nin: ["no", "yes"] },
        };
      }
      const EventsInvitedTo = await getEventsInvitedTo(
        matchArrayEvents,
        inviteeMatchArray
      );
      //turn Events result into usable array of event ID's.  (We use the original array at the bottom
      //of this function to add back the rsvp_status)
      let myInvitedEvents = [];
      for (let i = 0; i < EventsInvitedTo.length; i++) {
        myInvitedEvents = [...myInvitedEvents, EventsInvitedTo[i].event_id];
      }

      //BUILD THE WHO PART FOR THE matchArrayFinal.  THE SWITCH IS PASSED AS AN OPTIONAL PARAM
      let matchWho;
      if (filter === "managed") {
        friend_filter = "managed";
      }
      if (filter === "yes" || filter === "no" || filter === "maybe") {
        friend_filter = "inviteetest";
      }
      /*  if (filter === "action") {
        friend_filter = "action";
      } */

      switch (friend_filter.toString().toLowerCase()) {
        case "friends":
          matchWho = [
            //CREATED BY ONE OF MY FRIENDS
            {
              visibility: { $all: ["friends"] },
              created_by: { $in: myFriends.data },
              event_id: { $nin: myInvitedEvents },
            },
          ];
          break;
        case "group":
          matchWho = [
            //EVENT IS IN ONE OF MY GROUPS
            {
              group_id: { $in: myGroups },
              visibility: { $all: ["group"] },
              event_id: { $nin: myInvitedEvents },
            },
          ];
          break;
        case "organization":
          console.log('organization')
          matchWho = [
            //EVENT IS IN ONE OF MY GROUPS
            {
              visibility: { $all: ["organization"] },
              org_id: { $in: myCleanOrgs },
              event_id: { $nin: myInvitedEvents },
            },
          ];
          break;
        case "friends-of-friends":
          matchWho = [
            //CREATED BY ONE OF MY FRIENDS of Friends
            {
              visibility: { $all: ["friends of friends"] },
              created_by: { $in: myFriendsFriends.data },
              event_id: { $nin: myInvitedEvents },
            },
          ];
          break;
        case "both":
          matchWho = [
            //CREATED BY ONE OF MY FRIENDS
            {
              visibility: { $all: ["friends"] },
              created_by: { $in: myFriends.data },
              event_id: { $nin: myInvitedEvents },
            },
            //CREATED BY ONE OF MY FRIENDS of Friends
            {
              visibility: { $all: ["friends of friends"] },
              created_by: { $in: myFriendsFriends.data },
              event_id: { $nin: myInvitedEvents },
            },
          ];
          break;
        case "invited":
          matchWho = [
            {
              //I AM INVITED TO THE EVENT
              event_id: { $in: myInvitedEvents },
              created_by: { $nin: [person1.person_id] },
            },
          ];
          break;
        case "inviteetest":
          matchWho = [
            {
              //I AM INVITED TO THE EVENT
              event_id: { $in: myInvitedEvents },
              //created_by: { $nin: [person1.person_id] },
            },
          ];
          break;
        /* case "action":            
            matchWho = [
              {
                //I AM INVITED TO THE EVENT
                //event_id: { $in: myInvitedEvents },
                //created_by: { $nin: [person1.person_id] },
                status: { $in: ["Voting", "RSVP" ] },
              },
            ]; 
            break;*/
        /*  case "groups":
           matchWho = [
             {
               //ASSOCIATED GROUP IS A GROUP I BELONG TO
               group_id: { $in: myGroups },
               created_by: { $nin: [person1.person_id] },
               visibility: { $nin: ["invited", "anyone with link"] },
             },
           ];
           break; */
        case "managed":
          matchWho = [
            //I CREATED THE EVENT
            { created_by: authUser.data.person_id },
          ];
          break;
        default:

          matchWho = [
            //VISIBLE TO ANYONE (Public)
            { visibility: { $all: ["anyone"] } },
            { visibility: "anyone" },
            //I CREATED THE EVENT
            { created_by: authUser.data.person_id },
            //I AM INVITED TO THE EVENT
            { event_id: { $in: myInvitedEvents } },
            //ASSOCIATED GROUP IS A GROUP I BELONG TO
            {
              group_id: { $in: myGroups },
              visibility: { $all: ["group"] },
              /*   visibility: { $all: ["friends"] }, */
            },
            //VISIBLE TO AN ORGANIZATION I BELONG TO
            {
              visibility: { $all: ["organization"] },
              org_id: { $in: myCleanOrgs },
            },
            //CREATED BY ONE OF MY FRIENDS
            { visibility: { $all: ["friends"] }, created_by: { $in: myFriends.data } },
            //CREATED BY ONE OF MY FRIENDS of Friends
            {
              visibility: { $all: ["friends of friends"] },
              created_by: { $in: myFriendsFriends.data },
            },
          ];
      }

      //BUILD MATCH ARRAY TO GET THE FUTURE EVENTS
      let statusFilter = { $ne: "Draft" };
      if (filter === "action") {
        statusFilter = { $in: ["Voting", "RSVP"] };
      }
      let matchArrayFuture = {
        $and: [
          { status: statusFilter },
          { date_deleted: { $eq: null } },
          {
            $or: [
              {
                //There is a final date, and it is greather than today.
                //{createdAt:{$gte:ISODate("2021-01-01"),$lt:ISODate("2020-05-01"}}
                final_start_date: { $ne: null },
                final_start_date: { $gt: startDate, $lt: endDate },
              },
              //If there is not a final date (and it is in the future), we will return events where either of the proposed dates is in the future.
              {
                //There is not a final date, but the proposed date 1 is greater than today
                final_start_date: null,
                proposed_date1: { $gt: startDate, $lt: endDate },
              },
              //There is not a final date, but the proposed date 2 is greater than today
              {
                final_start_date: null,
                proposed_date2: { $gt: startDate, $lt: endDate },
              },
            ],
          },
          {
            $or: matchWho,
          },
        ],
      };

      //GROUP & ORG LIVE AT TOP LEVEL OF EVENT SO CAN BE ADDED TO THE END OF THE MATCH ARRAY

      // -- IF PASSED A GROUP TO THIS LIST, FILTER TO JUST GROUP
      if (groupId && groupId !== null) {
        //This is what makes events on a group work.
        matchArrayFuture = {
          ...matchArrayFuture,
          group_id: groupId,
        };
      }

      // -- IF PASSED AN ORGID TO THIS LIST, FILTER TO JUST THE ORG
      //TODO: [RAD-463] Upgrade the OrgID filter on getEvent when we code how we want to use it.
      if (orgId && orgId !== null) {
        matchArrayFuture = {
          ...matchArrayFuture,
          org_id: orgId,
        };
      }

      //console.log(JSON.stringify(matchArrayFuture));

      //USE THE MATCH ARRAY TO GET ALL event_id(s) THIS USER SHOULD SEE
      const myEventIDs = await events.distinct("event_id", matchArrayFuture);

      //ADD TO MATCH ARRAY TO PASS INTO AGGREGATE
      const eventsMatchArray = {
        event_id: {
          $in: myEventIDs,
        },
      };

      //GET THE FUTURE EVENTS FROM DATABASE  *************
      const myDoc = await events
        .aggregate(
          [
            {
              $match: eventsMatchArray, // Just uses the ID's built in the above list.
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
                from: "people",
                localField: "created_by",
                foreignField: "person_id",
                as: "owner",
              },
            },
            {
              $lookup: {
                from: "groups",
                localField: "group_id",
                foreignField: "group_id",
                as: "eventgroup",
              },
            },
            {
              $lookup: {
                from: "organizations",
                localField: "org_id",
                foreignField: "org_id",
                as: "eventorg",
              },
            },
            {
              $project: projectArray,
            },
            {
              $sort: {
                sort: 1,
                event_name: 1,
              },
            },
          ],
          {
            allowDiskUse: false,
          }
        )
        .limit(limit)
        .toArray();

      let myDoc2 = [];
      const mutedPeople = authUser.data.muted_people;
      if (myDoc && EventsInvitedTo) {
        //Need to add the RSVP Status to the array for events that you are invited to.
        //Note: You may not be invited to all future events, but will see them because of the various visibility.

        for (let i = 0; i < myDoc.length; i++) {
          /* TODO: [RAD-631] Optimize this call not to be 2 loops, but use the "in thing" */
          /*  if (EventsInvitedTo.indexOf(myDoc[i].event_id) > -1) {
                consol.log("yes");
              myDoc[i].inviteeRec.rsvp_status =  EventsInvitedTo.indexOf(myDoc[i].event_id).rsvp_status;
              } */
          for (let n = 0; n < EventsInvitedTo.length; n++) {
            if (myDoc[i].event_id === EventsInvitedTo[n].event_id) {
              //Push your RSVP Status to the event if you have one
              myDoc[i].inviteeRec.rsvp_status = EventsInvitedTo[n].rsvp_status;
            }
          }

          // if creator is muted by currentUser (authUser) remove those
          // in which we are not already a named invitee (in eventPeople)
          if (mutedPeople && mutedPeople.length > 0) {
            if (mutedPeople.indexOf(myDoc[i].created_by) > -1) {
              if (myDoc[i].inviteeRec && myDoc[i].inviteeRec.rsvp_status) {
                // muted BUT user is already in the invtees list so DON'T mute it
                myDoc2.push(myDoc[i]);
              }
            } else {
              myDoc2.push(myDoc[i]);
            }
          } else {
            myDoc2.push(myDoc[i]);
          }
        }
      }

      return myDoc2;
    }

    //*********************************************************************
    //"YOUR DRAFT EVENTS"   ***********************************************
    //*********************************************************************
    //IF DESIRED VIEW IS DRAFT, RETURN ALL EVENTS IN DRAFT MODE WHERE I AM THE CREATOR
    if (view === "draft") {
      matchArray = {
        status: "Draft",
        date_deleted: { $eq: null },
        created_by: authUser.data.person_id,
      };
      //Filter to just group if a group was passed
      if (groupId && groupId !== null) {
        matchArray = {
          ...matchArray,
          group_id: groupId,
        };
      }
      //Filter to org if just org passed.
      if (orgId && orgId !== null) {
        matchArray = {
          ...matchArray,
          org_id: orgId,
        };
      }

      sortArray = {
        proposed_date1: -1,
        event_name: 1,
      };

      //GET DRAFT DATA
      const myDoc = await events
        .aggregate(
          [
            {
              $match: matchArray,
            },
            {
              $lookup: {
                from: "groups",
                localField: "group_id",
                foreignField: "group_id",
                as: "eventgroup",
              },
            },
            {
              $lookup: {
                from: "organizations",
                localField: "org_id",
                foreignField: "org_id",
                as: "eventorg",
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
                //Just need your invitee Record
                from: "eventpeople",
                localField: "event_id",
                foreignField: "event_id",
                as: "inviteeRec",
              },
            },
            {
              $unwind: {
                path: "$inviteeRec", //Must unwind to set to "just you"
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
              $project: projectArray,
            },
            {
              $sort: {
                sort: -1,
                event_name: 1,
              },
            },
            /* {
              $lookup: {
                from: "images",
                localField: "image_id",
                foreignField: "image_id",
                as: "images",
              },
            }, */
          ],
          {
            allowDiskUse: false,
          }
        )
        /*  .sort(sortArray) */
        .limit(limit)
        .toArray();
      return myDoc;
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while fetching my events.",
      function: "getMyEvents",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function getEventsInvitedTo(matchArrayEvents, inviteeMatchArray) {
  try {
    const events = db.collection("events");
    const EventsInvitedTo = await events
      .aggregate(
        [
          {
            $match: matchArrayEvents,
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
              path: "$inviteeRec", //Must unwind to set to "just you"
            },
          },
          {
            $match: inviteeMatchArray,
          },
          {
            $project: {
              event_id: 1,
              rsvp_status: "$inviteeRec.rsvp_status",
              rating: "$inviteeRec.rating",
            },
          },
        ],
        {
          allowDiskUse: false,
        }
      )
      // .limit(50)  // NO NEED TO LIMIT HERE.  RETURN ALL FUTURE EVENTS I AM PART OF.
      .toArray();
    return EventsInvitedTo;
  } catch (err) {
    log({
      level: "error",
      message: `Error occurred while fetching events invited to`,
      function: "getEventsInvitedTo",
      params: matchArrayEvents,
      error_code: 500,
      error_stack: err.stack,
    });
    return;
  }
}

async function updateRSVP(eventPeopleId, status, personId) {
  try {
    const date = new Date();

    const query = { eventpeople_id: eventPeopleId };
    let fieldArray = {
      modified_by: personId,
      date_modified: date,
      rsvp_status: status,
    };

    const setArray = { $set: fieldArray };

    const collection = db.collection("eventpeople");

    await collection.updateOne(query, setArray);
  } catch (err) {
    log({
      level: "error",
      message: `Error occurred while updating RSVP, eventPeopleId: ${eventPeopleId}, status: ${status}, personId: ${personId}`,
      function: "updateRSVP",
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function getEventInvitee(params, authUser) {
  try {
    const collection = db.collection("eventpeople");
    const inviteeRec = await collection.findOne({
      invited_id: params.person_id,
      event_id: params.event_id,
    });

    if (
      inviteeRec &&
      (!inviteeRec.rsvp_status || inviteeRec.rsvp_status === "sent")
    ) {
      // set RSVP to :"opened"
      await updateRSVP(
        inviteeRec.eventpeople_id,
        "opened",
        authUser.data.person_id
      );
    }
    return {
      data: inviteeRec,
      message: "ok",
      code: 200,
    };
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while fetching event invitee.",
      function: "getEventInvitee",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    return {
      message: "Error getting event invitee",
      code: 500,
    };
  }
}

async function testInvitee(eventId, authUser) {
  try {
    const personId = authUser.data.person_id;
    const collection = db.collection("eventpeople");
    const myDoc = collection.countDocuments({
      event_id: eventId,
      invited_id: personId,
      date_deleted: null,
    });
    return myDoc;
  } catch (error) {
    log({
      level: "error",
      message: `Error occurred while test invitee, eventId: ${eventId}`,
      function: "testInvitee",
      error_code: 500,
      error_stack: error.stack,
    });
  }
}

const cachedInvitees = new NodeCache({ stdTTL: 86300, checkperiod: 86400 });

async function getEventInvitees(params) {
  try {
    const bypassCache = params.bypassCache || false;
    const eventpeople = db.collection("eventpeople");
    const count = await eventpeople.countDocuments({
      event_id: params.event_id,
      date_deleted: null,
    });

    let matchArray = {
      event_id: params.event_id,
    };
    if (params.no_deleted) {
      matchArray = {
        ...matchArray,
        date_deleted: null,
      };
    }
    if (params.invited_id) {
      matchArray = {
        ...matchArray,
        invited_id: params.invited_id,
      };
    }
    let invitees;
    let tempInvitees = cachedInvitees.get(params.event_id);
    if (!bypassCache && tempInvitees) {
      invitees = tempInvitees;
      //console.log("using cache");
      //console.log(`cachedInvitees: ${cachedInvitees.keys().length}`);
    } else {
      //console.log(`going to db`);
      invitees = await eventpeople
        .aggregate(
          [
            {
              $match: matchArray,
            },
            {
              $lookup: {
                localField: "invited_id",
                from: "people",
                foreignField: "person_id",
                as: "people",
              },
            },
            {
              $unwind: "$people",
            },
            {
              $match: {
                "people.date_deleted": null,
              },
            },
            {
              $project: {
                eventpeople_id: "$eventpeople_id",
                event_id: "$event_id",
                person_id: "$invited_id",
                date_preference: "$date_preference",
                place_preference: "$place_preference",
                place_type: "$place_type",
                rsvp_status: "$rsvp_status",
                first_name: "$people.first_name",
                last_name: "$people.last_name",
                image: { $ifNull: ["$people.thumbnail", "$people.image"] },
                date_deleted: "$date_deleted",
                invited_id: "$invited_id",
                inviter_id: "$inviter_id",
                attendance: "$attendance",
                rating: "$rating",
              },
            },
            {
              $sort: {
                first_name: 1,
                last_name: 1,
              },
            },
          ],
          {
            allowDiskUse: false,
          }
        )
        .limit(params.take || 1000)
        .toArray();
      if (invitees) {
        if (!bypassCache) {
          cachedInvitees.set(params.event_id, invitees, 86400); // 86400 = 24 hours
        } else {
          //purge cache item
          cachedInvitees.del(params.event_id);
        }
      }
    }
    return {
      data: invitees,
      count: count,
    };
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while fetching event invitees.",
      function: "getEventInvitees",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function getEventForRate(params) {
  try {
    const eventPeopleCollection = db.collection("eventpeople");
    const eventCollection = db.collection("events");
    const personCollection = db.collection("people");

    //FIRST MAKE SURE USER IS IN EVENTPEOPLE
    const myEventPeople = await eventPeopleCollection
      .find({ event_id: params.event_id, invited_id: params.person_id })
      .project({
        eventpeople_id: 1,
        inviter_id: 1,
        rating: 1,
      })
      .toArray();

    if (!myEventPeople) {
      return {
        event: null,
        person: null,
        rating: null,
        code: 500,
        message: "Person is not on the attendee list.",
      };
    }

    const myEvent = await eventCollection
      .find({ event_id: params.event_id })
      .project({
        event_id: 1,
        event_name: 1,
        event_description: 1,
        final_start_date: 1,
        final_end_date: 1,
      })
      .toArray();

    const myPerson = await personCollection
      .find({ person_id: params.person_id })
      .project({
        pesron_id: 1,
        first_name: 1,
      })
      .toArray();
    return {
      event: myEvent[0],
      person: myPerson[0],
      rating: myEventPeople[0].rating || null,
      eventpeople_id: myEventPeople[0].eventpeople_id,
      code: 200,
      message: "ok",
    };
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while fetching event for rating.",
      function: "getEventForRate",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    return {
      event: null,
      person: null,
      rating: null,
      code: 500,
      message: "Error fetching event for rating",
    };
  }
}

async function getEventInvitation(id, friendInviteId, authUser, isPublic) {
  // NOTE: this used on public invite page. No auth needed
  try {
    const collection = db.collection("events");
    const myDoc = await collection
      .aggregate([
        {
          $match: {
            event_id: id,
          },
        },
        {
          $lookup: {
            from: "organizations",
            localField: "org_id",
            foreignField: "org_id",
            as: "eventorg",
          },
        },
        {
          $lookup: {
            from: "groups",
            localField: "group_id",
            foreignField: "group_id",
            as: "eventgroup",
          },
        },
        {
          $project: {
            org_name: "$eventorg.name",
            group_name: "$eventgroup.group_name",
            proposed_place_id1: 1,
            proposed_place_id2: 1,
            proposed_place1_type: 1,
            proposed_place2_type: 1,
            final_place_id: 1,
            final_place_type: 1,
            hybrid_place_id: 1,
            event_id: 1,
            event_name: 1,
            event_description: 1,
            image_id: 1,
            org_id: 1,
            proposed_date1: 1,
            proposed_end_date1: 1,
            proposed_general1: 1,
            proposed_date2: 1,
            proposed_end_date2: 1,
            proposed_general2: 1,
            final_start_date: 1,
            final_end_date: 1,
            date_deleted: 1,
            visibility: 1,
            status: 1,
            group_id: 1,
            rsvp_deadline: 1,
            attendee_limit: 1,
          }
        },
      ])
      .toArray();

    const eventRec = myDoc[0];

    //TEST FOR DELETED EVENT
    if (eventRec.date_deleted && eventRec.date_deleted !== undefined) {
      return {
        data: null,
        message: "deleted",
      };
    }

    //TEST FOR DRAFT STATE
    if (eventRec.status === "Draft")
      return {
        data: null,
        message: "incomplete",
      };

    //TEST FOR INVITATION FOR EVENT IN PAST
    let pastEvent = false;
    pastEvent = await eventInPast(
      eventRec.final_start_date,
      eventRec.proposed_date1,
      eventRec.proposed_date2
    );
    if (pastEvent) {
      return {
        data: null,
        message: "pastEvent",
      };
    }

    //TEST FOR INCOMPLETE STATE(S)
    //Date & Place
    if (
      (!eventRec.proposed_date1 && !eventRec.final_start_date) ||
      (!eventRec.proposed_google_id1 &&
        !eventRec.proposed_place_id1 &&
        !eventRec.final_place_id)
    ) {
      return {
        data: null,
        message: "incomplete",
      };
    }

    //TEST FOR RSVP REPONSE LIMIT
    if (
      eventRec.attendee_limit &&
      eventRec.attendee_limit !== undefined &&
      eventRec.attendee_limit > 0
    ) {
      const collection2 = db.collection("eventpeople");
      const myDoc = await collection2.countDocuments({
        date_deleted: null,
        event_id: id,
        rsvp_status: { $in: ["yes"] },
      });
      if (myDoc >= eventRec.attendee_limit && authUser) {
        const myDoc2 = await collection2.countDocuments({
          date_deleted: null,
          event_id: id,
          invited_id: authUser.data.person_id,
          rsvp_status: { $in: ["yes"] },
        });
        // expect a count of 1 if user has previously voted "yes" and is just changing rsvp vote
        if (myDoc2 === 0) {
          return {
            data: null,
            message: "overRSVPLimit",
          };
        }
      }
    }

    //TEST FOR EXPIRED RSVP
    const today = new Date();
    //Does Event Have Final Date & Is Final Date Less than today?
    if (eventRec.rsvp_deadline && eventRec.rsvp_deadline !== undefined) {
      if (eventRec.rsvp_deadline < today) {
        return {
          data: null,
          message: "rsvpExpired",
        };
      }
    }

    // TEST IF IS ONLY TIME FOR RSVP
    // REMOVE UNECESSARY VOTING OPTIONS
    if (eventRec.final_start_date) {
      delete eventRec.proposed_date1;
      delete eventRec.proposed_end_date1;
      delete eventRec.proposed_general1;
      delete eventRec.proposed_date2;
      delete eventRec.proposed_end_date2;
      delete eventRec.proposed_general2;
      delete eventRec.proposed_place_id1;
      delete eventRec.proposed_place_id2;
      delete eventRec.proposed_place1_type;
      delete eventRec.proposed_place2_type;
    }

    //None of the situations above kicked us out, so test if public.
   
    if (isPublic) {
      return {
        data: eventRec,
        message: "ok",
      };
    } else {
      eventRec.invitee_full_name = `${authUser.data.first_name} ${authUser.data.last_name}`;
      eventRec.invitee_email = `${authUser.data.user_id}`;
      //Not public, so test if the current user is allowed to see the invitation
      const permission = await invitePermitted({
        eventRec: eventRec,
        friendInviteId: friendInviteId,
        authUser: authUser,
        boolOnly: false,
        fromInvite: true,
      });
      return {
        data: permission.data,
        message: permission.message,
      };
    }
  } catch (err) {
    log({
      level: "error",
      message: `Error occurred while fetching event invitation, id: ${id}, friendInviteId: ${friendInviteId}, authUser: ${authUser}, isPublic: ${isPublic}`,
      function: "getEventInvitation",
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function invitePermitted({ eventRec, friendInviteId, authUser, boolOnly, fromInvite }) {
  // if no eventRec, then go get the event with eventId
  // and return true or false based on permitted

  try {
    /* TEST DELETED */
    if (eventRec.date_deleted) {
      return {
        data: null,
        message: "deleted",
      };
    }
    /* TEST STATUS */
    if (
      eventRec.status === "Draft" &&
      authUser.data.person_id !== eventRec.created_by
    ) {
      return {
        data: null,
        message: "incomplete",
      };
    }

    /* TEST IF INVITED */
    const eventPeopleCollection = db.collection("eventpeople");
    const isInvited = await eventPeopleCollection.findOne({
      invited_id: authUser.data.person_id,
      event_id: eventRec.event_id,
      date_deleted: null,
    });
    if (isInvited) {
      return {
        data: eventRec,
        message: "ok",
      };
    }

    /* TEST VISIBILITY */
    const visibility = eventRec.visibility;
    if (visibility.indexOf("anyone") > -1) {
      console.log('anyone')
      return {
        data: eventRec,
        message: "ok",
      };
    }

    const invitedPersonId = authUser.data.person_id;

    //Test if you were inviter
    const inviterPerson = await people.getInviter(friendInviteId);
    const inviterPersonId = inviterPerson.data.person_id;
    let permissionResult = {
      data: null,
      message: "unauthorized",
    };

    let validToOpen = false;
    //GROUP
    if (!validToOpen && visibility.indexOf("group") > -1) {
      //Test if a group attached to event, and you are a member of the event.c
      if (eventRec.group_id) {

        const groupMember = await groups.getAmGroupMember(
          { group_id: eventRec.group_id },
          authUser
        );

        if (groupMember.data) {
          validToOpen = true;
          permissionResult = {
            data: eventRec,
            message: "ok",
          };
        }
      }
    }
    //FRIENDS
    if (!validToOpen && visibility.indexOf("friends") > -1) {
      // only if authUser is connected to inviter
      const friendId = {
        friend_person_id: inviterPersonId,
      }
      const testFriends = await people.checkUserIsFriendOrNot(
        friendId,
        authUser,
      );
      if (testFriends.code === 200 && testFriends.data) {
        console.log('friends');
        validToOpen = true;
        permissionResult = {
          data: eventRec,
          message: "ok",
        };
      }
    }
    //FRIENDS OF FRIENDS
    if (!validToOpen && visibility.indexOf("friends of friends") > -1) {
      // authUser and friends of authUser ONLY if authUser is connected to inviter
      const friendsModel = {
        person_id1: inviterPersonId,
        person_id2: invitedPersonId,
      };
      const testFriendsOfFriends = await people.getFriendsOfFriends(
        friendsModel
      );
      if (testFriendsOfFriends && testFriendsOfFriends.length > 0) {
        console.log('friends of friends');
        validToOpen = true;
        permissionResult = {
          data: eventRec,
          message: "ok",
        };
      }
    }
    //ORGANIZATION
    if (!validToOpen && visibility.indexOf("organization") > -1) {
      // only if authUser is connected to organization
      // -- GET MY CLEAN ORGS.
      if (eventRec.org_id) {
        const myCleanOrgs = await organizations.cleanUserOrgs(
          authUser.data,
          eventRec.org_id
        );
        if (myCleanOrgs) {
          console.log('organization');
          validToOpen = true;
          permissionResult = {
            data: eventRec,
            message: "ok1",
          };
        }
      } else {
        permissionResult = {
          data: null,
          message: "missing org",
        };
      }
    }
    // INVITED?
    if (!validToOpen && visibility.indexOf("invited") > -1) {
      // authUser must be in the invitees list
      //const invitees = await getEventInvitees(params, authUser);
      const isValid = await testInvitee(eventRec.event_id, authUser);
      if (isValid && isValid > 0) {
        console.log('invited');
        // user is in the invite list
        validToOpen = true;
        permissionResult = {
          data: eventRec,
          message: "ok",
        };
      }
    }
    // ANYONE WITH LINK?
    if (!validToOpen && fromInvite && visibility.indexOf("anyone with link") > -1) {
      console.log('anyone with link');
      validToOpen = true;
      permissionResult = {
        data: eventRec,
        message: "ok",
      };
    }
    /* switch (visibility) {
      case "invited":
        // authUser must be in the invitees list
        //const invitees = await getEventInvitees(params, authUser);
        const isValid = await testInvitee(eventRec.event_id, authUser);
        if (isValid && isValid > 0) {
          // user is in the invite list
          permissionResult = {
            data: eventRec,
            message: "ok",
          };
        }
        break;
      case "friends":
        // only if authUser is connected to inviter
        const friendId = {
          friend_person_id: inviterPersonId,
        }
        const testFriends = await people.checkUserIsFriendOrNot(
          friendId,
          authUser,
        );
        if (testFriends.code === 200 && testFriends.data) {
          permissionResult = {
            data: eventRec,
            message: "ok",
          };
        }
        break;
      case "friends of friends":
        // authUser and friends of authUser ONLY if authUser is connected to inviter
        const friendsModel = {
          person_id1: inviterPersonId,
          person_id2: invitedPersonId,
        };
        const testFriendsOfFriends = await people.getFriendsOfFriends(
          friendsModel
        );
        if (testFriendsOfFriends && testFriendsOfFriends.length > 0) {
          permissionResult = {
            data: eventRec,
            message: "ok",
          };
        }
        break;
      case "organization":
        // only if authUser is connected to organization
        // -- GET MY CLEAN ORGS.
        if (eventRec.org_id) {
          const myCleanOrgs = await organizations.cleanUserOrgs(
            authUser.data,
            eventRec.org_id
          );
          if (myCleanOrgs) {
            permissionResult = {
              data: eventRec,
              message: "ok1",
            };
          }
        } else {
          permissionResult = {
            data: null,
            message: "missing org",
          };
        }
        break;
      default:
        permissionResult = {
          data: null,
          message: "unauthorized",
        };
    } */



    /* TEST EXPIRED */
    pastEvent = false;
    pastEvent = await eventInPast(
      eventRec.final_start_date,
      eventRec.proposed_date1,
      eventRec.proposed_date2
    );
    if (pastEvent) {
      return {
        data: permissionResult.data,
        message: "expired",
      };
    }

    const today = new Date().getTime();
    const finalDate = eventRec.final_start_date
      ? new Date(eventRec.final_start_date).getTime()
      : null;
    const propDate1 = new Date(eventRec.proposed_date1).getTime();
    const propDate2 = eventRec.proposed_date2
      ? new Date(eventRec.proposed_date2).getTime()
      : null;
    if (finalDate && finalDate < today) {
      return {
        data: permissionResult.data,
        message: "expired",
      };
    }
    if (propDate1 < today && propDate2 && propDate2 < today) {
      return {
        data: permissionResult.data,
        message: "expired",
      };
    }
    if (boolOnly) {
      if (permissionResult.data) {
        return true;
      } else {
        return false;
      }
    } else {
      return {
        data: permissionResult.data,
        message: permissionResult.message,
      };
    }
  } catch (err) {
    log({
      level: "error",
      message: `Error occurred while checking invite permitted or not, eventRec: ${eventRec}, friendInviteId: ${friendInviteId}, authUser: ${authUser}, boolOnly: ${boolOnly}`,
      function: "invitePermitted",
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function insertEvent(params, authUser) {
  const cid = crypto.randomBytes(16).toString("hex");
  const date = new Date();
  try {
    const eventID = params.event_id || cid;
    const updating = params.event_id;
    const query = { event_id: eventID };
    const deleteNotify = params.notify || false;
    const timezone = params.timezone; //for creating presentable delete message.
    let imageID = params.image_id;
    let fieldArray;
    let pushArrayMsg;
    let changeType;
    if (params.date_deleted) {
      // DELETING EVENT
      fieldArray = {
        event_id: eventID,
        date_deleted: date,
        deleted_by: authUser.data.person_id,
      };
      changeType = "deleted";
      pushArrayMsg = `Deleted event.`;
    } else if (params.visibilityOnly) {
      // JUST SAVING VISIBILITY OBJECT
      fieldArray = {
        event_id: eventID,
        visibility: params.visibility,
      };
      changeType = "visibility";
      pushArrayMsg = `Changed ${changeType} to ${params.visibility}`;
    } else if (params.orgOnly) {
      // JUST SAVING RELATED ORG ID
      fieldArray = {
        event_id: eventID,
        org_id: params.org_id,
      };
      changeType = "organization";
      pushArrayMsg = `Changed ${changeType} to ${params.org_id}`;
    } else if (params.npOnly) {
      // JUST SAVING RELATED NONPROFIT ID
      fieldArray = {
        event_id: eventID,
        nonprofit_id: params.org_id,
      };
      changeType = "nonprofit";
      pushArrayMsg = `Changed ${changeType} to ${params.org_id}`;
    } else if (params.groupOnly) {
      // JUST SAVING RELATED GROUP ID
      fieldArray = {
        event_id: eventID,
        group_id: params.group_id,
      };
      changeType = "group";
      pushArrayMsg = `Changed ${changeType} to ${params.group_id}`;
    } else if (params.attendeeLimitOnly) {
      // JUST SAVING ATTENDEE LIMIT
      fieldArray = {
        event_id: eventID,
        attendee_limit: params.attendee_limit,
      };
      changeType = "attendee_limit";
      pushArrayMsg = `Changed ${changeType} to ${params.attendee_limit}`;
    } else if (params.hybridOnly) {
      // JUST SAVING ATTENDEE LIMIT
      fieldArray = {
        event_id: eventID,
      };
      if (params.hybrid_place_id) {
        fieldArray = {
          ...fieldArray,
          hybrid_place_id: params.hybrid_place_id,
        };
      }

      changeType = "hybrid_place_id";
      pushArrayMsg = `Changed ${changeType} to ${params.hybrid_place_id}`;
    } else if (params.deadlineOnly) {
      // JUST SAVING RSVP DEADLINE
      fieldArray = {
        event_id: eventID,
        rsvp_deadline: new Date(params.rsvp_deadline),
      };
      changeType = "rsvp_deadline";
      pushArrayMsg = `Changed ${changeType} to ${params.rsvp_deadline}`;
    } else if (params.statusOnly) {
      // JUST SAVING STATS
      fieldArray = {
        event_id: eventID,
        status: params.status,
      };
      changeType = "status";
      pushArrayMsg = `Changed ${changeType} to ${params.status}`;
      if (
        params.final_start_date &&
        params.final_end_date &&
        params.final_place_id
      ) {
        fieldArray = {
          ...fieldArray,
          final_start_date: new Date(params.final_start_date),
          final_end_date: new Date(params.final_end_date),
          final_place_id: params.final_place_id,
          final_place_type: params.final_place_type,
        };
      }
    } else {
      // SAVING WHOLE EVENT REC
      if (!imageID) {
        imageID = await tools.getSuggestedImage(params.event_name);
      }

      if (!params.orgOnly && params.org_id) {
        fieldArray = {
          ...fieldArray,
          org_id: params.org_id,
        };
      }

      fieldArray = {
        event_id: eventID,
        event_name: params.event_name,
        event_description: params.event_description,
        visibility: params.visibility,
        status: params.status,
        image_id: imageID,
      };
    }

    if (params.group_id) {
      fieldArray = {
        ...fieldArray,
        group_id: params.group_id,
      };
    }

    if (!updating) {
      // SET CREATED BY AND DATE CREATED
      fieldArray = {
        ...fieldArray,
        created_by: authUser.data.person_id,
        date_created: date,
      };
    }

    if (params.proposed_place_id1) {
      fieldArray = {
        ...fieldArray,
        proposed_place_id1: params.proposed_place_id1,
      };
    }

    if (params.proposed_place_id2) {
      fieldArray = {
        ...fieldArray,
        proposed_place_id2: params.proposed_place_id2,
      };
    }

    if (params.proposed_place1_type) {
      fieldArray = {
        ...fieldArray,
        proposed_place1_type: params.proposed_place1_type,
      };
    }

    if (params.proposed_place2_type) {
      fieldArray = {
        ...fieldArray,
        proposed_place2_type: params.proposed_place2_type,
      };
    }

    if (params.attendee_limit) {
      fieldArray = {
        ...fieldArray,
        attendee_limit: params.attendee_limit,
      };
    }

    if (params.rsvp_deadline) {
      fieldArray = {
        ...fieldArray,
        rsvp_deadline: new Date(params.rsvp_deadline),
      };
    }

    if (params.org_id) {
      fieldArray = {
        ...fieldArray,
        org_id: params.org_id,
      };
    }

    if (params.nonprofit_id) {
      fieldArray = {
        ...fieldArray,
        nonprofit_id: params.nonprofit_id,
      };
    }

    if (params.proposed_date1) {
      fieldArray = {
        ...fieldArray,
        proposed_date1: new Date(params.proposed_date1),
      };
    }

    if (params.proposed_end_date1) {
      fieldArray = {
        ...fieldArray,
        proposed_end_date1: new Date(params.proposed_end_date1),
      };
    }

    fieldArray = {
      ...fieldArray,
      modified_by: authUser.data.person_id,
      date_modified: date,
    };

    const collection = db.collection("events");
    const options = {
      upsert: true,
      // runValidators: true,
    };
    let setArray = { $set: fieldArray };
    if (pushArrayMsg) {
      pushArray = {
        $push: {
          changelog: {
            change_date: date,
            changed_by: authUser.data.person_id,
            change_type: changeType,
            change: pushArrayMsg,
          },
        },
      };
      await collection.updateOne(query, pushArray, options);
    }

    if (params.status && params.status == "Draft") {
      setArray = {
        ...setArray,
        $unset: {
          final_place_id: "",
          final_place_type: "",
          final_start_date: "",
          final_end_date: "",
        },
      };
    }

    if (params.hybridOnly && !params.hybrid_place_id) {
      setArray = {
        ...setArray,
        $unset: {
          hybrid_place_id: "",
        },
      };
    }
    await collection.updateOne(query, setArray, options);

    const upsertedEvent = await collection.findOne({ event_id: eventID });

    // INSERT EVENT CREATOR (authUser) AS FIRST INVITEE
    if (!params.event_id) {
      const peopleParams = {
        event_id: upsertedEvent.event_id,
        invited_id: authUser.data.person_id,
        inviter_id: authUser.data.person_id,
      };
      await insertEventPeople(peopleParams, authUser);
    }

    if (upsertedEvent.org_id) {
      //GET THE RELATED ORG NAME
      const orgName = await organizations.getOrganization(
        upsertedEvent.org_id,
        authUser,
        true
      );
      upsertedEvent.org_name = orgName;
    }
    if (upsertedEvent.nonprofit_id) {
      //GET THE RELATED ORG NAME
      const npName = await organizations.getOrganization(
        upsertedEvent.nonprofit_id,
        authUser,
        true
      );
      upsertedEvent.nonprofit_name = npName;
    }
    try {
      cachedInvitees.del(params.event_id);
    } catch {
      //do nothing
    }

    // NOTIFY DELETED EVENT
    if (deleteNotify) {
      //TODO: [RAD-673] send invitees email notice of deleted event w/ICS file
      let headingText = `${authUser.data.first_name} ${authUser.data.last_name} `;
      headingText += `has canceled the event: ${upsertedEvent.event_name}.`;
      const startDate = upsertedEvent.final_start_date
        ? new Date(upsertedEvent.final_start_date)
        : new Date(upsertedEvent.proposed_date1);
      const fullDate = moment(startDate)
        .tz(timezone)
        .format("dddd, MMMM Do YYYY [at] h:mm a z");
      const shortDate = moment(startDate).tz(timezone).format("MMMM Do");
      //const localStartDate = params.localStartDate; //only used for delete notification so can include meaninful date in email message
      const delEmailParams = {
        event_id: eventID,
        eventName: upsertedEvent.event_name,
        emailTemplate: "deleteEvent",
        subject: `An event for ${shortDate} has been canceled!`,
        heading: headingText,
        body: `The event scheduled for ${fullDate} has been canceled. Please make appropriate changes to your personal calendar.`,
      };
      /* console.log('delParams');
      console.log(delParams); */
      const emailResponse = await emailEventNotification(
        delEmailParams,
        authUser
      );
      //console.log(emailResponse);
      if (emailResponse.code === 500) {
        // error sending delete mails
        /*  return {
          message: "Error occurred while sending emails.",
          code: 500,
        }; */
      }
    }

    return upsertedEvent;
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while inserting event.",
      function: "insertEvent",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    return {
      message: "Error occurred while inserting event.",
      code: 500,
    };
  }
}

async function emailICS(params, authUser) {
  try {
    const eventID = params.event_id;
    const event = await getEvent(eventID, authUser);
    const place = params.place || [];
    const hybridPlace = params.hybrid_place;
    const eventName = event.event_name;
    const emailTemplate = 'ics1';
    const subject = `Invitation. ${eventName}`;
    const heading = eventName;
    const senderPersonId = authUser.data.person_id;
    const from = `Radish No Replay <info@radishapp.io>`;

    const pad = (num) => {
      // Ensure date values are double digits
      return num < 10 ? "0" + num : num;
    };

    const formatDate = (dateString) => {
      let dateTime = new Date(dateString);
      return [
        dateTime.getUTCFullYear(),
        pad(dateTime.getUTCMonth() + 1),
        pad(dateTime.getUTCDate()),
        "T",
        pad(dateTime.getUTCHours()),
        pad(dateTime.getUTCMinutes()) + "00Z",
      ].join("");
    };

    let cleanStart = moment(event.final_start_date).format("YYYY-MM-DD HH:mm");
    cleanStart = formatDate(cleanStart);
    let cleanEnd = moment(event.final_end_date).format("YYYY-MM-DD HH:mm");
    cleanEnd = formatDate(cleanEnd);
    let dCreated = moment(event.date_created).format("YYYY-MM-DD HH:mm");
    dCreated = formatDate(dCreated);
    let dtStamp = moment(new Date()).format("YYYY-MM-DD HH:mm");
    dtStamp = formatDate(dtStamp);

    let description = `${place.name}${place.addr && place.addr !== "undefined" ? " - " + place.addr : ""}${place.description && place.description !== "undefined" ? " - " + place.description : ""}${hybridPlace ? " - REMOTE OPTION: - " + hybridPlace.place_description : ""} ${event.event_description && event.event_description !== "undefined" ? " - " + event.event_description : ""}`;
    description = description.trim().replace(/(?:\r\n|\r|\n)/g, '<br>');

    let location = `${place.name} ${place.addr && place.addr !== "undefined" ? place.addr : ""} ${place.description && place.description !== "undefined" ? place.description : ""} ${hybridPlace ? "(See Remote Option)" : ""}`
    location = location.trim();

    let inviteeName = `${event.invitee_full_name}`;

    const body = `<div style="text-align:left;">${description}</div>`

    let icsText = `BEGIN:VCALENDAR\n`;
    icsText += `METHOD:REQUEST\n`;
    icsText += `PRODID:-RADISH\n`;
    icsText += `VERSION:2.0\n`;
    icsText += `BEGIN:VEVENT\n`;
    icsText += `DESCRIPTION:${description}\n`;
    icsText += `LOCATION:${location}\n`;
    icsText += `SUMMARY:${eventName}\n`;
    icsText += `DTSTART:${cleanStart}\n`;
    icsText += `DTEND:${cleanEnd}\n`;
    //icsText += `ATTENDEE;CN=${inviteeName};PARTSTAT=NEEDS-ACTION:mailto:${event.invitee_email}\n`
    //icsText += `ORGANIZER;CN=Radish Events:mailto:noreply@radishapp.io\n`
    icsText += `RSVP=FALSE\n`;
    icsText += `CREATED:${dCreated}\n`;
    icsText += `LAST-MODIFIED:${dtStamp}\n`;
    icsText += `SEQUENCE:0\n`;
    icsText += `PRIORITY:5\n`;
    icsText += `STATUS:CONFIRMED\n`;
    icsText += `TRANSP:OPAQUE\n`;
    icsText += `UID:${event.event_id}\n`;
    icsText += `DTSTAMP:${dtStamp}\n`;
    icsText += `END:VEVENT\n`;
    icsText += `END:VCALENDAR`;
    const ics = new Buffer.from(icsText, 'utf-8').toString('base64');

    const emailParams = {
      to: [authUser.data.user_id],
      from: from,
      replyTo: from,
      subject: subject,
      emailTemplate: emailTemplate,
      emailHeading: heading,
      //emailLink: link,
      emailBody: body,
      eventName: eventName,
      senderPersonId: senderPersonId,
      moduleId: eventID,
      moduleName: "event",
      type: "email",
      peopleIds: [authUser.data.person_id],
      recipientNames: [`${authUser.data.first_name} ${authUser.data.last_name}`],
      ics: ics,
    };
    let respCode;
    let respMessage;
    await sendgrid.sendMyMail(emailParams, async (resp) => {
      if (resp.code === 202) {
        // update eventpeople with status "sent"
        respCode = 200;
        respMessage = "ok"
      } else {
        respCode = 500;
        respMessage = "error"
      }
    });
    return {
      data: null,
      message: respMessage,
      code: respCode,
    }

  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while emailing event ICS file.",
      function: "emailICS",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    return {
      message: "Error occurred while emailing event ICS file.",
      code: 500,
    };
  }
}

async function emailEventNotification(params, authUser) {
  try {
    const eventID = params.event_id;
    const event = await getEvent(eventID, authUser);
    const eventName = params.eventName;
    const emailTemplate = params.emailTemplate;
    const subject = params.subject;
    const heading = params.heading;
    const body = params.body;
    const senderPersonId = authUser.data.person_id;
    const sender = await people.getPrimaryEmails([senderPersonId]);
    const from = `${sender[0].first_name} ${sender[0].last_name} <info@radishapp.io>`;

    //Get recipients
    let recipientIds = [];
    //console.log(event)
    if (event && event.invitees && event.invitees.length > 0) {
      event.invitees.map((invitee) => {
        recipientIds.push(invitee.person_id);
      });
    } else {
      return {
        message: "No invitees to send email to.",
        code: 200,
      };
    }
    const toArray = await people.getPrimaryEmails(recipientIds);
    let peopleEmails = [];
    for (let i = 0; i < toArray.length; i++) {
      peopleEmails.push(toArray[i].emails[0].email);
    }

    const emailParams = {
      to: peopleEmails,
      from: from,
      replyTo: from,
      subject: subject,
      emailTemplate: emailTemplate,
      emailHeading: heading,
      //emailLink: link,
      emailBody: body,
      eventName: eventName,
      senderPersonId: senderPersonId,
      moduleId: eventID,
      moduleName: "event",
      type: "email",
      peopleIds: recipientIds,
    };
    let respCode = 200;
    await sendgrid.sendMyMail(emailParams, async (resp) => {
      if (resp.code === 202) {
        // update eventpeople with status "sent"
        await updatetEventPeopleStatus(
          eventID,
          recipientIds,
          "sent",
          senderPersonId
        );
      } else {
        respCode = 500;
      }
    });
    return {
      code: respCode,
    };
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while emailing event notification.",
      function: "emailEventNotification",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    return {
      message: "Error occurred while emailing event notification.",
      code: 500,
    };
  }
}

async function eventFinalize(params, authUser) {
  // update event with final place, time, etc.
  try {
    const eventID = params.event_id;
    const date = new Date();
    const query = { event_id: eventID };
    let changeMsg = "Modified choice(s) to: ";
    let changeType;
    let unFieldArray;
    let fieldArray = {
      modified_by: authUser.data.person_id,
      date_modified: date,
    };
    if (params.final_place_id) {
      fieldArray = {
        ...fieldArray,
        final_place_id: params.final_place_id,
        final_place_type: params.final_place_type,
      };
      changeType = "Where";
      changeMsg = `final_place_id: ${params.final_place_id}`;
    }
    if (params.final_start_date) {
      fieldArray = {
        ...fieldArray,
        final_start_date: new Date(params.final_start_date),
      };
      changeType = "When";
      changeMsg += ` | final_start_date: ${params.final_start_date}`;
    }
    if (params.final_end_date) {
      fieldArray = {
        ...fieldArray,
        final_end_date: new Date(params.final_end_date),
      };
      changeType = "When";
      changeMsg += ` | final_end_date: ${params.final_end_date}`;
    }
    if (params.status) {
      fieldArray = {
        ...fieldArray,
        status: params.status,
      };
      changeType = "Status";
      changeMsg += ` | status: ${params.status}`;
    }
    if (params.clearFinalDate) {
      unFieldArray = {
        ...unFieldArray,
        final_start_date: "",
        final_end_date: "",
      };
      changeType = "When";
      changeMsg += ` | cleared final dates`;
    }
    if (params.clearFinalPlace) {
      unFieldArray = {
        ...unFieldArray,
        final_place_id: "",
        final_place_type: "",
      };
      changeType = "Where";
      changeMsg += ` | cleared final place`;
    }
    let setArray = { $set: fieldArray };
    if (unFieldArray) {
      setArray = {
        ...setArray,
        $unset: unFieldArray,
      };
    }
    const pushArray = {
      $push: {
        changelog: {
          change_date: date,
          changed_by: authUser.data.person_id,
          change_type: changeType,
          change: changeMsg,
        },
      },
    };
    const collection = db.collection("events");
    await collection.updateOne(query, setArray); //update the fields that get values
    await collection.updateOne(query, pushArray); //update changelog
    const respDoc = await getEvent(eventID, authUser);
    return respDoc;
  } catch (error) {
    log({
      level: "error",
      message: "Error occurred while finalizing event.",
      function: "eventFinalize",
      params: params,
      error_code: 500,
      error_stack: error.stack,
    });
  }
}

async function updateEventWhere(params, authUser) {
  try {
    const eventID = params.event_id;
    const date = new Date();

    const query = { event_id: eventID };
    let fieldArray = {
      modified_by: authUser.data.person_id,
      date_modified: date,
    };
    let unFieldArray;
    let changeMsg;
    if (params.proposed_place_id1) {
      fieldArray = {
        ...fieldArray,
        proposed_place_id1: params.proposed_place_id1,
        proposed_place1_type: params.proposed_place1_type,
      };
      changeMsg = `proposed_place_id1: ${params.proposed_place_id1} type: ${params.proposed_place1_type}`;
    } else {
      unFieldArray = {
        ...unFieldArray,
        proposed_place_id1: "",
        proposed_place1_type: "",
      };
    }
    if (params.proposed_place_id2) {
      fieldArray = {
        ...fieldArray,
        proposed_place_id2: params.proposed_place_id2,
        proposed_place2_type: params.proposed_place2_type,
      };
      changeMsg += ` | proposed_place_id2: ${params.proposed_place_id2}  type: ${params.proposed_place2_type}`;
    } else {
      unFieldArray = {
        ...unFieldArray,
        proposed_place_id2: "",
        proposed_place2_type: "",
      };
    }
    let setArray;
    if (unFieldArray) {
      setArray = { $set: fieldArray, $unset: unFieldArray }; //Addd the unset if needed.
    } else {
      setArray = { $set: fieldArray }; //Addd the unset if needed.
    }
    const pushArray = {
      $push: {
        changelog: {
          change_date: date,
          changed_by: authUser.data.person_id,
          change_type: "Where",
          change: `Modified location choice(s) to: ${changeMsg}`,
        },
      },
    };
    const collection = db.collection("events");
    await collection.updateOne(query, setArray); //update the fields that get values
    await collection.updateOne(query, pushArray); //update changelog

    const myDoc = await collection.findOne(
      { event_id: eventID },
      {
        projection: {
          proposed_place_id1: 1,
          proposed_place_id2: 1,
          proposed_place1_type: 1,
          proposed_place2_type: 1,
          event_id: 1,
          event_name: 1,
        },
      }
    );
    return myDoc;
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while updating event where details.",
      function: "updateEventWhere",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function updateEventWhen(params, authUser) {
  try {
    const eventID = params.event_id;
    const date = new Date();

    const query = { event_id: eventID };
    let fieldArray = {
      modified_by: authUser.data.person_id,
      date_modified: date,
    };
    let unFieldArray;
    let changeMsg;
    const deleteVal = params.delete_date;
    if (deleteVal) {
      if (deleteVal === "proposed_date1") {
        unFieldArray = {
          ...unFieldArray,
          proposed_date1: "",
          proposed_end_date1: "",
          proposed_general1: "",
        };
      }
      if (deleteVal === "proposed_date2") {
        unFieldArray = {
          ...unFieldArray,
          proposed_date2: "",
          proposed_end_date2: "",
          proposed_general2: "",
        };
      }
      if (deleteVal === "final_date") {
        unFieldArray = {
          ...unFieldArray,
          final_start_date: "",
          final_end_date: "",
        };
      }
    }

    //NEED TO CHECK EACH FIELD.  ONLY WANT TO SAVE THOSE THAT ARE NOT NULL
    if (params.proposed_date1) {
      fieldArray = {
        ...fieldArray,
        proposed_date1: new Date(params.proposed_date1),
      };
      changeMsg = `proposed_date1: ${new Date(params.proposed_date1)}`;
      if (params.proposed_general1) {
        fieldArray = {
          ...fieldArray,
          proposed_general1: params.proposed_general1,
        };
        changeMsg += ` | proposed_general1: ${params.proposed_general1}`;
      } else {
        unFieldArray = {
          ...unFieldArray,
          proposed_general1: "",
        };
      }
      if (params.proposed_end_date1) {
        fieldArray = {
          ...fieldArray,
          proposed_end_date1: new Date(params.proposed_end_date1),
        };
        changeMsg += ` | proposed_end_date1: ${params.proposed_end_date1}`;
      } else {
        unFieldArray = {
          ...unFieldArray,
          proposed_end_date1: "",
        };
      }
    }

    if (params.proposed_date2) {
      fieldArray = {
        ...fieldArray,
        proposed_date2: new Date(params.proposed_date2),
      };
      changeMsg = `proposed_date2: ${new Date(params.proposed_date2)}`;
      if (params.proposed_general2) {
        fieldArray = {
          ...fieldArray,
          proposed_general2: params.proposed_general2,
        };
        changeMsg += ` | proposed_general2: ${params.proposed_general2}`;
      } else {
        unFieldArray = {
          ...unFieldArray,
          proposed_general2: "",
        };
      }
      if (params.proposed_end_date2) {
        fieldArray = {
          ...fieldArray,
          proposed_end_date2: new Date(params.proposed_end_date2),
        };
        changeMsg += ` | proposed_end_date2: ${params.proposed_end_date2}`;
      } else {
        unFieldArray = {
          ...unFieldArray,
          proposed_end_date2: "",
        };
      }
    }
    const collection = db.collection("events");

    const pushArray = {
      $push: {
        changelog: {
          change_date: date,
          changed_by: authUser.data.person_id,
          change_type: "When",
          change: `Modified date/time choice(s) to: ${changeMsg}`,
        },
      },
    };

    let setArray = { $set: fieldArray };
    //const unsetArray = { $unset: unFieldArray };
    if (Object.keys(unFieldArray).length > 0) {
      setArray = {
        ...setArray,
        $unset: unFieldArray,
      };
    }
    //console.log(setArray)

    await collection.updateOne(query, setArray); //update the fields that get values
    // await collection.updateOne(query, unsetArray); //remove any fields being set to null.  Needed because validator won't allow setting null on a string/date field.
    await collection.updateOne(query, pushArray); //update changelog

    const myDoc = await collection.findOne(
      { event_id: eventID },
      {
        projection: {
          proposed_date1: 1,
          proposed_end_date1: 1,
          proposed_general1: 1,
          proposed_date2: 1,
          proposed_end_date2: 1,
          proposed_general2: 1,
          event_id: 1,
          event_name: 1,
        },
      }
    );
    return myDoc;
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while updating event when details.",
      function: "updateEventWhen",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function insertPlace(params, authUser) {
  const cid = crypto.randomBytes(16).toString("hex");
  try {
    const myDate = new Date();
    const placeID = params.place_id || cid;

    const query = { place_id: placeID };
    let fieldArray;
    let unFieldArray = {};

    //ADDING A GOOGLE PLACE
    if (params.google_id) {
      fieldArray = {
        ...fieldArray,
        google_id: params.google_id,
      };
      //not saving a user-defined place anymore, so remove fields if exist.
      unFieldArray = {
        ...unFieldArray,
        place_name: "",
        place_description: "",
        place_address1: "",
        place_address2: "",
        place_city: "",
        place_state: "",
        place_postal_code: "",
        place_country: "",
        place_phone: "",
        place_phone_country_code: "",
      };
    } else {
      //ADDING A USER DEFINED PLACE
      fieldArray = {
        place_name: params.place_name,
      };

      //ADDING VIRTUAL LOCATION TAG
      fieldArray = {
        ...fieldArray,
        virtual_location: params.virtual_location,
      };

      if (params.place_description) {
        fieldArray = {
          ...fieldArray,
          place_description: params.place_description,
        };
      } else {
        unFieldArray = {
          ...unFieldArray,
          place_description: "",
        };
      }

      if (params.place_address1) {
        fieldArray = {
          ...fieldArray,
          place_address1: params.place_address1,
        };
      } else {
        unFieldArray = {
          ...unFieldArray,
          place_address1: "",
        };
      }

      if (params.place_address2) {
        fieldArray = {
          ...fieldArray,
          place_address2: params.place_address2,
        };
      } else {
        unFieldArray = {
          ...unFieldArray,
          place_address2: "",
        };
      }

      if (params.place_city) {
        fieldArray = {
          ...fieldArray,
          place_city: params.place_city,
        };
      } else {
        unFieldArray = {
          ...unFieldArray,
          place_city: "",
        };
      }

      if (params.place_state) {
        fieldArray = {
          ...fieldArray,
          place_state: params.place_state,
        };
      } else {
        unFieldArray = {
          ...unFieldArray,
          place_state: "",
        };
      }

      if (params.place_postal_code) {
        fieldArray = {
          ...fieldArray,
          place_postal_code: params.place_postal_code,
        };
      } else {
        unFieldArray = {
          ...unFieldArray,
          place_postal_code: "",
        };
      }

      if (params.place_country) {
        fieldArray = {
          ...fieldArray,
          place_country: params.place_country,
        };
      } else {
        unFieldArray = {
          ...unFieldArray,
          place_country: "",
        };
      }

      if (params.place_phone) {
        fieldArray = {
          ...fieldArray,
          place_phone: params.place_phone,
        };
      } else {
        unFieldArray = {
          ...unFieldArray,
          place_phone: "",
        };
      }

      //ADDING PHONE COUNTRY CODE
      if (params.place_phone_country_code) {
        fieldArray = {
          ...fieldArray,
          place_phone_country_code: params.place_phone_country_code,
        };
      } else {
        unFieldArray = {
          ...unFieldArray,
          place_phone_country_code: "",
        };
      }
      //not a google place anymore, so remove field if exists.
      unFieldArray = {
        ...unFieldArray,
        google_id: "",
      };
    }
    fieldArray = {
      ...fieldArray,
      place_id: placeID,
      modified_by: authUser.data.person_id,
      date_modified: myDate,
    };

    if (params.date_deleted) {
      fieldArray = {
        ...fieldArray,
        date_deleted: myDate,
        deleted_by: authUser.data.person_id,
      };
    }

    if (params.place_image) {
      fieldArray = {
        ...fieldArray,
        place_image: params.place_image,
      };
    }

    if (!params.place_id) {
      fieldArray = {
        ...fieldArray,
        created_by: authUser.data.person_id,
        date_created: myDate,
      };
    }

    if (params.org_id) {
      fieldArray = {
        ...fieldArray,
        org_id: params.org_id,
      };
    }
    if (params.nonprofit_id) {
      fieldArray = {
        ...fieldArray,
        org_id: params.nonprofit_id,
      };
    }

    const setArray = { $set: fieldArray };
    const options = {
      upsert: true,
      // runValidators: true,
    };
    const collection = db.collection("places");
    const unsetArray = { $unset: unFieldArray };

    await collection.updateOne(query, setArray, options);
    await collection.updateOne(query, unsetArray); //remove any fields being set to null.  Needed because validator won't allow setting null on a string/date field.

    const myDoc = await collection.findOne({ place_id: placeID });
    return myDoc;
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while inserting place.",
      function: "insertPlace",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function getMyPlaces(params, authUser) {
  try {
    const collection = db.collection("places");
    const ownerID = authUser.data.person_id;
    const virtualOnly = params.virtual_location || false;

    let query = {
      created_by: ownerID,
      google_id: { $in: [null, ""] },
      date_deleted: { $in: [null, ""] },
    };
    if (virtualOnly) {
      query = {
        ...query,
        virtual_location: virtualOnly,
      };
    }

    const myDoc = await collection
      .find(query)
      .sort({ place_name: 1 })
      .toArray();

    return myDoc;
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while fetching my places.",
      function: "getMyPlaces",
      params: authUser.data,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function SearchCustomPlaces(options, authUser) {
  try {
    const collection = db.collection("places");
    const ids = options.ids;
    const myDoc = await collection
      .find({
        place_id: { $in: ids },
      })
      .sort({ place_name: 1 })
      .toArray();

    return myDoc;
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while searching custom places.",
      function: "SearchCustomPlaces",
      params: options,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function getMyPlace(id, authUser) {
  try {
    const collection = db.collection("places");
    const ownerID = authUser.data.person_id;
    const placeID = id;
    const myDoc = await collection
      .find({
        /* created_by: ownerID, */
        place_id: placeID,
      })
      .toArray();

    return myDoc;
  } catch (err) {
    log({
      level: "error",
      message: `Error occurred while fetching my place, id: ${id}`,
      function: "getMyPlace",
      params: authUser.data,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function getRecentGooglePlaces(authUser) {
  try {
    const collection = db.collection("places");
    const ownerID = authUser.data.person_id;
    const myDoc = await collection
      .aggregate(
        [
          {
            $match: {
              created_by: ownerID,
              google_id: {
                $nin: [null, ""],
                $ne: authUser.data.primary_location,
              },
            },
          },
          {
            $group: {
              _id: {
                google_id: "$google_id",
              },
              "MAX(date_created)": {
                $max: "$date_created",
              },
            },
          },
          {
            $project: {
              google_id: "$_id.google_id",
              "MAX(date_created)": "$MAX(date_created)",
              _id: 0,
            },
          },
          {
            $sort: {
              "MAX(date_created)": -1,
            },
          },
          {
            $limit: 3,
          },
        ],
        {
          allowDiskUse: true,
        }
      )
      .toArray();

    return {
      data: myDoc,
      message: "ok",
      code: 200,
    };
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while fetching recent google places.",
      function: "getRecentGooglePlaces",
      params: authUser.data,
      error_code: 500,
      error_stack: err.stack,
    });
    return {
      message: "Error occurred while fetching recent google places.",
      code: 500,
    };
  }
}

async function insertEventPeople(params, authUser) {
  try {
    let cid = crypto.randomBytes(16).toString("hex");
    const eventpeopleID = params.eventpeople_id || cid;
    const inviterId = params.inviter_id;
    const invitedId = params.invited_id;
    const date = new Date();
    let deleting = false;
    if (params.date_deleted) {
      deleting = true;
    }

    const query = { eventpeople_id: eventpeopleID };
    let unFieldArray = {};
    let runUnset = false;

    let fieldArray = {
      eventpeople_id: eventpeopleID,
      event_id: params.event_id,
      invited_id: invitedId,
      inviter_id: inviterId,
      created_by: authUser.data.person_id,
      date_created: date,
      modified_by: authUser.data.person_id,
      date_modified: date,
    };

    if (deleting) {
      //only pass deleted if deleted.
      fieldArray = {
        ...fieldArray,
        date_deleted: date,
        deleted_by: params.deleted_by,
      };
    } else {
      runUnset = true;
      unFieldArray = {
        ...unFieldArray,
        date_deleted: "",
        deleted_by: "",
      };
    }

    if (params.rsvp_status) {
      fieldArray = {
        ...fieldArray,
        rsvp_status: params.rsvp_status, // voted, no, maybe, yes, attended, absent
      };
    }
    if (params.place_preference) {
      fieldArray = {
        ...fieldArray,
        place_preference: params.place_preference, // place_id, google_id, noplace, anyplace
        place_type: params.place_type, // custom or google or null
      };
    }
    if (params.date_preference) {
      fieldArray = {
        ...fieldArray,
        date_preference: params.date_preference, // proposed_date1, proposed_date2, nodate, anydate
      };
    }

    const setArray = { $set: fieldArray };
    const options = {
      upsert: true,
      // runValidators: true,
    };
    const collection = db.collection("eventpeople");

    await collection.updateOne(query, setArray, options);

    //If need to cleanup previously deleted user.
    if (runUnset) {
      const unsetArray = { $unset: unFieldArray };
      await collection.updateOne(query, unsetArray);
    }

    const myDoc = await collection.findOne({ eventpeople_id: eventpeopleID });
    //purge cache item (if any)
    cachedInvitees.del(params.event_id);

    //=============================================================
    //MAKE MUTUAL FRIENDS WITH INVITER AND INVITEE IF NOT ALREADY
    //=============================================================
    try {
      const peopleCollection = db.collection("people");
      const inviter = await peopleCollection.findOne({ person_id: inviterId });
      const tempAuth = { data: inviter };
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
        person_ids: [invitedId],
      };
      await groups.addGroupMembers(groupParams, tempAuth);

      // insert inviter into invitee's new default group
      defaultGroupID = await people.getDefaultGroup(authUser.data);
      //console.log('getDefaultGroupId: ' + defaultGroupID);
      groupParams = {
        group_id: defaultGroupID,
        person_ids: [inviterId],
      };
      await groups.addGroupMembers(groupParams, tempAuth, true);
    } catch {
      //do nothing. opportunistic okay if fail (for now)
    }
    //===================================

    return myDoc;
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while inserting event people.",
      function: "insertEventPeople",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function insertEventManyPeople(params, authUser) {
  //Note: do not need to deal with $unset date_deleted in this function.  only called for creating new invite members.
  try {
    const today = new Date();
    let insertDocs = params;
    const eventID = params[0].event_id;
    const collection = db.collection("eventpeople");
    // go get members for this event
    const myIDs = await collection
      .find({ event_id: eventID })
      .project({ invited_id: 1, eventpeople_id: 1 })
      .toArray();
    let insertClean = insertDocs;
    let existingDocs = [];
    for (x = 0; x < myIDs.length; x++) {
      for (let i = 0; i < insertDocs.length; i++) {
        if (myIDs[x].invited_id === insertDocs[i].invited_id) {
          insertClean.splice(i, 1);
          existingDocs.push(myIDs[x].eventpeople_id);
        }
      }
    }
    if (existingDocs.length > 0) {
      // GET RID OF DATE DELETED DELETED BY
      await collection.updateMany(
        {
          eventpeople_id: { $in: existingDocs },
          date_deleted: { $ne: null },
        },
        {
          $unset: { date_deleted: "", deleted_by: "" },
        },
        {
          upsert: false,
        }
      );
    }
    for (let i = 0; i < insertClean.length; i++) {
      // remove insertDocs that match myIDs

      let cid = crypto.randomBytes(16).toString("hex");
      insertClean[i].eventpeople_id = cid;
      insertClean[i].created_by = authUser.data.person_id;
      insertClean[i].date_created = today;
      insertClean[i].modified_by = authUser.data.person_id;
      insertClean[i].date_modified = today;
    }
    let myDoc = [];
    if (insertClean.length > 0) {
      myDoc = await collection.insertMany(insertClean);
    }
    //purge cache item for this event (if any)
    cachedInvitees.del(eventID);
    return {
      data: myDoc.insertedIds || myDoc,
      message: "ok",
      code: 200,
    };
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while inserting event many people.",
      function: "insertEventManyPeople",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    return {
      message: "Error occurred while inserting event many people.",
      code: 500,
    };
  }
}

async function updatetEventManyPeople(params, authUser) {
  try {
    const today = new Date();
    let pushArray = {
      date_modified: today,
      modified_by: authUser.data.person_id,
      // date_deleted: null,
      // deleted_by: null,
      inviter_id: authUser.data.person_id,
    };

    const collection = db.collection("eventpeople");

    const myDoc = await collection.updateMany(
      {
        eventpeople_id: { $in: params },
      },
      {
        $set: pushArray,
        $unset: { date_deleted: "", deleted_by: "" },
      },
      {
        upsert: false,
      }
    );

    //const myDoc = await collection.findOne({ eventpeople_id: eventpeopleID });

    return myDoc.matchedCount;
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while updating event many people.",
      function: "updatetEventManyPeople",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function getFriendsToInvite(params, auth) {
  //A START BUT HAVE TO DO MANUAL MANIPULATION

  try {
    const my_id = params.id;
    let groupIds = [];
    if (params.group_id) {
      groupIds = [...group_id, params.groupIds];
    }
    //CLEAN GROUPS REMOVES ALL THE "DEFAULT" and "DELETED" GROUPS FROM THE LIST
    const cleanUser = await groups.cleanPersonGroups(auth.data);
    for (let i = 0; i < cleanUser.groups.length; i++) {
      groupIds = [...groupIds, cleanUser.groups[i].group_id];
    }

    let sortBy = { first_name: 1, last_name: 1 };
    if (params.sortBy) {
      sortBy = params.sortBy;
    }

    const collection = db.collection("people");
    let myDoc = null;
    const query = {
      person_id: { $ne: my_id },
      "groups.group_id": { $in: groupIds },
      "groups.date_deleted": null,
      date_deleted: null,
    };

    myDoc = await collection

      .aggregate([
        {
          $match: { date_deleted: null },
        },
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
            first_name: 1,
            last_name: 1,
            display_name: 1,
            user_id: 1,
            // date_created: 1,
            // last_active: 1,
            image: { $ifNull: ["$thumbnail", "$image"] },
            group_id: "$groups.group_id",
          },
        },
        {
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
            image: {
              $first: "$image",
            },
            group_id: {
              $addToArray: "$group_id",
            },
          },
        },
        {
          $sort: sortBy,
        },
        /* {
          $lookup: {
            from: "eventpeople",
            localField: "person_id",
            foreignField: "invited_id",
            as: "invitee",
          },
        },
        {
          $unwind: {
            path: "$invitee",
          },
        },
         {
          $match: {
           "invitee.event_id": "b519d8745bcdc41d0cb4cddb264fe549",
          },
        }, 
        {
          $project: {
            person_id: "$person_id",
            first_name: "$first_name",
            display_name: "$display_name",
            image: "$image",
            group_id: "$group_id",
            invitee: "$invitee",
          },
        }, */
      ])
      .toArray();

    log({
      level: "debug",
      message: `myDoc ${myDoc}`,
      function: "getFriendsToInvite",
    });
    return {
      data: myDoc,
      message: "ok",
    };
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while fetching friends to invite.",
      function: "getFriendsToInvite",
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

async function updatePersonRSVPStatus(params, authUser) {
  // updates rsvp
  try {
    const eventId = params.event_id;

    const personId = params.person_id;
    const status = params.status;
    const eventPeople = db.collection("eventpeople");
    let results;
    if (personId === "all") {
      const query = { event_id: eventId };
      results = await eventPeople.updateMany(
        query,
        {
          $set: {
            rsvp_status: status,
            modified_by: authUser.data.person_id,
            date_modified: new Date(),
          },
        },
        {
          upsert: false,
        }
      );
    } else {
      const query = { event_id: eventId, invited_id: personId };
      results = await eventPeople.updateOne(query, {
        $set: {
          rsvp_status: status,
          modified_by: authUser.data.person_id,
          date_modified: new Date(),
        },
      });
    }
    return {
      data: results,
      message: "ok",
      code: 200,
    };
  } catch (err) {
    log({
      level: "error",
      message: `Error occurred while updating person rsvp status`,
      function: "updatePersonRSVPStatus",
      error_code: 500,
      error_stack: err.stack,
    });
    return {
      message: `Error occurred while updating person rsvp status`,
      code: 500,
    };
  }
}

async function updatetEventPeopleStatus(
  eventId,
  recipientIds,
  status,
  person_id
) {
  // will update rsvp_status to 'status' if rsvp_status is null, i.e. it won't overwrite rsvp_status
  try {
    const today = new Date();
    const recipients = recipientIds; // expect array of person_ids like ['jdas90fad0fjaja0df', '89adsfka89afiod89']
    let pushArray = {
      date_modified: today,
      modified_by: person_id,
      inviter_id: person_id,
      rsvp_status: status,
    };

    const collection = db.collection("eventpeople");

    const myDoc = await collection.updateMany(
      {
        event_id: eventId,
        invited_id: { $in: recipients },
        rsvp_status: { $eq: null },
      },
      {
        $set: pushArray,
      },
      {
        upsert: false,
      }
    );

    return myDoc.matchedCount;
  } catch (err) {
    log({
      level: "error",
      message: `Error occurred while updating event people status, eventId: ${eventId}, recipientIds: ${recipientIds}, status: ${status}, person_id: ${person_id}`,
      function: "updatetEventPeopleStatus",
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function emailEventInvites(params, authUser, res) {
  try {
    const senderPersonId = authUser.data.person_id;
    const eventName = params.event_name;
    const eventId = params.id;
    const link = params.link;
    const recipients = params.to; // expect array of person_ids like ['jdas90fad0fjaja0df', '89adsfka89afiod89']
    const sender = await people.getPrimaryEmails([senderPersonId]);
    const from = `${sender[0].first_name} ${sender[0].last_name} <info@radishapp.io>`;
    const replyTo = from; // `${sender[0].emails[0].email}`; //<${sender[0].emails[0].email}>
    const toArray = await people.getPrimaryEmails(recipients);
    const isRSVP = params.rsvp || false;
    let peopleIds = [];
    let recipientNames = [];
    let to = [];
    for (let i = 0; i < toArray.length; i++) {
      to.push(toArray[i].emails[0].email);
      peopleIds.push(toArray[i].person_id);
      recipientNames.push(toArray[i].display_name);
    }
    const subject = `${isRSVP ? "Please RSVP." : "Please VOTE"} ${sender[0].first_name
      } ${sender[0].last_name} has invited you!`;
    const heading = `${isRSVP ? "Please RSVP.<br />" : "Please VOTE.<br />"} ${sender[0].first_name
      } ${sender[0].last_name} has invited you!`; // `INVITATION`;

    const template = "email1";
    const body = `Click to ${isRSVP ? "RSVP" : "learn more and vote on options"
      }.`;

    const emailParams = {
      to: to,
      from: from,
      replyTo: replyTo,
      subject: subject,
      emailTemplate: template,
      emailHeading: heading,
      emailLink: link,
      emailBody: body,
      eventName: eventName,
      senderPersonId: senderPersonId,
      moduleId: eventId,
      moduleName: "event",
      type: "email",
      peopleIds: peopleIds,
      recipientNames: recipientNames,
    };

    await sendgrid.sendMyMail(emailParams, async (resp) => {
      if (resp.code === 202) {
        // update eventpeople with status "sent"
        await updatetEventPeopleStatus(
          eventId,
          recipients,
          "sent",
          senderPersonId
        );
        res.send({
          data: [],
          message: "ok",
        });
      } else {
        res.send({
          data: null,
          message: "error sending emails",
        });
      }
    });
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while sending email to event invites.",
      function: "emailEventInvites",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    return null;
  }
}

async function textEventInvitees(params, authUser, res) {
  try {
    /* TODO: [RAD-518] Change events.js to actual phone, not Andrew's Cell */
    const to = "+13304664104";
    const message = `You’re invited! ${params.link}`;
    twilio.sendSMS(message, to, () => {
      log({
        level: "debug",
        message: "Cool. Sent.",
        function: "textEventInvitees",
      });
      res.send("cool");
    });
  } catch (error) {
    log({
      level: "error",
      message: "Error occurred while sending text to event invites.",
      function: "textEventInvitees",
      params: params,
      error_code: 500,
      error_stack: error.stack,
    });
  }
}

//API to fetch event invitations
//THIS IS WHAT SETS THE COUNTER AT TOP OF MyEvents ans can be used to genereate the invitations cards
async function getEventInvitations(params, authuser) {
  let response = {};
  try {
    const getNext = params.getNext || false;
    const collection = db.collection("events");
    let matchArrayEvents = {};
    const today = new Date(params.today);

    matchArrayEvents = {
      status: { $ne: "Draft" },
      date_deleted: { $eq: null },
      $or: [
        {
          //There is a final date, and it is greather than today.
          final_start_date: { $ne: null },
          final_start_date: { $gt: today },
        },
        //If there is not a final date (and it is in the future), we will return events where either of the proposed dates is in the future.
        {
          //There is not a final date, but the proposed date 1 is greater than today
          final_start_date: null,
          proposed_date1: { $gt: today },
        },
        //There is not a final date, but the proposed date 2 is greater than today
        {
          final_start_date: null,
          proposed_date2: { $gt: today },
        },
      ],
    };
    const EventsInvitedTo = await collection
      .aggregate(
        [
          {
            $match: matchArrayEvents,
          },
          {
            $lookup: {
              from: "eventpeople",
              localField: "event_id",
              foreignField: "event_id",
              as: "inviteeRec",
            },
          },
          // LOOKUP THE EVENT CREATOR's NAME (used in created_by below)
          {
            $unwind: {
              path: "$inviteeRec", //Must unwind to set to "just you"
            },
          },
          {
            $match: {
              //Events where I exist in the inviter table, and am not deleted.
              "inviteeRec.date_deleted": null,
              "inviteeRec.invited_id": authuser.data.person_id,
              "inviteeRec.rsvp_status": {
                $nin: ["maybe", "yes", "no", "rsvp", "likely"],
              },
            },
          },
          {
            // Lookup for event creator's name
            $lookup: {
              from: "people",
              localField: "created_by",
              foreignField: "person_id",
              as: "inviterRec",
            },
          },
          {
            $unwind: {
              path: "$inviterRec", //Must unwind to get event creator's name
            },
          },
          {
            $project: {
              event_id: 1,
              "inviteeRec.eventpeople_id": 1,
              event_name: 1,
              created_by: 1,
              "inviterRec.display_name": 1,
              date_created: 1,
            },
          },
        ],
        {
          allowDiskUse: false,
        }
      )
      .sort({ date_created: -1 })
      .toArray();

    // GET NEXT UPCOMING EVENT FOR LARGECARD DISPLAY
    let myNextEvent;
    if (getNext) {
      const tempNextEvent = await getMyEvents(
        { view: "future", limit: 1 },
        authuser
      );

      if (tempNextEvent && tempNextEvent[0]) {
        myNextEvent = await getEvent(tempNextEvent[0].event_id, authuser);
      }
    }

    response = {
      code: 200,
      data: EventsInvitedTo,
      nextEvent: myNextEvent,
      message: "Event invitations fetched successfully",
    };
  } catch (error) {
    log({
      level: "error",
      message: "Error occurred while fetching event invitations.",
      function: "getEventInvitations",
      params: authuser.data,
      error_code: 500,
      error_stack: error.stack,
    });
    response = {
      code: 500,
      message: "Error getting event invitations.",
    };
  }
  return response;
}

// API to update event attendance
async function updateEventAttendance(params, authUser) {
  try {
    const eventPeopleId = params.eventpeople_id;
    const personId = params.invited_id;
    const attendance = params.attendance;
    const eventPeople = db.collection("eventpeople");
    const results = await eventPeople.updateOne(
      { eventpeople_id: eventPeopleId, invited_id: personId },
      {
        $set: {
          attendance: attendance,
          modified_by: authUser.data.person_id,
          date_modified: new Date(),
        },
      }
    );
    return {
      data: results,
      message: "ok",
      code: 200,
    };
  } catch (err) {
    log({
      level: "error",
      message: `Error occurred while updating event attendance, eventId: ${eventId}, peopleId: ${personId}, attendance: ${attendance}`,
      function: "updatePersonRSVPStatus",
      error_code: 500,
      error_stack: err.stack,
    });
    return {
      message: `Error occurred while updating event attendance, eventId: ${eventId}, peopleId: ${personId}, attendance: ${attendance}`,
      code: 500,
    };
  }
}

// API to update event rating
async function updateEventRating(params) {
  try {
    const date = new Date();
    const personId = params.person_id;
    const rating = params.rating;
    const status = params.rsvp_status;
    const eventPeopleId = params.eventpeople_id;
    const query = { eventpeople_id: eventPeopleId };
    let unsetArray;
    let fieldArray = {
      modified_by: personId,
      date_modified: date,
      rsvp_status: status,
    };
    if (status === "absent") {
      // unset rating
      unsetArray = {
        rating: "",
      };
    } else {
      fieldArray = {
        ...fieldArray,
        rating: rating,
      };
    }
    let setArray = { $set: fieldArray };
    if (unsetArray) {
      setArray = {
        ...setArray,
        $unset: unsetArray,
      };
    }

    const collection = db.collection("eventpeople");

    const result = await collection.updateOne(query, setArray);
    return {
      data: result,
      message: "ok",
      code: 200,
    };
  } catch (err) {
    log({
      level: "error",
      message: `Error occurred while updating event rating.`,
      function: "updateEventRating",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    return {
      code: 500,
      message: "Error while updating event rating.",
    };
  }
}

// API to get events to be rated
async function getEventsToBeRated(params, authUser) {
  try {
    const today1 = new Date(params.today);
    const today2 = new Date(params.today);
    const personId = authUser.data.person_id;
    let startDate = today1.setDate(today1.getDate() - 30);
    let endDate = new Date(today2.setDate(today2.getDate() - 1)); // should be the day after the event occurrence (24 hours)
    startDate = new Date(startDate);
    const collection = db.collection("events");
    let matchArray = {
      status: { $ne: "Draft" },
      date_deleted: { $eq: null },
      final_end_date: {
        $ne: null,
        $exists: true,
        $lt: endDate,
        $gt: startDate,
      },
      /* $or: [
        {
          //There is a final date, and it is less than 30 days in the past.
          final_start_date: { $ne: null },
          $and: [
            {
              final_start_date: { $lt: date },
            },
            {
              final_start_date: { $gt: startDate },
            },
          ],
        },
        {
          //There is not a final date, but both proposed dates exist and are less than 30 days in the past.
          final_start_date: null,
          proposed_date2: { $ne: null },
          $and: [
            {
              proposed_date1: { $lt: date },
              proposed_date2: { $lt: date },
            },
            {
              proposed_date1: { $gt: startDate },
              proposed_date2: { $gt: startDate },
            },
          ],
        },
        //There is not a final date, There is not a proposed date 2, and proposed date 1 is less than 30 days in the past.
        {
          final_start_date: null,
          proposed_date2: null,
          proposed_date1: { $lt: date },
          $and: [
            {
              proposed_date1: { $lt: date },
            },
            {
              proposed_date1: { $gt: startDate },
            },
          ],
        },
      ], */
    };

    const result = await collection
      .aggregate([
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
            path: "$inviteeRec",
          },
        },
        {
          $match: {
            "inviteeRec.date_deleted": null,
            "inviteeRec.invited_id": personId,
            "inviteeRec.rating": null,
            "inviteeRec.rsvp_status": {
              $exists: true,
              $ne: null,
              $nin: ["no", "absent"],
            },
            //"inviteeRec.rsvp_status": { $nin: ["no", "absent" ] },
          },
        },
        {
          $project: {
            event_id: 1,
            event_name: 1,
            rsvp_status: "$inviteeRec.rsvp_status",
            final_start_date: 1,
            temp_final_start_date: "$final_start_date", // sort based on this temp_final_start_date
            proposed_date1: 1,
            proposed_date2: 1,
            "inviteeRec.invited_id": 1,
            // If there is no final_start_date means, then consider proposed_date1 as the temp_final_start_date
            temp_final_start_date: {
              $ifNull: ["$temp_final_start_date", "$proposed_date1"],
            },
          },
        },
        {
          $sort: {
            temp_final_start_date: 1,
          },
        },
      ])
      .toArray();

    return {
      data: result,
      message: "ok",
      code: 200,
    };
  } catch (err) {
    log({
      level: "error",
      message: `Error occurred while fetching events to be rated.`,
      function: "getEventsToBeRated",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    return {
      code: 500,
      message: "Error while fetching events to be rated.",
    };
  }
}

// API to get events to be rated for email notifications
async function getRateEventsForEmailNotifications(params) {
  try {
    const today1 = new Date(params.today);
    const today2 = new Date(params.today);
    const personId = params.person_id;
    let endDate = new Date(today1.setDate(today1.getDate() - 1)); // should be the day after the event occurrence (24 hours)
    let startDate = new Date(today2.setDate(today2.getDate() - 30)); // 30 days in the past from yesterday
    const collection = db.collection("events");
    let matchArray = {
      status: { $ne: "Draft" },
      date_deleted: { $eq: null },
      final_end_date: {
        $ne: null,
        $exists: true,
        $lt: endDate,
        $gt: startDate,
      },

      /* $or: [
        {
          //There is a final date, and it is less than 30 days in the past.
          final_start_date: { $ne: null },
          $and: [
            {
              final_start_date: { $lt: endDate },
            },
            {
              final_start_date: { $gt: startDate },
            },
          ],
        }, */
      /* {
          //There is not a final date, but both proposed dates exist and are less than 30 days in the past.
          final_start_date: null,
          proposed_date2: { $ne: null },
          $and: [
            {
              proposed_date1: { $lt: endDate },
              proposed_date2: { $lt: endDate },
            },
            {
              proposed_date1: { $gt: startDate },
              proposed_date2: { $gt: startDate },
            },
          ],
        }, */
      //There is not a final date, There is not a proposed date 2, and proposed date 1 is less than 30 days in the past.
      /*  {
          final_start_date: null,
          proposed_date2: null,
          proposed_date1: { $lt: endDate },
          $and: [
            {
              proposed_date1: { $lt: endDate },
            },
            {
              proposed_date1: { $gt: startDate },
            },
          ],
        }, */
      // ],
    };
    const result = await collection
      .aggregate([
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
          $lookup: {
            from: "images",
            localField: "image_id",
            foreignField: "image_id",
            as: "image",
          },
        },
        {
          $lookup: {
            from: "people",
            localField: "created_by",
            foreignField: "person_id",
            as: "creator",
          },
        },
        {
          $lookup: {
            from: "groups",
            localField: "group_id",
            foreignField: "group_id",
            as: "group",
          },
        },
        {
          $unwind: {
            path: "$inviteeRec",
          },
        },
        {
          $match: {
            "inviteeRec.date_deleted": null,
            "inviteeRec.invited_id": personId,
            "inviteeRec.rating": { $exists: false },
            "inviteeRec.rsvp_status": {
              $exists: true,
              $ne: null,
              $nin: ["no", "absent"],
            },
            /*  $or: [
              { "inviteeRec.rsvp_status": { $exists: false } },
              { "inviteeRec.rsvp_status": { $ne: "no" } },
              { "inviteeRec.rsvp_status": { $ne: "absent" } },
            ], */
          },
        },
        {
          $project: {
            event_id: 1,
            event_name: 1,
            creator_first: "$creator.first_name",
            creator_last: "$creator.last_name",
            group_name: "$group.group_name",
            final_start_date: 1,
            temp_final_start_date: "$final_start_date", // sort based on this temp_final_start_date
            status: 1,
            proposed_date1: 1,
            proposed_end_date1: 1,
            proposed_general1: 1,
            proposed_date2: 1,
            proposed_end_date2: 1,
            proposed_general2: 1,
            final_start_date: 1,
            final_end_date: 1,
            "inviteeRec.invited_id": 1,
            image_id: 1,
            image_date: "$image.date_modified",
            image_version: "$image.version",
            // If there is no final_start_date means, then consider proposed_date1 as the temp_final_start_date
            temp_final_start_date: {
              $ifNull: ["$temp_final_start_date", "$proposed_date1"],
            },
          },
        },
        {
          $sort: {
            temp_final_start_date: 1,
          },
        },
      ])
      .toArray();
    return {
      data: result,
      message: "ok",
      code: 200,
    };
  } catch (err) {
    log({
      level: "error",
      message: `Error occurred while fetching rate events for email notifications.`,
      function: "getRateEventsForEmailNotifications",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    return {
      code: 500,
      message: "Error while fetching rate events for email notifications.",
    };
  }
}

// Check event permission
async function checkEventPermission(params) {
  try {
    let authorized = false;
    const eventId = params.eventId;
    const authUser = params.authUser;
    const inviter = params.inviter;
    const collection = db.collection("events");
    const testEvent = await collection.findOne(
      { event_id: eventId },
      {
        projection: {
          visibility: 1,
          event_name: 1,
        },
      }
    );
    // Check event permission
    if (testEvent.visibility.indexOf("anyone with link") > -1) {
      authorized = true;
    } else if (testEvent.visibility.indexOf("invited") > -1) {
      const isValid = await testInvitee(eventId, authUser);
      if (isValid && isValid > 0) {
        authorized = true;
      }
    } else {
      const friendId = {
        friend_person_id: inviter.person_id,
      }
      const testFriends = await people.checkUserIsFriendOrNot(
        friendId,
        authUser,
      );
      if (testFriends.code === 200 && testFriends.data) {
        authorized = true;
      }
    }
    if (authorized) {
      return testEvent;
    } else {
      return;
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error while checking event permission",
      function: "checkEventPermission",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    return;
  }
}

module.exports = {
  eventsAtGlance,
  insertEvent,
  getEvent,
  getMyEvents,
  getEventInvitee,
  getEventInvitees,
  getEventInvitation,
  getEventInvitations,
  updateEventWhen,
  updateEventWhere,
  insertPlace,
  getMyPlaces,
  SearchCustomPlaces,
  getMyPlace,
  getRecentGooglePlaces,
  insertEventPeople,
  insertEventManyPeople,
  updatetEventManyPeople,
  getFriendsToInvite,
  emailEventInvites,
  textEventInvitees,
  eventInPast,
  eventFinalize,
  updatePersonRSVPStatus,
  updateEventAttendance,
  updateEventRating,
  getEventsToBeRated,
  getRateEventsForEmailNotifications,
  getEventForRate,
  checkEventPermission,
  emailICS,
  invitePermitted,
};
