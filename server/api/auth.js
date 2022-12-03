const log = require("./logger.js").insertServerLogs;
const jwt = require("jsonwebtoken");
const JWTID = process.env.JWTID;
const NodeCache = require("node-cache");

global.ValidHash = (str, salt, hash) => {
  const myHash = crypto
    .pbkdf2Sync(str, salt, 1000, 64, `sha512`)
    .toString(`hex`);
  return myHash === hash;
};

global.GenerateAuthToken = (personID, tempUser) => {
  const token_salt = crypto.randomBytes(16).toString("hex");
  const token_hash = crypto
    .pbkdf2Sync(personID, token_salt, 1000, 64, `sha512`)
    .toString(`hex`);

  const expiresIn = tempUser ? "10m" : "90d";

  const jwtToken = jwt.sign(
    {
      personID: personID,
      salt: token_salt,
      hash: token_hash,
      tempUser: tempUser,
    },
    JWTID,
    {
      expiresIn: expiresIn,
    }
  );
  return jwtToken;
};
const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });

global.Auth2 = async (
  req,
  checkRadishAdmin,
  res,
  allowTempUser = false,
  bypassCache = false
) => {
  const token = req.headers["x-access-token"] || req.headers["Authorization"];
  let decodedToken;
  try {
    if (token) {
      decodedToken = jwt.verify(token, JWTID);
    } else {
      return {
        message: "Invalid or expired token.",
        isRadishAdmin: false,
        code: 400,
      };
    }
  } catch (error) {
    log({
      level: "error",
      message: "Invalid or expired token.",
      function: "Auth2",
      error_code: 400,
      error_stack: error.stack,
    });
    return {
      message: "Invalid or expired token.",
      isRadishAdmin: false,
      code: 400,
    };
  }

  const tempToken = decodedToken.tempUser; // prevents from spoofing other users

  const result = {
    person_id: decodedToken.personID,
    salt: decodedToken.salt,
    hash: decodedToken.hash,
  };
  const date = new Date();

  if (ValidHash(result.person_id, result.salt, result.hash)) {
    try {
      const people = db.collection("people");
      let isAdmin = null;
      if (checkRadishAdmin) {
        const admins = db.collection("radishadmins");
        const isAdminUser = await admins.findOne({
          admin_id: result.person_id,
          date_deleted: null, //don't return deleted users.
        });
        if (!isAdminUser) {
          res.send({
            data: null,
            message: "Bummer! Looks like you're not authorized here.",
          });
          return false;
        } else {
          isAdmin = true;
        }
      }

      /* CACHE MGT */
      let user;
      let useingCache;
      let cachedUser = await myCache.get(result.person_id);
      if (cachedUser && !bypassCache) {
        //console.log(`using cache for ${cachedUser.first_name}`);
        user = cachedUser;
        useingCache = true;
      } else {
        //console.log("using DB");
        user = await people.findOne({
          person_id: result.person_id,
          date_deleted: null,
        });
        if (user) {
          myCache.set(result.person_id, user, 60);
        }
        useingCache = false;
      }

      if (user) {
        if (!allowTempUser) {
          // TEST if primary email is validated
          let isValidatedEmail = false;
          for (let i = 0; i < user.emails.length; i++) {
            if (
              user.emails[i].primary &&
              user.emails[i].email === user.user_id &&
              user.emails[i].date_validated
            ) {
              // has a validated primary email
              isValidatedEmail = true;
            }
          }
          if (!isValidatedEmail) {
            // tell front end so user can go through validation process
            return {
              data: null,
              message: "Email has never been validated.",
              isRadishAdmin: false,
              code: 700, // '700' is reserved for this email validation purpose
            };
          }
        }

        if (!useingCache) {
          // UPDATE user last_active datetime
          // if has been more than 10 min since last update
          const testDate = date.getTime();
          const lastActive = user.last_active
            ? new Date(user.last_active).getTime() + 600000
            : date.getTime();
          if (testDate > lastActive || !user.last_active) {
            await people.updateOne(
              { person_id: result.person_id },
              {
                $set: { last_active: date },
              }
            );
          }
        }
        if ((user.is_temp || tempToken) && !allowTempUser) {
          return {
            data: null,
            message: "Temp User Error. User has is_temp status.",
            isRadishAdmin: false,
            code: 400,
          };
        } else {
          return {
            data: user,
            message: "OK",
            isRadishAdmin: isAdmin,
            code: 200,
          };
        }
      } else {
        return {
          data: null,
          message: "No user found",
          isRadishAdmin: false,
          code: 400,
        };
      }
    } catch (err) {
      log({
        level: "error",
        message: "Error in authentication process.",
        function: "Auth2",
        params: token,
        error_code: 500,
        error_stack: err.stack,
      });
      return {
        data: null,
        message: "Error in authentication",
        isRadishAdmin: false,
        code: 400,
      };
    }
  } else {
    return {
      data: null,
      message: "Unauthorized token or session.",
      isRadishAdmin: false,
      code: 400,
    };
  }
};

module.exports = {
  ValidHash,
  GenerateAuthToken,
};
