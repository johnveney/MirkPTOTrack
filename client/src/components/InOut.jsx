import React, { useEffect, useRef, useState } from "react";
import { slideScreen } from "../Tools";
import teamchat from "../graphics/Teams-24x24.png";
import newemail from "../graphics/email.png";
import newphone from "../graphics/phone.png";

function InOut() {
  const [loading, setLoading] = useState(false);
  const wrapper = useRef(null);
  const outerWrapper = useRef(null);
  const colspan = 4;

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
          Employee Status Board
        </h2>
      </header>
      {loading ? (
        <div className="dot-bricks"></div>
      ) : (
        <div ref={wrapper} className="body p-2 fade-in">
          <table class="table-2">
            <thead>
              <tr>
                <th>Employee</th>
                <th class="td_status">Status</th>
                <th>Contact</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr class="location" colspan={colspan}>
                <td colspan={colspan}>CORPORATE</td>
              </tr>
              <tr>
                <td class="td_first">Baker, Tina</td>
                <td class="td_status">Vacation</td>
                <td class="td_contact">
                  <a
                    class="contact_anchor"
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
                    class="contact_anchor"
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
                    class="contact_anchor"
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
              <tr class="tr_reverse">
                <td>Thut, Mike</td>
                <td class="td_status">In Office</td>
                <td class="td_contact">
                  <a
                    class="contact_anchor"
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
                    class="contact_anchor"
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
                    class="contact_anchor"
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
                <td class="td_status">Vacation</td>
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
              <tr class="tr_reverse">
                <td>Veney, John</td>
                <td class="td_status">Remote</td>
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

              <tr class="location">
                <td colspan={colspan}>ORRVILLE OHIO</td>
              </tr>

              <tr>
                <td>I, Brian</td>
                <td class="td_status">In Office</td>
                <td></td>
                <td></td>
              </tr>
              <tr class="tr_reverse">
                <td>Friday, Chris</td>
                <td class="td_status">Customer Delivery</td>
                <td></td>
                <td>Delivering Truck to xyz Company</td>
              </tr>
              <tr>
                <td>S, Jamie</td>
                <td class="td_status">In Office</td>
                <td></td>
                <td></td>
              </tr>
              <tr class="tr_reverse">
                <td>Thut, Brock</td>
                <td class="td_status">In Office</td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>Z, Rick</td>
                <td class="td_status">In Office</td>
                <td></td>
                <td></td>
              </tr>
              <tr class="location">
                <td colspan={colspan}>BARTOW FLORIDA</td>
              </tr>
              <tr>
                <td>Cox, Kat</td>
                <td class="td_status">In Office</td>
                <td></td>
                <td></td>
              </tr>
              <tr class="tr_reverse">
                <td>Darby, Beth</td>
                <td class="td_status">In Office</td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>Haas, Bill</td>
                <td class="td_status">In Office</td>
                <td></td>
                <td></td>
              </tr>
              <tr class="location">
                <td colspan={colspan}>WAUKEGAN ILLINOIS</td>
              </tr>
              <tr>
                <td>A, Daniel</td>
                <td class="td_status">In Office</td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>H, James</td>
                <td class="td_status">In Office</td>
                <td></td>
                <td></td>
              </tr>
  
            </tbody>
          
          </table>
        </div>
      )}
    </div>
  );
}
export default InOut;
