import { useEffect, useRef } from "react";

function PopUp({
  component = null,
  stateFunction = null,
  title = "",
  customClass,
  fromFooter,
  onClose,
}) {
  const headerbarRef = useRef(null);
  const wrapper = useRef();
  const popbody = useRef();

  useEffect(() => {
    let timer;
    let timer2;
    if (wrapper.current) {
      wrapper.current.classList.add("slide-open");
      if (popbody.current) {
        timer2 = setTimeout(() => {
          popbody.current.scrollTop = 0;
        }, 1000);
      }
    }
    if (headerbarRef.current) {
      timer = setTimeout(() => {
        headerbarRef.current.classList.add("fixed");
      }, 500);
    }

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, []);

  function closeRules() {
    headerbarRef.current.classList.remove("fixed");
    wrapper.current.classList.add("slide-down");
    setTimeout(() => {
      if(onClose) {
        onClose();
      }
      stateFunction(false);
    }, 500);
  }

  return (
    <div ref={wrapper} className="sheen2">
      {/* SHEEN */}
      {/*  <div className={`sheen2 fade fade-in`}></div> */}
      <div className="pop-up">
        <div
          data-id="headerbar"
          ref={headerbarRef}
          className="popup-header-bar b-bottom-1"
        >
          <div className="flex-align-items-center p-1">
            <div className="flex-1 large-font ellipsis p-right-1">{title}</div>

            {stateFunction ? (
              <button
                type="button"
                className="pop-close"
                onClick={() => {
                  closeRules();
                }}
              >
                <i
                  role="button"
                  id="popclose"
                  data-id="close"
                  className="fas fa-times"
                />
              </button>
            ) : null}

          </div>
        </div>
        <div
          ref={popbody}
          className={`body ${customClass ? customClass : ""} ${fromFooter ? "from-footer" : ""
            }`}
        >
          {component}
        </div>
      </div>
    </div>
  );
}
export default PopUp;
