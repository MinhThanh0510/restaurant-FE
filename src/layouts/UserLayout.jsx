import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Chatbox from "../components/user/Chatbox";
import PageLoader from "../components/PageLoader";
import ScrollToTop from "../components/ScrollToTop";

function UserLayout() {
    return (
        <div className="user-layout-wrapper" style={{ minHeight: "100vh", backgroundColor: "#0a0a0a" }}>
            <PageLoader />

            <Navbar />

            <main className="user-main-content">
                <Outlet />
            </main>

            <Footer />

            <ScrollToTop />
            <Chatbox />
        </div>
    );
}

export default UserLayout;