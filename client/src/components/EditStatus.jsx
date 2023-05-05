import React, { useEffect, useRef, useState } from "react";
import baseClient from "../api/Base";
import { slideScreen } from "../Tools";
//import Dropdown from "Components/FormControls/Dropdown";

function EditStatus({ userID = "", aStatus = "", aNotes = "" }) {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState([]);
  const [dirty, setDirty] = useState();
  const wrapper = useRef(null);
  const outerWrapper = useRef(null);

  const uid = userID;
  const form1 = useRef();
  const status = useRef(aStatus);
  const notes = useRef();

  useEffect(() => {
    const getData = async () => {
      //ADD DATA CALL STUFF HERE
      setLoading(true);
      //GO GET DATA...
      const model = {
        UserId: uid,
      };
      const myStatus = await baseClient.APIPost({
        model: model,
        api: "personstatus",
      });
      if (myStatus.data) {
        const data = myStatus.data;
        setUser(data);
      }
      //HANDLE SLIDEIN
      slideScreen(outerWrapper.current, wrapper, setLoading);
    };
    getData();
  }, []);

  const handleExit = async () => {
    
    
      setTimeout(function () {
        //outerWrapper.current.classList.add("slide-right-off");
      }, 0);
      setTimeout(function () {
        //  navigate(`/group/${groupId}`);
        window.location.reload();
      }, 10);
    
  };

  return (
    <div ref={outerWrapper} className="main-panel p-bottom-4 bg-neutral-1 ">
      {loading ? (
        <div className="dot-bricks"></div>
      ) : (
        <div ref={wrapper} className="body p-2 fade-in">
          <p className="p-bottom-1">
            Update your status and click the update button below.
          </p>
          <form ref={form1} noValidate className="p-top2">
            <label htmlFor="status" className="m-top-05">
              <div className="brand-overline">Status*</div>
              <input
                ref={status}
                id="statusName"
                name="status"
                type="text"
                placeholder="Status"
                defaultValue={user?.Status}
                autoFocus
                required
                onChange={() => {
                  //setCase(status, "upper");
                  setDirty(true);
                }}
              />
              {/*  <div>
                  <Dropdown
                    options={typeTagsList}
                    onSelect={reloadOrgs}
                    selected={selectedType}
                  />
                </div>  */}
            </label>

            <label htmlFor="notes" className="m-top-05">
              <div className="brand-overline">Notes</div>
              <textarea
                ref={notes}
                id="notes"
                name="notes"
                type="text"
                rows="2"
                cols="75"
                placeholder="Enter Any Necessary Notes"
                defaultValue={user?.Notes}
               /*  autoFocus */
                required
                onChange={() => {
                  //setCase(notes, "upper");
                  setDirty(true);
                }}
              />
            </label>
            <div className="m-top-1">
              <button
                type="button"
                className="button button-teal"
                onClick={() => {
                  goStep(2);
                }}
              >
                Save
              </button>
              <button
                type="button"
                className="button button-red"
                onClick={() => {
                 // if (!dirty) {
                  handleExit();
                 // } else {
                 //   alert("Dirty")
                 // }
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
export default EditStatus;
