// -----------------------------------------------------------------------
//ORGANIZATIONS ******************************************************
// -----------------------------------------------------------------------
Table organizations {
  _id guid [pk, increment, note:"Auto Assigned by Mongo"] // auto assigned by Mongo
  org_id guid [pk, increment, note:"Auto Assigned by Radish"] // assigned by Radish
  name string [not null]
  address1 string
  address2 string
  city string
  state string
  postal_code string
  country string
  website string
  image string [note:"Main Org Image / Logo"]
  image_full string [note:"Stores big / wide logo for org"]
  budget int
  budget_auto_renew boolean
  budget_term string [note: "make enum"]
  match_type_person sting [note: "make enum?"]
  max_event_total_match numeric
  max_person_match numeric
  std_person_match numeric
  min_participation numeric
  enforce_cause boolean
  type_tags array [ref: > type_tags_object.type_tag, note:"Allows for many.  Shows as tags in the application."]
  nonprofits object [ref: > nonprofit_object.org_id, note:"Nonprofits object in org table.  Ties this org to nonprofits"]
  venues object [ref: > nonprofit_object.org_id, note:"Nonprofits object in org table.  Ties this org to nonprofits"]
  causes object [ref: > causes_object_orgs.id]
  roles roles [ref: > roles_object.user_id]
  date_created datetime
  date_deleted datetime
  created_by datetime
}

table type_tags_object {
  type_tag string [pk, increment, Note:"creates the type tags.  Currently is a unique from the tags put in."]
}

table nonprofit_object [note: "these are nonprofits the organization prefers"] {
  org_id guid [pk, increment, ref: > organizations.org_id, Note:"Ties to another document in the organizations table"]
  date_added date
  added_by guid [ref: - people.person_id]
}



table roles_object {
  user_id guid [ref: > people.person_id]
  role roles
  date_added datetime
  added_by guid  [ref: > people.person_id]
}

// -----------------------------------------------------------------------
//MAIN PEOPLE TABLE ******************************************************
// -----------------------------------------------------------------------
table users {
user_id guid [ref: > people.user_id]
}

table people  {
  _id guild [pk, increment, note:"Auto Assigned by Mongo"]
  person_id guid [pk, increment, note:"Auto assigned by Radish"]
  user_id sting [unique, note: "Used to log in.  ie:evaeth@cureo.com"]
  salt string [pk, unique, note: "Auto assigned by Radish"]
  hash string [pk, unique, note: "Auto assigned by Radish"]
  first_name string [not null]
  last_name string [not null]
  display_name string [note: "Example: John V."]
  title string [note: "may be unused ??"]
  image string [note: "is the users profile image"]
  emails string [ref: > emails_object.email]
  phones string [ref: > phones_object.phone]
  alert_count int
  primary_location string  [note: "Columbus Ohio"]
  default_coordinates string [note: "full lat-lon example: 39.983334,-82.983330"]
  location_services bool
  referral_code string
  show_my_events_helper bool
  show_new_event_helper bool
  show_friend_helper bool
  show_friends_group_helper bool
  show_hints bool [note: 'Used to turn off all system hints']
  notification_preferences object [ref: > notification_preferences.notification_frequency]
  hint_last_seen_build_rad_event datetime [note: 'Creat Event - lets build hint...']
  allowed_access_to_friends boolean [note: 'Need to account for how we know they have granted access to fiends like contacts on phone or linkedIn']
  onboarding_last_presented datetime [note: 'Used to show onboarding screens if null or x number days']
  //TODO: DEAL WITH FREQUENCY THAT WE WANT TO RE_SHOW ONBOARDING
  splashloader_last_presented datetime [note: 'Used to show splashloader screens if null or x number days']
  //TODO: DEAL WITH FREQUENCY THAT WE WANT TO RE_SHOW splashloader screens
  updates_last_presented datetime [note: 'Used to show application update screens if null or x number days']
  //TODO: DEAL WITH HOW WE POPULATE WHATS NEW SCREENS
  xxxxxxxxxx string [note: "fields between the xxxx are from testdata_currentuser and may not be needed"]
  badges_count int
  gem_bank int
  xp_bank int
  event_action_count int
  xxxxxxxxxxx string
  hands_raised sting
  hand_raised string [note: "may be an unused flag"]
  role string [note:"currently contains 'admin' but not sure why"]
  groups string  [ref: > groups_object.groups_id]
  badges string [ref: > badges_object.badge_id]
  organizations string [ref: > organizations_object.org_id]
  causes string [ref: > causes_object.cause_id]
  nonprofits string [ref: > nonprofits_object.org_id]
  venues string [ref: > venues_object.org_id]
  perks string [ref: > perks_object.perk_id,  note: "place to store claimed / used perks?"]
  last_active datetime
}

table groups_object [note: "sub-object in people table"]  {  
  groups_id guid [ref: > groups.group_id, Note: "This is an array object inside the people table.  Exists for each person"]
  date_added datetime
  added_by guid  [ref: > people.person_id]
  roles array [note: "This is an array of roles as a string.  Currently only empty or 'Admin'"]
}

table badges_object [note:"Replaces testdata_badges eventually"] {
  badge_id string [pk, ref: > badges.badge_id]
  date_earned datetime
  //requirements_earned string [ref: > requirements_earned_object.requirement_id]
}

table requirements_earned_object  [Note: "NOT CURRENTLY USED"]  {
  requirement_id string [ref: > badge_requirments.requirement_id]
  date_earned datetime
}

table organizations_object  {
  org_id string [pk, ref: > organizations.org_id]
  date_added datetime
  employer bool
  bank numeric
}

table nonprofits_object  {
  org_id string [pk, ref: > organizations.org_id]
  date_added datetime
  favorite bool
  bank numeric
}

table venues_object  {
  org_id string [pk, ref: > organizations.org_id]
  date_added datetime
  bank numeric
}

table causes_object  {
  cause_id string [pk, ref: > causetypes.id]
  date_added datetime
  favorite bool
}

table emails_object [note: "sub-object in people table"] {
  email string [pk, unique]
  type phone_email_type
  primary bool [note: "default false"]
  date_validated datetime
}

table phones_object [note: "sub-object in people table"] {
  phone string [pk, unique]
  type phone_email_type
  primary bool [note: "default false"]
  date_validated datetime
}

table notification_preferences [note: "sub-object in people table"] {
  notification_frequency NotificationFrequency
  new_invites NotificationNewInvitations
  rsvps NotificationRSVP
  event_comments NotificationEventComments
  finalized_event NotificationFinalizedEvent
  event_reminders NotificationEventReminders [note: 'This is a multiple choice']
}

//END OF PEOPLE SECTION ******************************************************

// -----------------------------------------------------------------------
//BADGES ******************************************************
// -----------------------------------------------------------------------
table badges [note: "sub-object in people table"] {
  _id guid [pk, increment, note: "Auto Assigned by Mongo"]
  badge_id [pk]
  level string
  badge_name string
  badge_description string
  badge_image string [note:"path to actual image in application"]
  badge_image_large string [note:"path to actual image in application"]
  requirements object [ref: > badge_requirments.requirement_id]
}
table badge_requirments  {
  _id guid [pk, increment, note: "Auto Assigned by Mongo"]
  requirement_id guid [pk, increment, unique, note: "added by Radish"]
  sort_order int
  requirment_name string
  requirment_description string
}

// -----------------------------------------------------------------------
//CAUSES ******************************************************
// -----------------------------------------------------------------------
table causetypes {
  _id guid [pk, increment]
  id string [pk]
  type string
  cause_image string [note:"path to actual image in application"]
}

table causes_object_orgs [note: "used by non-profits to attached to a cause, and orgs to support a cause (or causes)"] {
  id string [pk, ref: > causetypes.id]
  date_added datetime
}

// -----------------------------------------------------------------------
//PERKS ******************************************************
// -----------------------------------------------------------------------
table perks_object  {
  perk_id guid [pk, increment]
  claimed datetime
  used datetime
}


// -----------------------------------------------------------------------
//GROUPS *****************************************************************
// -----------------------------------------------------------------------
table groups  {
  _id guid [pk, increment, note: "Assigned by Mongo"]
  group_id guid [pk, increment, unique, note: "Assigned by Radish"]
  group_name string [not null]
  group_description string
  created_by string [ref: > people.person_id, note: "People ID of the person who created"]
  date_created datetime [not null]
  everyone_add_friends bool
  everyone_add_events bool
  can_join can_join
  org_id guid [ref: > organizations.org_id]
  }


// -----------------------------------------------------------------------
//EVENTS *****************************************************************
// -----------------------------------------------------------------------
table events  {
  _id guid [pk, increment, note: "Assigned by Mongo"]
  event_id guid [pk, increment, note:"Assigned by Radish"]
  notcomplete string
  comments object [ref: > event_comments_object.comment_id]
}

table event_comments_object  {
  comment_id guid [pk, increment, note:"Assigned by Radish"]
  user_id guid [ref: > people.person_id]
  comment string
  createddate datetime
}

//ENUM / LOOKUP  *****************************************************************

//Create lookup for notification notification_frequency
enum NotificationFrequency {
  "Never"
  "As they happen"
  "Daily"
  "Weekly"
  }
enum NotificationFinalizedEvent {
  "Off"
  "On"
}
enum NotificationEventComments {
  "Off"  
  "From Friends"
  "From Everyone"
}
enum NotificationEventReminders {
//NOTE - THIS IS A MULTIPLE CHOICE
  "Off"
  "Week of event"
  "3 Days before"
  "Day of event"
}
enum NotificationNewInvitations {
  "Off"
  "From Friends"
  "From Everyone"
}
enum NotificationRSVP {
  "Off"
  "On"
}
enum phone_email_type {
  Personal
  Work
  Other
}

enum roles {
  "Org Admin"
  "Giving Fund Admin"
  "Financial Admin"
  "User Admin"
}

enum can_join {
  "nobody"
  "my friends"
  "my friends by request"
  "anyone"
  "anyone by request"
  "invited"
}