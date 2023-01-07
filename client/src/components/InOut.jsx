import React, { useCallback, useEffect, useRef, useState } from "react";
import { slideScreen } from "../Tools";
import baseClient from "../api/Base";
import teamchat from "../graphics/Teams-24x24.png";
import newemail from "../graphics/email.png";
import newphone from "../graphics/phone.png";
import InOutRow from "./InOutRow";

function InOut() {
  const [inOutBoard, setInOutBoard] = useState();
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
      const model = {};
      const myInOutBoard = await baseClient.APIPost({
        model: model,
        api: "inoutboard",
      });
     
      if (myInOutBoard.data) {
        setInOutBoard(myInOutBoard.data);
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
          Employee Status Board

        </h2>
      </header>
      {loading ? (
        <div className="dot-bricks"></div>
      ) : (
        <div ref={wrapper} className="body p-2 fade-in">
          <div  className="rtable table-2">
            <div rtablerow>
                              <div className="rtablehead col1">Employee</div>
                <div className="rtablehead col2 td_status">Status</div>
                <div className="rtablehead col3">Contact</div>
                <div className="rtablehead col4">Notes</div>
              </div>
            

              <div className="rtablerow location" colSpan={colspan}>
                <div className="rtablecell">CORPORATE</div>
              </div>
            
           
             {inOutBoard && inOutBoard.length >0 ? (
              
              <div >
               {inOutBoard.map((inOutBoard, index) => 
               (
              
                <InOutRow
               userId={`${index}`}
               lastName={`${inOutBoard.LastName}`}
                firstName={`${inOutBoard.FirstName}`}
                cell={`${inOutBoard.Cell}`}
                email={`${inOutBoard.Email}`}
                status={`${inOutBoard.Status}`}
                location={`${inOutBoard.Location}`}
                notes={`${inOutBoard.Notes}`} 
                reverse={`${inOutBoard.Reverse}`}
              />

              
             )
             )}  
             </div>
             ):
             (<div>{`{errMessage}`}</div>)} 

         {/*   {inOutBoard.map((inOutBoard, index) => (
                 <InOutRow
                 id={`${inOutBoard.UserId}`}
                lastName={`${d.LastName}`}
                 firstName={`${d.FirstName}`}
                 cell={`${d.Cell}`}
                 email={`${d.Email}`}
                 status={`${d.Status}`}
                 location={`${d.Location}`}
                 notes={`${d.Notes}`} 
               />
              ))}  */}
          
              {/* <InOutRow
                id="1"
                lastName="Baker"
                firstName="Tina"
                cell="330-123-1234"
                email="bakert@gmail.com"
                status="hi"
                location="woo"
                notes="the quick fox"
              /> */}
             {/*  <tr>
                <td className="td_first">Baker, Tina</td>
                <td className="td_status">Vacation</td>
                <td className="td_contact">
                  <a
                    className="contact_anchor"
                    target="tbakerchat"
                    title="Chat via Teams"
                    href="https://teams.microsoft.com/l/chat/0/0?users=bakert@mirkinc.us"
                  >
                    <img
                      src={teamchat}
                      className="radish-icon-24"
                      alt="start team chat"
                    />
                  </a>
                  <a
                    className="contact_anchor"
                    title="Moble call"
                    href="tel:330-641-2303"
                  >
                    <img
                      src={newphone}
                      className="radish-icon-24"
                      alt="start mobile call"
                    />
                  </a>
                  <a
                    className="contact_anchor"
                    title="Send email"
                    href="mailto:bakert@mirkinc.us"
                  >
                    <img
                      src={newemail}
                      className="radish-icon-24"
                      alt="start new email"
                    />
                  </a>
                </td>
                <td>Out Until 12/5</td>
              </tr>
              <tr className="tr_reverse">
                <td>Thut, Mike</td>
                <td className="td_status">In Office</td>
                <td className="td_contact">
                  <a
                    className="contact_anchor"
                    target="tbakerchat"
                    title="Chat via Teams"
                    href="https://teams.microsoft.com/l/chat/0/0?users=bakert@mirkinc.us"
                  >
                    <img
                      src={teamchat}
                      className="radish-icon-24"
                      alt="start team chat"
                    />
                  </a>
                  <a
                    className="contact_anchor"
                    title="Moble call"
                    href="tel:330-641-2303"
                  >
                    <img
                      src={newphone}
                      className="radish-icon-24"
                      alt="start mobile call"
                    />
                  </a>
                  <a
                    className="contact_anchor"
                    title="Send email"
                    href="mailto:bakert@mirkinc.us"
                  >
                    <img
                      src={newemail}
                      className="radish-icon-24"
                      alt="start new email"
                    />
                  </a>
                </td>
                <td></td>
              </tr>
              <tr>
                <td>Thut, Shirley</td>
                <td className="td_status">Vacation</td>
                <td></td>
                <td>
                  Out Until 12/5
                  <a
                    target="tbakerchat"
                    href="https://teams.microsoft.com/l/chat/0/0?users=bakert@mirkinc.us"
                  >
                    Chat
                  </a>
                </td>
              </tr>
              <tr className="tr_reverse">
                <td>Veney, John</td>
                <td className="td_status">Remote</td>
                <td></td>
                <td>
                  At home until 9:00 In about 10:00 Cell:
                  <a href="tel:330-641-2303">330-641-2303</a>
                  <a
                    target="jveneychat"
                    href="https://teams.microsoft.com/l/chat/0/0?users=veneyj@mirkinc.us"
                  >
                    <img src="https://mirkinc.sharepoint.com/:i:/s/MirkIntranet/EcxnP490AxVOumHFGLLy-oEBZRVVUuQLSQCCj2fHXuBmGg?e=MzwnnR" />
                  </a>
                </td>
              </tr>

              <tr className="location">
                <td colSpan={colspan}>ORRVILLE OHIO</td>
              </tr>

              <tr>
                <td>I, Brian</td>
                <td className="td_status">In Office</td>
                <td></td>
                <td></td>
              </tr>
              <tr className="tr_reverse">
                <td>Friday, Chris</td>
                <td className="td_status">Customer Delivery</td>
                <td></td>
                <td>Delivering Truck to xyz Company</td>
              </tr>
              <tr>
                <td>S, Jamie</td>
                <td className="td_status">In Office</td>
                <td></td>
                <td></td>
              </tr>
              <tr className="tr_reverse">
                <td>Thut, Brock</td>
                <td className="td_status">In Office</td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>Z, Rick</td>
                <td className="td_status">In Office</td>
                <td></td>
                <td></td>
              </tr>
              <tr className="location">
                <td colSpan={colspan}>BARTOW FLORIDA</td>
              </tr>
              <tr>
                <td>Cox, Kat</td>
                <td className="td_status">In Office</td>
                <td></td>
                <td></td>
              </tr>
              <tr className="tr_reverse">
                <td>Darby, Beth</td>
                <td className="td_status">In Office</td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>Haas, Bill</td>
                <td className="td_status">In Office</td>
                <td></td>
                <td></td>
              </tr>
              <tr className="location">
                <td colSpan={colspan}>WAUKEGAN ILLINOIS</td>
              </tr>
              <tr>
                <td>A, Daniel</td>
                <td className="td_status">In Office</td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>H, James</td>
                <td className="td_status">In Office</td>
                <td></td>
                <td></td>
              </tr> */}
        
          </div>
        </div>
      )}
    </div>
  );
}
export default InOut;
