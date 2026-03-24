import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import api from "../api";
import "./MyReservations.css";

function MyReservations() {
  const [reservations, setReservations] = useState([]);
  const [reviewedIds, setReviewedIds] = useState(new Set());
  const [preorders, setPreorders] = useState({}); 
  const [loading, setLoading] = useState(true);

  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("status");

  const [reviewModal, setReviewModal] = useState({
    isOpen: false,
    reservationId: null,
    rating: 5,
    comment: ""
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resData, revData] = await Promise.all([
        api.get("/reservations/my"),
        api.get("/reviews/my")
      ]);

      const fetchedReservations = resData.data.reservations || [];
      setReservations(fetchedReservations);

      const revList = revData.data.reviews || [];
      const reviewedSet = new Set(revList.map(r => r.reservationId?._id || r.reservationId));
      setReviewedIds(reviewedSet);

      const preorderMap = {};
      await Promise.all(
        fetchedReservations.map(async (r) => {
          try {
            const pRes = await api.get(`/preorders/reservation/${r._id}`);
            preorderMap[r._id] = pRes.data.preorder || pRes.data.items || pRes.data || []; 
          } catch (error) {
            // Do nothing if no preorders
          }
        })
      );
      setPreorders(preorderMap);

    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancel = async (id) => {
    if (window.confirm("Are you sure you want to cancel this reservation?")) {
      try {
        await api.put(`/reservations/${id}/cancel`); 
        alert("Reservation cancelled successfully.");
        fetchData(); 
      } catch (err) {
        alert(err.response?.data?.message || "Error cancelling reservation.");
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this cancelled history?")) {
      try {
        await api.delete(`/reservations/${id}`); 
        alert("Reservation history deleted!");
        fetchData(); 
      } catch (err) {
        alert(err.response?.data?.message || "Error deleting reservation.");
      }
    }
  };

  const openReviewModal = (id) => {
    setReviewModal({ isOpen: true, reservationId: id, rating: 5, comment: "" });
  };

  const closeReviewModal = () => {
    setReviewModal({ ...reviewModal, isOpen: false });
  };

  const submitReview = async () => {
    try {
      await api.post("/reviews", {
        reservationId: reviewModal.reservationId,
        rating: reviewModal.rating,
        comment: reviewModal.comment
      });
      alert("🎉 Thank you for your review!");
      closeReviewModal();
      fetchData(); 
    } catch (err) {
      alert(err.response?.data?.message || "Error submitting review.");
    }
  };

  const renderInteractiveStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <span 
        key={star} 
        className={star <= reviewModal.rating ? "active" : ""}
        onClick={() => setReviewModal({ ...reviewModal, rating: star })}
      >
        ★
      </span>
    ));
  };

  const statusPriority = {
    pending: 1,
    confirmed: 2,
    completed: 3,
    cancelled: 4
  };

  const displayedReservations = reservations
    .filter(res => filterStatus === "all" ? true : res.status === filterStatus)
    .sort((a, b) => {
      const timeA = new Date(a.reservationDate).getTime();
      const timeB = new Date(b.reservationDate).getTime();

      if (sortOrder === "status") {
        const weightA = statusPriority[a.status] || 5;
        const weightB = statusPriority[b.status] || 5;
        if (weightA !== weightB) return weightA - weightB; 
        return timeB - timeA;
      }
      return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });

  return (
    <div className="my-reservations-page">
      <Navbar />

      <div className="reservations-container">
        <h2>My Reservations</h2>

        <div className="filter-bar">
          <div className="filter-group">
            <label>Status:</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Sort By:</label>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="status">Pending First</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: "#aaa" }}>Loading your reservations...</p>
        ) : displayedReservations.length === 0 ? (
          <p style={{ textAlign: "center", color: "#aaa" }}>No reservations found matching your criteria.</p>
        ) : (
          displayedReservations.map((res) => {
            const hasReviewed = reviewedIds.has(res._id);
            
            const preorderItems = preorders[res._id] && Array.isArray(preorders[res._id]) ? preorders[res._id] : (preorders[res._id]?.items || []);
            const hasPreorder = preorderItems.length > 0;
            // Tính trực tiếp tiền món ăn phòng trường hợp dữ liệu cũ bị lệch
            const calculatedTotal = preorderItems.reduce((sum, item) => sum + ((item.price || item.menuId?.price || 0) * item.quantity), 0);
            const surcharge = res.tablePrice || 0;

            return (
              <div key={res._id} className="res-card">
                <div className="res-header">
                  <span className="res-code">{res.bookingCode}</span>
                  <span className={`res-status status-${res.status}`}>
                    {res.status}
                  </span>
                </div>

                <div className="res-body">
                  <div className="res-info-item">
                    <span>Date & Time</span>
                    <p>
                      {new Date(res.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {" "}
                      {new Date(res.reservationDate).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <div className="res-info-item">
                    <span>Table</span>
                    {/* Hiển thị Location */}
                    <p style={{ textTransform: "capitalize" }}>
                      {res.tableId?.tableNumber ? `Table ${res.tableId.tableNumber} (${res.tableId.location || "indoor"})` : "Not Assigned"}
                    </p>
                  </div>
                  <div className="res-info-item">
                    <span>Guests</span>
                    <p>{res.numberOfGuests} People</p>
                  </div>
                  <div className="res-info-item">
                    <span>Contact Info</span>
                    <p>{res.customerInfo?.fullName || "N/A"}</p>
                  </div>
                </div>

                {/* ====== HIỂN THỊ PREORDER & CHI PHÍ ====== */}
                {(hasPreorder || surcharge > 0) && (
                  <div className="res-preorder-section">
                    
                    {hasPreorder && (
                      <>
                        <h4>Pre-ordered Meals:</h4>
                        <ul className="preorder-list">
                          {preorderItems.map((item, index) => (
                            <li key={index} className="preorder-item">
                              <img src={item.menuId?.image || "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg"} alt={item.menuId?.name} />
                              <div className="preorder-info">
                                <span className="preorder-name">{item.menuId?.name || "Unknown Item"}</span>
                                <span className="preorder-qty">Qty: {item.quantity}</span>
                              </div>
                              <span className="preorder-price">{((item.price || item.menuId?.price || 0) * item.quantity).toLocaleString()} $</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}

                    {/* Khối Tổng kết chi phí */}
                    <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px dashed rgba(255, 255, 255, 0.1)", textAlign: "right" }}>
                      {calculatedTotal > 0 && (
                        <div style={{ fontSize: "13px", color: "#aaa", marginBottom: "5px" }}>
                          Meals Total: {calculatedTotal.toLocaleString()} $
                        </div>
                      )}
                      {surcharge > 0 && (
                        <div style={{ fontSize: "13px", color: "#aaa", marginBottom: "5px" }}>
                          Table Surcharge: {surcharge.toLocaleString()} $
                        </div>
                      )}
                      <div style={{ fontSize: "15px", color: "#eee", marginTop: "8px" }}>
                        Grand Total: <span style={{ color: "#D4AF37", fontSize: "20px", fontWeight: "bold", marginLeft: "10px" }}>{(calculatedTotal + surcharge).toLocaleString()} $</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="res-actions">
                  {(res.status === "pending" || res.status === "confirmed") && (
                    <button className="btn-cancel" onClick={() => handleCancel(res._id)}>
                      Cancel Booking
                    </button>
                  )}

                  {res.status === "completed" && !hasReviewed && (
                    <button className="btn-review" onClick={() => openReviewModal(res._id)}>
                      Leave a Review
                    </button>
                  )}

                  {res.status === "completed" && hasReviewed && (
                    <span className="reviewed-badge">✓ Reviewed</span>
                  )}

                  {res.status === "cancelled" && (
                    <button className="btn-delete" onClick={() => handleDelete(res._id)}>
                      Delete History
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL ĐÁNH GIÁ */}
      {reviewModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Rate your experience</h3>
            <div className="star-rating">
              {renderInteractiveStars()}
            </div>
            <textarea 
              placeholder="Tell us what you loved (or what we can improve)..."
              value={reviewModal.comment}
              onChange={(e) => setReviewModal({ ...reviewModal, comment: e.target.value })}
            ></textarea>
            <div className="modal-actions">
              <button className="btn-close" onClick={closeReviewModal}>Cancel</button>
              <button className="btn-submit" onClick={submitReview}>Submit Review</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyReservations;