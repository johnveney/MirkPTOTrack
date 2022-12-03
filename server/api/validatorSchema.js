const acceptancelogSchema = {
  $jsonSchema: {
    bsonType: "object",
    required: [
      "invite_id",
      "invite_type",
      "invited_by",
      "date_created",
      "date_accepted",
    ],
    properties: {
      invite_id: {
        bsonType: "string",
        description: "must be a string and is required",
      },
      invite_type: {
        bsonType: "string",
        description: "must be a string and is required",
      },
      invited_by: {
        bsonType: "string",
        description: "must be a string, and is required",
      },
      date_created: {
        bsonType: "date",
        description: "must be a date and is required",
      },
      date_accepted: {
        bsonType: "date",
        description: "must be a date and is required",
      },
      group_id: {
        bsonType: "string",
        description: "must be a string",
      },
      event_id: {
        bsonType: "string",
        description: "must be a string",
      },
      date_deleted: {
        bsonType: "date",
        description: "must be a date",
      },
      deleted_by: {
        bsonType: "string",
        description: "must be a string",
      },
    },
  },
};

const badgeSchema = {
  $jsonSchema: {
    bsonType: "object",
    required: [
      "badge_id",
      "badge_name",
      "level",
      "badge_image",
      "created_by",
      "created_date",
    ],
    properties: {
      badge_id: {
        bsonType: "string",
        description: "must be a string and is required",
      },
      badge_name: {
        bsonType: "string",
        description: "must be a string and is required",
      },
      badge_description: {
        bsonType: "string",
        description: "must be a string",
      },
      badge_image: {
        bsonType: "string",
        description: "must be a string and is required",
      },
      badge_image_large: {
        bsonType: "string",
        description: "must be a string",
      },
      level: {
        bsonType: "string",
        description: "must be a string",
      },
      created_by: {
        bsonType: "string",
        description: "must be a string and is required",
      },
      created_date: {
        bsonType: "date",
        description: "must be a date and is required",
      },
      date_deleted: {
        bsonType: "date",
        description: "must be a date",
      },
      deleted_by: {
        bsonType: "string",
        description: "must be a string",
      },
      date_modified: {
        bsonType: "date",
        description: "must be a date",
      },
      modified_by: {
        bsonType: "string",
        description: "must be a string",
      },
    },
  },
};

const causetypeSchema = {
  $jsonSchema: {
    bsonType: "object",
    required: ["id", "type", "cause_image", "created_by", "created_date"],
    properties: {
      id: {
        bsonType: "string",
        description: "must be a string and is required",
      },
      type: {
        bsonType: "string",
        description: "must be a string and is required",
      },
      cause_image: {
        bsonType: "string",
        description: "must be a string and is required",
      },
      created_by: {
        bsonType: "string",
        description: "must be a string and is required",
      },
      created_date: {
        bsonType: "date",
        description: "must be a date and is required",
      },
      date_deleted: {
        bsonType: "date",
        description: "must be a date",
      },
      deleted_by: {
        bsonType: "string",
        description: "must be a string",
      },
      date_modified: {
        bsonType: "date",
        description: "must be a date",
      },
      modified_by: {
        bsonType: "string",
        description: "must be a string",
      },
    },
  },
};

const eventSchema = {
  $jsonSchema: {
    bsonType: "object",
    required: ["event_id", "event_name", "created_by", "date_created"],
    properties: {
      event_id: {
        bsonType: "string",
        description: "must be a string and is required",
      },
      event_name: {
        bsonType: "string",
        description: "must be a string and is required",
      },
      created_by: {
        bsonType: "string",
        description: "must be a string and is required",
      },
      date_created: {
        bsonType: "date",
        description: "must be a date and is required",
      },
      date_deleted: {
        bsonType: "date",
        description: "must be a date",
      },
      deleted_by: {
        bsonType: "string",
        description: "must be a string",
      },
      date_modified: {
        bsonType: "date",
        description: "must be a date",
      },
      modified_by: {
        bsonType: "string",
        description: "must be a string",
      },
      proposed_date1: {
        bsonType: "date",
        description: "must be a date",
      },
      proposed_date2: {
        bsonType: "date",
        description: "must be a date",
      },
      proposed_general1: {
        bsonType: "string",
        description: "must be a string",
      },
      proposed_general2: {
        bsonType: "string",
        description: "must be a string",
      },
      proposed_time1: {
        bsonType: "string",
        description: "must be a string",
      },
      proposed_time2: {
        bsonType: "string",
        description: "must be a string",
      },
      proposed_place1_type: {
        bsonType: "string",
        description: "must be a string - custom or google",
      },
      proposed_place2_type: {
        bsonType: "string",
        description: "must be a string - custom or google",
      },
      proposed_place_id1: {
        bsonType: "string",
        description: "must be a string",
      },
      proposed_place_id2: {
        bsonType: "string",
        description: "must be a string",
      },
      proposed_place_id2: {
        bsonType: "string",
        description: "must be a string",
      },
      attendee_limit: {
        bsonType: "string",
        description: "must be a string",
      },
      rsvp_deadline: {
        bsonType: "date",
        description: "must be a date",
      },
      final_start_date: {
        bsonType: "date",
        description: "must be a date",
      },
      final_end_date: {
        bsonType: "date",
        description: "must be a date",
      },
      final_place_id: {
        bsonType: "string",
        description: "must be a string",
      },
      final_place_type: {
        bsonType: "string",
        description: "must be a string - custom or google",
      },
    },
  },
};

const eventpeopleSchema = {
  $jsonSchema: {
    bsonType: "object",
    required: [
      "event_id",
      "eventpeople_id",
      "invited_id",
      "inviter_id",
      "created_by",
      "date_created",
    ],
    properties: {
      event_id: {
        bsonType: "string",
        description: "must be a string and is required",
      },
      eventpeople_id: {
        bsonType: "string",
        description: "must be a string and is required",
      },
      invited_id: {
        bsonType: "string",
        description: "must be a string and is required",
      },
      inviter_id: {
        bsonType: "string",
        description: "must be a string and is required",
      },
      created_by: {
        bsonType: "string",
        description: "must be a string and is required",
      },
      date_created: {
        bsonType: "date",
        description: "must be a date and is required",
      },
      date_deleted: {
        bsonType: "date",
        description: "must be a date",
      },
      deleted_by: {
        bsonType: "string",
        description: "must be a string",
      },
      date_modified: {
        bsonType: "date",
        description: "must be a date",
      },
      modified_by: {
        bsonType: "string",
        description: "must be a string",
      },
      date_preference: {
        bsonType: "string",
        description: "must be a string",
      },
      place_preference: {
        bsonType: "string",
        description: "must be a string",
      },
      rsvp_status: {
        bsonType: "string",
        description: "must be a string",
      },
    },
  },
};

const groupSchema = {
  $jsonSchema: {
    bsonType: "object",
    required: ["group_id", "group_name", "created_by", "date_created"],
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
      everyone_add_friends: {
        bsonType: "bool",
        description: "must be a bool",
      },
      everyone_add_events: {
        bsonType: "bool",
        description: "must be a bool",
      },
      can_join: {
        bsonType: "string",
        description: "must be a string",
      },
      org_id: {
        bsonType: "string",
        description: "must be a string",
      },
      discoverability: {
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
      date_deleted: {
        bsonType: "date",
        description: "must be a date",
      },
      deleted_by: {
        bsonType: "string",
        description: "must be a string",
      },
      date_modified: {
        bsonType: "date",
        description: "must be a date",
      },
      modified_by: {
        bsonType: "string",
        description: "must be a string",
      },
      user_default: {
        bsonType: "bool",
        description: "must be a bool",
      },
    },
  },
};

const invitesSchema = {
  $jsonSchema: {
    bsonType: "object",
    required: ["invite_id", "invite_type", "invited_by", "date_accepted"],
    properties: {
      date_accepted: {
        bsonType: "date",
        description: "must be a date and is required",
      },
      date_created: {
        bsonType: "date",
        description: "must be a date and is required",
      },
      invite_id: {
        bsonType: "string",
        description: "must be a string and is required",
      },
      invite_type: {
        bsonType: "string",
        description: "must be a string and is required",
      },
      invited_by: {
        bsonType: "string",
        description: "must be a string and is required",
      },
    },
  },
};

const peopleSchema = {
  $jsonSchema: {
    bsonType: "object",
    required: ["person_id", "first_name", "date_created", "created_by"],
    properties: {
      person_id: {
        bsonType: "string",
        description: "must be a string and is required",
      },
      first_name: {
        bsonType: "string",
        description: "must be a string and is required",
        minLength: 1,
      },
      last_name: {
        bsonType: "string",
        description: "must be a string",
      },
      emails: {
        bsonType: "array",
        required: ["email"],
        properties: {
          email: {
            bsonType: "string",
            description: "must be a string and is required",
          },
          type: {
            bsonType: "string",
            description: "can only be string",
          },
          primary: {
            bsonType: "bool",
            description: "can only be bool",
          },
          date_validated: {
            bsonType: "date",
            description: "can only be date",
          },
        },
      },
      display_name: {
        bsonType: "string",
        description: "must be a string",
      },
      title: {
        bsonType: "string",
        description: "must be a string",
      },

      phones: {
        bsonType: "array",
        required: ["phone"],
        properties: {
          phone: {
            bsonType: "string",
            description: "must be a string and is required",
          },
          type: {
            bsonType: "array",
            description: "can only be string",
          },
          primary: {
            bsonType: "bool",
            description: "can only be bool",
          },
        },
      },
      invite_link: {
        bsonType: "string",
        description: "must be a string",
      },
      primary_location: {
        bsonType: "string",
        description: "must be a string",
      },
      default_coordinates: {
        bsonType: "string",
        description: "must be a string",
      },
      location_services: {
        bsonType: "string",
        description: "must be a string",
      },
      gem_bank: {
        bsonType: "int",
        description: "must be a integer",
      },
      xp_bank: {
        bsonType: "int",
        description: "must be a integer",
      },
      referral_code: {
        bsonType: "string",
        description: "must be a string",
      },
      digest_preferences: {
        bsonType: "object",
      },
      allowed_access_to_friends: {
        bsonType: "bool",
        description: "must be a bool",
      },
      onboarding_last_presented: {
        bsonType: "date",
        description: "must be a date",
      },
      splashloader_last_presented: {
        bsonType: "date",
        description: "must be a date",
      },
      updates_last_presented: {
        bsonType: "date",
        description: "must be a date",
      },
      groups: {
        bsonType: "array",
        required: ["group_id"],
        properties: {
          group_id: {
            bsonType: "string",
            description: "must be a string and is required",
          },
          date_added: {
            bsonType: "date",
            description: "must be a date",
          },
          role: {
            bsonType: "string",
            description: "can only be a string",
          },
          added_by: {
            bsonType: "string",
            description: "can only be string relative to another person_id",
          },
          date_deleted: {
            bsonType: "date",
            description: "must be a date",
          },
          deleted_by: {
            bsonType: "string",
            description: "can only be string relative to another person_id",
          },
          default_group: {
            bsonType: "bool",
            description: "can only be boolean",
          },
        },
      },
      badges: {
        bsonType: "array",
        required: ["badge_id"],
        properties: {
          badge_id: {
            bsonType: "string",
            description: "must be a string and is required",
          },
          date_earned: {
            bsonType: "date",
            description: "must be a date",
          },
        },
      },
      organizations: {
        bsonType: "array",
        required: ["org_id"],
        properties: {
          org_id: {
            bsonType: "string",
            description: "must be a string and is required",
          },
          date_added: {
            bsonType: "date",
            description: "must be a date",
          },
          employer: {
            bsonType: "bool",
            description: "must be a bool",
          },
          admin: {
            bsonType: "bool",
            description: "must be a bool",
          },
          date_deleted: {
            bsonType: "date",
            description: "must be a date",
          },
          deleted_by: {
            bsonType: "string",
            description: "must be a string",
          },
        },
      },
      nonprofits: {
        bsonType: "array",
        required: ["org_id"],
        properties: {
          org_id: {
            bsonType: "string",
            description: "must be a string and is required",
          },
          date_added: {
            bsonType: "date",
            description: "must be a date",
          },
          favorite: {
            bsonType: "bool",
            description: "must be a bool",
          },
        },
      },
      venues: {
        bsonType: "array",
        required: ["org_id"],
        properties: {
          org_id: {
            bsonType: "string",
            description: "must be a string and is required",
          },
          date_added: {
            bsonType: "date",
            description: "must be a date",
          },
        },
      },
      causes: {
        bsonType: "array",
        required: ["cause_id"],
        properties: {
          cause_id: {
            bsonType: "string",
            description: "must be a string and is required",
          },
          date_added: {
            bsonType: "date",
            description: "must be a date",
          },
          favorite: {
            bsonType: "bool",
            description: "must be a bool",
          },
        },
      },
      user_id: {
        bsonType: "string",
        description: "must be a string",
      },
      salt: {
        bsonType: "string",
        description: "must be a string",
      },
      hash: {
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
      last_active: {
        bsonType: "date",
        description: "must be a date",
      },
      deleted_by: {
        bsonType: "string",
        description: "must be a string and is required",
      },
      date_deleted: {
        bsonType: "date",
        description: "must be a date and is required",
      },
      modified_by: {
        bsonType: "string",
        description: "must be a string and is required",
      },
      date_modified: {
        bsonType: "date",
        description: "must be a date and is required",
      },
    },
  },
};

const placesSchema = {
  $jsonSchema: {
    bsonType: "object",
    required: ["place_id", "created_by", "date_created"],
    properties: {
      place_id: {
        bsonType: "string",
        description: "must be a string and is required",
      },
      google_id: {
        bsonType: "string",
        description: "must be a string",
      },
      place_name: {
        bsonType: "string",
        description: "must be a string",
      },
      place_description: {
        bsonType: "string",
        description: "must be a string",
      },
      place_address1: {
        bsonType: "string",
        description: "must be a string",
      },
      place_address2: {
        bsonType: "string",
        description: "must be a string",
      },
      place_city: {
        bsonType: "string",
        description: "must be a string",
      },
      place_state: {
        bsonType: "string",
        description: "must be a string",
      },
      place_postal_code: {
        bsonType: "string",
        description: "must be a string",
      },
      place_country: {
        bsonType: "string",
        description: "must be a string",
      },
      place_phone: {
        bsonType: "string",
        description: "must be a string",
      },
      place_phone_country_code: {
        bsonType: "string",
        description: "must be a string",
      },
      place_image: {
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
      date_deleted: {
        bsonType: "date",
        description: "must be a date",
      },
      deleted_by: {
        bsonType: "string",
        description: "must be a string",
      },
      date_modified: {
        bsonType: "date",
        description: "must be a date",
      },
      modified_by: {
        bsonType: "string",
        description: "must be a string",
      },
      virtual_location: {
        bsonType: "bool",
        description: "must be a bool.  true indicates is a virtual location",
      },
    },
  },
};

const radishadminsSchema = {
  $jsonSchema: {
    bsonType: "object",
    required: ["admin_id", "created_by", "date_created"],
    properties: {
      admin_id: {
        bsonType: "string",
        description: "must be a string and is required",
      },
      created_by: {
        bsonType: "string",
        description: "must be a string and is required",
      },
      date_created: {
        bsonType: "date",
        description: "must be a date and is required",
      },
      date_deleted: {
        bsonType: "date",
        description: "must be a date",
      },
      deleted_by: {
        bsonType: "string",
        description: "must be a string",
      },
      date_modified: {
        bsonType: "date",
        description: "must be a date",
      },
      modified_by: {
        bsonType: "string",
        description: "must be a string",
      },
    },
  },
};

[
  {
    org_id: "8974d2279f10011cbddd92a55852c357",
    date_added: "4/15/2021",
  },
  {
    org_id: "07e17a423c9b9015e32412bec9d0a51a",
    date_added: "4/15/2021",
  },
  {
    org_id: "d541a30d39e3572333f6037e268ec369",
    date_added: "4/15/2021",
  },
];

const organizationsSchema = {
  $jsonSchema: {
    bsonType: "object",
    required: ["org_id", "name"],
    properties: {
      org_id: {
        bsonType: "string",
        description: "Unique Identifier, Created by Radish at server level.",
      },
      created_by: {
        bsonType: "string",
        description: "matches a person_id",
      },
      date_created: {
        bsonType: "date",
        description: "date_time record written",
      },
      modified_by: {
        bsonType: "string",
        description: "matches a person_id",
      },
      date_modified: {
        bsonType: "date",
        description: "date_time record modified (last)",
      },
      deleted_by: {
        bsonType: "string",
        description: "matches a person_id",
      },
      date_deleted: {
        bsonType: "date",
        description: "date_time record deleted.  If exists, exclude from result sets",
      },
      name: {
        bsonType: "string",
        description: "name of the organization",
        minLength: 1,
      },
      address1: {
        bsonType: "string",
        description: "primary address of organization",
      },
      address2: {
        bsonType: "string",
        description: "second address line - suite",
      },
      city: {
        bsonType: "string",
        description: "city",
      },
      state: {
        bsonType: "string",
        description: "state",
      },
      postal_code: {
        bsonType: "string",
        description: "zip/postal code",
      },
      country: {
        bsonType: "string",
        description: "from dropdown",
      },
      website: {
        bsonType: "string",
        description: "exclude the http:// ...",
      },
      image: {
        bsonType: "string",
        description: "must be a string the represents the image",
      },
      employer: {
        bsonType: "bool",
        description: "must be a bool, indicates if record is an employer",
      },
      nonprofit: {
        bsonType: "bool",
        description: "must be a bool, indicates if record is a nonprofit",
      },
      venue: {
        bsonType: "bool",
        description:
          "must be a bool, indicates if record is a venue/vendor/provider",
      },
      enforce_domains: {
        bsonType: "bool",
        description: "when true, application will enforce the user must have an email on that domain"
      },
      domains: {
          bsonType:"array",
          description: "stores the domain (everything after the @)"
      },
      type_tags: {
        bsonType: "array",
        description: "possibly depricated.  currently exists only on Radmin forms",
      },
      nonprofits: {
        bsonType: "array",
        description: "STORES NONPROFITs THIS ORGANIZATION FOLLOWS",
        required: ["id"],
        properties: {
          org_id: {
            bsonType: "string",
            description: "must be a string and an existing org_id",
          },
          date_added: {
            bsonType: "date",
            description: "date_time array record written",
          },
          added_by: {
            bsonType: "string",
            description: "matches a person_id",
          },
          date_deleted: {
            bsonType: "date",
            description: "date_time record deleted.  If exists, indicates nolonger following the NP",
          },
          deleted_by: {
            bsonType: "string",
            description: "matches a person_id",
          },
          favorite: {
            bsonType: "bool",
            description: "is this nonprofit a favorite",
          },
        },
      },
      venues: {
        bsonType: "array",
        description: "STORES VENUEs THIS ORGANIZATION FOLLOWS",
        required: ["id"],
        properties: {
          org_id: {
            bsonType: "string",
            description: "must be a string and an existing org_id",
          },
          date_added: {
            bsonType: "date",
            description: "date_time array record written",
          },
          added_by: {
            bsonType: "string",
            description: "matches a person_id",
          },
          date_deleted: {
            bsonType: "date",
            description: "date_time record deleted.  If exists, indicates nolonger following the venue",
          },
          deleted_by: {
            bsonType: "string",
            description: "matches a person_id",
          },
          favorite: {
            bsonType: "bool",
            description: "is this nonprofit a favorite",
          },
        },
      },
      emp_specific: {
        bsonType: "object",
        description: "EMPLOYER SPECIFIC INFORMATION IN THIS SECTION",
        properties: {
          total_matched: {
            bsonType: "int",
            description: "stores total matched",
          },
          budget: {
            bsonType: "int",
            description: "must be a number",
          },
          budget_auto_renew: {
            bsonType: "bool",
            description: "can only be bool",
          },
          budget_term: {
            bsonType: "string",
            description: "must be a string",
          },
          match_type_person: {
            bsonType: "string",
            description: "must be a string",
          },
          max_event_total_match: {
            bsonType: "decimal",
            description: "must be a number",
          },
          max_person_match: {
            bsonType: "decimal",
            description: "must be a number",
          },
          std_person_match: {
            bsonType: "decimal",
            description: "must be a number",
          },
          min_participation: {
            bsonType: "decimal",
            description: "must be a number",
          },
          enforce_cause: {
            bsonType: "bool",
            description: "can only be bool",
          },
          causes: {
            bsonType: "array",
            description: "holds an array of causes the employer supports",
          },
        },
      },
      np_specific: {
        bsonType: "object",
        description: "NONPROFIT SPECIFIC INFORMATION IN THIS SECTION",
        properties: {
          total_given: {
            bsonType: "int",
            description: "stores total given to np",
          },
          cause: {
            bsonType: "string",
            description: "must be a string and a valid cause_type",
          },
          mission: {
            bsonType: "string",
            description: "must be a string",
          },
          categories: {
            bsonType: "array",
          },
        },
      },
      vend_specific: {
        bsonType: "object",
        description: "VENDOR SPECIFIC INFORMATION IN THIS SECTION",
        properties: {
          total_matched: {
            bsonType: "int",
            description: "stores total matched",
          },
          causes: {
            bsonType: "array",
            description: "holds an array of causes the employer supports",
          }
        },
      },
    },
  },
};

module.exports = {
  acceptancelogSchema,
  badgeSchema,
  causetypeSchema,
  eventSchema,
  eventpeopleSchema,
  groupSchema,
  peopleSchema,
  placesSchema,
  radishadminsSchema,
  organizationsSchema,
  invitesSchema,
};
