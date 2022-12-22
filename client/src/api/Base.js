import authHeader from "./AuthHeader";
//import { navigate } from "hookrouter";
//import { openDB } from "idb";

import { logout } from "../Tools";

const loginUser = async (credentials) => {
  const response = fetch("/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  }).then((data) => data.json());
  return response;
};

const setCurrentUser = async (setUser) => {
  const response = await fetch("/currentuser", { headers: authHeader() });
  const data = await response.json();
  setUser(data.data);
};

const checkIfPathNeededValidToken = async () => {
  const path = document.location.pathname;
  let tokenValidationNotNeeded = false;
  if (path.includes("/i")) {
    /* Invitation acceptance (public, no auth token needed)       */
    tokenValidationNotNeeded = true;
  } else if (path.includes("/forgotpwd")) {
    // Forgot Password. No auth token needed
    tokenValidationNotNeeded = true;
  } else if (path.includes("/tempcode")) {
    // Get magic temp code. No auth token needed
    tokenValidationNotNeeded = true;
  } else if (path.includes("/notificationsettingsbyemail")) {
    //user not validly logged in
    tokenValidationNotNeeded = true;
  }
  return tokenValidationNotNeeded;
};

const APIPost = async ({ model, api }) => {
  let myHeaders = authHeader();
  let tokenValidationNotNeeded = false;
  
  // *** TEMP WORK AROUND *** //
  //TODO: [ERP-78] Fix Temp Validation Work Around in Base.JS

  tokenValidationNotNeeded = true
  
  myHeaders = {
    ...myHeaders,
    "Content-Type": "application/json",
  };
  
  //TODO: [ERP-79] Fix this authentication work around in Base.js
 // tokenValidationNotNeeded = checkIfPathNeededValidToken();
  if ((myHeaders && myHeaders["x-access-token"]) || tokenValidationNotNeeded) {
    const response = await fetch(`/${api}`, {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(model),
    });
 
    const data = await response.json();
    
    if (
      data &&
      data.code &&
      data.code !== 200 &&
      data.code !== 201 &&
      data.code !== 202
    ) {
      console.log(`code: ${data.code}: ${data.message}`);
      
      if (data.code === 400) {
        // unauthorized
        logout();
        let path = document.location.pathname;
        path = path.replace("/", "");
        navigate(`/login/${path}`, true);
        return null;
      }
      if (data.code === 700) {
        // user has not yet validated email address
        logout();
        navigate("/tempcode/validemail", true);
        return null;
      }
    }
    return data;
  } else {
    console.log("Invalid or expired token.");
    return null;
  }
};

//let fetchingImages = false;
// NOTE:  THIS FUNCTION CALLED FROM: index.jsx, imagelist.jsx, ImaePicker.jsx
// and from base.fetchMyImage which is called once for each event card put down.
/* const fetchImages = async ({ returnData = false, imageId }) => {
  try {
    if (!fetchingImages || imageId) {
      fetchingImages = true;
      let returnArray = [];
      const today = new Date();
      const testDate = today.setDate(today.getDate());
      //const expireDate = new Date(today.setTime(today.getTime() + (2 * 60 * 60 * 1000))); // adding 2 hours
      let dataExpired = false;

      let db = await createDB();

      let dbcount = await db.count("images");

      let storedDate = localStorage.getItem("imageDate");

      let imagesAvailableInLocal = true;
      let dateModifiedExists = true;
      let lastImageDateFromServer = new Date();
      if (dbcount > 0 && storedDate) {
        if (storedDate && storedDate < testDate) {
          // we found data in local database
          // let's test the storedDate to see if update needed
          const mod = {};
          const dataTemp = await APIPost({
            model: mod,
            api: "lastimagedate",
          });
          if (dataTemp.data) {
            lastImageDateFromServer = dataTemp.data;
            if (storedDate < dataTemp.data) {
              // need to reload data from server
              dataExpired = true;
              // check for date_modified field for all item
              dateModifiedExists = await checkForDateModifiedField(db);
            }
          }
        }
      } else {
        imagesAvailableInLocal = false;
      }

      if (!imagesAvailableInLocal || !dateModifiedExists) {
        await deleteAndAddImagesInLocal();
      } else if (dataExpired && dateModifiedExists) {
        let imagesInLocal = await db.getAllFromIndex("images", "image_id");
        // sort images in local by date_modified
        let tempArray = imagesInLocal.sort(function (a, b) {
          return new Date(b.date_modified) - new Date(a.date_modified);
        });
        let lastImageDateInLocal = new Date(tempArray[0].date_modified);
        let lastImageTime = lastImageDateInLocal.setDate(
          lastImageDateInLocal.getDate()
        );
        // compare latest date_modified in local with latest date_modified from server
        if (lastImageTime < lastImageDateFromServer) {
          const model = {
            lastModifiedDateFromIDB: tempArray[0].date_modified,
          };
          // Fetch only latest images
          const tempData = await baseClient.APIPost({
            model: model,
            api: "getlatestimages",
          });
          if (tempData.data) {
            let rawData = tempData.data;
            for (let i = 0; i < rawData.length; i++) {
              const key = await db.getKeyFromIndex(
                "images",
                "image_id",
                rawData[i].image_id
              );
              if (key) {
                await db.delete("images", key);
              }
              await db.put("images", rawData[i]);
            }
          }
        }
        dbcount = await db.count("images");
        let imagesCountNotMatched = await checkForDeletedImages(dbcount);
        if (imagesCountNotMatched) {
          await deleteAndAddImagesInLocal();
        }
      }

      // reset localstorage imageDate for furture test
      // localStorage.setItem("imageDate", expireDate.setDate(expireDate.getDate())); 

      if (returnData) {
        if (imageId) {
          returnArray = await db.getFromIndex("images", "image_id", imageId);
        } else {
          returnArray = await db.getAllFromIndex("images", "image_id");
        }
      }
      fetchingImages = false;
      return returnArray;
    }
  } catch (err) {
    fetchingImages = false;
    console.error(err.message);
  }
}; */

/* const deleteMyDb = async () => {
  const db = await openDB("Radish", 1);
  if (db) {
    await db.clear("images");
  }
  return true;
}; */

/* const createDB = async () => {
  let db = await openDB("Radish", 1, {
    // SET UP LOCAL INDEX DB IF NOT EXISTS
    upgrade(db) {
      // Create a store of objects
      const store = db.createObjectStore("images", {
        // The 'id' property of the object will be the key.
        keyPath: "id",
        // If it isn't explicitly set, create a value by auto incrementing.
        autoIncrement: true,
      });
      // Create an index on the 'date' property of the objects.
      store.createIndex("image_id", "image_id");
    },
  });
  return db;
}; */

/* const deleteAndAddImagesInLocal = async () => {
  try {
    // delete local storate database
    await deleteMyDb();
    // we need to go database to get images
    const model = {};
    const tempData = await baseClient.APIPost({
      model: model,
      api: "getimages",
    });
    const db = await createDB();
    if (tempData.data) {
      let rawData = tempData.data;
      for (let i = 0; i < rawData.length; i++) {
        await db.add("images", rawData[i]);
      }
    }
  } catch (err) {
    console.error(err.message);
  }
}; */

/* const checkForDeletedImages = async (imageCountInLocal) => {
  try {
    let imagesCountNotMatched = false;
    const tempData = await baseClient.APIPost({
      api: "getimagescount",
    });
    if (tempData.data) {
      if (tempData.data !== imageCountInLocal) {
        imagesCountNotMatched = true;
      }
    }
    return imagesCountNotMatched;
  } catch (err) {
    console.error(err.message);
    return true;
  }
}; */

/* const checkForDateModifiedField = async (db) => {
  try {
    let dateModifiedExists = true;
    if (db) {
      let images = await db.getAllFromIndex("images", "image_id");
      for (let i = 0; i < images.length; i++) {
        if (!images[i].date_modified) {
          dateModifiedExists = false;
          break;
        }
      }
    } else {
      dateModifiedExists = false;
    }
    return dateModifiedExists;
  } catch (err) {
    console.error(err.message);
    return false;
  }
}; */

/* const fetchMyImage = async (imgId) => {
  // fetch images from local DB and return it (blob)
  const myImage = await fetchImages({ returnData: true, imageId: imgId });
  if (!myImage) {
    return "";
  } else {
    return myImage.image;
  }
}; */
/* const appendLocalImages = async (data) => {
  if (data) {
    // fetch images from local DB and append a row "image" to data
    // and return data with appended row
    for (let i = 0; i < data.length; i++) {
      data[i].image = await fetchMyImage(data[i].image_id);
    }
    return data;
  }
}; */

//TODO: [RAD-609] - While I merged this, I did ask for why they put here.  JEV 1-27-22
const getRecommendedFriends = async () => {
  try {
    const friends = await baseClient.APIPost({
      model: {},
      api: "recommendedfriends",
    });
    return friends;
  } catch (err) {
    console.error(err.message);
    return null;
  }
};
const baseClient = {
  loginUser,
  setCurrentUser,
  APIPost,
  //fetchImages,
  // fetchMyImage,
  //appendLocalImages,  
  getRecommendedFriends,
};
export default baseClient;
