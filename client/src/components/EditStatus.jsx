import React, { useEffect, useRef, useState } from "react";
import { slideScreen } from "../Tools";
//import Dropdown from "Components/FormControls/Dropdown";

function EditStatus({ userID = "" }) {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState([]);
  const wrapper = useRef(null);
  const outerWrapper = useRef(null);

  const uid = userID;
  const form1 = useRef();
  /* const lastName = useRef(); */
  /* const firstName = useRef(); */
  const status = useRef(); 
  /* const teamsID = useRef(); */
  /* const email = useRef(); */
  /* const cellPhone = useRef(); */
  const notes = useRef();

  useEffect(() => {
    const getData = async () => {
      //ADD DATA CALL STUFF HERE
      setLoading(true);
      //GO GET DATA...

      //HANDLE SLIDEIN
      slideScreen(outerWrapper.current, wrapper, setLoading);
    };
    getData();
  }, []);

  return (
    <div ref={outerWrapper} className="main-panel p-bottom-4 bg-neutral-1 ">
      <header className="p-1 p-top-2 flex-align-items-center bg-white">
        <h2>
          <button
            type="button"
            title="Go back to home"
            className="back-chevron"
            onClick={() => {
              setTimeout(function () {
                outerWrapper.current.classList.add("slide-right-off");
              }, 0);
              setTimeout(function () {
                window.history.back(0);
              }, 100);
            }}
          >
            <span className="fas fa-chevron-left m-right-1"></span>
          </button>{" "}
          Edit Status
        </h2>
      </header>
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
                /* defaultValue={contactInfo?.last_name} */
                autoFocus
                required
                onBlur={(e) => {
                  checkRequired(e);
                }}
                onChange={() => {
                  setCase(status, "upper");
                }}
              />
              {/* <div>
                  <Dropdown
                    options={typeTagsList}
                    onSelect={reloadOrgs}
                    selected={selectedType}
                  />
                </div> */}
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
                placeholder="Notes"
                /* defaultValue={contactInfo?.last_name} */
                autoFocus
                required
                onBlur={(e) => {
                  checkRequired(e);
                }}
                onChange={() => {
                  setCase(notes, "upper");
                }}
              />
            </label>
          </form>
        </div>
      )}
    </div>
  );
}
export default EditStatus;
