import {  useState } from "react";
//import baseClient from "../api/Base";
import PopUp from "./PopUp";
import EditStatus from "./EditStatus";

import teamchat from "../graphics/Teams-24x24.png";
import newemail from "../graphics/email.png";
import newphone from "../graphics/phone.png";

function InOutRow({
  userId = "",
  lastName = "",
  firstName = "",
  cell = "",
  email = "",
  status = "",
  notes = "",
  reverse = false,
}) {
  const { showEditStatus, setShowEditStatus } = useState(true);

const   setState = () => {
    alert("hi");
    setShowEditStatus(true);
  }; 
  

  const results = (
    <div className="rtablerow" id={userId}>
      <div>
        {showEditStatus  ? (
          <PopUp
            title="Add Group"
            //stateFunction={setShowAddGroup}
            component={
              <EditStatus
                /*  orgId={orgID} */
                fnClose={() => {
                  setShowEula(null);
                }}
              />
            }
          />
        ) : null}
      </div>
      {/* <div className={`rtablecell col1 ${reverse ? "tr_reverse" : ""}`}> */}
      <div className={`rtablecell col1`}>
        Show Edit Status: {showEditStatus}
        {lastName},&nbsp;{firstName}
      </div>
      <div className={`rtablecell col2 td_status  `}>
        {status}
        <div className="p-05">
          <button
            type="button"
            className="link-alike"
            onClick={() => {
              setState();
              //setShowEditStatus(true);
            }}
          >
            <i className="fa fa-edit neutral-5" />
          </button>
        </div>
      </div>
      <div className={`rtablecell col3 td_contact `}>
        <a
          className="contact_anchor"
          target={`${userId}chat`}
          title="Chat via Teams"
          href={`https://teams.microsoft.com/l/chat/0/0?users=${email}`}
        >
          <img
            src={teamchat}
            className="radish-icon-24"
            alt={`Start Team Chat with ${firstName}`}
          />
        </a>
        <a className="contact_anchor" title="Moble call" href={`tel:${cell}`}>
          <img
            src={newphone}
            className="radish-icon-24"
            alt={`Start Mobile Call to ${cell}`}
          />
        </a>
        <a
          className="contact_anchor"
          title="Send email"
          href={`mailto:${email}`}
        >
          <img
            src={newemail}
            className="radish-icon-24"
            alt={`Start New Email to ${firstName}`}
          />
        </a>
      </div>
      <div className={`rtablecell col4 td_notes `}>{notes}</div>
    </div>
  
  );

  return(results)
  
}
export default InOutRow;
