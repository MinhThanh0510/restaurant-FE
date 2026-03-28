import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import "./Home.css";

function Home() {
  const navigate = useNavigate();
  const [featuredMenus, setFeaturedMenus] = useState([]);
  const [reviewsData, setReviewsData] = useState({ reviews: [], avgRating: 0, total: 0 });

  const [searchParams, setSearchParams] = useState({
    date: "",
    time: "19:00",
    guests: 2
  });

  const timeSlots = ["17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const menuRes = await api.get("/menus");
        const allItems = menuRes.data.data.reduce((acc, cat) => [...acc, ...cat.items], []);
        const uniqueItems = Array.from(new Map(allItems.map(item => [item._id, item])).values());
        setFeaturedMenus(uniqueItems.slice(0, 3));

        const reviewRes = await api.get("/reviews");
        setReviewsData({
          reviews: reviewRes.data.reviews.slice(0, 3),
          avgRating: reviewRes.data.avgRating,
          total: reviewRes.data.total
        });
      } catch (err) {
        console.error("Fetch data error:", err);
      }
    };
    fetchData();
  }, []);

  const renderStars = (rating) => "★".repeat(rating) + "☆".repeat(5 - rating);

  const handleQuickSearch = (e) => {
    e.preventDefault();
    if (!searchParams.date) return alert("Please select a date!");
    navigate(`/reservation?date=${searchParams.date}&time=${searchParams.time}&guests=${searchParams.guests}`);
  };

  return (
    <div className="home-container">
      {/* ===== HERO SECTION ===== */}
      <section className="hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <span className="hero-subtitle">Welcome to Excellence</span>
          <h1>Taste the Luxury</h1>
          <p>An unforgettable dining experience awaits you in the heart of the city.</p>

          <form className="quick-search-box glass-panel" onSubmit={handleQuickSearch}>
            <div className="search-field">
              <label>Date</label>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={searchParams.date}
                onChange={(e) => setSearchParams({ ...searchParams, date: e.target.value })}
                required
              />
            </div>
            <div className="search-divider"></div>
            <div className="search-field">
              <label>Time</label>
              <select value={searchParams.time} onChange={(e) => setSearchParams({ ...searchParams, time: e.target.value })}>
                {timeSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
              </select>
            </div>
            <div className="search-divider"></div>
            <div className="search-field">
              <label>Guests</label>
              <input
                type="number" min="1" max="20"
                value={searchParams.guests}
                onChange={(e) => setSearchParams({ ...searchParams, guests: parseInt(e.target.value) })}
                required
              />
            </div>
            <button type="submit" className="btn-search-primary">Book Table</button>
          </form>
        </div>
      </section>

      {/* ===== SIGNATURE MENU ===== */}
      <section className="home-section home-menu">
        <div className="section-header">
          <span className="gold-subtitle">Culinary Art</span>
          <h2 className="section-title">Our Signature Dishes</h2>
          <div className="title-separator"></div>
        </div>

        <div className="featured-grid">
          {featuredMenus.map(item => (
            <div key={item._id} className="featured-card">
              <div className="card-img-wrapper">
                <img src={item.image || "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg"} alt={item.name} />
              </div>
              <div className="featured-card-content">
                <div className="card-text-top">
                  <h4>{item.name}</h4>
                  <span className="featured-price">${item.price.toLocaleString()}</span>
                </div>
                <p>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== REVIEWS ===== */}
      <section className="home-section home-reviews">
        <div className="section-header">
          <span className="gold-subtitle">Testimonials</span>
          <h2 className="section-title">Guest Experiences</h2>
          <div className="title-separator"></div>
        </div>

        {reviewsData.total > 0 ? (
          <>
            <div className="reviews-summary">
              <span className="avg-rating">{Number(reviewsData.avgRating || 0).toFixed(1)}</span>
              <div className="stars-outer">{renderStars(Math.round(Number(reviewsData.avgRating || 0)))}</div>
              <p className="total-reviews">Based on {reviewsData.total} reviews</p>
            </div>

            <div className="reviews-grid">
              {reviewsData.reviews.map((rev) => {
                const userName = rev.userId?.fullName || "Valued Guest";
                const userInitial = userName.charAt(0).toUpperCase();

                return (
                  <div key={rev._id} className="review-card glass-panel">
                    <div className="quote-mark">"</div>
                    <div className="review-stars">{renderStars(rev.rating)}</div>
                    <p className="review-comment">{rev.comment}</p>

                    <div className="review-footer">
                      <div className="review-avatar">{userInitial}</div>
                      <span className="review-user">{userName}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p className="empty-reviews">No reviews yet. Be the first to visit us!</p>
        )}
      </section>
    </div>
  );
}

export default Home;