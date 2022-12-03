const validators = require("./validatorSchema");
const log = require("./logger.js").insertServerLogs;
let validationComplete = false;

async function runValidator(params, authUser) {
  try {
    const validateWhat = params.validator;
    const date = new Date();
    let runMessage = null;
    let myDoc = null;

    switch (validateWhat) {
      case "acceptancelogSchema":
        await db.command({
          collMod: "acceptancelog",
          validator: validators.acceptancelogSchema,
          validationLevel: "moderate",
        });
        runMessage = validateWhat + " validator ran at: " + date;
        break;

      case "badgeSchema":
        await db.command({
          collMod: "badges",
          validator: validators.badgeSchema,
          validationLevel: "moderate",
        });
        runMessage = validateWhat + " validator ran at: " + date;
        break;

      case "causetypeSchema":
        await db.command({
          collMod: "causetypes",
          validator: validators.causetypeSchema,
          validationLevel: "moderate",
        });
        runMessage = validateWhat + " validator ran at: " + date;
        break;

      case "eventSchema":
        await db.command({
          collMod: "events",
          validator: validators.eventSchema,
          validationLevel: "moderate",
        });
        runMessage = validateWhat + " validator ran at: " + date;
        break;

      case "eventpeopleSchema":
        await db.command({
          collMod: "eventpeople",
          validator: validators.eventpeopleSchema,
          validationLevel: "moderate",
        });
        runMessage = validateWhat + " validator ran at: " + date;
        break;

      case "inviteSchema":
        await db.command({
          collMod: "invites",
          validator: validators.invitesSchema,
          validationLevel: "moderate",
        });
        runMessage = validateWhat + " validator ran at: " + date;
        break;

      case "groupSchema":
        await db.command({
          collMod: "groups",
          validator: validators.groupSchema,
          validationLevel: "moderate",
        });
        runMessage = validateWhat + " validator ran at: " + date;
        break;

      case "organizationsSchema":
        await db.command({
          collMod: "organizations",
          validator: validators.organizationsSchema,
          validationLevel: "moderate",
        });
        runMessage = validateWhat + " validator ran at: " + date;
        break;

      case "peopleSchema":
        await db.command({
          collMod: "people",
          validator: validators.peopleSchema,
          validationLevel: "moderate",
        });
        runMessage = validateWhat + " validator ran at: " + date;
        break;

      case "placesSchema":
        await db.command({
          collMod: "places",
          validator: validators.placesSchema,
          validationLevel: "moderate",
        });
        runMessage = validateWhat + " validator ran at: " + date;
        break;

      case "radishadminsSchema":
        await db.command({
          collMod: "radishadmins",
          validator: validators.radishadminsSchema,
          validationLevel: "moderate",
        });
        runMessage = validateWhat + " validator ran at: " + date;
        break;

      default:
        log({
          level: "info", message: "There was not a validator passed I can process", function: "runValidator",
          params: params
        });
        runMessage = "I didn't find a validator for: " + validateWhat;
    }

    if (runMessage) {
      myDoc = runMessage;
    } else {
      myDoc = "There was a problem executing: " + validateWhat;
    }

    return myDoc;
  } catch (err) {
    log({
      level: "error", message: `There was a problem executing: ${params.validator}`, function: "runValidator",
      params: params, error_code: 500, error_stack: err.stack
    });
  }
}

async function runIndexes(params, authUser) {
  try {
    const indexWhat = params.collection;
    const date = new Date();
    let runMessage = null;
    let myDoc = null;
    let collection = null;

    switch (indexWhat) {
      case "acceptancelog":
        collection = db.collection("acceptancelog");
        await collection.dropIndexes();
        await collection.createIndex(
          { invite_id: 1 },
          { unique: true },
          { name: "invite_id" }
        );
        await collection.createIndex(
          { date_created: -1 },
          { name: "date_created" }
        );
        await collection.createIndex({ invited_by: 1 }, { name: "invited_by" });

        runMessage = indexWhat + " indexes ran at: " + date;
        break;

      case "badges":
        collection = db.collection("badges");
        await collection.dropIndexes();
        await collection.createIndex(
          { badge_id: 1 },
          { unique: true },
          { name: "badge_id" }
        );
        await collection.createIndex(
          { badge_name: 1, level: 1 },
          { unique: true },
          { name: "badge_name_and_level" }
        );

        runMessage = indexWhat + " indexes ran at: " + date;
        break;

      case "causetypes":
        collection = db.collection("causetypes");
        await collection.dropIndexes();
        await collection.createIndex(
          { id: 1 },
          { unique: true },
          { name: "id" }
        );
        await collection.createIndex({ type: 1 }, { name: "type" });

        runMessage = indexWhat + " indexes ran at: " + date;
        break;

      case "eventpeople":
        collection = db.collection("eventpeople");
        await collection.dropIndexes();
        await collection.createIndex({ event_id: 1 }, { name: "event_id" });
        await collection.createIndex(
          { eventpeople_id: 1 },
          { unique: true },
          { name: "eventpeople_id" }
        );
        await collection.createIndex(
          { event_id: 1, invited_id: 1 },
          { unique: true },
          { name: "event_id_invited_id" }
        );

        runMessage = indexWhat + " indexes ran at: " + date;
        break;

      case "events":
        collection = db.collection("events");
        await collection.dropIndexes();
        await collection.createIndex(
          { event_id: 1 },
          { unique: true },
          { name: "event_id" }
        );
        await collection.createIndex({ created_by: 1 }, { name: "created_by" });

        runMessage = indexWhat + " indexes ran at: " + date;
        break;

      case "groups":
        collection = db.collection("groups");
        await collection.dropIndexes();
        await collection.createIndex(
          { group_id: 1 },
          { unique: true },
          { name: "group_id" }
        );
        await collection.createIndex({ created_by: 1 }, { name: "created_by" });

        runMessage = indexWhat + " indexes ran at: " + date;
        break;

      case "organizations":
        collection = db.collection("organizations");
        await collection.dropIndexes();
        await collection.createIndex(
          { org_id: 1 },
          { unique: true },
          { name: "org_id" }
        );
        await collection.createIndex({ name: 1 }, { name: "name" });

        runMessage = indexWhat + " indexes ran at: " + date;
        break;

      case "people":
        collection = db.collection("people");
        await collection.dropIndexes();
        await collection.createIndex(
          { person_id: 1 },
          { unique: true },
          { name: "person_id" }
        );
        await collection.createIndex(
          { user_id: 1 },
          { unique: true },
          { name: "user_id" }
        );

        runMessage = indexWhat + " indexes ran at: " + date;
        break;

      case "perks":
        collection = db.collection("perks");
        await collection.dropIndexes();
        await collection.createIndex(
          { organization_id: 1 },
          { name: "organization_id" }
        );

        runMessage = indexWhat + " indexes ran at: " + date;
        break;

      case "places":
        collection = db.collection("places");
        await collection.dropIndexes();
        await collection.createIndex(
          { place_id: 1 },
          { unique: true },
          { name: "place_id" }
        );
        await collection.createIndex({ created_by: 1 }, { name: "created_by" });

        runMessage = indexWhat + " indexes ran at: " + date;
        break;

      default:
        log({
          level: "info", message: "There was not a collection passed I can process", function: "runIndexes",
          params: params
        });
        runMessage = "I didn't find a collection to process for: " + indexWhat;
    }

    if (runMessage) {
      myDoc = runMessage;
    } else {
      myDoc = "There was a problem executing: " + indexWhat;
    }

    return myDoc;
  } catch (err) {
    log({
      level: "error", message: `There was a problem executing: ${params.collection}`, function: "runIndexes",
      params: params, error_code: 500, error_stack: err.stack
    });
  }
}

async function getKeys(auth) {
  try {
    if (auth) {
      let runMessage = null;
      let myDoc = null;

      const client_id = process.env.GKEY1;
      const client_secret = process.env.GKEY2;
      const server = process.env.SERVER_PATH;
      const database = process.env.MONGODB_URI;
      const maps_key = process.env.GMAPS_API_KEY;
      const jwtkey = process.env.JWTID
      /* 
            runMessage =
              "client_id: " +
              client_id +
              " | client_secret: " +
              client_secret +
              " | server/url: " +
              server +
              " | database: " +
              database +
              " | google maps key: " +
              maps_key+
              " | jwt key: " +
              jwtkey; */

      runMessage = "edit code in validator.js to return keys"

      if (runMessage) {
        myDoc = runMessage;
      } else {
        myDoc = "There was a problem getting keys";
      }

      return myDoc;
    } else {
      myDoc = "YOU ARE NOT AUTHORIZED TO PERFORM THIS ACTION";
      return myDoc;
    }
  } catch (err) {
    log({
      level: "error", message: `There was a problem getting keys`, function: "getKeys", error_code: 500, error_stack: err.stack
    });
  }
}

//USED TO RUN AN UPDATE AGAINST DATA.  DO NOT LEAVE DESTRUCTIVE CALLS.
async function runTempUpdate(auth) {
  try {
    if (auth) {
      let runMessage = null;
      let myDoc = null;

      //UPDATE EVENTS TO CHANGE FROM GOOGLE_ID TO PLACE_ID AND TYPE
      const collection = db.collection("images");
      myDoc = await collection
        .updateMany(
          {image_id: {$ne: null}},
          {
            $set: {
              version: 1,
            },
          },
        );


      runMessage = "done";
      runMessage = "NO UPDATE CODE ENABLED.  EDIT validator.js.";

      if (runMessage) {
        myDoc = runMessage;
      } else {
        myDoc = "There was a problem running update";
      }

      return myDoc;
    } else {
      myDoc = "YOU ARE NOT AUTHORIZED TO PERFORM THIS ACTION";
      return myDoc;
    }
  } catch (err) {
    log({
      level: "error", message: `There was a problem running update`, function: "runTempUpdate", error_code: 500, error_stack: err.stack
    });
  }
}

module.exports = {
  runValidator,
  runIndexes,
  getKeys,
  runTempUpdate,
};
