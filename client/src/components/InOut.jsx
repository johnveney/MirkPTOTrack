import React, { useCallback, useEffect, useRef, useState } from "react";
//import { slideScreen } from "../Tools";
import baseClient from "../api/Base";
import InOutRow from "./InOutRow";

function InOut() {
  const [inOutBoard, setInOutBoard] = useState();
  const [corp, setCorp] = useState();
  const [orrville, setOrrville] = useState();
  const [florida, setFlorida] = useState();
  const [illinois, setIllinois] = useState();
  const [loading, setLoading] = useState(true);
  const [errMessage, setErrMessage] = useState();
  const wrapper = useRef(null);
  const outerWrapper = useRef(null);
  // const [errorMsg] = useState(null);
  const colspan = 4;
  // const [iReverse, setIReverse]=0;

  const getInoutBoard = useCallback(async () => {
    try {
      //mainWrapper.current.classList.remove("fade-in");
      setLoading(true);
      //  setAddPlaceType(false);
      //  setPlaceTypeId(null);
      const model = {
        //aLocation : "CORPORATE",
        //aLocation: "ORRVILLE OHIO",
      };
      const myInOutBoard = await baseClient.APIPost({
        model: model,
        api: "inoutboard",
      });

      if (myInOutBoard.data) {
        setInOutBoard(myInOutBoard.data);
        setCorp(myInOutBoard.corp);
        setOrrville(myInOutBoard.orrville);
        setFlorida(myInOutBoard.florida);
        setIllinois(myInOutBoard.illinois);
      }
      if (myInOutBoard.message && myInOutBoard.message !== "ok") {
        console.error(myInOutBoard.message);
        setErrMessage(myInOutBoard.message);
      }
      setTimeout(() => {
        setLoading(false);
        //fadeIn(mainWrapper.current);
      }, 400);
    } catch (err) {
      setErrMessage(err.message);
      setTimeout(() => {
        setLoading(false);
        //  fadeIn(mainWrapper.current);
      }, 400);
    }
  }, []);

  useEffect(() => {
    try {
      getInoutBoard();
    } catch (err) {
      console.error(err.message);
      setErrMessage(err.message);
    }
  }, [getInoutBoard]);

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
          Employee&nbsp;Status&nbsp;Board
        </h2>
        <button
            type="button"
            title="Refresh this page"
            className="refresh-link"
            onClick={() => {
              setTimeout(function () {
                window.location.reload();
              }, 0);
              
            }}
          >
            <span className="fa fa-refresh m-left-1"></span>
          </button>
      </header>
      {loading ? (
        <div className="dot-bricks"></div>
      ) : (
        <div ref={wrapper} className="body p-1-pct fade-in">
          <div className="rtable table-2">
            <div rtablerow>
              <div className="rtablehead col1 padding-top-1-pct">Employee</div>
              <div className="rtablehead col2 td_status padding-top-1-pct">Status</div>
              <div className="rtablehead col3 padding-top-1-pct">Contact</div>
              <div className="rtablehead col4 padding-top-1-pct">Notes</div>
            </div>

            <div className="rtablerow location">
              <div className="rtablecell locName">CORPORATE</div>
            </div>

            {corp && corp.length > 0 ? (
              <div>
                {corp.map((corp, index) => (
                  <InOutRow
                    key={`a${index}`}
                    userId={`a${index}`}
                    lastName={`${corp.LastName}`}
                    firstName={`${corp.FirstName}`}
                    cell={`${corp.Cell}`}
                    email={`${corp.Email}`}
                    status={`${corp.Status}`}
                    notes={`${corp.Notes}`}
                    reverse={`${corp.Reverse}`}
                  />
                ))}
              </div>
            ) : (
              <div>{`{errMessage}`}</div>
            )}

            <div className="rtablerow location">
              <div className="rtablecell locName">ORRVILLE OHIO</div>
            </div>

            {orrville && orrville.length > 0 ? (
              <div>
                {orrville.map((orrville, index) => (
                  <InOutRow
                    key={`b${index}`}
                    userId={`b${index}`}
                    lastName={`${orrville.LastName}`}
                    firstName={`${orrville.FirstName}`}
                    cell={`${orrville.Cell}`}
                    email={`${orrville.Email}`}
                    status={`${orrville.Status}`}
                    notes={`${orrville.Notes}`}
                    reverse={`${orrville.Reverse}`}
                  />
                ))}
              </div>
            ) : (
              <div>{`{errMessage}`}</div>
            )}

            <div className="rtablerow location">
              <div className="rtablecell locName">BARTOW FLORIDA</div>
            </div>

            {florida && florida.length > 0 ? (
              <div>
                {florida.map((florida, index) => (
                  <InOutRow
                    key={`c${index}`}
                    userId={`c${index}`}
                    lastName={`${florida.LastName}`}
                    firstName={`${florida.FirstName}`}
                    cell={`${florida.Cell}`}
                    email={`${florida.Email}`}
                    status={`${florida.Status}`}
                    notes={`${florida.Notes}`}
                    reverse={`${florida.Reverse}`}
                  />
                ))}
              </div>
            ) : (
              <div>{`{errMessage}`}</div>
            )}

            <div className="rtablerow location">
              <div className="rtablecell locName">WAUKEGAN ILLINOIS</div>
            </div>

            {illinois && illinois.length > 0 ? (
              <div>
                {illinois.map((illinois, index) => (
                  <InOutRow
                    key={`d${index}`}
                    userId={`d${index}`}
                    lastName={`${illinois.LastName}`}
                    firstName={`${illinois.FirstName}`}
                    cell={`${illinois.Cell}`}
                    email={`${illinois.Email}`}
                    status={`${illinois.Status}`}
                    notes={`${illinois.Notes}`}
                    reverse={`${illinois.Reverse}`}
                  />
                ))}
              </div>
            ) : (
              <div>{`{errMessage}`}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default InOut;
