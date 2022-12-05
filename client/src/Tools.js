import moment from "moment-timezone";
//import { Convert } from "mongo-image-converter";

export function logout() {
  localStorage.setItem("token", null);
}

export function VisibilityText(permissionArray = []) {
  let responseArray = [];

  if (permissionArray.indexOf("invited") > -1) {
    responseArray.push("Invitees");
  }
  if (permissionArray.indexOf("anyone with link") > -1) {
    responseArray.push("Anyone w/Code");
  }
  if (permissionArray.indexOf("friends") > -1) {
    responseArray.push("My Friends");
  }
  if (permissionArray.indexOf("organization") > -1) {
    responseArray.push(`Anyone in Org`);
  }
  if (permissionArray.indexOf("group") > -1) {
    responseArray.push(`Anyone in Group`);
  }
  
  return responseArray;
}

export function isMobileTablet() {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );

}

export function urlify(text, callBack) {
  let urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
  //var urlRegex = /(https?:\/\/[^\s]+)/g;
  let resp;
  resp = text.replace(urlRegex, function (url, b, c) {
    var url2 = c === "www." ? "http://" + url : url;
    return '<a href="' + url2 + '" target="_blank">' + url + "</a>";
  });
  callBack(resp);
}

export function UseFetch(url) {
  let response = [];

  const fetchAbstracts = () => {
    fetch(url, {
      //fetch dates
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })
      .then((data) => data.json())
      .then((data) => (response = data));
  };

  fetchAbstracts();
  return response;
}

export function addRemoveClass(
  ref = null,
  className = "",
  delay = 0,
  callBack = () => null
) {
  if (ref) {
    setTimeout(function () {
      const element = ref.current;
      if (element) {
        element.className = className;
      }
      callBack();
    }, delay);
  }
}

export function isValidDate(date) {
  return (
    date &&
    Object.prototype.toString.call(date) === "[object Date]" &&
    !isNaN(date)
  );
}

export function getDateTagText(dateVal) {
  // returns something like: "Tomorrow" or "Tuesday" or "A Week From Tomorrow"
  // if more than 8 days in future returns date string like "May 4 2022"
  // else returns "Past Event"
  try {
    const myDate = new Date(dateVal);
    /*  const date = new Date(
       `${
         shortMonthNames[myDate.getMonth()]
       }/${myDate.getDate()}/${myDate.getFullYear()}`
     ); */
    const date = new Date(moment(myDate).format("MM/DD/YYYY"));
    if (!isValidDate(date)) {
      return null;
    }
    const today = new Date();
    const tempDiff = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    const dayOfWeek = moment(date).format("dddd");
    let result = "";
    if (tempDiff < 0) {
      console.log("past");
      result = "Past Event";
      return result;
    }
    const dateDiff = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    switch (dateDiff) {
      case 0:
        result = "Today";
        break;
      case 1:
        result = "Tomorrow";
        break;
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
        result = dayOfWeek;
        break;
      case 7:
        result = `Next ${dayOfWeek}`;
        break;
      case 8:
        result = "A week from tomorrow";
        break;
      default:
        if (dateDiff > 180) {
          result = moment(date).format("MMM-DD-YYYY");
        } else {
          result = moment(date).format("MMMM Do");
        }
        break;
    }

    return result.toUpperCase();
  } catch (err) {
    console.log(err.message);
    return null;
  }
}

export function getDayOfWeek(date) {
  const dayOfWeek = new Date(date).getDay();
  return isNaN(dayOfWeek)
    ? null
    : [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ][dayOfWeek];
}

export function getQueryParam(strParam) {
  const urlParams = new URLSearchParams(window.location.search);
  let myParam = "";
  if (strParam && strParam.length > 0) {
    myParam = urlParams.get(strParam);
  }
  return myParam;
}

export function checkRequired(e, len) {
  const ref = e.target ? e.target : e;
  //check IsNullOrWhiteSpace
  if (
    ref.required &&
    (ref.value == null ||
      ref.value.match(/^\s*$/) !== null ||
      (len !== null && ref.value.length < len))
  ) {
    ref.classList.add("required");
    return false;
  } else {
    ref.classList.remove("required");
    return true;
  }
}

export function getFormModel(myForm, myModel, setLoading) {
  let model = myModel;
  for (let i = 0; i < myForm.length; i++) {
    let el = myForm[i];
    let key = el.name;
    let obj = {};
    if (key.length > 0) {
      if (!checkRequired(el)) {
        if (setLoading) {
          setLoading(false);
        }
        return false;
      }
      obj[key] = el.value;
      model = {
        ...model,
        [key]: el.value,
      };
    }
  }
  return model;
}



export function validateEmail(email) {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

export function validateDomain(domain) {
  const re =
    /^((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  return re.test(domain);
}

export function extractDomain(domain) {
  const re = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:?\n]+)$/;
  return re.exec(domain);
}

export function strengthChecker({ strengthDisp, matchDisp, newPassword }) {
  const strengthBadge = strengthDisp;
  const matchBadge = matchDisp;
  const PasswordParameter = newPassword;
  const strongPassword = new RegExp(
    "(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})"
  );
  const mediumPassword = new RegExp(
    "((?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{6,}))|((?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9])(?=.{8,}))"
  );

  if (PasswordParameter.length > 0) {
    if (strongPassword.test(PasswordParameter)) {
      strengthBadge.style.color = "green";
      strengthBadge.textContent = "Strong. Excellent!";
      matchBadge.style.color = "green";
      return true;
    } else if (mediumPassword.test(PasswordParameter)) {
      strengthBadge.style.color = "blue";
      strengthBadge.textContent = "Medium. Okay.";
      matchBadge.style.color = "blue";
      return true;
    } else {
      strengthBadge.style.color = "red";
      strengthBadge.textContent = "Too weak.";
      return false;
    }
  } else {
    return false;
  }
}

export function strengthChecks({
  strengthDisp,
  matchDisp,
  newPassword,
  lengthBox,
  upperBox,
  numBox,
  symbBox,
}) {
  const strengthBadge = strengthDisp;
  const matchBadge = matchDisp;
  const PasswordParameter = newPassword;
  const hasUpper = new RegExp("(?=.*[A-Z])");
  const hasNum = new RegExp("(?=.*[0-9])");
  const hasSymb = new RegExp("(?=.*[^A-Za-z0-9])");
  const strongPassword = new RegExp(
    "(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})"
  );
  const mediumPassword = new RegExp(
    "((?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{6,}))|((?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9])(?=.{8,}))"
  );

  const checkBox = (reg, ref) => {
    if (reg.test(PasswordParameter)) {
      ref.classList.add("good");
    } else {
      ref.classList.remove("good");
    }
  };

  if (PasswordParameter.length > 0) {
    if (PasswordParameter.length > 7) {
      lengthBox.classList.add("good");
    } else {
      lengthBox.classList.remove("good");
    }
    checkBox(hasUpper, upperBox);
    checkBox(hasNum, numBox);
    checkBox(hasSymb, symbBox);

    if (strongPassword.test(PasswordParameter)) {
      strengthBadge.style.color = "green";
      strengthBadge.title = "Strong. Excellent!";
      matchBadge.style.color = "green";
      return true;
    } else if (mediumPassword.test(PasswordParameter)) {
      strengthBadge.style.color = "blue";
      strengthBadge.title = "Medium. Okay.";
      matchBadge.style.color = "blue";
      return true;
    } else {
      strengthBadge.style.color = "red";
      strengthBadge.title = "Too weak.";
      return false;
    }
  } else {
    return false;
  }
}

export function fadeIn(ref) {
  if (ref) {
    setTimeout(ref.classList.add("fade-in"), 400);
  }
}

export function copyInputText(ref, copyButtonRef, copyMessageRef) {
  const myLink = ref.current;
  myLink.disabled = false;
  myLink.select();
  myLink.setSelectionRange(0, 99999); /* For mobile devices */
  document.execCommand("copy");
  if (window.getSelection) {
    window.getSelection().removeAllRanges();
  } else if (document.selection) {
    document.selection.empty();
  }
  myLink.disabled = true;
  if (copyButtonRef && copyMessageRef) {
    copyButtonRef.current.classList.add("hidden");
    copyMessageRef.current.classList.remove("hidden");
    setTimeout(() => {
      copyButtonRef.current.classList.remove("hidden");
      copyMessageRef.current.classList.add("hidden");
    }, 2000);
  }
}

export function grabVScroll(el) {
  const slider = el;
  let isDown = false;
  let startX;
  let scrollLeft;

  slider.addEventListener("mousedown", (e) => {
    isDown = true;
    slider.classList.add("grabbing");
    startX = e.pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
  });
  slider.addEventListener("mouseleave", () => {
    isDown = false;
    slider.classList.remove("grabbing");
  });
  slider.addEventListener("mouseup", () => {
    isDown = false;
    slider.classList.remove("grabbing");
  });
  slider.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 3; //scroll-fast
    slider.scrollLeft = scrollLeft - walk;
  });
}

export function grabVScrollH(el) {
  const slider = el;
  let isDown = false;
  let startY;
  let scrollTop;

  slider.addEventListener("mousedown", (e) => {
    isDown = true;
    slider.classList.add("grabbing");
    startY = e.pageY - slider.offsetTop;
    scrollTop = slider.scrollTop;
  });
  slider.addEventListener("mouseleave", () => {
    isDown = false;
    slider.classList.remove("grabbing");
  });
  slider.addEventListener("mouseup", () => {
    isDown = false;
    slider.classList.remove("grabbing");
  });
  slider.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const y = e.pageY - slider.offsetTop;
    const walk = (y - startY) * 3; //scroll-fast
    slider.scrollTop = scrollTop - walk;
  });
}

export async function shareLink(link, title, message) {
  try {
    const shareData = {
      title: title || "Radish",
      text: message || "Join me on Radish",
      url: link,
    };
    await navigator.share(shareData);
  } catch (err) {
    console.log(`Share error: ${err.message}`);
  }
}

export function eachWordToUpper(sentence) {
  try {
    return sentence.replace(/\w\S*/g, function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1);
    });
  } catch (err) {
    return sentence;
  }
}

export function parseStandardTime(time) {
  try {
    time = time.split(":"); // convert to array

    // fetch
    let hours = Number(time[0]);
    let minutes = Number(time[1]);

    // calculate
    let timeValue;

    if (hours > 0 && hours <= 12) {
      timeValue = "" + hours;
    } else if (hours > 12) {
      timeValue = "" + (hours - 12);
    } else if (hours === 0) {
      timeValue = "12";
    }

    timeValue += minutes < 10 ? ":0" + minutes : ":" + minutes; // get minutes
    timeValue += hours >= 12 ? " PM" : " AM"; // get AM/PM
    return timeValue;
  } catch {
    return time;
  }
}

export const shortDateTime = (date) => {
  // returns friendly short date time string
  // ex: Wed Jul 28 2021 5:00 PM
  return date
    ? new Date(date).toDateString() +
    " " +
    parseStandardTime(
      `${new Date(date).getHours().toString().padStart(2, "0")}:00`
    )
    : null;
};

export const daySpread = (date1, date2) => {
  // returns difference in days between two dates
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const shortMonthNames = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

export const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const shortDayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export const slideScreen = (outerRef, innerRef, fnLoading, callBack) => {
  const outerRefTime = 0;
  const innerRefTime = 700;
  const loadingTime = 500;
  if (outerRef && innerRef) {
    if (fnLoading) {
      setTimeout(() => {
        fnLoading(false);
      }, loadingTime);
    }
    setTimeout(() => {
      outerRef.classList.add("slide-left");
    }, outerRefTime);
    if (fnLoading) {
      setTimeout(() => {
        fadeIn(innerRef.current);
        outerRef.classList.add("transparent");
      }, innerRefTime);
    }
    if (callBack) {
      setTimeout(() => {
        callBack();
      }, innerRefTime);
    }
  }
};

export function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function priceLevel(level) {
  let resp = "";
  for (let i = 0; i < level; i++) {
    resp = resp + "$";
  }
  return resp;
}

export const getAllFriends = async (data, setAllFriends, setErrMessage) => {
  try {
    let allFriendsGroup = {};
    allFriendsGroup = [
      {
        ...allFriendsGroup,
        group_id: "all",
        group_name: "All Friends",
        membersCount: data.length,
        group_members: data,
      },
    ];
    setAllFriends(allFriendsGroup);
  } catch (err) {
    setErrMessage("Snap! There was an error creating  All-Friends list.");
    console.log(err.message);
  }
};

export const getNiceDate = (date) => {
  if (date) {
    const today = new Date().toLocaleDateString();
    const returnDate = new Date(date).toLocaleDateString();
    if (returnDate === today) {
      return "Today";
    } else {
      return returnDate;
    }
  } else {
    return "";
  }
};

export const maxEventDate = (event) => {
  // takes all the possible proposed (and final) dates for an event
  // and returns the max possible date. If there is a final date,
  // return final date even if not the max.
  try {
    const date1 = event.proposed_date1 ? new Date(event.proposed_date1) : null;
    const date2 = event.proposed_date2 ? new Date(event.proposed_date2) : null;
    const finaldate = event.final_start_date
      ? new Date(event.final_start_date)
      : null;
    const time1 = event.proposed_time1
      ? Date.parse(`01/01/1999 ${event.proposed_time1}`)
      : null;
    const time2 = event.proposed_time2
      ? Date.parse(`01/01/1999 ${event.proposed_time2}`)
      : null;
    let maxDate = new Date();
    if (finaldate) {
      maxDate = finaldate;
    } else if (date1 && date2) {
      maxDate = new Date(Math.max(date1, date2));
    } else if (date1) {
      maxDate = date1;
    } else {
      maxDate = null;
    }
    if (!maxDate) {
      return null;
    }
    let maxTime = new Date();
    if (time1 && time2) {
      maxTime = new Date(Math.max(time1, time1));
    } else if (time1) {
      maxTime = new Date(time1);
    } else if (time2) {
      maxTime = new Date(time2);
    } else {
      maxTime = null;
    }
    const maxDateString = `${maxDate.getMonth() + 1
      }/${maxDate.getDate()}/${maxDate.getFullYear()}`;
    const maxTimeString = `${maxTime
      ? maxTime.getHours().toLocaleString("en-US", {
        minimumIntegerDigits: 2,
        useGrouping: false,
      }) +
      ":" +
      maxTime.getMinutes().toLocaleString("en-US", {
        minimumIntegerDigits: 2,
        useGrouping: false,
      })
      : "00:00"
      }`;
    const officialMaxDate = `${maxDateString} ${maxTimeString}`;
    return new Date(officialMaxDate);
  } catch (err) {
    console.log(err.message);
  }
};

export const calcRSVPDeadline = (event, days) => {
  // takes all event proposed date time options,
  // figures out the max possible
  // subtracts days from max to get response rsvp deadline
  // returns full iso date string, ex: Wed Jul 28 2021 17:00:00 GMT-0400 (Eastern Daylight Time)
  try {
    const maxDate = maxEventDate(event);
    if (!maxDate) {
      return null;
    }
    let returnDate = new Date(maxDate);
    returnDate = new Date(returnDate.setDate(returnDate.getDate() - days));
    return returnDate.toString();
  } catch (err) {
    console.log(err.message);
  }
};

export const forceLower = (refCurrent) => {
  refCurrent.value = refCurrent.value.toLowerCase();
};

export const getBase64FromUrl = async (url) => {
  const data = await fetch(url);
  const blob = await data.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64data = reader.result;
      resolve(base64data);
    };
  });
};

export const getEventUserStatus = (eventData) => {
  //This helper function returns a display status / tag to event or event cards.
  let rsvpStatus = eventData.inviteeRec?.rsvp_status || "sent";
  let displayStatus = !eventData.status ? "Draft" : eventData.status;

  //Valid Result Status: "Declined", "DRAFT", "Going", "Locked", "MAYBE", "LIKELY", "RSVP", "VOTE"
  if (!eventData.pastEvent) {
    // Event not in the past
    switch (displayStatus) {
      case "Draft": //Result: "DRAFT"
        displayStatus = "DRAFT";
        break;
      case "Voting": //Result: "LIKELY", "MAYBE" or "VOTE"
        displayStatus =
          rsvpStatus === "likely" ||
            rsvpStatus === "maybe" ||
            rsvpStatus === "virtually"
            ? eachWordToUpper(rsvpStatus)
            : rsvpStatus === "yes"
              ? `Going${rsvpStatus === "virtually" ? " Virtually" : ""}`
              : rsvpStatus === "no"
                ? "You Declined"
                : rsvpStatus === "remote" || rsvpStatus === "present"
                  ? "You Attended"
                  : rsvpStatus === "absent"
                    ? "You Did Not Attend"
                    : "Please VOTE";
        break;
      case "RSVP": //Result:  "RSVP", "Going", "Declined"  (Why not all UPPER CASE?)
        displayStatus =
          rsvpStatus === "sent" ||
            rsvpStatus === "maybe" ||
            rsvpStatus === "likely" ||
            rsvpStatus === "opened"
            ? "Please RSVP"
            : rsvpStatus === "yes" || rsvpStatus === "virtually"
              ? `Going${rsvpStatus === "virtually" ? " Virtually" : ""}`
              : rsvpStatus === "no"
                ? "You Declined"
                : rsvpStatus === "remote" || rsvpStatus === "present"
                  ? "You Attended"
                  : "You Did Not Attend";
        break;
      case "Locked": //Result: "Going", "Declined", "Locked"  (Why not all UPPER CASE?)
        displayStatus =
          rsvpStatus === "yes" || rsvpStatus === "virtually"
            ? `Going${rsvpStatus === "virtually" ? " Virtually" : ""}`
            : rsvpStatus === "no"
              ? "You Declined"
              : rsvpStatus === "remote" || rsvpStatus === "present"
                ? "You Attended"
                : "You Did Not Attend";
        break;
      default:
        //Result: DRAFT
        displayStatus = "DRAFT";
        break;
    }
  } else {
    //Event is in past, deal with tags
    //TODO: [RAD-470] Determine what TAG to return to the event when the event is in the past.

    displayStatus = "PAST";
  }
  return displayStatus;
};

export const getEventFinalDisplayDate = (finalStartDate, finalEndDate) => {
  let returnDisplay = "";
  let tempStart = moment(finalStartDate)
    //.tz(moment.tz.guess())
    .format("ddd, MMM Do [from] h:mm a");
  let sameDay = moment(moment(finalStartDate).format("YYYY-MM-DD")).isSame(
    moment(finalEndDate).format("YYYY-MM-DD"),
    "day"
  );
  let sameMonth = moment(moment(finalStartDate).format("YYYY-MM-DD")).isSame(
    moment(finalEndDate).format("YYYY-MM-DD"),
    "month"
  );
  let tempEnd = moment(finalEndDate).format("[ to ] h:mm a");
  if (!sameDay && !sameMonth) {
    tempEnd = moment(finalEndDate).format("[ to ] ddd, MMM Do [ at ] h:mm a");
  } else if (!sameDay) {
    // is same month
    tempEnd = moment(finalEndDate).format(
      "[ to ] ddd [ the ] Do [ at ]  h:mm a"
    );
  }
  returnDisplay = tempStart + tempEnd;
  return returnDisplay;
};
export const getEventDisplayDate = (eventData, short) => {
  let returnArray = [];
  let strTemp = "";
  /*  if (eventData.final_start_date && !short) {
     returnArray.push(
       getEventFinalDisplayDate(
         eventData.final_start_date,
         eventData.final_end_date
       )
     );
     return returnArray;
   } */
  const formatProposedDate = (dtDate, dtEndDate, genTime) => {
    strTemp = moment(dtDate).format(
      `${short ? "dddd, MMM Do" : "dddd, MMMM Do"}`
    );
    if (genTime) {
      strTemp += ` in the ${genTime}`;
    } else {
      if (!short) {
        strTemp += ` from ${moment(dtDate).format(
          "h:mm a"
        )} to `;
        if (
          moment(dtDate).format("YYYYDDD") !== moment(dtEndDate).format("YYYYDDD")
        ) {
          //is multi-day
          strTemp += `${moment(dtEndDate).format(
            `${short ? "ddd, MMM Do" : "dddd, MMMM Do"} [ at ] h:mm a`
          )}`;
        } else {
          // is NOT multi-day
          strTemp += moment(dtEndDate).format("h:mm a");
        }
      } else {
        strTemp += ` at ${moment(dtDate).format("h:mm a")}`;
      }

    }
    returnArray.push(strTemp);
  };
  if (eventData.final_start_date) {
    formatProposedDate(
      eventData.final_start_date,
      eventData.final_end_date,
    );
  } else {
    if (eventData.proposed_date1) {
      formatProposedDate(
        eventData.proposed_date1,
        eventData.proposed_end_date1,
        eventData.proposed_general1
      );
    }
    if (eventData.proposed_date2) {
      formatProposedDate(
        eventData.proposed_date2,
        eventData.proposed_end_date2,
        eventData.proposed_general2
      );
    }
  }
  return returnArray;
};
