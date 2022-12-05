import logo from "../graphics/RadishIcon.png";

function PageNotFound() {
    return (
        <>
            <div className="bg-neutral-1 fade fade-in">
                <>
                    <div className="m-4">
                        <img src={logo} className="radish-icon-medium" alt="radish" />
                    </div>
                    {/* <h1 className="m-2">404 Error</h1> */}
                    <h1 className="m-2">Sorry, requested page not found</h1>
                    <div className="p-bottom-1">
                        <div className="m-bottom-1">
                            <button
                                type="button"
                                className="button-save"
                                title="Go Home"
                                onClick={(e) => {
                                    e.preventDefault();
                                    window.location.href = "/";
                                }}
                            >
                                Continue to Home
                            </button>
                        </div>
                    </div>
                </>
            </div>
        </>
    );
}

export default PageNotFound;
