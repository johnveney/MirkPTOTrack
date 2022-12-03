const { google } = require("googleapis");
const client_id = process.env.GKEY1;
const client_secret = process.env.GKEY2;
const server = process.env.SERVER_PATH;
const redirect_uri = server + 'googlecontactstemp';
const log = require("./logger.js").insertServerLogs;

const getAuthClient = () => {
  try {
    return new google.auth.OAuth2(client_id, client_secret, redirect_uri);
  } catch (error) {
    log({ level: "error", message: "Error while fetching OAuth2 client details.", function: "getAuthClient", error_code: 500, error_stack: error.stack });
  }
};

const getAuthUrl = (oauth2Client) => {
  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: "https://www.googleapis.com/auth/contacts.readonly",
    });

    return {
      data: authUrl,
      message: "auth_required",
    };
  } catch (error) {
    log({ level: "error", message: "Error while generating OAuth2 URL.", function: "getAuthUrl", error_code: 500, error_stack: error.stack });
  }
};

const getConnections = async (oauth2Client, pageToken) => {
  // Params info: https://developers.google.com/people/api/rest/v1/people.connections/list#query-parameters
  try {
    const { people } = google.people({ version: "v1", auth: oauth2Client });
    const { data } = await people.connections.list({
      resourceName: "people/me",
      pageToken: pageToken,
      pageSize: 1000,
      sortOrder: "LAST_NAME_ASCENDING",

      // List any fields that should be returned. 'resourceName' is always returned and should not be listed here
      personFields: "names,emailAddresses,phoneNumbers,photos",
    });
    return ({ connections, totalItems, nextPageToken } = data);
  } catch (error) {
    log({ level: "error", message: "Error while get connections.", function: "getConnections", error_code: 500, error_stack: error.stack });
  }

};

// Whatever fields are needed here need to be listed in the 'personFields' parameter in the getConnections method
// except 'resourceName' which is always returned from the Google API.
const createContact = ({
  resourceName,
  names,
  emailAddresses,
  phoneNumbers,
  photos,
}) => ({
  id: resourceName,
  name: names && names.length ? names[0].displayName || "" : "",
  familyName: names && names.length ? names[0].familyName || "" : "",
  givenName: names && names.length ? names[0].givenName || "" : "",
  email:
    emailAddresses && emailAddresses.length
      ? emailAddresses[0].value || ""
      : "",
  phone: phoneNumbers && phoneNumbers.length ? phoneNumbers[0].value || "" : "",
  photo: photos && photos.length ? photos[0].url || "" : "",
});

async function getGoogleContacts(options, res) {

  try {
    const oauth2Client = getAuthClient();

    let { code, refreshToken } = options;
    const hasCode = code && code.length;
    const hasRefreshToken = refreshToken && refreshToken.length;

    if (!hasCode && !hasRefreshToken) return getAuthUrl(oauth2Client);

    if (hasCode) {
      const { tokens } = await oauth2Client.getToken(code);

      oauth2Client.setCredentials(tokens);

      refreshToken = tokens.refresh_token;

      // TODO: [RAD-471] Persist refresh token?
    } else if (hasRefreshToken) {
      oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });
    }

    const { connections, totalItems, nextPageToken } = await getConnections(
      oauth2Client,
      options.pageToken || ""
    );

    const badFirstNames = [];
    const connectionsTemp = [];
    for (let i = 0; i < connections.length; i++) {
      // ONLY TAKE RECORDS WITH EMAIL ADDRESSES
      if (connections[i].emailAddresses) {
        connectionsTemp.push(connections[i]);
        // APPEND RECORD IF MISSING FIRST NAME (givenName)
        if (!connections[i].names || !connections[i].names[0].givenName || connections[i].names[0].givenName.length === 0) {
          badFirstNames.push(connections[i].emailAddresses[0].value.toLowerCase());
        }
      }
    }
    let contacts = connectionsTemp.map(createContact);
    if (badFirstNames.length > 0) {
      // ASK DATABASE IF IT KNOWS THESE PEOPLE AND FIX FIRST NAME BEFORE SENDING TO CLIENT
      const collection = db.collection("people");
      const myDoc = await collection.find(
        { user_id: { $in: badFirstNames } }
      )
        .project(
          {
            user_id: 1,
            first_name: 1,
            last_name: 2,
          }
        )
        .toArray();

      if (myDoc && myDoc.length > 0) {
        for (let i = 0; i < contacts.length; i++) {
          if (contacts[i].givenName.length === 0) {
            for (let x = 0; x < myDoc.length; x++) {
              if (contacts[i].email.toLowerCase() === myDoc[x].user_id) {
                contacts[i].givenName = myDoc[x].first_name;
                if (myDoc[x].last_name) {
                  contacts[i].familyName = myDoc[x].last_name;
                }
              }
            }
          }
        }
      }
    }

    return {
      data: {
        contacts: contacts,
        refreshToken: hasCode ? refreshToken : null,
        totalItems,
        nextPageToken,
      },
      message: "ok",
    };
  } catch (error) {
    log({ level: "error", message: "Error while fetching google contacts.", function: "getGoogleContacts", params: options, error_code: 500, error_stack: error.stack });
    return {
      data: null,
      message: 'error from server'
    }
  }
}

module.exports = {
  getGoogleContacts,
};
