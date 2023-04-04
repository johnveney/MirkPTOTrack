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
  const lastName = useRef();
  const firstName = useRef();
  const status = useRef();
  const teamsID = useRef();
  const email = useRef();
  const cellPhone = useRef();
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
          <h1>End-User License Agreement (&quot;Agreement&quot;)</h1>
          <p>Last updated: January 14, 2022</p>
          <p className="p-top-1">
            Please read this End-User License Agreement carefully before
            clicking the &quot;I Agree&quot; button, downloading or using
            RadishApp.
          </p>
          <form ref={form1} noValidate className="center p-top2">
            <label htmlFor="firstName" className="m-top-05">
              <div className="brand-overline">First Name*</div>
              <input
                ref={firstName}
                id="firstName"
                name="first_name"
                type="text"
                className="center"
                placeholder="First Name"
                /* defaultValue={contactInfo?.first_name} */
                autoFocus
                required
                onBlur={(e) => {
                  checkRequired(e);
                }}
                onChange={() => {
                  setCase(firstName, "upper");
                }}
              />
            </label>
            <label htmlFor="lastName" className="m-top-05">
              <div className="brand-overline">Last Name*</div>
              <input
                ref={lastName}
                id="lastName"
                name="last_name"
                type="text"
                className="center"
                placeholder="Last Name"
                /* defaultValue={contactInfo?.last_name} */
                autoFocus
                required
                onBlur={(e) => {
                  checkRequired(e);
                }}
                onChange={() => {
                  setCase(lastName, "upper");
                }}
              />
            </label>
            <label htmlFor="status" className="m-top-05">
              <div className="brand-overline">Status*</div>
              <input
                ref={status}
                id="statusName"
                name="status"
                type="text"
                className="center"
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
            <label htmlFor="teamsID" className="m-top-05">
              <div className="brand-overline">Teams ID*</div>
              <input
                ref={teamsID}
                id="teamsID"
                name="teamsID"
                type="text"
                className="center"
                placeholder="Teams ID"
                /* defaultValue={contactInfo?.last_name} */
                autoFocus
                required
                onBlur={(e) => {
                  checkRequired(e);
                }}
                onChange={() => {
                  setCase(teamsID, "upper");
                }}
              />
            </label>
            <label htmlFor="email" className="m-top-05">
              <div className="brand-overline">Email*</div>
              <input
                ref={email}
                id="email"
                name="email"
                type="text"
                className="center"
                placeholder="Eamil"
                /* defaultValue={contactInfo?.last_name} */
                autoFocus
                required
                onBlur={(e) => {
                  checkRequired(e);
                }}
                onChange={() => {
                  setCase(email, "upper");
                }}
              />
            </label>
            <label htmlFor="cellPhone" className="m-top-05">
              <div className="brand-overline">Cell Phone*</div>
              <input
                ref={cellPhone}
                id="cellPhone"
                name="cellPhone"
                type="text"
                className="center"
                placeholder="Cell Phone"
                /* defaultValue={contactInfo?.last_name} */
                autoFocus
                required
                onBlur={(e) => {
                  checkRequired(e);
                }}
                onChange={() => {
                  setCase(cellPhone, "upper");
                }}
              />
            </label>
            <label htmlFor="notes" className="m-top-05">
              <div className="brand-overline">Notes</div>
              <textarea
                ref={notes}
                id="notes"
                name="notes"
                type="text"
                className="center"
                rows="2"
                cols="50"
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
