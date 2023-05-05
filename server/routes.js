const inout = require("./api/inout.js");
//const placeTypes = require("./api/placeTypes.js");
//const notifications = require("./api/notifications.js");F
//const comments = require("./api/comments.js");
//const users = require("./api/users.js");
//const people = require("./api/people.js");
//const organizations = require("./api/organizations.js");
//const imageAdmin = require("./api/imageAdmin.js");
//const badges = require("./api/badges.js");
//const causes = require("./api/causes.js");
//const groups = require("./api/groups.js");
//const public = require("./api/public.js");
//const googleContacts = require("./api/googleContacts.js");
//const events = require("./api/events.js");
//const validator = require("./api/validator.js");
//const google = require("./api/google.js");
const logger = require("./api/logger.js");
const log = require("./api/logger").insertServerLogs;

const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

router.get("/api", (req, res) => {
  res.json({ message: "Hello from Radish!" });
});

const authFailResponse = (authUser) => {
  return {
    message: authUser.message || "Authorization Error!",
    code: authUser.code,
  };
};

/*IN OUT BOARD */
router.post("/inoutboard", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does NOT require Radmin
    if (authUser.code === 200) {
      const params = req.body;

      const myInOutBoard = await inout.getInOutBoard(params);

      res.send({
        data: myInOutBoard.data,
        corp: myInOutBoard.aCorp,
        orrville: myInOutBoard.aOrrville,
        florida: myInOutBoard.aFlorida,
        illinois: myInOutBoard.aIllinois,
        message: "ok",
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting inoutboard.",
      function: "inoutboard",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      message: "Error getting inoutboard.",
      code: 500,
    });
  }
});

router.post("/inoutperson", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does NOT require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const orgAdmin = organizations.validateOrgAdmin(
        params.org_id,
        authUser,
        false
      );
      if (orgAdmin) {
        const myPerk = await inout.getInOutPerson(params);
        res.send({
          data: myInOutPerson,
          message: myInOutPerson.message || "ok",
          code: myInOutPerson.code || 200,
        });
      }
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting inoutperson.",
      function: "inoutperson",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      message: "Error getting inoutperson.",
      code: 500,
    });
  }
});

router.post("/personstatus", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does NOT require Radmin
    if (authUser.code === 200) {
      const params = req.body;

      const myPersonStatus = await inout.getPersonStatus(params);
      /* console.log(myPersonStatus.data); */
      res.send({
        data: myPersonStatus.data,
        message: "ok",
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting personstatus.",
      function: "personstatus",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      message: "Error getting personstatus.",
      code: 500,
    });
  }
});

router.post("/upsertinoutperson", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does NOT require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const orgAdmin = organizations.validateOrgAdmin(
        params.org_id,
        authUser,
        false
      );
      if (orgAdmin) {
        const perk = await inout.upsertInOutPerson(params, authUser);
        res.send({
          data: inoutperson,
          message: inoutperson.message || "ok",
          code: inoutpersoninoutperson.code || 200,
        });
      }
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while updating perk.",
      function: "upsertinoutperson",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      message: "Error updating inoutperson.",
      code: 500,
    });
  }
});

/* PUBLIC */
router.post("/contactus", async (req, res) => {
  try {
    //NO AUTH NEEDED
    const params = req.body;
    const result = await public.ContactUs(params);
    res.send(result);
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred during contact-us.",
      function: "contactus",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      message: "Error inserting data.",
      code: 500,
    });
  }
});

/* COMMENTS */
router.post("/comments", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res, true); // does NOT require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const result = await comments.getComments(params, authUser);
      if (result) {
        res.send({
          data: result.data,
          message: result.message || "ok",
          code: result.code || 200,
        });
      }
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while updating perk.",
      function: "upsertperk",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      message: "Error updating perk.",
      code: 500,
    });
  }
});
router.post("/upsertcomment", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res, true); // does NOT require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const result = comments.upsertComment(params, authUser);
      if (result) {
        res.send({
          data: result.data,
          message: result.message || "ok",
          code: result.code || 200,
        });
      }
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while updating perk.",
      function: "upsertperk",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      message: "Error updating perk.",
      code: 500,
    });
  }
});

/* PLACETYPES */
router.post("/upsertplacetype", async (req, res) => {
  try {
    const authUser = await Auth2(req, true, res); // DO require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const perk = await placeTypes.upsertPlaceType(params, authUser);
      res.send({
        data: perk,
        message: perk.message || "ok",
        code: perk.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while updating place type.",
      function: "upsertplacetype",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      message: "Error updating place type.",
      code: 500,
    });
  }
});
router.post("/placetype", async (req, res) => {
  try {
    const authUser = await Auth2(req, true, res); // DO require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const myPerk = await placeTypes.getPlaceType(params);
      res.send({
        data: myPerk,
        message: myPerk.message || "ok",
        code: myPerk.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting place type.",
      function: "placetype",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      message: "Error getting place type.",
      code: 500,
    });
  }
});
router.post("/placetypes", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does NOT require Radmin
    if (authUser.code === 200) {
      let params = req.body;
      const myTemplates = await placeTypes.getPlaceTypes(params);
      res.send({
        data: myTemplates,
        message: myTemplates.message || "ok",
        code: myTemplates.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting place types.",
      function: "placetypes",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      message: "Error getting place types.",
      code: 500,
    });
  }
});

/* PERKS */
router.post("/perk", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does NOT require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const orgAdmin = organizations.validateOrgAdmin(
        params.org_id,
        authUser,
        false
      );
      if (orgAdmin) {
        const myPerk = await perks.getPerk(params);
        res.send({
          data: myPerk,
          message: myPerk.message || "ok",
          code: myPerk.code || 200,
        });
      }
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting perk.",
      function: "perk",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      message: "Error getting perk.",
      code: 500,
    });
  }
});
router.post("/perks", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does NOT require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const orgAdmin = organizations.validateOrgAdmin(
        params.org_id,
        authUser,
        false
      );
      if (orgAdmin) {
        const myPerks = await perks.getPerks(params);
        res.send({
          data: myPerks,
          message: "ok",
        });
      }
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting perks.",
      function: "perks",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      message: "Error getting perks.",
      code: 500,
    });
  }
});
router.post("/upsertperktemplate", async (req, res) => {
  try {
    const authUser = await Auth2(req, true, res); // DO require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const perk = await perks.upsertPerkTemplate(params, authUser);
      res.send({
        data: perk,
        message: perk.message || "ok",
        code: perk.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while updating perk template.",
      function: "upsertperktemplate",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      message: "Error updating perk template.",
      code: 500,
    });
  }
});
router.post("/perktemplate", async (req, res) => {
  try {
    const authUser = await Auth2(req, true, res); // DO require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const myPerk = await perks.getPerkTemplate(params);
      res.send({
        data: myPerk,
        message: myPerk.message || "ok",
        code: myPerk.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting perk template.",
      function: "perktemplate",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      message: "Error getting perk template.",
      code: 500,
    });
  }
});
router.post("/perktemplates", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does NOT require Radmin
    if (authUser.code === 200) {
      let params = req.body;
      const myTemplates = await perks.getPerkTemplates(params);
      res.send({
        data: myTemplates,
        message: myTemplates.message || "ok",
        code: myTemplates.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting perk templates.",
      function: "perktemplates",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      message: "Error getting perk templates.",
      code: 500,
    });
  }
});
router.post("/upsertperk", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does NOT require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const orgAdmin = organizations.validateOrgAdmin(
        params.org_id,
        authUser,
        false
      );
      if (orgAdmin) {
        const perk = await perks.upsertPerk(params, authUser);
        res.send({
          data: perk,
          message: perk.message || "ok",
          code: perk.code || 200,
        });
      }
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while updating perk.",
      function: "upsertperk",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      message: "Error updating perk.",
      code: 500,
    });
  }
});

/* GOOGLE */
router.post("/places", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      await google.getGooglePlaces(params, res);
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting places.",
      function: "places",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      message: "Error getting places.",
      code: 500,
    });
  }
});
router.post("/autocomplete", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      // note: googlePlaces call responses directly to res
      await google.googleAutoComplete(params, res);
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting places.",
      function: "autocomplete",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      message: "Error getting places.",
      code: 500,
    });
  }
});
router.post("/placedetails", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res, true); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      // note: googlePlaces call responses directly to res
      await google.googlePlaceDetails(params, res);
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting place.",
      function: "placedetails",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      message: "Error getting place.",
      code: 500,
    });
  }
});
router.post("/googlephoto", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res, true); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      await google.googlePhoto(params, res);
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting place.",
      function: "googlephoto",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      message: "Error getting place.",
      code: 500,
    });
  }
});
router.post("/googletextsearch", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      await google.getGooglePlaceFromText(params, res);
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting place.",
      function: "googletextsearch",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      message: "Error getting place.",
      code: 500,
    });
  }
});
router.post("/googlegeocodesearch", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      await google.googleGeocodeDetails(params, res);
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting place.",
      function: "googlegeocodesearch",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      message: "Error getting place.",
      code: 500,
    });
  }
});

/* EVENTS */
router.post("/emailics", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const result = await events.emailICS(params, authUser);
      if (result) {
        res.send(result);
      } else {
        res.send({
          message: "Error emailing event ICS file.",
          code: 500,
        });
      }
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting event.",
      function: "event",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      message: "Error Getting Event.",
      code: 500,
    });
  }
});
router.post("/event", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const id = req.body.id;
      const event = await events.getEvent(id, authUser);
      if (event) {
        res.send({
          data: event,
          message: event.message || "ok",
          code: event.code || 200,
        });
      } else {
        res.send({
          message: "Error getting event. Possibly a permission error.",
          code: 500,
        });
      }
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting event.",
      function: "event",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      message: "Error Getting Event.",
      code: 500,
    });
  }
});
router.post("/editevent", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const id = req.body.id;
      const event = await events.getEvent(id, authUser, true); // editing = true
      if (event) {
        res.send({
          data: event,
          message: event.message || "ok",
          code: event.code || 200,
        });
      } else {
        res.send({
          message: "Error getting event. Possibly a permission error.",
          code: 500,
        });
      }
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while editing event.",
      function: "editevent",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      message: "Error Getting Event.",
      code: 500,
    });
  }
});
router.post("/myevents", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const event = await events.getMyEvents(req.body, authUser);
      res.send({
        data: event,
        message: event.message || "ok",
        code: event.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting events.",
      function: "myevents",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error getting events.",
    });
  }
});
router.post("/eventsbrief", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res, false, true); // does not require Radmin
    if (authUser.code === 200) {
      const myevents = await events.eventsAtGlance(req.body, authUser);
      res.send({
        data: myevents.data,
        myFriends: myevents.myFriends,
        message: myevents.message || "ok",
        code: myevents.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting events.",
      function: "eventsbrief",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error getting events.",
    });
  }
});
router.post("/raisehand", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res, true); // does not require Radmin
    if (authUser.code === 200) {
      const result = await users.raiseHand(req.body, authUser);
      res.send({
        data: result.data,
        message: result.message || "ok",
        code: result.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while raising hand.",
      function: "raisehand",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error raising hand.",
    });
  }
});
router.post("/eventforrate", async (req, res) => {
  try {
    //no auth needed. returns minimal event data for public consumption
    const result = await events.getEventForRate(req.body);
    res.send(result);
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting event.",
      function: "invited",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error getting event.",
    });
  }
});
router.post("/invited", async (req, res) => {
  try {
    //no auth needed. returns firstname, lastname, user_id (email)
    const result = await users.getInvited(req.body);
    res.send({
      data: result.data,
      message: result.message || "ok",
      code: result.code || 200,
    });
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting invited user.",
      function: "invited",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error getting invited user.",
    });
  }
});
router.post("/eventinvitee", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res, true); // does not require Radmin
    if (authUser.code === 200) {
      const result = await events.getEventInvitee(req.body, authUser);
      res.send({
        data: result.data,
        message: result.message || "ok",
        code: result.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting invitee.",
      function: "eventinvitee",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error getting invitee.",
    });
  }
});
router.post("/eventinvitees", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const invitees = await events.getEventInvitees(req.body, authUser);
      res.send({
        data: invitees.data,
        count: invitees.count,
        message: invitees.message || "ok",
        code: invitees.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting invitees.",
      function: "eventinvitees",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error getting invitees.",
    });
  }
});
router.post("/eventinvitation", async (req, res) => {
  try {
    let authUser = null;
    let isPublic = req.body.isPublic;
    if (!isPublic) {
      authUser = await Auth2(req, false, res, true); // does not require Radmin
    }
    const id = req.body.id;
    const friendInviteId = req.body.friendInviteId;
    let event = null;
    event = await events.getEventInvitation(
      id,
      friendInviteId,
      authUser,
      isPublic
    );
    res.send({
      data: event.data,
      message: event.message,
    });
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting event.",
      function: "eventinvitation",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error getting event.",
    });
  }
});
router.post("/insertevent", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const event = await events.insertEvent(params, authUser);

      res.send({
        data: event,
        message: event.message || "ok",
        code: event.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while inserting event.",
      function: "insertevent",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error inserting event.",
    });
  }
});
router.post("/updateeventwhen", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const event = await events.updateEventWhen(params, authUser);

      res.send({
        data: event,
        message: event.message || "ok",
        code: event.code || 200,
      });
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while updating event.",
      function: "updateeventwhen",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error updating event.",
    });
  }
});
router.post("/updateeventwhere", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const event = await events.updateEventWhere(params, authUser);

      res.send({
        data: event,
        message: event.message || "ok",
        code: event.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while updating event.",
      function: "updateeventwhere",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error updating event.",
    });
  }
});
router.post("/eventfinalize", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const event = await events.eventFinalize(params, authUser);

      res.send({
        data: event,
        message: event.message || "ok",
        code: event.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while updating event.",
      function: "eventfinalize",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error updating event.",
    });
  }
});
router.post("/inserteventpeople", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res, true); // does not require Radmin

    if (authUser.code === 200) {
      const params = req.body;
      const inviteRecord = await events.insertEventPeople(params, authUser);

      res.send({
        data: inviteRecord,
        message: inviteRecord.message || "ok",
        code: inviteRecord.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while upserting eventpeople record.",
      function: "inserteventpeople",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error upserting eventpeople record.",
    });
  }
});
router.post("/inserteventmanypeople", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const inviteResponse = await events.insertEventManyPeople(
        params,
        authUser
      );

      res.send({
        data: inviteResponse,
        message: inviteResponse.message || "ok",
        code: inviteResponse.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while upserting eventpeople records.",
      function: "inserteventmanypeople",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error upserting eventpeople records.",
    });
  }
});
router.post("/updateeventmanypeople", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const inviteResponse = await events.updatetEventManyPeople(
        params,
        authUser
      );

      res.send({
        data: inviteResponse,
        message: inviteResponse.message || "ok",
        code: inviteResponse.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while updating eventpeople records.",
      function: "updateeventmanypeople",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error updating eventpeople records.",
    });
  }
});
router.post("/updatersvp", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const result = await events.updatePersonRSVPStatus(params, authUser);
      res.send({
        data: result,
        message: result.message || "ok",
        code: result.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while updating eventpeople records.",
      function: "updatersvp",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error updating eventpeople records.",
    });
  }
});
router.post("/getfriendstoinvite", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const eventFriends = await events.getFriendsToInvite(params, authUser);

      res.send({
        data: eventFriends,
        message: eventFriends.message || "ok",
        code: eventFriends.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting friends for event invite.",
      function: "getfriendstoinvite",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "error getting friends for event invite.",
    });
  }
});

/* PLACES */
router.post("/insertplace", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const place = await events.insertPlace(params, authUser);

      res.send({
        data: place,
        message: place.message || "ok",
        code: place.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while inserting place.",
      function: "insertplace",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error inserting place.",
    });
  }
});
router.post("/myplaces", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const places = await events.getMyPlaces(params, authUser);
      res.send({
        data: places,
        message: places.message || "ok",
        code: places.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while fetching place.",
      function: "myplaces",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error fetching places.",
    });
  }
});
router.post("/searchcustomplaces", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res, true); // does not require Radmin
    if (authUser.code === 200) {
      const options = req.body;
      const places = await events.SearchCustomPlaces(options, authUser);
      res.send({
        data: places,
        message: places.message || "ok",
        code: places.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while fetching place.",
      function: "searchcustomplaces",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error fetching places.",
    });
  }
});
router.post("/googlecontacts", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const result = await googleContacts.getGoogleContacts(params, res);
      res.send({
        data: result.data,
        message: result.message || "ok",
        code: result.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting contacts.",
      function: "googlecontacts",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error getting contacts.",
    });
  }
});
router.post("/myrecentgoogleplaces", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const places = await events.getRecentGooglePlaces(authUser);
      res.send({
        data: places.data,
        message: places.message || "ok",
        code: places.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while fetching places.",
      function: "myrecentgoogleplaces",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error fetching places.",
    });
  }
});
router.post("/place", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res, true); // does not require Radmin // allow tempuser
    if (authUser.code === 200) {
      const id = req.body.id;
      const event = await events.getMyPlace(id, authUser);

      res.send({
        data: event,
        message: event.message || "ok",
        code: event.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting places.",
      function: "place",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error getting place.",
    });
  }
});

/* GROUPS */
router.post("/updategroup", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const group = await groups.updateGroup(params, authUser);

      res.send({
        data: group?.data,
        message: group?.message || "ok",
        code: group?.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while updating group.",
      function: "updategroup",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error updating group.",
    });
  }
});

router.post("/insertgroup", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const group = await groups.insertGroup(params, authUser);

      res.send({
        data: group,
        message: group.message || "ok",
        code: group.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while inserting group.",
      function: "insertgroup",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error inserting group.",
    });
  }
});

router.post("/deletegroup", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const group = await groups.deleteGroup(params, authUser);
      let msg = "ok";
      let code = 200;
      if (!group) {
        msg = "There was an error deleting group. Maybe a permissions issue.";
        code = 500;
      }

      res.send({
        data: group,
        message: msg,
        code: code,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while deleting group.",
      function: "deletegroup",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error deleting group.",
    });
  }
});

router.post("/addgroupmembers", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const groupid = await groups.addGroupMembers(params, authUser);
      let msg = "ok";
      let code = 200;
      if (!groupid) {
        msg = "Error adding member(s). Perhaps a permission issue.";
        code = 500;
      }
      res.send({
        data: groupid,
        message: msg,
        code: code,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while adding group members.",
      function: "addgroupmembers",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error adding group members.",
    });
  }
});

router.post("/updategroupmember", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const groupid = await groups.updateGroupMember(params, authUser);
      let msg = "ok";
      let code = 200;
      if (!groupid) {
        msg = "Error updating group members. Perhaps a permission issue.";
        code = 500;
      }
      res.send({
        data: groupid,
        message: msg,
        code: code,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while updating group members.",
      function: "updategroupmember",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error updating group members.",
    });
  }
});

router.post("/leavegroup", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const groupid = await groups.leaveGroup(params, authUser);
      let msg = "ok";
      let code = 200;
      if (!groupid) {
        msg = "Error updating group members. Perhaps a permission issue.";
        code = 500;
      }
      res.send({
        data: groupid,
        message: msg,
        code: code,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while updating group members.",
      function: "leavegroup",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error updating group members.",
    });
  }
});

router.post("/logsupportmsg", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin

    if (authUser.code === 200) {
      const params = req.body;
      const result = await people.logSupportMessage(params, authUser);

      res.send({
        data: result.data,
        message: result.message || "ok",
        code: result.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    console.log(err.stack);
    res.send({
      message: "Error joining group.",
      code: 500,
    });
  }
});

router.post("/joingroup", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin

    if (authUser.code === 200) {
      const params = req.body;
      const group = await people.joinGroup(params, authUser);
      //test
      res.send({
        data: group.data,
        message: group.message || "ok",
        code: group.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while joining group.",
      function: "joingroup",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      message: "Error joining group.",
      code: 500,
    });
  }
});

router.post("/suggestgroups", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res, false, true); // does not require Radmin

    if (authUser.code === 200) {
      const params = req.body;
      const group = await people.getSuggestedGroups(params, authUser);
      //test
      res.send({
        data: group.data,
        friendGroups: group.friendGroups,
        friendsOfFriendGroups: group.friendsOfFriendGroups,
        orgGroups: group.orgGroups,
        message: group.message || "ok",
        code: group.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while retreiving suggested groups.",
      function: "suggestgroups",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      message: "Error retreiving suggested groups.",
      code: 500,
    });
  }
});

router.post("/mygroups", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res, false, true); // does not require Radmin

    if (authUser.code === 200) {
      const params = req.body;
      const group = await groups.getMyGroups(params, authUser);
      //test
      res.send({
        data: group.groups,
        message: group.message || "ok",
        code: group.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while retreiving groups.",
      function: "mygroups",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      message: "Error retreiving groups.",
      code: 500,
    });
  }
});

router.post("/groups", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const groupIds = req.body.group_ids;
      const myData = await groups.getGroups(groupIds);

      res.send({
        data: myData,
        message: myData.message || "ok",
        code: myData.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while retreiving groups.",
      function: "groups",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error retreiving groups.",
    });
  }
});

router.post("/group", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const group = await groups.getGroup(params, authUser);
      res.send({
        data: group.data,
        message: group.message || "ok",
        code: group.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while retreiving group.",
      function: "group",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error retreiving group.",
    });
  }
});

/* BADGES */
router.post("/myfullbadgelist", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const badgeList = await badges.myFullBadgeList(params, authUser);

      res.send({
        badges: badgeList,
        message: badgeList.message || "ok",
        code: badgeList.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting full badge list.",
      function: "myfullbadgelist",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error getting full badge list.",
    });
  }
});

router.post("/badge/", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const id = req.body.id;
      const abadge = await badges.getBadge(id);

      res.send({
        data: abadge,
        message: abadge.message || "ok",
        code: abadge.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting badge.",
      function: "badge",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error getting badge.",
    });
  }
});

router.post("/badges", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const badgeList = await badges.getBadges(params, authUser);

      res.send({
        data: badgeList,
        message: badgeList.message || "ok",
        code: badgeList.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting badges.",
      function: "badges",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error getting badges.",
    });
  }
});

/* CAUSES */
router.post("/causetypes", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const cause = await causes.getCauseTypes(params, authUser);
      res.send({
        data: cause.data,
        message: cause.message || "ok",
        code: cause.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while retreiving causes.",
      function: "causetypes",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error retreiving causes.",
    });
  }
});

//TODO: [RAD-162] routes: /casues - wire to real data or delte call.
router.get("/causes", (req, res) => {
  fs.readFile(
    path.resolve(__dirname, "./testdata", "TestData_Causes.json"),
    (err, data) => {
      if (err) throw err;
      let causes = JSON.parse(data);
      res.json({ causes: causes });
    }
  );
});

/* PEOPLE */
router.post("/myfriends", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const peoples = await people.getMyFriends(params, authUser);
      res.send({
        data: peoples.data,
        message: peoples.message,
        code: peoples.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while retreiving my friends.",
      function: "myfriends",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      message: "Error retreiving my friends.",
      code: 500,
    });
  }
});
router.post("/lowerhands", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const peoples = await people.lowerHands(params);
      res.send({
        data: peoples.data,
        message: peoples.message,
        code: peoples.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while lowering hands.",
      function: "lowerhands",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      message: "Error lowering hands.",
      code: 500,
    });
  }
});

router.post("/countmyfriends", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const friendCount = await people.countMyFriends(params, authUser);
      res.send({
        data: friendCount.data,
        message: friendCount.message || "ok",
        code: friendCount.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while fetching my friends count.",
      function: "countmyfriends",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error fetching my friends count.",
    });
  }
});

router.post("/saveorgadmin", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const myPeople = await people.saveOrgAdmin(params, authUser);
      res.send({
        data: myPeople.data,
        message: myPeople.message || "ok",
        code: myPeople.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while saving org admin.",
      function: "saveorgadmin",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error saving org admin.",
    });
  }
});

router.post("/orgadminpeople", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const myPeople = await people.getOrgAdminPeople(params, authUser);
      res.send({
        data: myPeople.data,
        message: myPeople.message || "ok",
        code: myPeople.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while retreiving people for an organization.",
      function: "orgadminpeople",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error retreiving people for an organization.",
    });
  }
});

router.post("/person", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    //const id = req.params.id;
    if (authUser.code === 200) {
      const person = await people.getPerson(req.body.id, authUser);
      res.send({
        data: person,
        message: person.message || "ok",
        code: person.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting person record.",
      function: "person",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error getting person record.",
    });
  }
});

router.post("/importpeople", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    //const id = req.params.id;
    if (authUser.code === 200) {
      const myPeople = await people.importPeople(req.body, authUser);
      res.send({
        data: myPeople,
        message: myPeople.message || "ok",
        code: myPeople.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while inserting contacts.",
      function: "importpeople",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error inserting contacts.",
    });
  }
});

router.post("/inviter", async (req, res) => {
  /* do NOT put auth code here. is public page calling this */
  try {
    const person = await people.getInviter(req.body.id);
    res.send({
      data: person,
      message: person.message || "ok",
      code: person.code || 200,
    });
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while fetching inviter.",
      function: "inviter",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error fetching inviter.",
    });
  }
});

router.post("/organizations", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does NOT require Radmin
    if (authUser.code === 200) {
      const params = req.body;

      const response = await organizations.getOrganizations(params, authUser);
      res.send(response);
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while fetching Orgs.",
      function: "organizations",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error fetching Orgs.",
    });
  }
});

router.post("/nporganizations", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does NOT require Radmin
    if (authUser.code === 200) {
      const params = req.body;

      const nporganization = await organizations.getNPOrganizations(
        params,
        authUser
      );

      res.send({
        data: nporganization,
        message: nporganization.message || "ok",
        code: nporganization.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while fetching nonprofit organizations.",
      function: "nporganizations",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error fetching nonprofit organizations.",
    });
  }
});

router.post("/radminorganizations", async (req, res) => {
  try {
    const authUser = await Auth2(req, (checkRadishAdmin = true), res); // does NOT require Radmin
    if (authUser.code === 200) {
      const params = req.body;

      const response = await organizations.getOrganizations(params, authUser);

      res.send(response);
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while fetching organizations.",
      function: "radminorganizations",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      data: null,
      message: "Error fetching organizations.",
    });
  }
});

router.post("/myadminorg", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does NOT require Radmin
    if (authUser.code === 200) {
      const org = await organizations.getMyAdminOrg(req.body, authUser);
      res.send({
        data: org.data,
        message: org.message || "ok",
        code: org.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while fetching my admin org.",
      function: "myadminorg",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error fetching my admin org.",
    });
  }
});

router.post("/myadminorgs", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does NOT require Radmin
    if (authUser.code === 200) {
      const orgs = await organizations.getMyAdminOrgs(authUser);
      res.send({
        data: orgs.data,
        message: orgs.message || "ok",
        code: orgs.code || 200,
        env: process.env.SERVER_PATH,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while fetching my admin orgs.",
      function: "myadminorgs",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error fetching my admin orgs.",
    });
  }
});

router.post("/orgtypetags", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does NOT require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const organization = await organizations.getOrgTypeTags(params, authUser);

      res.send({
        data: organization,
        message: organization.message || "ok",
        code: organization.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while fetching org tag types.",
      function: "orgtypetags",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error fetching org tag types.",
    });
  }
});

router.post("/organization", async (req, res) => {
  try {
    const id = req.body.id;
    const authUser = await Auth2(req, (checkRadishAdmin = true), res); // does NOT require Radmin
    if (authUser.code === 200) {
      const organization = await organizations.getOrganization(id, authUser);

      res.send({
        data: organization,
        message: organization.message || "ok",
        code: organization.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while fetching Organization.",
      function: "organization",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error fetching Organization.",
    });
  }
});

router.post("/orginvitation", async (req, res) => {
  try {
    const organization = await organizations.getOrgInvitation(req.body);
    res.send({
      data: organization,
      message: "ok",
    });
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while fetching Org Invitation.",
      function: "orginvitation",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error fetching Org Invitation.",
    });
  }
});

router.post("/updateorganization", async (req, res) => {
  try {
    const authUser = await Auth2(req, (checkRadishAdmin = false), res); //RADMIN NOT REQUIRED.  Check for org admin happens in UpdateOrganization.  (JEV 12/17)
    if (authUser.code === 200) {
      const params = req.body;
      const org = await organizations.updateOrganization(params, authUser);

      res.send({
        data: org,
        message: org.message || "ok",
        code: org.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while fetching updating organization.",
      function: "updateorganization",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error updating organization.",
    });
  }
});

router.post("/updateorglogos", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const orgs = await organizations.updateOrgLogos(params, authUser);

      res.send({
        data: orgs.data,
        message: orgs.message || "ok",
        code: orgs.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while fetching updating org logo.",
      function: "updateorglogos",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error updating org logo.",
    });
  }
});

router.post("/updateorgdomains", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const org = await organizations.updateOrgDomains(params, authUser);

      res.send({
        data: org,
        message: org.message || "ok",
        code: org.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while fetching updating org domains.",
      function: "updateorgdomains",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error updating org domains.",
    });
  }
});

router.post("/updateorgtypes", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const orgs = await organizations.updateOrgTypes(params, authUser);

      res.send({
        data: orgs,
        message: orgs.message || "ok",
        code: orgs.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while fetching updating org types.",
      function: "updateorgtypes",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error updating org types.",
    });
  }
});

router.post("/insertorganization", async (req, res) => {
  try {
    const params = req.body;
    const authUser = await Auth2(
      req,
      (checkRadishAdmin = params.checkRadishAdmin),
      res
    );
    if (authUser.code === 200) {
      const org = await organizations.insertOrganization(params, authUser);
      res.send({
        data: org,
        message: org.message || "ok",
        code: org.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while inserting organization.",
      function: "insertorganization",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error inserting organization.",
    });
  }
});

router.post("/organizationextended", async (req, res) => {
  try {
    const authUser = await Auth2(req, (checkRadishAdmin = true), res);
    if (authUser.code === 200) {
      const id = req.body.id;
      const org = await organizations.getOrganizationExtended(id);

      res.send({
        data: org.data,
        message: org.message || "ok",
        code: org.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while updating organization.",
      function: "organizationextended",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error updating organization.",
    });
  }
});

router.post("/organizationprofile", async (req, res) => {
  //called from mysettings
  try {
    const authUser = await Auth2(req, false, res);
    if (authUser.code === 200) {
      const id = req.body.id;
      const org = await organizations.getOrganizationProfile(id);

      res.send({
        data: org.data,
        message: org.message || "ok",
        code: org.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting org profile.",
      function: "organizationprofile",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error getting org profile.",
    });
  }
});

/* ADMIN IMAGES */
router.post("/lastimagedate", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const imageData = await imageAdmin.lastImageDate(params, authUser);

      res.send({
        data: imageData,
        message: imageData.message || "ok",
        code: imageData.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while fetching last image date.",
      function: "lastimagedate",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error fetching last image date.",
    });
  }
});
router.post("/updateimage", async (req, res) => {
  try {
    const authUser = await Auth2(req, true, res); // requires Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const imageData = await imageAdmin.upsertImage(params, authUser);

      res.send({
        data: imageData,
        message: imageData.message || "ok",
        code: imageData.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while updating image.",
      function: "updateimage",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error updating image.",
    });
  }
});
router.post("/deleteimage", async (req, res) => {
  try {
    const authUser = await Auth2(req, true, res); // requires Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const imageData = await imageAdmin.deleteImage(params, authUser);

      res.send({
        data: imageData,
        message: imageData.message || "ok",
        code: imageData.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while deleting image.",
      function: "deleteimage",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error deleting image.",
    });
  }
});
router.post("/getimage", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const imageData = await imageAdmin.getImage(params, authUser);
      res.send({
        data: imageData,
        message: imageData.message || "ok",
        code: imageData.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting image.",
      function: "getimage",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error getting image.",
    });
  }
});
router.post("/getimages", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res, true); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const imageData = await imageAdmin.getImages(params, authUser);
      res.send({
        data: imageData,
        message: imageData.message || "ok",
        code: imageData.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting images.",
      function: "getimages",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error getting images.",
    });
  }
});

router.post("/getlatestimages", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res, true); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const imageData = await imageAdmin.getLatestImages(params, authUser);
      res.send({
        data: imageData,
        message: imageData.message || "ok",
        code: imageData.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting latest images.",
      function: "getlatestimages",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error getting latest images.",
    });
  }
});

router.post("/getimagescount", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res, true); // does not require Radmin
    if (authUser.code === 200) {
      const imageData = await imageAdmin.getImagesCount(authUser);
      res.send({
        data: imageData,
        message: imageData.message || "ok",
        code: imageData.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting images count.",
      function: "getimagescount",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error getting images count.",
    });
  }
});

/* USERS */
router.post("/insertuser", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const user = await users.insertUser(params, authUser);

      res.send({
        data: user,
        message: user.message || "ok",
        code: user.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while inserting user.",
      function: "insertuser",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error inserting user.",
    });
  }
});

router.post("/insertaccept", async (req, res) => {
  try {
    // public call. no auth needed.
    const params = req.body;
    const user = await users.insertAccept(params);
    res.send({
      code: user.code,
      userAlreadyExists: user.userAlreadyExists,
      data: user.data,
      message: "ok",
    });
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while accepting invite.",
      function: "insertaccept",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error accepting invite.",
    });
  }
});

router.post("/acceptorguser", async (req, res) => {
  try {
    const authUser = await Auth2(req, (checkRadishAdmin = false), res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const personID = params.person_id;
      const orgID = params.org_id;
      const doc = await people.acceptOrgUser(personID, orgID);
      res.send({
        data: doc,
        message: doc.message || "ok",
        code: doc.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while accepting organization invite.",
      function: "acceptorguser",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error accepting organization invite.",
    });
  }
});

router.post("/login", async (req, res) => {
  //Does not need auth2.  actually logging in.
  try {
    users.login(req, res);
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while doing login.",
      function: "login",
      error_code: 500,
      error_stack: err.stack,
    });
  }
});

router.post("/resetpwd", async (req, res) => {
  //Does not need auth2.  actually resetting pwd in.
  try {
    users.resetPwd(req, res);
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while resetting password.",
      function: "resetpwd",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 400,
      message: "failure",
    });
  }
});

router.post("/cleartempuser", async (req, res) => {
  try {
    const authUser = await Auth2(
      req,
      (checkRadishAdmin = false),
      res,
      (allowTempUser = true)
    ); // does require Radmin
    if (authUser.code === 200) {
      const user = await users.clearTempUser(authUser);
      res.send({
        message: user.message || "ok",
        code: user.code,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while clearing temp user.",
      function: "cleartempuser",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error clearing temp user.",
    });
  }
});

router.post("/getradmins", async (req, res) => {
  try {
    const authUser = await Auth2(req, (checkRadishAdmin = true), res); // does require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const user = await users.getRadmins(params, authUser);

      res.send({
        data: user,
        message: user.message || "ok",
        code: user.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting Radmins.",
      function: "getradmins",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error getting Radmins.",
    });
  }
});

router.post("/usersradmin", async (req, res) => {
  try {
    const authUser = await Auth2(req, (checkRadishAdmin = true), res); // does require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const response = await users.getUsersRadmin(params, authUser);

      res.send({
        data: response.users,
        count: response.count,
        message: response.message || "ok",
        code: response.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting Users(Radmin).",
      function: "usersradmin",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error getting Users(Radmin).",
    });
  }
});

router.post("/toggleradmin", async (req, res) => {
  try {
    const authUser = await Auth2(req, (checkRadishAdmin = true), res); // does require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const user = await users.toggleRadmin(params, authUser);

      res.send({
        data: user,
        message: user.message || "ok",
        code: user.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while toggling radmin.",
      function: "toggleradmin",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error toggling radmin.",
    });
  }
});

router.get("/currentuser", async (req, res) => {
  try {
    const authUser = await Auth2(
      req,
      false,
      res,
      (allowTempUser = true),
      (bypassCache = true)
    ); // does not require Radmin

    if (authUser.code === 200) {
      const user = await users.getCurrentUser(authUser);
      res.send(user);
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting current user.",
      function: "currentuser",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error getting current user.",
    });
  }
});

router.post("/clearhint", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res, true, true); // does not require Radmin. allow tempuser. bypasscache
    if (authUser.code === 200) {
      const params = req.body;
      const user = await users.clearHint(params, authUser);
      res.send({
        data: user.data,
        message: user.message || "ok",
        code: user.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while clearing hint.",
      function: "clearhint",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error getting user.",
    });
  }
});

router.post("/user/", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const id = req.body.id;
      const user = await users.getUser(id);
      res.send({
        data: user.data,
        message: user.message || "ok",
        code: user.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting user.",
      function: "user",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error getting user.",
    });
  }
});

router.post("/updateuserimage", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const user = await users.updateUserImage(params, authUser);

      res.send({
        data: user,
        message: user.message || "ok",
        code: user.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while updating user image.",
      function: "updateuserimage",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error updating user image.",
    });
  }
});

router.post("/updatecurrentuser", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const user = await users.updateCurrentUser(params, authUser);

      res.send({
        data: user,
        message: user.message || "ok",
        code: user.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while updating current user.",
      function: "updatecurrentuser",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error updating current user.",
    });
  }
});

router.post("/insertuseremail", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res, true, true); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const user = await users.insertUserEmail(params, authUser);

      if (user && user.errmessage) {
        // some error message returned
        res.send({
          data: null,
          message: user.errmessage,
          code: 500,
        });
        return;
      }
      res.send({
        data: user,
        message: user.message || "ok",
        code: user.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while inserting email.",
      function: "insertuseremail",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error inserting email.",
    });
  }
});

router.post("/insertuserphone", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const user = await users.insertUserPhone(params, authUser);

      if (user && user.errmessage) {
        // some error message returned
        res.send({
          data: null,
          message: user.errmessage,
          code: 500,
        });
        return;
      }
      res.send({
        data: user,
        message: user.message || "ok",
        code: user.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while inserting phone.",
      function: "insertuserphone",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error inserting phone.",
    });
  }
});

router.post("/updateaccountinfo", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const user = await users.updateAccountInfo(params, authUser);

      res.send({
        data: user.data,
        message: user.message || "ok",
        code: user.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while updating current user.",
      function: "updateaccountinfo",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error updating current user.",
    });
  }
});

router.post("/deleteaccountinfo", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const user = await users.deleteAccountInfo(params, authUser);

      res.send({
        data: user.data,
        message: user.message || "ok",
        code: user.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while deleting user account data.",
      function: "deleteaccountinfo",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error deleting user account data.",
    });
  }
});

router.post("/checkemailcode", async (req, res) => {
  //Leaving Auth check @ Backend.  Most Secure way to prevent a user  password change.
  try {
    const authUser = await Auth2(req, false, res, true); // allow tempusers
    if (authUser.code === 200) {
      const params = req.body;
      const user = await users.checkEmailCode(params);

      res.send({
        data: user.data,
        message: user.message || "ok",
        token: user.token,
        code: user.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while checking mail code.",
      function: "checkemailcode",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error checking mail code.",
    });
  }
});

router.post("/checktempcode", async (req, res) => {
  //Leaving Auth check @ Backend.  Most Secure way to prevent a user  password change.
  try {
    users.checkTempCode(req, res);
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while checking temp code.",
      function: "checktempcode",
      error_code: 500,
      error_stack: err.stack,
    });
  }
});

router.post("/tempcode", async (req, res) => {
  //Leaving Auth check @ Backend.  Most Secure way to prevent a user  password change.
  try {
    users.sendTempCode(req, res);
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while sending temp code.",
      function: "tempcode",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error sending temp code.",
    });
  }
});

router.post("/tempuser", async (req, res) => {
  //Leaving Auth check @ Backend.  Most Secure way to prevent a user  password change.
  try {
    users.getTempUser(req, res);
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while fetching temp user details.",
      function: "tempuser",
      error_code: 500,
      error_stack: err.stack,
    });
  }
});

router.post("/changepassword", async (req, res) => {
  //Leaving Auth check @ Backend.  Most Secure way to prevent a user  password change.
  try {
    users.changePassword(req, res);
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while changing password.",
      function: "changepassword",
      error_code: 500,
      error_stack: err.stack,
    });
  }
});

router.post("/orgmembers", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const results = await organizations.getOrgMembers(params);
      res.send(results);
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting organization users.",
      function: "orgmembers",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error getting organization users.",
    });
  }
});

router.post("/deletemyuser", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const user = await users.deleteMyUser(params, authUser);

      res.send({
        data: user,
        message: user.message || "ok",
        code: user.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while deleting user.",
      function: "deletemyuser",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error deleting user.",
    });
  }
});

// SENDGRID
router.post("/maileventinvites", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      // function "emailEventInvites()"with do res.send for us
      await events.emailEventInvites(params, authUser, res);
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while sending email.",
      function: "maileventinvites",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error sending email.",
    });
  }
});

// TWILIO SMS
router.post("/texteventinvites", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      // function "emailEventInvites()"with do res.send for us
      await events.textEventInvitees(params, authUser, res);
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while sending text.",
      function: "texteventinvites",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error sending text.",
    });
  }
});

// All other GET requests not handled before will return our React app
router.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../client/build", "index.html"));
});
module.exports = router;

/* VALIDATORS  & INDEXES*/
//PASS THE SCHEMA NAME TO RUN VALIDATOR AGAINST
router.post("/runValidator", async (req, res) => {
  try {
    const authUser = await Auth2(req, (checkRadishAdmin = true), res); // does require Radmin
    if (authUser.code === 200) {
      const params = req.body;

      const validators = await validator.runValidator(params, authUser);

      res.send({
        data: validators,
        message: "ok",
      });
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while running validator.",
      function: "runValidator",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      data: null,
      message: "Error running validator.",
    });
  }
});

router.post("/runindexes", async (req, res) => {
  try {
    const authUser = await Auth2(req, (checkRadishAdmin = true), res); // does require Radmin
    if (authUser.code === 200) {
      const params = req.body;

      const retundata = await validator.runIndexes(params, authUser);

      res.send({
        data: retundata,
        message: retundata.message || "ok",
        code: retundata.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while running indexes.",
      function: "runindexes",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error running indexes.",
    });
  }
});

router.post("/getkeys", async (req, res) => {
  try {
    const authUser = await Auth2(req, (checkRadishAdmin = true), res); // does require Radmin
    if (authUser.code === 200) {
      const params = req.body;

      const retundata = await validator.getKeys(params, authUser);

      res.send({
        data: retundata,
        message: retundata.message || "ok",
        code: retundata.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting keys.",
      function: "getkeys",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error running indexes.",
    });
  }
});

//USED TO RUN AN UPDATE AGAINST DATA.  DO NOT LEAVE DESTRUCTIVE CALLS.
router.post("/runtempupdate", async (req, res) => {
  try {
    const authUser = await Auth2(req, (checkRadishAdmin = true), res); // does require Radmin
    if (authUser.code === 200) {
      const params = req.body;

      const retundata = await validator.runTempUpdate(params, authUser);

      res.send({
        data: retundata,
        message: retundata.message || "ok",
        code: retundata.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while running update.",
      function: "runtempupdate",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error running indexes.",
    });
  }
});

router.post("/mutefriend", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const response = await people.muteFriend(params, authUser);
      res.send({
        data: response.data,
        message: response.message,
        code: response.code,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while muting friend.",
      function: "mutefriend",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error muting friend.",
    });
  }
});

//Route to remove friend from all group lists
router.post("/removeFriend", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const response = await people.removeFriend(params, authUser, res);
      res.send(response);
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while removing friend.",
      function: "removeFriend",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error removing friend.",
    });
  }
});

//Heart or Unheart an organization
router.post("/updateOrgFavorite", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const response = await people.updateOrgFavorite(params, authUser, res);
      res.send(response);
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while updating favorite status.",
      function: "updateOrgFavorite",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error updating favorite status.",
    });
  }
});

//Route to remove org from user profile
router.post("/removeorgforuser", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const response = await people.removeOrgForUser(params, authUser, res);
      res.send(response);
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while removing organization.",
      function: "removeOrgForUser",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error removing organization.",
    });
  }
});

//Route to get nonprofits details
router.post("/getnonprofits", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const response = await people.getNonProfits(params, authUser, res);
      res.send(response);
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while fetching nonprofits details.",
      function: "getnonprofits",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error fetching nonprofits details.",
    });
  }
});

//Route to get nonprofit org details
router.post("/nonprofitorgdetails", async (req, res) => {
  try {
    const id = req.body.id;
    const authUser = await Auth2(req, false, res); // does NOT require Radmin
    if (authUser.code === 200) {
      const organization = await organizations.getOrganization(id, authUser);

      res.send({
        data: organization,
        message: organization.message || "ok",
        code: organization.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while fetching Organization.",
      function: "nonprofitorgdetails",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error fetching Organization.",
    });
  }
});

//Route to get nonprofit details
router.post("/getnonprofitdetails", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const response = await people.getNonprofitDetails(params, authUser, res);
      res.send(response);
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while fetching favorite status.",
      function: "getnonprofitdetails",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error fetching favorite status.",
    });
  }
});

//Route to remove nonprofit from user profile
router.post("/removenonprofitforuser", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const response = await people.removeNonProfitForUser(
        params,
        authUser,
        res
      );
      res.send(response);
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while removing organization.",
      function: "removenonprofitforuser",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error removing organization.",
    });
  }
});

//Heart or Unheart an nonprofit
router.post("/updatenonprofitfavorite", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const response = await people.updateNonprofitFavorite(
        params,
        authUser,
        res
      );
      res.send(response);
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while updating favorite status.",
      function: "updatenonprofitfavorite",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error updating favorite status.",
    });
  }
});

//Route to email authorization code
router.post("/sendauthorizationcode", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      await users.sendAuthorizationCode(params, authUser, res);
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while sending authorization code.",
      function: "sendauthorizationcode",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error sending authorization code.",
    });
  }
});

//Route to add organization to user
router.post("/addorgtouser", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const response = await people.addOrgToUser(params, authUser, res);
      res.send(response);
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while adding organization to the user.",
      function: "addorgtouser",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error while adding organization to the user.",
    });
  }
});

//Route to get event invitations
router.post("/eventinvitations", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    const params = req.body;
    if (authUser.code === 200) {
      const response = await events.getEventInvitations(params, authUser);
      res.send(response);
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while getting event invitations.",
      function: "eventinvitations",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error getting event invitations.",
    });
  }
});

//Route to fetch recommended friends
router.post("/recommendedfriends", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const response = await people.RecommendedFriends(authUser, res);
      res.send(response);
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    console.log(err.stack);
    res.send({
      code: 500,
      message: "Error while fetching recommended friends.",
    });
  }
});

// Write logs into Database
router.post("/writelogsintodb", async (req, res) => {
  try {
    const params = req.body;
    await logger.writeLogsintoDB(params, res);
    res.end();
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while writing logs into DB.",
      function: "writelogsintodb",
      error_code: 500,
      error_stack: err.stack,
    });
  }
});

//Route to get notification preferences
router.post("/getnotificationprefernces/", async (req, res) => {
  try {
    //No auth needed.
    const person_id = req.body.person_id;
    const response = await users.getNotificationPrefernces(person_id, res);
    res.send(response);
  } catch (err) {
    console.log(err.stack);
    res.send({
      code: 500,
      message: "Error getting notification prefernces.",
    });
  }
});

//Route to update notification preferences
router.post("/updatenotificationpreferences", async (req, res) => {
  try {
    //No auth needed.
    const params = req.body;
    const response = await users.updateNotificationPreferences(params, res);
    res.send(response);
  } catch (err) {
    console.log(err.stack);
    res.send({
      code: 500,
      message: "Error while updating user notification preferences.",
    });
  }
});

//Route to fetch recommended friends
router.post("/recommendedfriends", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const response = await people.RecommendedFriends(authUser, res);
      res.send(response);
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while fetching recommended friends.",
      function: "recommendedfriends",
      error_code: 500,
      error_stack: err.stack,
    });
    console.log(err.stack);
    res.send({
      code: 500,
      message: "Error while fetching recommended friends.",
    });
  }
});

//Route to update event attendance
router.post("/updateeventattendance", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const result = await events.updateEventAttendance(params, authUser);
      res.send({
        data: result,
        message: result.message || "ok",
        code: result.code || 200,
      });
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    console.log(err.stack);
    res.send({
      code: 500,
      message: "Error while updating event attendance.",
    });
  }
});

router.post("/dailydigest", async (req, res) => {
  try {
    const authUser = await Auth2(req, true, res); // does require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const personId = params.person_id || "9ccaa9c88a1507830615a3eabc8ae81a";
      const sendEmail = params.sendEmail || false;
      const page = await notifications.getDailyDigest({
        person_id: personId,
        sendEmail: sendEmail,
      });
      res.send({
        page: page,
      });
    }
  } catch (err) {
    console.log(err.stack);
  }
});
router.post("/writeimagefiles", async (req, res) => {
  try {
    const authUser = await Auth2(req, true, res); // does require Radmin
    if (authUser.code === 200) {
      await imageAdmin.writeImageDBFiles();
      res.send({
        message: "ok",
      });
    }
  } catch (err) {
    console.log(err.stack);
  }
});

//Route to update event rating
router.post("/updateeventrating", async (req, res) => {
  try {
    //PUBLIC FUNCTION. NO AUTH NEEDED
    const params = req.body;
    const response = await events.updateEventRating(params);
    res.send(response);
  } catch (err) {
    console.log(err.stack);
    res.send({
      code: 500,
      message: "Error while updating event rating.",
    });
  }
});

// Route to get events to be rated
router.post("/geteventstoberated", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const response = await events.getEventsToBeRated(params, authUser);
      res.send(response);
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while fetching events to be rated.",
      function: "geteventstoberated",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error while fetching events to be rated.",
    });
  }
});

/* Route to check the the given user is friend or not */
router.post("/checkuserisfriendornot", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    if (authUser.code === 200) {
      const params = req.body;
      const response = await people.checkUserIsFriendOrNot(params, authUser);
      res.send(response);
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error while checking the given user is friend or not.",
      function: "checkuserisfriendornot",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      message: "Error while checking the given user is friend or not.",
      code: 500,
    });
  }
});

router.post("/updatehints", async (req, res) => {
  try {
    const authUser = await Auth2(req, false, res); // does not require Radmin
    const params = req.body;
    if (authUser.code === 200) {
      const response = await people.updateHints(params);
      res.send(response);
    } else {
      res.send(authFailResponse(authUser));
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error occurred while updating hints.",
      function: "updatehints",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      code: 500,
      message: "Error occurred while updating hints.",
    });
  }
});
