const { Client } = require("@googlemaps/google-maps-services-js");
const gKey = process.env.GMAPS_API_KEY;
const log = require("./logger.js").insertServerLogs;

// clearThrottle() prevents runaway api calls or bad user behavior.
// Attempts to run same call w/in [interval] will be force-failed and NOT attempt API calls.
let prevInput = "";
let timer;
const interval = 1000;
const clearThrottle = (input) => {
  let returnVal;
  if (input.toLowerCase() === prevInput) {
    returnVal = false;
  } else {
    prevInput = input.toLowerCase();
    returnVal = true;
  }
  clearTimeout(timer);
  timer = setTimeout(() => {
    prevInput = "";
  }, interval);
  return returnVal;
}

async function getGooglePlaces(options, res) {
  /* API REFERENCE
    https://developers.google.com/maps/documentation/places/web-service/search */

  try {
    if (clearThrottle(options.location)) {
      const client = new Client({});
      client
        .placesNearby({
          params: {
            location: options.location,
            radius: "10500",
            //type: params.type,
            keyword: "restaurant",
            key: gKey,
          },
          timeout: 2000, // milliseconds
        })
        .then((r) => {
          // console.log(r.data.results);
          res.send({
            data: r.data.results,
            message: "ok",
          });
        })
        .catch((e) => {
          log({ level: "error", message: "Error while fetching nearby places.", function: "placesNearby", params: options, error_code: 500, error_stack: e.stack });
          res.send({
            data: null,
            message: "places error",
          });
        });
    } else {
      res.send({
        data: null,
        message: "throttle error",
      })
    }
  } catch (err) {
    log({ level: "error", message: "Error while fetching nearby places", function: "getGooglePlaces", params: options, error_code: 500, error_stack: err.stack });
    res.send({
      data: null,
      message: "Error fetching places.",
    });
  }
}

async function googleAutoComplete(options, res) {
  try {
    if (clearThrottle(`${options.input}.${options.location}.${options.sessiontoken}`)) {
      const client = new Client({});
      client
        .placeAutocomplete({
          params: {
            location: options.location,
            radius: "10000",
            //strictbounds: true,
            types: "(cities)",
            input: options.input,
            sessiontoken: options.sessiontoken,
            key: gKey,
          },
          timeout: 1000, // milliseconds
        })
        .then((r) => {
          res.send({
            data: r.data.predictions,
            message: "ok",
          });
        })
        .catch((e) => {
          log({ level: "error", message: "Error in place autocomplete .", function: "placeAutocomplete", params: options, error_code: 500, error_stack: e.stack });
          res.send({
            data: null,
            message: e.response.data.error_message,
          });
        });
    } else {
      res.send({
        data: null,
        message: "throttle error",
      })
    }
  } catch (err) {
    log({ level: "error", message: "Error in google place autocomplete.", function: "googleAutoComplete", params: options, error_code: 500, error_stack: err.stack });
    res.send({
      data: null,
      message: "Error fetching places.",
    });
  }
}

async function googlePlaceDetails(options, res) {
  try {
    if (clearThrottle(`${options.place_id}.${options.sessiontoken}`)) {
      const client = new Client({});
      let params = {
        place_id: options.place_id,
        sessiontoken: options.sessiontoken,
        key: gKey,
      };
      if (options.fields) {
        params = {
          ...params,
          fields: options.fields, // || "address_component,adr_address,business_status,formatted_address,geometry,icon,name,photo,place_id,plus_code,type,url,utc_offset,vicinity",
        }
      }
      client
        .placeDetails({
          params: params,
          timeout: 1000, // milliseconds
        })
        .then((r) => {
          res.send({
            data: r.data.result,
            message: "ok",
          });
        })
        .catch((e) => {
          log({ level: "error", message: "Error while fetching google place details.", function: "placeDetails", params: options, error_code: 500, error_stack: e.stack });
          res.send({
            data: null,
            message: e.error_message,
          });
        });
    } else {
      res.send({
        data: null,
        message: "throttle error",
      })
    }
  } catch (err) {
    log({ level: "error", message: "Error while fetching google place details.", function: "googlePlaceDetails", params: options, error_code: 500, error_stack: err.stack });
    res.send({
      data: null,
      message: "Error fetching places.",
    });
  }
}

async function googlePhoto(options, res) {
  try {
    if (clearThrottle(options.id)) {
      const client = new Client({});
      client
        .placePhoto({
          params: {
            photoreference: options.id,
            maxheight: options.size || 325,
            key: gKey,
          },
          timeout: 1000, // milliseconds
        })
        .then((r) => {
          res.send({ image: r.request.res.responseUrl });
        })
        .catch((e) => {
          log({ level: "error", message: "Error while fetching google photo details.", function: "placePhoto", params: options, error_code: 500, error_stack: e.stack });
          return e.error_message;
        });
    } else {
      res.send({ image: "" });
    }
  } catch (err) {
    log({ level: "error", message: "Error while fetching google photo details.", function: "googlePhoto", params: options, error_code: 500, error_stack: err.stack });
    return "Error fetching photo";
  }
}



async function getGooglePlaceFromText(options, res) {
  try {
    if (clearThrottle(`${options.input}.${options.location}`)) {
      const client = new Client({});
      client
        .textSearch({
          params: {
            location: options.location,
            radius: "10500",
            query: options.input,
            key: gKey,
          },
          timeout: 2000, // milliseconds
        })
        .then((r) => {
          //console.log(r.data.results);
          res.send({
            data: r.data.results,
            message: "ok",
          });
        })
        .catch((e) => {
          log({ level: "error", message: "Error in text search.", function: "textSearch", params: options, error_code: 500, error_stack: e.stack });
          res.send({
            data: null,
            message: 'error in googleTExtSearch',
          });
        });
    } else {
      res.send({
        data: null,
        message: "throttle error",
      })
    }
  } catch (err) {
    log({ level: "error", message: "Error while fetching google place from text.", function: "getGooglePlaceFromText", params: options, error_code: 500, error_stack: err.stack });
    res.send({
      data: null,
      message: "Error fetching places.",
    });
  }
}

async function googleGeocodeDetails(options, res) {
  try {
    if (clearThrottle(options.location)) {
      const client = new Client({});
      client
        .reverseGeocode({
          params: {
            key: gKey,
            latlng: options.location,
            result_type: 'locality',
          },
          timeout: 1000, // milliseconds
        })
        .then((r) => {
          res.send({
            data: r.data.results,
            message: "ok",
          });
        })
        .catch((e) => {
          log({ level: "error", message: "Error in reverse geocode.", function: "reverseGeocode", params: options, error_code: 500, error_stack: e.stack });
          res.send({
            data: null,
            message: e.error_message,
          });
        });
    } else {
      res.send({
        data: null,
        message: "throttle error",
      })
    }
  } catch (err) {
    log({ level: "error", message: "Error while fetching google geocode details.", function: "googleGeocodeDetails", params: options, error_code: 500, error_stack: err.stack });
    res.send({
      data: null,
      message: "Error fetching places.",
    });
  }
}

module.exports = {
  getGooglePlaces,
  googleAutoComplete,
  googlePlaceDetails,
  googlePhoto,
  getGooglePlaceFromText,
  googleGeocodeDetails,
};
