import { eachWordToUpper, uuidv4 } from "Tools";
import baseClient from "./Base";
import moment from "moment-timezone";
import googleClient from "./GooglePlaces";
import mapPin from "Graphics/MapPinBlueTransparent2.png";

const getEventPlaces = async (event) => {
  // load custom place(s) and/or google place(s) for event
  let tempPlaces = [];
  const place1_id = event.proposed_place_id1;
  const place1_type = event.proposed_place1_type;
  const place2_id = event.proposed_place_id2;
  const place2_type = event.proposed_place2_type;
  const finalPlace_id = event.final_place_id;
  const finalPlaceType = event.final_place_type;
  let customIds = [];
  if (finalPlace_id && finalPlaceType === "custom") {
    customIds = [...customIds, finalPlace_id];
  }
  if (place1_id && place1_type === "custom" && place1_id !== finalPlace_id) {
    customIds = [...customIds, place1_id];
  }
  if (place2_id && place2_type === "custom" && place2_id !== finalPlace_id) {
    customIds = [...customIds, place2_id];
  }
  if (customIds.length > 0) {
    const placesModel = {
      ids: customIds,
    };
    const customPlaces = await baseClient.APIPost({
      model: placesModel,
      api: "searchcustomplaces",
    });
    if (customPlaces?.data) {
      const cPlaces = customPlaces.data;
      let placeTemp = [];
      for (let i = 0; i < cPlaces.length; i++) {
        placeTemp = {
          uuid: uuidv4(),
          id: cPlaces[i].place_id,
          name: cPlaces[i].place_name,
          addr: `${cPlaces[i].place_address1}${
            cPlaces[i].place_city ? `, ${cPlaces[i].place_city} ` : ""
          }`,
          image: cPlaces[i].place_image,
          image_bg: cPlaces[i].place_image
            ? {
                backgroundImage: `url(${cPlaces[i].place_image})`,
              }
            : null,
          virtual_location: cPlaces[i].virtual_location
            ? cPlaces[i].virtual_location
            : false,
          type: "custom",
          final: cPlaces[i].place_id === finalPlace_id,
          placeNbr:
            cPlaces[i].place_id === place1_id
              ? 1
              : cPlaces[i].place_id === place2_id
              ? 2
              : null,
          description: cPlaces[i].place_description,
        };
        tempPlaces = [...tempPlaces, placeTemp];
      }
    }
  }

  // GOOGLE places
  let googleIds = [];
  if (finalPlace_id && finalPlaceType === "google") {
    googleIds = [...googleIds, finalPlace_id];
  }

  if (place1_id && place1_type === "google" && place1_id !== finalPlace_id) {
    googleIds = [...googleIds, place1_id];
  }
  if (place2_id && place2_type === "google" && place2_id !== finalPlace_id) {
    googleIds = [...googleIds, place2_id];
  }
  const fetchGooglePlace = async (id, size) => {
    let model = {
      place_id: id,
      sessiontoken: null,
      //fields: "formatted_address,name,place_id,icon,vicinity",
    };
    const myPlace = await googleClient.googlePlaceDetails(model);
    if (myPlace.data) {
      if (myPlace.data.photos) {
        const gImage = await googleClient.googlePhoto({
          id: myPlace.data.photos[0].photo_reference,
          size: size,
        });
        if (gImage) {
          myPlace.data.imageURL = gImage.image;
        }
      }
      const placeTemp = {
        uuid: uuidv4(),
        id: myPlace.data.place_id,
        google_id: myPlace.data.place_id,
        name: myPlace.data.name || myPlace.data.structured_formatting.main_text,
        addr:
          myPlace.data.vicinity ||
          myPlace.data.formatted_address ||
          myPlace.data.structured_formatting.secondary_text,
        image: myPlace.data.imageURL,
        image_bg: myPlace.data.imageURL
          ? {
              backgroundImage: `url(${myPlace.data.imageURL})`,
            }
          : null,
        price_level: myPlace.data.price_level,
        rating: myPlace.data.rating,
        url: myPlace.data.url,
        user_ratings_total: myPlace.data.user_ratings_total,
        type: "google",
        final: myPlace.data.place_id === finalPlace_id,
        placeNbr:
          myPlace.data.place_id === place1_id
            ? 1
            : myPlace.data.place_id === place2_id
            ? 2
            : null,
      };
      return placeTemp;
    }
  };
  if (googleIds.length > 0) {
    for (let i = 0; i < googleIds.length; i++) {
      tempPlaces = [
        ...tempPlaces,
        await fetchGooglePlace(
          googleIds[i],
          googleIds.length === 1 ? 325 : 125
        ),
      ];
    }
  }

  return tempPlaces;
};

const getEventPlacesShort = async (
  event,
  setSelectedPlace1,
  setSelectedPlace2,
  isFinal
) => {
  const getCustomPlace = async (place_id) => {
    const model = {
      id: place_id,
    };
    const tempPlace = await baseClient.APIPost({
      model: model,
      api: "place",
    });

    if (tempPlace?.data) {
      const place = tempPlace?.data[0];
      const result = {
        id: place.place_id,
        name: place.place_name,
        addr: `${place.place_address1}${
          place.place_city ? `, ${place.place_city} ` : ""
        }`,
        image_bg: {
          backgroundImage: `url(${
            place.place_image ? place.place_image : mapPin
          })`,
          backgroundSize: `${place.place_image ? "cover" : "60%"}`,
        },
        virtual_location: place.virtual_location
          ? place.virtual_location
          : false,
        type: "custom",
      };
      return result;
    } else {
      return null;
    }
  };

  const fetchGooglePlace = async (id) => {
    let model = {
      place_id: id,
      sessiontoken: null,
      fields: "formatted_address,name,place_id,icon,vicinity",
    };
    const myPlace = await googleClient.googlePlaceDetails(model);
    if (myPlace.data) {
      const placeTemp = {
        id: myPlace.data.place_id,
        google_id: myPlace.data.place_id,
        name: myPlace.data.name || myPlace.data.structured_formatting.main_text,
        addr:
          myPlace.data.formatted_address ||
          myPlace.data.structured_formatting.secondary_text,
        image_bg: {
          backgroundImage: `url(${
            myPlace.data.icon ? myPlace.data.icon : mapPin
          })`,
          backgroundSize: "70%",
        },
        type: "google",
      };
      return placeTemp;
    }
  };
  if (isFinal) {
    if (event.final_place_id && event.final_place_type === "custom") {
      const tempCustomPlace = await getCustomPlace(event.final_place_id);
      setSelectedPlace1(tempCustomPlace);
    }
    if (event.final_place_id && event.final_place_type === "google") {
      const tempGooglePlace = await fetchGooglePlace(event.final_place_id);
      setSelectedPlace1(tempGooglePlace);
    }
    return;
  }
  if (event.proposed_place_id1 && event.proposed_place1_type === "custom") {
    const tempCustomPlace = await getCustomPlace(event.proposed_place_id1);
    setSelectedPlace1(tempCustomPlace);
  }
  if (event.proposed_place_id1 && event.proposed_place1_type === "google") {
    const tempGooglePlace = await fetchGooglePlace(event.proposed_place_id1);
    setSelectedPlace1(tempGooglePlace);
  }

  if (event.proposed_place_id2 && event.proposed_place2_type === "custom") {
    const tempCustomPlace = await getCustomPlace(event.proposed_place_id2);
    setSelectedPlace2(tempCustomPlace);
  }
  if (event.proposed_place_id2 && event.proposed_place2_type === "google") {
    const tempGooglePlace = await fetchGooglePlace(event.proposed_place_id2);
    setSelectedPlace2(tempGooglePlace);
  }
};

const getFriends = async (userId) => {
  try {
    let model = {};
    model = {
      ...model,
      id: userId,
    };
    const tempData = await baseClient.APIPost({
      model: model,
      api: "myfriends",
    });
    return tempData.data;
  } catch (err) {
    console.log(err.message);
    return null;
  }
};

const saveGroupMembers = async (userId, groupId, selectedPersonIds) => {
  try {
    let model = {};
    model = {
      ...model,
      person_id: userId,
      group_id: groupId,
      person_ids: selectedPersonIds,
    };
    await baseClient.APIPost({
      model: model,
      api: "addgroupmembers",
    });
    return true;
  } catch (err) {
    console.log(err.message);
    return false;
  }
};

const testEventVisibility = async ({ event, invitees, permission, uid }) => {
  try {
    let todoArray = [];
    const startOfMsg = `You appear to have a visibility setting of [${eachWordToUpper(
      permission
    )}], `;
    switch (permission) {
      case "invited":
        if (invitees.length <= 1) {
          // YOU HAVE NOT INVITED ANYONE
          todoArray = [
            ...todoArray,
            {
              type: "WHO",
              level: "critical",
              header: "Are you intending to invite anyone?",
              message: `${startOfMsg}i.e. anyone you invite can see this event, but ${
                invitees?.length === 0
                  ? "nobody has been invited."
                  : "there's only one invitee"
              }${uid === event?.created_by ? ", and it's YOU!" : "."}`,
              link: `/neweventwho/${event.event_id}/neweventpublish`,
            },
          ];
          return todoArray;
        }
        break;
      case "organization":
        if (!event.org_id) {
          // YOU NEED AN AFFILIATED ORG
          todoArray = [
            ...todoArray,
            {
              type: "WHO",
              level: "critical",
              header: "Need to link an Organization",
              message: `${startOfMsg}i.e. anyone in the organization can see this event, but you have not linked an organization to this event.`,
              link: `/neweventorg/${event.event_id}/false`,
            },
          ];
          return todoArray;
        }
        break;
      case "friends":
      case "friends of friends":
        const countMyFreinds = async () => {
          let model = {};
          model = {
            ...model,
            id: uid,
          };
          const tempData = await baseClient.APIPost({
            model: model,
            api: "countmyfriends",
          });
          if (!tempData.data || tempData.data === 0) {
            // YOU HAVE NO FRIENDS
            todoArray = [
              ...todoArray,
              {
                type: "WHO",
                level: "critical",
                header: "You don't have any Radish Friends yet.",
                message: `${startOfMsg}i.e. only your Radish friends can see this event, but you don't have any Radish friends yet. Start by adding a group and putting some friends in it.`,
                link: "/addgroup",
              },
            ];
            return todoArray;
          }
        };
        countMyFreinds();
        break;
      default:
        break;
    }
    return [];
  } catch (err) {
    console.error(err.message);
  }
};

const deleteEvent = async (event, eventId, notify) => {
  try {
    event.preventDefault();
    const model = {
      event_id: eventId,
      date_deleted: new Date(),
      notify: notify,
      timezone: moment.tz.guess(),
    };
    await baseClient.APIPost({
      model: model,
      api: "insertevent",
    });
  } catch (err) {
    console.log(err.message);
  }
};

const getDateTimeForZone = (datetime, timezone) => {
  // returns new datetime based difference between offeset of current user timezone for 'datetime' passed in
  // and 'timezone' offset otherwise return back datetime if same timezone (no calculations nec) or if error
  try {
    const userTimezone = moment.tz.guess();
    if (userTimezone !== timezone) {
      // timezones are dif. calculate new time.
      const timzeZoneOffset = moment.tz(timezone).format("ZZ") / 100;
      const localOffset = moment.tz(userTimezone).format("ZZ") / 100;
      const hoursDif = localOffset - timzeZoneOffset;
      const finalstart = new Date(
        moment(datetime).add(hoursDif, "h").format("YYYY/MM/DD HH:mm")
      );
      return finalstart;
    } else {
      return datetime;
    }
  } catch (err) {
    console.error(err.message);
    return datetime;
  }
};

const generalOptionArray = [
  "All Day",
  "Early Morning",
  "Late Morning",
  "Mid Day",
  "Afternoon",
  "Late Afternoon",
  "Evening",
  "Late Evening",
  "Overnight",
];

const tallyVoting = (myEvent) => {
  let responders = myEvent.invitees;
  
  let respArray = {
    place1Responders: [],
    place2Responders: [],
    anyPlaceResponders: [],
    virtualPlaceResponders: [],
    noPlaceResponders: [],
    date1Responders: [],
    date2Responders: [],
    anyDateResponders: [],
    noDateResponders: [],
    placeWinner: null,
    dateWinner: null,
  };

  for (let i = 0; i < responders.length; i++) {
    if (responders[i].place_preference) {
      // tally place votes
      switch (responders[i].place_preference) {
        case myEvent.proposed_place_id1:
          respArray.place1Responders.push(responders[i]);
          break;
        case myEvent.proposed_place_id2:
          respArray.place2Responders.push(responders[i]);
          break;
        case "anyplace":
          respArray.anyPlaceResponders.push(responders[i]);
          break;
        case "virtually":
          respArray.virtualPlaceResponders.push(responders[i]);
          break;
        default:
          respArray.virtualPlaceResponders.push(responders[i]);
          break;
      }
    }
    if (responders[i].date_preference) {
      // tally date votes
      switch (responders[i].date_preference) {
        case "proposed_date1":
          respArray.date1Responders.push(responders[i]);
          break;
        case "proposed_date2":
          respArray.date2Responders.push(responders[i]);
          break;
        case "anydate":
          respArray.anyDateResponders.push(responders[i]);
          break;
        default:
          respArray.noDateResponders.push(responders[i]);
          break;
      }
    }
  }
  // determine winners (if any) for place and for date
  const place1Count = respArray.place1Responders.length || 0;
  const place2Count = respArray.place2Responders.length || 0;
  const date1Count = respArray.date1Responders.length || 0;
  const date2Count = respArray.date2Responders.length || 0;
  if (place1Count !== place2Count) {
    if (place1Count > place2Count) {
      respArray.placeWinner = myEvent.proposed_place_id1;
    } else {
      respArray.placeWinner = myEvent.proposed_place_id2;
    }
  }

  if (date1Count !== date2Count) {
    if (date1Count > date2Count) {
      respArray.dateWinner = "proposed_date1";
    } else {
      respArray.placeWinner = "proposed_date2";
    }
  }
  //console.log(respArray)
  return respArray;
};

const APIToolsClient = {
  getEventPlaces,
  getEventPlacesShort,
  getFriends,
  saveGroupMembers,
  testEventVisibility,
  deleteEvent,
  getDateTimeForZone,
  generalOptionArray,
  tallyVoting,
};
export default APIToolsClient;
