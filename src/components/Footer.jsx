import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
    return (
        <footer className="footer-wrapper">
            {/* ===== MAIN FOOTER GRID ===== */}
            <div className="footer-main">
                {/* Cột 1: Brand Info */}
                <div className="footer-col brand-col">
                    <Link to="/" className="footer-logo">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>
                            <path d="M7 2v20"></path>
                            <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>
                        </svg>
                        <span>L'Aura</span>
                    </Link>
                    <p className="brand-desc">
                        A symphony of tastes. Experience the pinnacle of fine dining in the heart of the city, where every dish is a crafted masterpiece.
                    </p>
                </div>

                {/* Cột 2: Contact */}
                <div className="footer-col">
                    <h4>Contact Us</h4>
                    <ul className="footer-list info-list">
                        <li>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            <span>123 Culinary Ave, District 1, HCMC</span>
                        </li>
                        <li>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                            <span>+84 123 456 789</span>
                        </li>
                        <li>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2-2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                            <span>reservations@laura.com</span>
                        </li>
                    </ul>
                </div>

                {/* Cột 3: Hours */}
                <div className="footer-col">
                    <h4>Opening Hours</h4>
                    <ul className="footer-list hours-list">
                        <li><span>Mon - Thu:</span> <span>17:00 - 21:30</span></li>
                        <li><span>Fri - Sun:</span> <span>17:00 - 22:30</span></li>
                        <li className="hours-note">Dress Code: Smart Casual</li>
                    </ul>
                </div>

                {/* Cột 4: Quick Links */}
                <div className="footer-col">
                    <h4>Quick Links</h4>
                    <ul className="footer-list link-list">
                        <li><Link to="/menu">Our Menu</Link></li>
                        <li><Link to="/reservation">Book a Table</Link></li>
                        <li><Link to="/my-reservations">My Reservations</Link></li>
                        <li><Link to="/login">Sign In</Link></li>
                    </ul>
                </div>
            </div>

            {/* ===== BOTTOM FOOTER ===== */}
            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} L'Aura Fine Dining. All rights reserved.</p>
                <div className="social-links">
                    <a href="#" aria-label="Facebook">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                    </a>
                    <a href="#" aria-label="Instagram">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                    </a>
                    <a href="#" aria-label="Twitter">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
                    </a>
                </div>
            </div>
        </footer>
    );
}

export default Footer;