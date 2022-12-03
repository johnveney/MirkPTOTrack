const crypto = require("crypto");
const mongodb = require("mongodb");
const log = require("./logger.js").insertServerLogs;
const sendgrid = require("./sendgrid.js");

async function validateOrgAdmin(orgID, authUser, checkRadishAdmin) {
  try {
    let authorized = false;

    if (checkRadishAdmin) {
      const admins = db.collection("radishadmins");
      //check to make sure the userid exists in the radmin table, and their record isn't date_deleted true.
      const isAdminUser = await admins.findOne({
        admin_id: authUser.data.person_id,
        date_deleted: null,
      });
      if (isAdminUser) {
        authorized = true;
      }
    }
    let orgs = authUser.data.organizations || [];
    for (let i = 0; i < orgs.length; i++) {
      if (orgs[i].org_id === orgID && orgs[i].admin) {
        authorized = true;
      }
    }

    return authorized;
  } catch (error) {
    log({
      level: "error",
      message: `Error while validating org admin, orgID: ${orgID}.`,
      function: "validateOrgAdmin",
      error_code: 500,
      error_stack: error.stack,
    });
    return false;
  }
}

async function getOrganizations(params, authUser) {
  try {
    const collection = db.collection("organizations");
    let myKey = params.myKey; // the field we're filtering on
    let myFilter = params.myFilter; // the values we're matching on
    var response = {};
    //TEST TO MAKE SURE THERE IS A FILTER IF YOU ARE NOT A RADMIN (CAN'T JUST RETURN ALL ORGS)
    if (!authUser.isRadishAdmin) {
      if (!myFilter || myFilter.length === 0) {
        const returnData = "You must pass a filter when you are not a Radmin";
        response = {
          code: 403,
          data: null,
          message: returnData,
        };
        return response;
      }
    }

    let query = null;
    let project = null;
    if (myKey && myFilter) {
      query = {
        [myKey]: { $in: myFilter },
        date_deleted: null, //PREVENT RETURNING DELETED ORGS
      };
    }

    let fetchFields = params.fetchFields; // the fields to return (project)
    if (fetchFields) {
      // should we have a project
      project = fetchFields;
    }

    const myDoc = await collection
      .find(query ? query : null)
      .project(project)
      .sort({ name: 1 })
      .toArray();

    response = {
      code: 200,
      data: myDoc,
      message: "success",
    };
    return response;
  } catch (err) {
    log({
      level: "error",
      message: "Error while fetching organizations.",
      function: "getOrganizations",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    response = {
      code: 500,
      data: null,
      message: "failure",
    };
    return response;
  }
}

async function getNPOrganizations(params, authUser) {
  try {
    const collection = db.collection("organizations");
    let myKey = params.myKey; // the field we're filtering on
    let myFilter = params.myFilter; // the values we're matching on
    //TEST TO MAKE SURE THERE IS A FILTER IF YOU ARE NOT A RADMIN (CAN'T JUST RETURN ALL ORGS)
    if (!authUser.isRadishAdmin) {
      if (!myFilter || myFilter.length === 0) {
        const returnData = "You must pass a filter when you are not a Radmin";
        return returnData;
      }
    }

    let query = null;
    let project = null;
    if (myKey && myFilter) {
      query = {
        [myKey]: { $in: myFilter },
        date_deleted: null, //PREVENT RETURNING DELETED ORGS
      };
    }

    let fetchFields = params.fetchFields; // the fields to return (project)
    if (fetchFields) {
      // should we have a project
      project = fetchFields;
    }

    const myDoc = await collection
      .aggregate([
        {
          /*  $match: {
            query,
          }, */
          $match: {
            org_id: {
              $in: [
                "f503dd64369e5d310689e2060a469a91",
                "6ea045f294140e88501d6f90de9d1494",
                "d020ed5d569acc2e7bd943151704a4b8",
                "d59e712c7e4a038864967553a7de4d13",
              ],
            },
            date_deleted: null,
          },
        },
        {
          $lookup: {
            from: "causetypes",
            localField: "np_specific.cause",
            foreignField: "type",
            as: "causetypes",
          },
        },
        {
          /* $project: project, */
          $project: project,
        },
        {
          $sort: { name: 1.0 },
        },
      ])
      .toArray();

    return myDoc;
  } catch (err) {
    log({
      level: "error",
      message: "Error while fetching nonprofit organizations.",
      function: "getNPOrganizations",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function getMyAdminOrg(params, authUser) {
  try {
    const orgID = params.org_id;
    let authorized = await validateOrgAdmin(orgID, authUser, true);
    if (authorized) {
      const collection = db.collection("organizations");
      const myDoc = await collection.findOne(
        { org_id: orgID },
        {
          projection: {
            org_id: 1,
            name: 1,
            address1: 1,
            address2: 1,
            city: 1,
            state: 1,
            postal_code: 1,
            website: 1,
            country: 1,
            image: 1,
            image_full: 1,
            enforce_domains: 1,
            domains: 1,
            employer: 1,
            nonprofit: 1,
            venue: 1,
            emp_specific: 1,
            np_specific: 1,
            vend_specific: 1,
          },
        }
      );
      return {
        data: myDoc,
        message: "ok",
        code: 200,
      };
    } else {
      return {
        message: "Error retrieving myAdminOrg",
        code: 500,
      };
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error while fetching my admin org.",
      function: "getMyAdminOrg",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function getMyAdminOrgs(authUser) {
  try {
    let orgIDs = [];
    let orgs = authUser.data.organizations || [];
    for (let i = 0; i < orgs.length; i++) {
      if (!orgs[i].date_deleted) {
        // EXCLUDE ORGS I I HAVE LEFT
        if (orgs[i].admin) {
          orgIDs.push(orgs[i].org_id);
        }
      }
    }
    if (orgIDs.length > 0) {
      const collection = db.collection("organizations");

      const myDoc = await collection
        .find({ org_id: { $in: orgIDs }, date_deleted: null })
        .project({
          org_id: 1,
          name: 1,
          city: 1,
          state: 1,
          country: 1,
          image: 1,
          enforce_domains: 1,
          domains: 1,
          employer: 1,
          nonprofit: 1,
          venue: 1,
        })
        .sort({ name: 1 })
        .toArray();
      return {
        data: myDoc,
        message: "ok",
        code: 200,
      };
    } else {
      return {
        message: "No organizations found.",
        code: 200,
      };
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error while fetching my admin orgs.",
      function: "getMyAdminOrgs",
      params: authUser.data,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function getOrgInvitation(params) {
  // public consumption no auth
  try {
    const orgID = params.org_id;
    const collection = db.collection("organizations");
    const myOrg = await collection.findOne(
      { org_id: orgID },
      {
        projection: {
          org_id: 1,
          name: 1,
          city: 1,
          state: 1,
          country: 1,
          enforce_domains: 1,
          domains: 1,
          image: 1,
        },
      }
    );
    return myOrg;
  } catch (err) {
    log({
      level: "error",
      message: "Error while fetching org invitation.",
      function: "getOrgInvitation",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function getOrganization(id, authUser, nameOnly) {
  // retrieves flat org w/out extended sub-document details
  try {
    const collection = db.collection("organizations");
    let myDoc = null;
    let query = {
      org_id: id,
      date_deleted: null,
    };
    if (nameOnly) {
      myDoc = await collection.findOne(query, { $projection: { name: 1 } });
      if (myDoc) {
        return myDoc.name;
      } else {
        return "org not found"; //NOTE: this specific text is used elsewhere to determine that the org is not being returned.
      }
    } else {
      myDoc = await collection.findOne(query);
      return myDoc;
    }
  } catch (err) {
    log({
      level: "error",
      message: `Error while fetching organization, id: ${id}.`,
      function: "getOrganization",
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function updateOrgLogos(params, auth) {
  try {
    const date = new Date();
    const orgID = params.org_id;
    const authorized = await validateOrgAdmin(orgID, auth, true);
    if (authorized) {
      const collection = db.collection("organizations");

      let fieldArray = {};
      const img = params.image;
      const img_full = params.image_full;
      //Add the Modified information to db
      fieldArray = {
        ...fieldArray,
        date_modified: date,
        modified_by: auth.data.person_id,
      };
      if (img) {
        fieldArray = {
          ...fieldArray,
          image: img,
        };
      }
      if (img_full) {
        fieldArray = {
          ...fieldArray,
          image_full: img_full,
        };
      }
      await collection.updateOne(
        { org_id: orgID },
        {
          $set: fieldArray,
        }
      );
      const orgData = await getMyAdminOrg(params, auth);

      return {
        data: orgData,
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
      message: "Error while updating org logos.",
      function: "updateOrgLogos",
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

async function insertOrganization(params, auth) {
  const cid = crypto.randomBytes(16).toString("hex");

  try {
    const date = new Date();
    const orgID = cid;

    let fieldArray = {
      org_id: orgID,
      name: params.name,
      employer: params.employer ? params.employer : false,
      nonprofit: params.nonprofit ? params.nonprofit : false,
      venue: params.venue ? params.venue : false,
      date_created: date,
      created_by: auth.data.person_id,
      date_modified: date,
      modified_by: auth.data.person_id,
    };

    if (params.address1) {
      fieldArray = {
        ...fieldArray,
        address1: params.address1,
      };
    }
    if (params.address2) {
      fieldArray = {
        ...fieldArray,
        address2: params.address2,
      };
    }
    if (params.city) {
      fieldArray = {
        ...fieldArray,
        city: params.city,
      };
    }
    if (params.state) {
      fieldArray = {
        ...fieldArray,
        state: params.state,
      };
    }
    if (params.postal_code) {
      fieldArray = {
        ...fieldArray,
        postal_code: params.postal_code,
      };
    }
    if (params.country) {
      fieldArray = {
        ...fieldArray,
        country: params.country,
      };
    }
    if (params.website) {
      fieldArray = {
        ...fieldArray,
        website: params.website,
      };
    }

    const img = params.image;
    const img_full = params.image_full;
    if (img) {
      fieldArray = {
        ...fieldArray,
        image: img,
      };
    }
    if (img_full) {
      fieldArray = {
        ...fieldArray,
        image_full: img_full,
      };
    }

    const collection = db.collection("organizations");
    await collection.insertOne(fieldArray, { runValidators: true });

    const myDoc = await collection.findOne({ org_id: orgID });
    if (myDoc) {
      // SEND EMAIL
      const emailParams = {
        to: ["support@radishapp.io"],
        from: "RadishApp <info@radishapp.io>",
        subject: "New Organization Added",
        emailBody: `New Organization Added`,
        emailTemplate: "addOrgConfirm",
        type: "email",
        moduleName: "addOrgConfirm",
        user_id: auth.data.user_id,
        first_name: auth.data.first_name,
        last_name: auth.data.last_name,
        org_name: params.name,
        org_id: orgID,
        date_created: date,
        peopleIds: [auth.data.person_id],
      };
      await sendgrid.sendMyMail(emailParams, async (resp) => {
        if (resp.code === 202) {
          log({
            level: "debug",
            message:
              "New organization added information email generated successfully.",
            function: "insertOrganization",
          });
        } else {
          log({
            level: "error",
            message:
              "Error while generating new organization added information email.",
            function: "insertOrganization",
            error_code: resp.code,
            error_stack: resp,
          });
        }
      });
    }
    return myDoc;
  } catch (err) {
    log({
      level: "error",
      message: "Error while inserting organization.",
      function: "insertOrganization",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function updateOrganization(params, auth) {
  try {
    const date = new Date();
    const orgID = params.org_id;
    const authorized = await validateOrgAdmin(orgID, auth, true);
    if (authorized) {
      let unFieldArray;
      let fieldArray = {
        name: params.name,
        employer: params.employer ? params.employer : false,
        nonprofit: params.nonprofit ? params.nonprofit : false,
        venue: params.venue ? params.venue : false,
        date_modified: date,
        modified_by: auth.data.person_id,
      };

      if (params.address1) {
        fieldArray = {
          ...fieldArray,
          address1: params.address1,
        };
      } else {
        unFieldArray = {
          ...unFieldArray,
          address1: "",
        };
      }
      if (params.address2) {
        fieldArray = {
          ...fieldArray,
          address2: params.address2,
        };
      } else {
        unFieldArray = {
          ...unFieldArray,
          address2: "",
        };
      }
      if (params.city) {
        fieldArray = {
          ...fieldArray,
          city: params.city,
        };
      } else {
        unFieldArray = {
          ...unFieldArray,
          city: "",
        };
      }

      if (params.state) {
        fieldArray = {
          ...fieldArray,
          state: params.state,
        };
      } else {
        unFieldArray = {
          ...unFieldArray,
          state: "",
        };
      }

      if (params.postal_code) {
        fieldArray = {
          ...fieldArray,
          postal_code: params.postal_code,
        };
      } else {
        unFieldArray = {
          ...unFieldArray,
          postal_code: "",
        };
      }

      if (params.country) {
        fieldArray = {
          ...fieldArray,
          country: params.country,
        };
      } else {
        unFieldArray = {
          ...unFieldArray,
          country: "",
        };
      }

      if (params.website) {
        fieldArray = {
          ...fieldArray,
          website: params.website,
        };
      } else {
        unFieldArray = {
          ...unFieldArray,
          website: "",
        };
      }
      if (params.emp_specific) {
        let empSpecific = params.emp_specific;
        empSpecific.max_event_total_match = mongodb.Decimal128.fromString(
          empSpecific.max_event_total_match || "0"
        );
        empSpecific.max_person_match = mongodb.Decimal128.fromString(
          empSpecific.max_person_match || "0"
        );
        empSpecific.std_person_match = mongodb.Decimal128.fromString(
          empSpecific.std_person_match || "0"
        );
        empSpecific.min_participation = mongodb.Decimal128.fromString(
          empSpecific.min_participation || "0"
        );
        fieldArray = {
          ...fieldArray,
          emp_specific: empSpecific,
        };
      }

      if (params.np_specific) {
        fieldArray = {
          ...fieldArray,
          np_specific: params.np_specific,
        };
      }
      if (params.vend_specific) {
        fieldArray = {
          ...fieldArray,
          vend_specific: params.vend_specific,
        };
      }
      const collection = db.collection("organizations");
      const setArray = { $set: fieldArray };

      await collection.updateOne({ org_id: orgID }, setArray, {
        runValidators: true,
      }); //update the fields that get values
      if (unFieldArray) {
        const unsetArray = { $unset: unFieldArray };
        await collection.updateOne({ org_id: orgID }, unsetArray); //remove any fields being set to null.  Needed because validator won't allow setting null on a string/date field.
      }

      const myDoc = await collection.findOne({ org_id: orgID });
      return myDoc;
    } else {
      return "unauthorized";
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error while updating organization.",
      function: "updateOrganization",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

async function updateOrgDomains(params, authUser) {
  try {
    const date = new Date();
    const orgID = params.org_id;
    let authroized = await validateOrgAdmin(orgID, authUser, true);
    const enforce = params.enforce_domains || false;

    if (authroized) {
      let fieldArray = {
        date_modified: date,
        modified_by: authUser.data.person_id,
        enforce_domains: enforce,
      };
      if (params.domains) {
        fieldArray = {
          ...fieldArray,
          domains: params.domains,
        };
      }

      const collection = db.collection("organizations");
      await collection.updateOne(
        { org_id: orgID },
        {
          $set: fieldArray,
        },
        { runValidators: true }
      );

      const myDoc = await collection.findOne(
        { org_id: orgID },
        {
          projection: {
            org_id: 1,
            name: 1,
            city: 1,
            state: 1,
            country: 1,
            image: 1,
            enforce_domains: 1,
            domains: 1,
          },
        }
      );

      return myDoc;
    } else {
      return null;
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error while updating org domains.",
      function: "updateOrgDomains",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    return {
      data: null,
      message: err.message,
    };
  }
}

async function updateOrgTypes(params, auth) {
  try {
    const date = new Date();

    const orgID = params.org_id;
    let fieldArray = {
      type_tags: params.type_tags,
      date_modified: date,
      modified_by: auth.data.person_id,
    };
    const collection = db.collection("organizations");

    await collection.updateOne(
      { org_id: orgID },
      {
        $set: fieldArray,
      },
      { runValidators: true }
    );

    const myDoc = await collection
      .find({ org_id: orgID })
      .project({
        name: 1,
        type_tags: 1,
      })
      .toArray();
    return {
      data: myDoc,
      message: "ok",
    };
  } catch (err) {
    log({
      level: "error",
      message: "Error while updating org types.",
      function: "updateOrgTypes",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    return {
      data: null,
      message: err.message,
    };
  }
}

async function getOrganizationExtended(id) {
  // retrieves org with extended sub-document details
  try {
    const collection = db.collection("organizations");
    const mydoc = await collection
      .aggregate([
        {
          $match: { org_id: { $eq: id } },
        },
      ])
      .toArray();

    return {
      data: mydoc,
      message: "ok",
    };
  } catch (err) {
    log({
      level: "error",
      message: `Error while getting organization extended, id: ${id}.`,
      function: "getOrganizationExtended",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      data: null,
      message: err.message,
    });
  }
}

async function getOrganizationProfile(id) {
  // retrieves org with extended sub-document details used on Org Profile Card (ie: from mystuff)
  // nonprofits is retrieved in a second run because it is faster than unwinding.  Just returns the orgs(nonprofits) we need based on the parent.
  try {
    //GET THE ORG PROFILE DATA
    let mydoc1 = null;
    const collection = db.collection("organizations");
    const mydoc = await collection
      .aggregate([
        {
          $match: { org_id: { $eq: id } },
        },
        {
          $project: {
            org_id: 1.0,
            name: 1.0,
            city: 1.0,
            state: 1.0,
            country: 1.0,
            image: 1.0,
            website: 1.0,
            znonprofits: "$nonprofits",
          },
        },
      ])
      .toArray();

    //PROCESS FOR NONPROFITS
    let aNonprofits = [];
    if (mydoc[0].znonprofits) {
      for (let i = 0; i < mydoc[0].znonprofits.length; i++) {
        //only push nonprofits org still follows
        if (!mydoc[0].znonprofits[i].date_deleted) {
          aNonprofits.push(mydoc[0].znonprofits[i].org_id);
        }
      }
    }

    if (aNonprofits.length > 0) {
      //FETCH THE NONPROFITS
      mydoc1 = await collection
        .aggregate([
          {
            $match: {
              org_id: { $in: aNonprofits },
            },
          },
          {
            $match: {
              date_deleted: null,
            },
          },
          {
            $project: {
              org_id: 1.0,
              name: 1.0,
              city: 1.0,
              state: 1.0,
              country: 1.0,
              image: 1.0,
              website: 1.0,
            },
          },
        ])
        .toArray();
    }

    if (mydoc1) {
      //Add nonprofit info to org info array.
      mydoc[0].nonprofit_info = mydoc1;
    }

    return {
      data: mydoc,
      message: "ok",
    };
  } catch (err) {
    log({
      level: "error",
      message: `Error while fetching organization profile, id: ${id}.`,
      function: "getOrganizationProfile",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      data: null,
      message: err.message,
    });
  }
}

async function getOrgMembers(params) {
  // fetches people who claim to to follow a specific org.
  try {
    const orgid = params.id;
    const handsOnly = params.handsOnly;
    const limit = params.limit || 100;

    let matchArray = {
      date_deleted: null,
      "organizations.org_id": orgid,
      "organizations.date_deleted": null,
    };
    if (handsOnly) {
      matchArray = {
        ...matchArray,
        open_dates: { $ne: null },
      };
    }

    const aggregateArray = [
      {
        $match: matchArray,
      },
      {
        $unwind: {
          path: "$organizations",
        },
      },
      {
        $match: {
          "organizations.org_id": orgid,
          "organizations.date_deleted": null,
        },
      },
      {
        $project: {
          person_id: 1,
          first_name: 1,
          last_name: 1,
          image: 1,
          last_active: 1,
          open_dates: 1,
          hands_tz: 1,
          see_hand: 1,
          admin: "$organizations.admin",
          favorite: "$organizations.favorite",
        },
      },
      {
        $sort: {
          first_name: 1,
          last_name: 1,
        },
      },
    ];

    const collection = db.collection("people");
    const count = await collection.countDocuments(matchArray);

    const mydoc = await collection
      .aggregate(aggregateArray)
      .limit(limit)
      .toArray();

    return {
      data: mydoc,
      count: count,
      message: "ok",
      code: 200,
    };
  } catch (err) {
    log({
      level: "error",
      message: `Error while fetching organization members, params: ${params}.`,
      function: "getOrgMembers",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      data: null,
      message: err.message,
      code: 500,
    });
  }
}

async function getOrgTypeTags(params, authUser) {
  try {
    const collection = db.collection("organizations");
    const myDoc = await collection.distinct("type_tags", {});
    return {
      data: myDoc,
      message: "ok",
    };
  } catch (err) {
    log({
      level: "error",
      message: "Error while fetching org type tags.",
      function: "getOrgTypeTags",
      error_code: 500,
      error_stack: err.stack,
    });
    res.send({
      data: null,
      message: err.message,
    });
  }
}

/* async function createGroups() {
  db.createCollection("groups", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["group_id", "group_name", "created_by"],
        properties: {
          group_id: {
            bsonType: "string",
            description: "must be a string and is required",
          },
          group_name: {
            bsonType: "string",
            description: "must be a string and is required",
          },
          group_description: {
            bsonType: "string",
            description: "must be a string",
          },
          created_by: {
            bsonType: "string",
            description: "must be a string and is required",
          },
          date_created: {
            bsonType: "date",
            description: "must be a date and is required",
          },
          everyone_add_friends: {
            bsonType: "bool",
            description: "must be a bool",
          },
          everyone_add_event: {
            bsonType: "bool",
            description: "must be a bool",
          },
          org_id: {
            bsonType: "string",
            description: "must be a string",
          },
          everyone_add_event: {
            bsonType: "bool",
            description: "must be a bool",
          },
        }
      }

    }
  })
} */

async function getNonDeletedOrganizations(orgIds) {
  try {
    const collection = db.collection("organizations");
    const query = {
      org_id: { $in: orgIds },
      date_deleted: null,
    };
    const orgDetails = await collection.find(query).sort({ name: 1 }).toArray();
    return orgDetails;
  } catch (err) {
    log({
      level: "error",
      message: "Error while fetching non-deleted orgs.",
      function: "getNonDeletedOrganizations",
      params: orgIds,
      error_code: 500,
      error_stack: err.stack,
    });
    return null;
  }
}

async function cleanUserOrgs(person, orgId) {
  try {
    let myOrgs = [];
    let myCleanOrgs = [];
    let tempReturnBool = false;
    if (person.organizations) {
      for (let i = 0; i < person.organizations.length; i++) {
        //MAKE SURE USER IS STILL A MEMBER OF THIS Organization (person.organizations)
        if (!person.organizations[i].date_deleted) {
          myOrgs.push(person.organizations[i].org_id);
        }
      }

      const nonDeletedOrgs = await getNonDeletedOrganizations(myOrgs);

      //  RETURN ARRAY OF CURRENT ORG ID's FOR USER
      for (let i = 0; i < nonDeletedOrgs.length; i++) {
        if (orgId) {
          if (nonDeletedOrgs[i].org_id === orgId) {
            tempReturnBool = true;
          }
        }
        myCleanOrgs.push(nonDeletedOrgs[i].org_id);
      }
    }
    if (orgId) {
      return tempReturnBool;
    } else {
      return myCleanOrgs;
    }
  } catch (err) {
    log({
      level: "error",
      message: "Error while cleaning user orgs.",
      function: "cleanUserOrgs",
      params: person,
      error_code: 500,
      error_stack: err.stack,
    });
  }
}

module.exports = {
  validateOrgAdmin,
  getOrganization,
  getOrganizations,
  getNPOrganizations,
  getMyAdminOrg,
  getMyAdminOrgs,
  getOrganizationExtended,
  getOrganizationProfile,
  updateOrganization,
  insertOrganization,
  updateOrgLogos,
  updateOrgTypes,
  getOrgTypeTags,
  getOrgMembers,
  updateOrgDomains,
  getOrgInvitation,
  getNonDeletedOrganizations,
  cleanUserOrgs,
};
