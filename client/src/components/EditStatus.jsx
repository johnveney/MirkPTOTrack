import React, { useEffect, useRef, useState } from "react";
import { slideScreen } from "../Tools";

function EditStatus({ userID = "" }) {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState([]);
  const wrapper = useRef(null);
  const outerWrapper = useRef(null);

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
        </div>
      )}
    </div>
  );
}
export default EditStatus;
