import { useState, useEffect } from "react";
import api from "../api";
import { toast } from "react-toastify";
import "./AdminReviews.css";

function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, avgRating: 0 });

  // Bộ lọc
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRating, setFilterRating] = useState("all");

  const fetchReviews = async (isManual = false) => {
    setLoading(true);
    try {
      const res = await api.get("/reviews/admin");
      setReviews(res.data.reviews || []);
      setStats({ total: res.data.total, avgRating: res.data.avgRating });
      
      if (isManual) toast.success("Reviews synchronized!");
    } catch (error) {
      toast.error("Failed to load reviews.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // ====== XỬ LÝ ẨN/HIỆN REVIEW ======
  const handleToggleHide = async (id, currentStatus) => {
    const actionText = currentStatus ? "unhide" : "hide";
    if (window.confirm(`Are you sure you want to ${actionText} this review from the public?`)) {
      try {
        const res = await api.put(`/reviews/${id}/toggle-hide`);
        toast.success(res.data.message);
        fetchReviews(); // Load lại data
      } catch (err) {
        toast.error(err.response?.data?.message || "Error updating review visibility.");
      }
    }
  };

  // ====== XỬ LÝ XÓA REVIEW ======
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this review?")) {
      try {
        await api.delete(`/reviews/${id}`);
        toast.success("Review deleted successfully!");
        fetchReviews();
      } catch (err) {
        toast.error(err.response?.data?.message || "Error deleting review.");
      }
    }
  };

  // Vẽ sao (Stars)
  const renderStars = (rating) => {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  };

  // ====== LỌC DỮ LIỆU ======
  const filteredReviews = reviews.filter(rev => {
    const matchRating = filterRating === "all" || rev.rating === parseInt(filterRating);
    const searchLower = searchTerm.toLowerCase();
    const matchSearch = !searchTerm || 
      rev.userId?.fullName?.toLowerCase().includes(searchLower) ||
      rev.reservationId?.bookingCode?.toLowerCase().includes(searchLower) ||
      rev.comment?.toLowerCase().includes(searchLower);

    return matchRating && matchSearch;
  });

  return (
    <div className="admin-rev-wrapper">
      <div className="admin-rev-header">
        <h3>Review & Feedback Management</h3>
      </div>

      <div className="admin-rev-actions">
        <div className="filter-group-inline">
          <input 
            type="text" 
            placeholder="Search by customer, booking code, or comment..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rev-search-input"
          />
          <select 
            value={filterRating} 
            onChange={(e) => setFilterRating(e.target.value)} 
            className="rev-filter-select"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
        
        <button className="btn-refresh" onClick={() => fetchReviews(true)} disabled={loading}>
          {loading ? (
            <svg className="spin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
          )}
          Refresh
        </button>
      </div>

      <div className="stats-bar">
        Total Reviews: <b className="text-gold">{stats.total}</b> | 
        Average Rating: <b className="text-gold">{stats.avgRating} / 5.0 ★</b>
      </div>

      <div className="admin-table-container">
        {loading ? <p className="loading-text">Loading reviews...</p> : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer / Booking</th>
                <th>Rating & Comment</th>
                <th>Visibility</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.length === 0 ? (
                <tr><td colSpan="5" className="empty-cell">No reviews found.</td></tr>
              ) : (
                filteredReviews.map(rev => (
                  <tr key={rev._id} className={`table-row ${rev.isHidden ? 'row-hidden' : ''}`}>
                    <td className="text-muted" style={{whiteSpace: "nowrap"}}>
                      {new Date(rev.createdAt).toLocaleDateString("en-GB")}
                    </td>
                    <td>
                      <div className="font-bold">{rev.userId?.fullName || "Deleted User"}</div>
                      <div className="text-muted" style={{fontSize: "12px", marginTop: "2px"}}>
                        Code: {rev.reservationId?.bookingCode || "N/A"}
                      </div>
                    </td>
                    <td style={{ maxWidth: "350px" }}>
                      <div className="star-display">{renderStars(rev.rating)}</div>
                      <p className="review-comment">"{rev.comment || "No text comment provided."}"</p>
                    </td>
                    <td>
                      <span className={`status-badge ${rev.isHidden ? "status-hidden" : "status-visible"}`}>
                        {rev.isHidden ? "Hidden" : "Public"}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons-sm">
                        <button 
                          className={`btn-small-${rev.isHidden ? "blue" : "gold"}`} 
                          onClick={() => handleToggleHide(rev._id, rev.isHidden)}
                        >
                          {rev.isHidden ? "Unhide" : "Hide"}
                        </button>
                        <button className="btn-small-red" onClick={() => handleDelete(rev._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminReviews;