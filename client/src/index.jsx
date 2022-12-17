import {
  Suspense,
  lazy,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import ReactDOM from "react-dom";
//const outerWrapper = useRef(null);
const PageNotFound = lazy(() => import("./components/PageNotFound"));
const EULA = lazy(() => import("./components/EULA"));
const InOut = lazy(() => import("./components/InOut"));
//import { useRoutes } from "hookrouter";
//import routes from "Router";
//import EULA from "components/EULA";
import "./variables.css";
import "./App.css";
import "./MobileApp.css";
import "./Tools.css";
import "./Overrides.css";
//import { AppContextProvider } from "Context/AppContext.jsx";
//import { AppContext } from "Context/AppContext";
//import { useRoutes } from "hookrouter";
//import routes from "Router";
//import { logout } from "Tools.js";
//import useToken from "useToken";
//import baseClient from "API/Base";
//import moment from "moment-timezone";
//import WelcomeUser from "Components/MobileApp/WelcomeUser";
//import RateEvent from "Components/Public/RateEvent";
//import SignUp from "Components/Public/SignUp";
//const Login = lazy(() => import("Components/Login"));
//const ForgotPwd = lazy(() => import("Components/ForgotPwd"));
//const Tempcode = lazy(() => import("Components/Tempcode"));
//const LeftMenu = lazy(() => import("Components/LeftMenu"));
//const FooterMenu = lazy(() => import("Components/MobileApp/FooterMenu"));
//const FriendAccept = lazy(() => import("Components/Public/FriendAccept"));
/* const NotificationSettings = lazy(() =>
  import("Components/MobileApp/UserSettings/NotificationSettings")
); */
//const PageNotFound = lazy(() => import("Components/PageNotFound"));

/* function ComponentWrapper({ component }) {
  return (
    <div ref={outerWrapper} className="mobile">
      <div ref={appWrapper} id="app-wrapper" className="radish-mobile">
        <Suspense fallback={<span></span>}>{component}</Suspense>
      </div>
    </div>
  );
}
<ComponentWrapper component={<PageNotFound />} />; */

function MainArea() {
  return (
    <div>
      <div>Hello Dave ! </div>
      <div id="data">
        <Suspense fallback={<span>error</span>}>
          <PageNotFound />
           <InOut /> 
        </Suspense>
      </div>
    </div>
  );
}

function MainArea2() {
  return (
    <div ref={outerWrapper} className="mobile">
      <div ref={appWrapper} id="app-wrapper" className="radish-mobile">
        <Suspense fallback={<span></span>}>
          <LeftMenu orgID={activeOID} />
          {routeResult}
        </Suspense>
        {mainScreens.indexOf(document.location.pathname) > -1 ? (
          <Suspense fallback={<span></span>}>
            <PageNotFound />
          </Suspense>
        ) : null}
      </div>
    </div>
  );
}

function MainArea1() {
  const routeResult = useRoutes(routes);
  const { token } = useToken();
  const { currentUser, setUser } = useContext(AppContext);
  const [badUser, setBadUser] = useState(false);
  const [invFriend, setInvFriend] = useState(false);
  const [forgotPwd, setForgotPwd] = useState();
  const [activeOID, setActiveOID] = useState();
  const [tempCode, setTempCode] = useState();
  const [personId, setPersonId] = useState();
  const [rateEvent, setRateEvent] = useState();
  const [notificationSettings, setNotificationSettings] = useState();
  const [welcomeNeeded, setWelcomeNeeded] = useState();
  const [signUp, setSignUp] = useState();
  const { adminOrgLink } = useContext(AppContext);
  const appWrapper = useRef(null);
  const outerWrapper = useRef(null);

  const mainScreens = [
    "/mobilehome",
    "/myevents",
    "/newevent",
    "/friends",
    "/mystuff",
    "/",
  ];

  if (appWrapper.current && outerWrapper.current) {
    if (document.location.pathname.indexOf("o-") > -1) {
      appWrapper.current.classList.remove("radish-mobile");
      outerWrapper.current.classList.remove("mobile");
    } else {
      appWrapper.current.classList.add("radish-mobile");
      outerWrapper.current.classList.add("mobile");
    }
  }

  const resetUser = useCallback(async () => {
    await baseClient.setCurrentUser(setUser);
  }, [setUser]);

  useEffect(() => {
    const path = document.location.pathname;

    if (currentUser && currentUser.person_id && path !== "/welcomeuser") {
      let needsWelcome = true;
      if (currentUser.hints) {
        for (let i = 0; i < currentUser.hints.length; i++) {
          if (currentUser.hints[i] === "WelcomeUser") {
            needsWelcome = false;
          }
        }
      }
      if (currentUser.is_temp || needsWelcome) {
        setWelcomeNeeded(true);
      } else {
        setWelcomeNeeded(false);
      }
    } else {
      setWelcomeNeeded(false);
    }
    if (path === "/i") {
      /* Invitation acceptance (public, no auth token needed)       */
      setInvFriend(true);
    } else if (path === "/rateevent") {
      //rateevent?uid=9ccaa9c88a1507830615a3eabc8ae81a&e=18e7518a7c86adcd0111010f4ce2db35
      setRateEvent(true);
    } else if (path === "/forgotpwd") {
      // Forgot Password. No auth token needed
      setForgotPwd(true);
    } else if (path === "/tempcode") {
      // Get magic temp code. No auth token needed
      setTempCode(true);
    } else if (path === "/signup") {
      //Public Sign Up Page. No auth token needed
      setSignUp(true);
    } else if (path.includes("/notificationsettingsbyemail")) {
      // Get notification preferences page. No auth token needed
      // Get person id from path
      const splittedPath = path.split("notificationsettingsbyemail")[1];
      if (splittedPath) {
        const personId = splittedPath.split("/")[1];
        setPersonId(personId);
      }
      setNotificationSettings(true);
    } else if (!token) {
      //user not validly logged in
      logout();
      setBadUser(true);
    } else {
      /* authorized user logged in */
      setBadUser(false);

      const resetUser = async () => {
        await baseClient.setCurrentUser(setUser);
      };

      if (token && (!currentUser || !currentUser.person_id)) {
        // if user context empty, reload context with current user
        resetUser();
      }
      if (adminOrgLink) {
        setActiveOID(adminOrgLink);
      }
    }
  }, [currentUser, setUser, token, adminOrgLink, resetUser]);

  if (currentUser && currentUser.person_id) {
    // CAN'T BE IN USEEFFECT BECAUSE CURRENT USER DOES NOT CHANGE MUCH
    // CHECKING TO SEE IF TIME TO LOAD IDB WITH IMAGES
    const today = new Date();
    /* const testDate = today.setDate(today.getDate());

    let imageDate = localStorage.getItem("imageDate");
    if (!imageDate || imageDate < testDate) {
      const fetchMyImages = async () => {
        await baseClient.fetchImages({ returnData: false, imageId: null });
        // reset localstorage imageDate for furture test
        const expireDate = new Date(
          today.setTime(today.getTime() + 2 * 60 * 60 * 1000)
        ); // adding 2 hours
        localStorage.setItem(
          "imageDate",
          expireDate.setDate(expireDate.getDate())
        );
      };
      fetchMyImages();
    } */

    //TEST FOR CURRENT USER REFRESH
    if (currentUser.last_fetched) {
      const lastDate = new Date(moment(currentUser.last_fetched).add(1, "h"));
      const testMyDate = new Date(moment(today));
      if (lastDate < testMyDate) {
        resetUser();
      }
    }
  }

  function ComponentWrapper({ component }) {
    return (
      <div ref={outerWrapper} className="mobile">
        <div ref={appWrapper} id="app-wrapper" className="radish-mobile">
          <Suspense fallback={<span></span>}>{component}</Suspense>
        </div>
      </div>
    );
  }

  if (invFriend) {
    /* this is a public friend invitation acceptance. no auth needed */
    return <ComponentWrapper component={<FriendAccept />} />;
  }

  if (rateEvent) {
    // this is public. no auth needed
    return <ComponentWrapper component={<RateEvent />} />;
  }
  if (forgotPwd) {
    /* forgot password. no auth needed */
    return <ComponentWrapper component={<ForgotPwd />} />;
  }

  if (tempCode) {
    /* temp login code. no auth needed */
    return <ComponentWrapper component={<Tempcode />} />;
  }

  if (signUp) {
    /* temp login code. no auth needed */
    return <ComponentWrapper component={<SignUp />} />;
  }

  if (notificationSettings) {
    /* notification preferences. no auth needed */
    return (
      <ComponentWrapper
        component={<NotificationSettings personId={personId} />}
      />
    );
  }
  if (badUser) {
    /* this is not an authenticated user */
    return (
      <ComponentWrapper
        component={<Login path={document.location.pathname} />}
      />
    );
  }
  if (welcomeNeeded && mainScreens.indexOf(document.location.pathname) > -1) {
    return <ComponentWrapper component={<WelcomeUser />} />;
  }

  if (!routeResult) {
    /* Redirect to PageNotFound for bad routes */
    return <ComponentWrapper component={<PageNotFound />} />;
  }

  return (
    <div ref={outerWrapper} className="mobile">
      <div ref={appWrapper} id="app-wrapper" className="radish-mobile">
        <Suspense fallback={<span></span>}>
          <LeftMenu orgID={activeOID} />
          {routeResult}
        </Suspense>
        {mainScreens.indexOf(document.location.pathname) > -1 ? (
          <Suspense fallback={<span></span>}>
            <FooterMenu />
          </Suspense>
        ) : null}
      </div>
    </div>
  );
}

ReactDOM.render(
  /*  <AppContextProvider>
     <MainArea />
   </AppContextProvider>, */
  /*   <EULA />, */
  <MainArea />,
  document.getElementById("root")
);
