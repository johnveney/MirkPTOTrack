const log = require("./logger.js").insertServerLogs;

const directory = "./client/public/Graphics/ImageDb/";

async function upsertImage(params, authUser) {
  try {
    const cid = crypto.randomBytes(16).toString("hex");
    const date = new Date();
    const imageID = params.image_id || cid;
    const isNew = params.image_id ? false : true;
    const query = { image_id: imageID };
    const version = params.image_id ? params.version : 1;
    const collection = db.collection("images");
    let fieldArray;
    if (params.date_deleted) {
      // DELETING IMAGE
      fieldArray = {
        date_deleted: date,
        deleted_by: authUser.data.person_id,
      };
    } else {
      fieldArray = {
        image: params.image,
        thumbnail: params.thumbnail,
        image_name: params.image_name,
        image_description: params.image_description,
        image_keywords: params.image_keywords,
        modified_by: authUser.data.person_id,
        date_modified: date,
        image_type: params.image_type,

        //personal: params.personal,
      };
      if (version) {
        fieldArray = {
          ...fieldArray,
          version: version,
        };
      }
    }
    if (!params.image_id) {
      fieldArray = {
        ...fieldArray,
        image_id: imageID,
        created_by: authUser.data.person_id,
        date_created: date,
      };
    }

    const setArray = { $set: fieldArray };
    const options = {
      upsert: true,
      // runValidators: true,
    };
    await collection.updateOne(query, setArray, options);
    const myDoc = await collection.findOne({ image_id: imageID });

    if (version && !isNew) {
      // delete previous version from directory
      const fileToDelete = `${directory}${imageID}.v${version - 1}.png`;
      await deleteFile(fileToDelete);
    }

    // write new file to directory
    if (version) {
      await writeImageFile(myDoc);
    }

    return myDoc;
  } catch (error) {
    log({
      level: "error",
      message: "Error while updating image",
      function: "upsertImage",
      error_code: 500,
      error_stack: error.stack,
    });
    return null;
  }
}

async function deleteImage(params) {
  // perminently delete. not a date_deleted type of delete
  try {
    const collection = db.collection("images");
    const myDoc = await collection.deleteOne({ image_id: params.image_id });
    return myDoc.deletedCount;
  } catch (error) {
    log({
      level: "error",
      message: "Error while deleting image",
      function: "deleteImage",
      error_code: 500,
      error_stack: error.stack,
    });
    return null;
  }
}

async function getImage(params) {
  try {
    let query = {
      image_id: params.image_id,
    };
    if (!params.image_id) {
      query = { image_name: "Generic1" };
    }

    const collection = db.collection("images");
    const myDoc = await collection.findOne(query);

    if (params.imageOnly) {
      return { image: myDoc.image, image_id: myDoc.image_id };
    }
    return myDoc;
  } catch (err) {
    log({
      level: "error",
      message: "Error while fetching image",
      function: "getImage",
      error_code: 500,
      error_stack: err.stack,
    });
    return null;
  }
}

async function getImages(params) {
  try {
    const excludeBase64Image = params.excludeImage;
    const collection = db.collection("images");
    let sortArray = {
      image_name: 1,
    };
    let matchArray = {
      date_deleted: { $eq: null },
    };
    let projectArray = {
      image_description: 1,
      image_type: 1,
      image_id: 1,
      image_keywords: 1,
      date_modified: 1,
      version: 1,
    };

    if (!excludeBase64Image) {
      projectArray = {
        ...projectArray,
        image: 1,
      };
    }

    const myDoc = await collection
      .find(matchArray)
      .project(projectArray)
      .sort(sortArray)
      .toArray();
    return myDoc;
  } catch (err) {
    log({
      level: "error",
      message: "Error while fetching images",
      function: "getImages",
      error_code: 500,
      error_stack: err.stack,
    });
    return null;
  }
}

async function getLatestImages(params) {
  try {
    const collection = db.collection("images");
    const lastModifiedDateFromIDB = new Date(params.lastModifiedDateFromIDB);
    let sortArray = {
      image_name: 1,
    };
    let matchArray = {
      date_deleted: { $eq: null },
      date_modified: { $gt: lastModifiedDateFromIDB },
    };
    const myDoc = await collection
      .find(matchArray)
      .project({
        image: 1,
        image_description: 1,
        image_type: 1,
        image_id: 1,
        image_keywords: 1,
        date_modified: 1,
      })
      .sort(sortArray)
      .toArray();
    return myDoc;
  } catch (err) {
    log({
      level: "error",
      message: "Error while fetching latest images",
      function: "getLatestImages",
      params: params,
      error_code: 500,
      error_stack: err.stack,
    });
    return null;
  }
}

async function getImagesCount() {
  try {
    const collection = db.collection("images");
    let matchArray = {
      date_deleted: { $eq: null },
    };
    const imagesCount = await collection.countDocuments(matchArray);
    return imagesCount;
  } catch (err) {
    log({
      level: "error",
      message: "Error while fetching images count",
      function: "getImagesCount",
      error_code: 500,
      error_stack: err.stack,
    });
    return null;
  }
}

async function lastImageDate(params) {
  try {
    const collection = db.collection("images");
    const myDoc = await collection
      .find()
      .sort({ date_modified: -1 })
      .project({ date_modified: 1 })
      .limit(1)
      .toArray();
    const myDate = new Date(myDoc[0].date_modified);
    const resp = myDate.setDate(myDate.getDate());
    return resp;
  } catch (err) {
    log({
      level: "error",
      message: "Error while last image date",
      function: "lastImageDate",
      error_code: 500,
      error_stack: err.stack,
    });
    return null;
  }
}
async function writeImageDBFiles() {
  try {
    let base64Data;
    const fs = require("fs");
    const path = require("path");
    const imageCollection = db.collection("images");
    const images = await imageCollection.find().toArray();
    let editStamp;
    //const directory = "./client/public/Graphics/ImageDb/";

    fs.readdir(directory, (err, files) => {
      if (err) throw err;

      for (const file of files) {
        fs.unlink(path.join(directory, file), (err) => {
          if (err) throw err;
        });
      }
    });

    images.map((image) => {
      base64Data = image.image;
      base64Data = base64Data.split(";base64,").pop();
      editStamp = `v${image.version}`; //moment(image.date_modified).format('MMDDYYYYHHmmss')

      fs.writeFile(
        `./client/public/Graphics/ImageDb/${image.image_id}.${editStamp}.png`,
        base64Data,
        "base64",
        function (err) {
          if (err) {
            console.log(err);
          }
        }
      );
    });
  } catch (err) {
    console.log(err.stack);
  }
}
const fsPromises = require("fs/promises");
async function deleteFile(filePath) {
  try {
    await fsPromises.unlink(filePath);
    console.log("Successfully removed file!");
  } catch (err) {
    console.log(err);
  }
}

async function writeImageFile(image) {
  try {
    let base64Data;
    const fs = require("fs");

    base64Data = image.image;
    base64Data = base64Data.split(";base64,").pop();
    editStamp = `v${image.version}`; //moment(image.date_modified).format('MMDDYYYYHHmmss')

    fs.writeFile(
      `${directory}${image.image_id}.${editStamp}.png`,
      base64Data,
      "base64",
      function (err) {
        if (err) {
          console.log(err);
        }
      }
    );
  } catch (err) {
    console.log(err.stack);
  }
}

module.exports = {
  upsertImage,
  deleteImage,
  getImage,
  getImages,
  getLatestImages,
  getImagesCount,
  lastImageDate,
  writeImageDBFiles,
};
