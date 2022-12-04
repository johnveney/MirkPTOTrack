/* WARNING: THIS IS A TESTING FILE ONLY
CHANGES IN THIS FILE DO NOT CHANGE
PRODUCTION DAILY DIGEST
GO TO digestData.js AND COPY DISIRED CHANGES FROM HERE TO THERE */

//const moment = require("moment-timezone");
const events = require("./events.js");
const constants = require("../utilities/constants.js");
const emailTemplates = require("../utilities/emailTemplates.js");
const log = require("./logger.js").insertServerLogs;
let usedEventIds = [];
async function getDailyDigest(params) {
  // what to do about authUser

  try {
    usedEventIds = [];
    let resultHTML = emailTemplates.digestHeaderHTML({ tohtml: "" });
    resultHTML += emailTemplates.digestLogoSection();

    const personId = params.person_id;
    const sendEmail = params.sendEmail || false;
    const personCollection = db.collection("people");
    const person = await personCollection.findOne({ person_id: personId });
    const emailTo = person.user_id;
    const digestPreferences = person.digest_preferences;
    const authUser = { data: person };
    let friendFilter;
    let limit = params.limit || 3;
    let start;
    let end;
    let view = "future";
    //const timeZone = person.default_timezone || "America/New_York";
    let headerText;
    let invitedOnly;

    // test user's digest preferences
    if (!digestPreferences.digest_on) {
      // no need to continue
      return;
    }
    if (digestPreferences.friends_on) {
      friendFilter = "Friends";
      if (digestPreferences.friends_of_friends_on) {
        friendFilter = "Both";
      }
    } else {
      if (digestPreferences.friends_of_friends_on) {
        friendFilter = "Friends-Of-Friends";
      } else {
        // no friends_on
        // friendFilter stays null
      }
    }

    // =============================================
    // FIRST SECTION INVITED-TO SECTION
    // =============================================
    if (digestPreferences.invited_on) {
      view = "future";
      filter = "Invited";
      headerText = "Events You're Invited To";
      limit = 3;
      start = moment().tz(timeZone);
      const authCopy = JSON.parse(JSON.stringify(authUser));
      invitedOnly = true;
      resultHTML = await digestEventSection({
        personId: personId,
        resultHTML: resultHTML,
        view: view,
        filter: filter,
        limit: limit,
        start: start,
        end: end,
        authUser: authCopy,
        timeZone: timeZone,
        headerText: headerText,
        invitedOnly: invitedOnly,
        type: "invited",
      });
    }

    // =============================================
    // FRIENDS SECTION RECOMMENDED EVENTS
    // =============================================
    if (friendFilter) {
      view = "future";
      filter = friendFilter; //friendFilter;
      headerText = "Recommended Friend Events";
      limit = 3;
      start = moment().tz(timeZone);
      const authCopy2 = JSON.parse(JSON.stringify(authUser));
      invitedOnly = false;
      resultHTML = await digestEventSection({
        personId: personId,
        resultHTML: resultHTML,
        view: view,
        filter: filter,
        limit: limit,
        start: start,
        end: end,
        authUser: authCopy2,
        timeZone: timeZone,
        headerText: headerText,
        invitedOnly: invitedOnly,
        type: "recommended",
      });
    }

    // =============================================
    // GROUPS SECTION RECOMMENDED EVENTS
    // =============================================
    if (digestPreferences.group_events_on) {
      view = "future";
      filter = "group"; //friendFilter;
      headerText = "Recommended Group Events";
      limit = 3;
      start = moment().tz(timeZone);
      const authCopy222 = JSON.parse(JSON.stringify(authUser));
      invitedOnly = false;
      resultHTML = await digestEventSection({
        personId: personId,
        resultHTML: resultHTML,
        view: view,
        filter: filter,
        limit: limit,
        start: start,
        end: end,
        authUser: authCopy222,
        timeZone: timeZone,
        headerText: headerText,
        invitedOnly: invitedOnly,
        type: "recommended",
      });
    }

    // =============================================
    // ORGS SECTION RECOMMENDED EVENTS
    // =============================================
    if (digestPreferences.org_events_on) {
      view = "future";
      filter = "organization"; //friendFilter;
      headerText = "Recommended Organization Events";
      limit = 3;
      start = moment().tz(timeZone);
      const authCopy22 = JSON.parse(JSON.stringify(authUser));
      invitedOnly = false;
      resultHTML = await digestEventSection({
        personId: personId,
        resultHTML: resultHTML,
        view: view,
        filter: filter,
        limit: limit,
        start: start,
        end: end,
        authUser: authCopy22,
        timeZone: timeZone,
        headerText: headerText,
        invitedOnly: invitedOnly,
        type: "recommended",
      });
    }



    // =============================================
    // MANAGED SECTION MANAGED EVENTS
    // =============================================
    if (digestPreferences.organized_on) {
      view = "future";
      filter = "Managed";
      headerText = `Events You Manage `;
      limit = 3;
      start = moment().tz(timeZone);
      const authCopy3 = JSON.parse(JSON.stringify(authUser));
      invitedOnly = false;
      resultHTML = await digestEventSection({
        personId: personId,
        resultHTML: resultHTML,
        view: view,
        filter: filter,
        limit: limit,
        start: start,
        end: end,
        authUser: authCopy3,
        timeZone: timeZone,
        headerText: headerText,
        invitedOnly: invitedOnly,
        type: "managed",
      });
    }

    // FINISH UP W HTML FOOTER
    resultHTML += emailTemplates.digestFooterHTML();

    // SEND EMAIL (MAY BE TEMP HERE FOR TESTING)
    let response = { code: 200, status: "no email attempted" };
    if (sendEmail) {
      let sgMail = require("@sendgrid/mail");
      let msg = {
        to: "developer@radishapp.io",
        from: "Radish <info@radishapp.io>",
        replyTo: "info@radishapp.io",
        subject: `Radish Daily Digest for ${emailTo}`,
        html: resultHTML,
      };
      const sgKey = process.env.SENDGRID_API_KEY;
      sgMail.setApiKey(sgKey);
      try {
        await sgMail
          .send(msg)
          .then(([res]) => {
            response = {
              code: res.statusCode,
              status: "success",
            };
          })
          .catch((error) => {
            response = {
              code: error.code || 400,
              error: error.stack,
              status: "failure",
            };
          });
      } catch (error) {
        response = {
          code: error.code || 400,
          error: error.stack,
          status: "failure",
        };
      }
      // console.log(response);
    }

    // WRITE TO DATABASE
    const digestCollection = db.collection("digest");
    await digestCollection.insertOne({
      person_id: personId,
      mail_to: emailTo,
      date_created: new Date(),
      message: resultHTML,
      response: response,
    });

    return resultHTML;
  } catch (err) {
    log({
      level: "error",
      message: `Error occurred while fetching digest events`,
      function: "getDailyDigest",
      error_code: 500,
      params: params,
      error_stack: err.stack,
    });
  }
}

async function digestEventSection(params) {
  try {
    const personId = params.personId;
    let resultHTML = params.resultHTML;
    const view = params.view;
    const filter = params.filter;
    const limit = params.limit;
    const start = params.start;
    const end = params.end;
    const authUser = params.authUser;
    const timeZone = params.timeZone;
    const headerText = params.headerText;
    const invitedOnly = params.invitedOnly;
    const type = params.type;
    let eventsList;
    const eventParams = {
      view: view,
      minimal: true,
      friend_filter: filter, // either 'Friends' or 'Friends-Of-Friends' or 'Both' or 'Invited' or 'Managed' or null,
      limit: limit,
      start_date: start,
      end_date: end,
    };
    const myEvents = await events.getMyEvents(eventParams, authUser);
    //console.log('myevents');
    //console.log(myEvents);
    if (myEvents && myEvents.length > 0) {
      resultHTML += emailTemplates.digestSectionHeader({
        headerText: headerText,
      });

      let eventIds = [];
      for (let i = 0; i < myEvents.length; i++) {      
        if (usedEventIds.indexOf(myEvents[i].event_id) === -1) {
          eventIds.push(myEvents[i].event_id);
        }
        usedEventIds.push(myEvents[i].event_id);
      }

      if (filter === "Managed") {
        eventsList = await getDigestManagedEvents({
          ids: eventIds,
          personId: personId,
          days: -1,
        });
      } else if (filter === "Invited") {
        eventsList = await getInvitedDigestEvents(eventIds, personId);
      } else {
        // suggested events
        eventsList = await getDigestEvents(eventIds, personId);
      }
      // console.log(myInvitedEvents)


      eventsList.map((e) => {
        inviterLink = filter !== "Managed" ? e.inviter_link[0] : null;
        actionLink =
          filter !== "Managed"
            ? `${process.env.SERVER_PATH}i?f=${inviterLink}&e=${e.event_id}`
            : `${process.env.SERVER_PATH}event/${e.event_id}`;
        e.link = actionLink;
        dateArray = getEventDisplayDate(e, true, timeZone);
        if (dateArray.length > 1) {
          displayDate = `Either ${dateArray[0]} or ${dateArray[1]}`;
        } else {
          displayDate = dateArray[0];
        }
        e.dateDisplay = displayDate;
        nextStatus =
          filter !== "Managed"
            ? getEventUserStatus(e.status, e.rsvp_status)
            : null;
        e.status = nextStatus;
        e.type = type;
        e.image = `https://app.radishapp.io/Graphics/ImageDB/${e.image_id}.v${e.image_version}.png`;
        resultHTML += emailTemplates.digestEventRow(e, constants.EMAIL_TEMPLATE.DAILY_DIGEST);
      });

      // place the section link
      let sectionLink = `${process.env.SERVER_PATH}myevents`;
      resultHTML += emailTemplates.digestSectionFooterLink({
        link: sectionLink,
        text: "View All Events",
      });
    }

    return resultHTML;
  } catch (err) {
    log({
      level: "error",
      message: `Error occurred while fetching digest events`,
      function: "digestSection",
      error_code: 500,
      error_stack: err.stack,
    });
    return resultHTML;
  }
}

async function getDigestEvents(ids, personId) {
  try {

    const collection = db.collection("events");
    const myEvents = await collection
      .aggregate([
        {
          $match: { event_id: { $in: ids } },
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
          $project: {
            image_id: 1,
            image_date: "$image.date_modified",
            image_version: "$image.version",
            group_name: "$group.group_name",
            creator_first: "$creator.first_name",
            creator_last: "$creator.last_name",
            event_name: 1,
            status: 1,
            event_id: 1,
            inviter_link: "$creator.invite_link",
            proposed_date1: 1,
            proposed_end_date1: 1,
            proposed_general1: 1,
            proposed_date2: 1,
            proposed_end_date2: 1,
            proposed_general2: 1,
            final_start_date: 1,
            final_end_date: 1,
            sort: { $ifNull: ["$final_start_date", "$proposed_date1"] },
          },
        },
        {
          $sort: {
            sort: 1,
            event_name: 1,
          },
        },
      ])
      .toArray();
    return myEvents;
  } catch (err) {
    log({
      level: "error",
      message: `Error occurred while fetching events`,
      function: "getDigestEvents",
      //params: params,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function getInvitedDigestEvents(ids, personId) {
  try {
    let matchArray = {
      "invitees.invited_id": personId,
      "invitees.rsvp_status": { $ne: "no" },
    };

    const collection = db.collection("events");
    const myEvents = await collection
      .aggregate([
        {
          $match: { event_id: { $in: ids } },
        },
        {
          $lookup: {
            from: "eventpeople",
            localField: "event_id",
            foreignField: "event_id",
            as: "invitees",
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
          $unwind: "$invitees",
        },
        {
          $match: matchArray,
        },

        {
          $project: {
            image_id: 1,
            image_date: "$image.date_modified",
            image_version: "$image.version",
            group_name: "$group.group_name",
            creator_first: "$creator.first_name",
            creator_last: "$creator.last_name",
            invited_id: "$invitees.invited_id",
            rsvp_status: "$invitees.rsvp_status",
            event_name: 1,
            hybrid_place_id: 1,
            status: 1,
            event_id: 1,
            inviter_link: "$creator.invite_link",
            proposed_date1: 1,
            proposed_end_date1: 1,
            proposed_general1: 1,
            proposed_date2: 1,
            proposed_end_date2: 1,
            proposed_general2: 1,
            final_start_date: 1,
            final_end_date: 1,
            sort: { $ifNull: ["$final_start_date", "$proposed_date1"] },
          },
        },
        {
          $sort: {
            sort: 1,
            event_name: 1,
          },
        },
      ])
      .toArray();
    return myEvents;
  } catch (err) {
    log({
      level: "error",
      message: `Error occurred while fetching events`,
      function: "getDigestEvents",
      //params: params,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function getDigestManagedEvents(params) {
  try {
    const days = params.days || -1; // should always be negative
    const ids = params.ids;
    const personId = params.personId;
    const collection = db.collection("events");
    const myEvents = await collection
      .aggregate([
        {
          $match: { event_id: { $in: ids } },
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
            from: "eventpeople",
            localField: "event_id",
            foreignField: "event_id",
            as: "invitees",
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

        /* {
          $match: {
            "invitees.date_modified": {
              $gt: new Date(moment(new Date()).add(-2, "days")),
            },           
          },
        }, */
        {
          $project: {
            //date_modified: "$invitees.date_modified",
            /*  modified_dates: "$invitees.date_modified",
             invited_ids: "$invitees.invited_id", */
            /* invite_data: {
              modified_date: "$invitees.date_modified",
              invited_id: "$invitees.invited_id",
            }, */
            invitees: "$invitees",
            group_name: "$group.group_name",
            event_name: "$event_name",
            image_id: 1,
            image_date: "$image.date_modified",
            image_version: "$image.version",
            status: 1,
            event_id: 1,
            hybrid_place_id: 1,
            proposed_date1: 1,
            proposed_end_date1: 1,
            proposed_general1: 1,
            proposed_date2: 1,
            proposed_end_date2: 1,
            proposed_general2: 1,
            final_start_date: 1,
            final_end_date: 1,
            sort: { $ifNull: ["$final_start_date", "$proposed_date1"] },
          },
        },

        {
          $sort: {
            sort: 1,
            event_name: 1,
          },
        },
      ])
      .toArray();

    // COUNT THE ACTIONS FOR ACTIVITY NOT THE OWNER (personId)
    let actionCount = 0;
    myEvents.map((eventRec) => {
      actionCount = 0;
      eventRec.invitees.map((person, i) => {
        if (
          person.date_modified > new Date(moment(new Date()).add(days, "days"))
        ) {
          if (person.invited_id !== personId) {
            if (person.rsvp_status && person.rsvp_status !== "sent") {
              actionCount += 1;
            }
          }
        }
      });

      eventRec.action_count = actionCount;
    });

    return myEvents;
  } catch (err) {
    log({
      level: "error",
      message: `Error occurred while fetching events`,
      function: "getDigestEvents",
      //params: params,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

const getEventUserStatus = (eventStatus, rsvpStatus) => {
  //This helper function returns a display status / tag to event or event cards.

  //Valid Result Status: "Declined", "DRAFT", "Going", "Locked", "MAYBE", "NON LIKELY", "RSVP", "VOTE"

  let nextStatus;

  switch (eventStatus) {
    case "Draft": //Result: "DRAFT"
      nextStatus = "DRAFT";
      break;
    case "Voting": //Result: "LIKELY", "MAYBE" or "VOTE"
      nextStatus =
        rsvpStatus === "likely" || rsvpStatus === "maybe"
          ? "You Voted"
          : rsvpStatus === "yes"
            ? "You're Going"
            : rsvpStatus === "no"
              ? "Declined"
              : "Time to Vote";
      break;
    case "RSVP": //Result:  "RSVP", "Going", "Declined"  (Why not all UPPER CASE?)
      nextStatus =
        !rsvpStatus ||
          rsvpStatus === "sent" ||
          rsvpStatus === "maybe" ||
          rsvpStatus === "likely" ||
          rsvpStatus === "opened"
          ? "Time to RSVP"
          : rsvpStatus === "yes"
            ? "You're Going"
            : "Declined";
      break;
    case "Locked": //Result: "Going", "Declined", "Locked"  (Why not all UPPER CASE?)
      nextStatus =
        rsvpStatus === "yes"
          ? "You're Going"
          : rsvpStatus === "no"
            ? "Declined"
            : "Locked";
      break;
    default:
      //Result: DRAFT
      nextStatus = "DRAFT";
      break;
  }

  return nextStatus;
};

const getEventFinalDisplayDate = (finalStartDate, finalEndDate, timezone) => {
  let returnDisplay = "";
  let tempStart = moment(finalStartDate)
    .tz(timezone)
    .format("ddd, MMM Do [from] h:mm a");
  let sameDay = moment(
    moment(finalStartDate).tz(timezone).format("YYYY-MM-DD")
  ).isSame(moment(finalEndDate).tz(timezone).format("YYYY-MM-DD"), "day");
  let sameMonth = moment(
    moment(finalStartDate).tz(timezone).format("YYYY-MM-DD")
  ).isSame(moment(finalEndDate).tz(timezone).format("YYYY-MM-DD"), "month");
  let tempEnd = moment(finalEndDate).tz(timezone).format("[ to ] h:mm a");
  if (!sameDay && !sameMonth) {
    tempEnd = moment(finalEndDate)
      .tz(timezone)
      .format("[ to ] h:mm a [on] ddd, MMM Do");
  } else if (!sameDay) {
    // is same month
    tempEnd = moment(finalEndDate)
      .tz(timezone)
      .format("[ to ] h:mm a [on] ddd [ the ] Do");
  }
  returnDisplay = tempStart + tempEnd;
  return returnDisplay;
};

const getEventDisplayDate = (eventData, short, timezone) => {
  let returnArray = [];
  let strTemp = "";
  if (eventData.final_start_date) {
    returnArray.push(
      getEventFinalDisplayDate(
        eventData.final_start_date,
        eventData.final_end_date,
        timezone
      )
    );
    return returnArray;
  }
  const formatProposedDate = (dtDate, dtEndDate, genTime) => {
    strTemp = moment(dtDate)
      .tz(timezone)
      .format(`${short ? "ddd, MMM Do" : "dddd, MMMM Do"}`);
    if (genTime) {
      strTemp += ` in the ${genTime}`;
    } else {
      strTemp += ` ${!short ? "from" : ""} ${moment(dtDate)
        .tz(timezone)
        .format("h:mm a")} to `;
      if (
        moment(dtDate).tz(timezone).format("YYYYDDD") !==
        moment(dtEndDate).tz(timezone).format("YYYYDDD")
      ) {
        //is multi-day
        strTemp += `${moment(dtEndDate)
          .tz(timezone)
          .format(`h:mm a [on] ${short ? "ddd, MMM Do" : "dddd, MMMM Do"}`)}`;
      } else {
        // is NOT multi-day
        strTemp += moment(dtEndDate).tz(timezone).format("h:mm a");
      }
    }
    returnArray.push(strTemp);
  };
  if (eventData.proposed_date1) {
    formatProposedDate(
      eventData.proposed_date1,
      eventData.proposed_end_date1,
      eventData.proposed_general1
    );
  }
  if (eventData.proposed_date2) {
    formatProposedDate(
      eventData.proposed_date2,
      eventData.proposed_end_date2,
      eventData.proposed_general2
    );
  }
  return returnArray;
};

module.exports = {
  getDailyDigest,
};
