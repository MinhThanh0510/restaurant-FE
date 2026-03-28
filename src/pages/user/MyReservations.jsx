import { useState, useEffect } from "react";
import api from "../../api";
import "./MyReservations.css";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { toast } from "react-toastify"; // 🔥 Đã import Toastify để làm thông báo trượt

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

  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    reservationId: null,
    amount: 0
  });

  // 🔥 STATE QUẢN LÝ CUSTOM CONFIRM MODAL (Dùng chung cho cả Cancel và Delete)
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    actionType: null, // "CANCEL" hoặc "DELETE"
    reservationId: null
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
          } catch (error) { }
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

  // 🔥 MỞ MODAL XÁC NHẬN
  const promptCancel = (id) => setConfirmModal({ isOpen: true, actionType: "CANCEL", reservationId: id });
  const promptDelete = (id) => setConfirmModal({ isOpen: true, actionType: "DELETE", reservationId: id });
  const closeConfirmModal = () => setConfirmModal({ isOpen: false, actionType: null, reservationId: null });

  // 🔥 THỰC THI HÀNH ĐỘNG KHI BẤM "YES" TRONG MODAL
  const executeConfirmAction = async () => {
    const id = confirmModal.reservationId;
    const type = confirmModal.actionType;

    closeConfirmModal(); // Đóng modal ngay lập tức cho mượt

    if (type === "CANCEL") {
      try {
        const res = await api.put(`/reservations/${id}/cancel`);
        toast.success(res.data.message || "Cancellation request sent to admin."); // Thay alert bằng toast
        fetchData();
      } catch (err) {
        toast.error(err.response?.data?.message || "Error sending cancellation request.");
      }
    }

    else if (type === "DELETE") {
      try {
        await api.delete(`/reservations/${id}`);
        toast.success("Reservation history deleted!"); // Thay alert bằng toast
        fetchData();
      } catch (err) {
        toast.error(err.response?.data?.message || "Error deleting reservation.");
      }
    }
  };

  const openReviewModal = (id) => setReviewModal({ isOpen: true, reservationId: id, rating: 5, comment: "" });
  const closeReviewModal = () => setReviewModal({ ...reviewModal, isOpen: false });

  const submitReview = async () => {
    try {
      await api.post("/reviews", {
        reservationId: reviewModal.reservationId,
        rating: reviewModal.rating,
        comment: reviewModal.comment
      });
      toast.success("Thank you for your review!"); // Thay alert
      closeReviewModal();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error submitting review."); // Thay alert
    }
  };

  const renderInteractiveStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        className={star <= reviewModal.rating ? "active" : ""}
        onClick={() => setReviewModal({ ...reviewModal, rating: star })}
      >★</span>
    ));
  };

  const statusPriority = {
    pending_payment: 1,
    paid: 2,
    cancel_request: 3,
    pending: 4,
    confirmed: 5,
    completed: 6,
    cancelled: 7
  };

  const displayedReservations = reservations
    .filter(res => filterStatus === "all" ? true : res.status === filterStatus)
    .sort((a, b) => {
      const timeA = new Date(a.reservationDate).getTime();
      const timeB = new Date(b.reservationDate).getTime();

      if (sortOrder === "status") {
        const weightA = statusPriority[a.status] || 8;
        const weightB = statusPriority[b.status] || 8;
        if (weightA !== weightB) return weightA - weightB;
        return timeB - timeA;
      }
      return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });

  return (
    <div className="my-reservations-page">
      <div className="reservations-container">
        <div className="page-header">
          <span className="gold-subtitle">Your Journey</span>
          <h2>Dining History</h2>
          <div className="title-separator"></div>
        </div>

        <div className="filter-bar glass-panel">
          <div className="filter-group">
            <label>Status:</label>
            <div className="select-wrapper">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">All Records</option>
                <option value="pending_payment">Awaiting Payment</option>
                <option value="paid">Paid (Awaiting Confirmation)</option>
                <option value="cancel_request">Cancellation Requested</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="filter-group">
            <label>Sort By:</label>
            <div className="select-wrapper">
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                <option value="status">Action Needed First</option>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Retrieving your reservations...</p>
          </div>
        ) : displayedReservations.length === 0 ? (
          <div className="empty-state glass-panel">
            <p>No reservations found matching your criteria.</p>
          </div>
        ) : (
          displayedReservations.map((res) => {
            const hasReviewed = reviewedIds.has(res._id);
            const preorderItems = preorders[res._id] && Array.isArray(preorders[res._id]) ? preorders[res._id] : (preorders[res._id]?.items || []);
            const hasPreorder = preorderItems.length > 0;
            const calculatedTotal = preorderItems.reduce((sum, item) => sum + ((item.price || item.menuId?.price || 0) * item.quantity), 0);
            const surcharge = res.tablePrice || 0;
            const grandTotal = calculatedTotal + surcharge;

            let displayStatus = res.status;
            if (res.status === "pending_payment") displayStatus = "Awaiting Payment";
            if (res.status === "paid") displayStatus = "Paid - Awaiting Admin";
            if (res.status === "cancel_request") displayStatus = "Cancellation Requested";

            return (
              <div key={res._id} className="res-card glass-panel">
                <div className="res-header">
                  <span className="res-code">ID: {res.bookingCode}</span>
                  <span className={`res-status status-${res.status}`}>
                    {displayStatus}
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

                {(hasPreorder || surcharge > 0) && (
                  <div className="res-preorder-section">
                    {hasPreorder && (
                      <>
                        <h4>Pre-ordered Meals</h4>
                        <ul className="preorder-list">
                          {preorderItems.map((item, index) => (
                            <li key={index} className="preorder-item">
                              <img src={item.menuId?.image || "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg"} alt={item.menuId?.name} />
                              <div className="preorder-info">
                                <span className="preorder-name">{item.menuId?.name || "Unknown Item"}</span>
                                <span className="preorder-qty">Qty: {item.quantity}</span>
                              </div>
                              <span className="preorder-price">${((item.price || item.menuId?.price || 0) * item.quantity).toLocaleString()}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}

                    <div className="res-total-summary">
                      {calculatedTotal > 0 && (
                        <div className="summary-line"><span>Meals Total:</span> <span>${calculatedTotal.toLocaleString()}</span></div>
                      )}
                      {surcharge > 0 && (
                        <div className="summary-line"><span>Table Surcharge:</span> <span>${surcharge.toLocaleString()}</span></div>
                      )}
                      <div className="summary-grand-total">
                        Grand Total: <span className="gold-text">${grandTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="res-actions">
                  {res.status === "pending_payment" && grandTotal > 0 && (
                    <button
                      className="btn-action primary-gold"
                      onClick={() => setPaymentModal({ isOpen: true, reservationId: res._id, amount: grandTotal })}
                    >
                      Pay Now
                    </button>
                  )}

                  {/* Sửa onClick gọi hàm promptCancel thay vì hàm gọi api trực tiếp */}
                  {["pending_payment", "paid", "confirmed"].includes(res.status) && (
                    <button className="btn-action outline-danger" onClick={() => promptCancel(res._id)}>
                      Request Cancel
                    </button>
                  )}

                  {res.status === "cancel_request" && (
                    <span className="awaiting-badge">⏳ Awaiting Refund Approval</span>
                  )}

                  {res.status === "completed" && !hasReviewed && (
                    <button className="btn-action primary-gold" onClick={() => openReviewModal(res._id)}>Leave a Review</button>
                  )}
                  {res.status === "completed" && hasReviewed && (
                    <span className="reviewed-badge">✓ Reviewed</span>
                  )}

                  {/* Sửa onClick gọi hàm promptDelete */}
                  {res.status === "cancelled" && (
                    <button className="btn-action outline-danger" onClick={() => promptDelete(res._id)}>Delete History</button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ===== UNIFIED CONFIRM MODAL (Dành cho Cancel & Delete) ===== */}
      {confirmModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: "450px" }}>

            {/* 🔥 Thay thế bằng SVG Icon thay vì Text Icon */}
            <div className="modal-warning-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>

            <h3 className="modal-title" style={{ fontSize: "24px" }}>
              {confirmModal.actionType === "CANCEL" ? "Cancel Reservation" : "Delete History"}
            </h3>

            {confirmModal.actionType === "CANCEL" ? (
              <>
                <p className="modal-desc" style={{ marginBottom: "20px", color: "#f0f0f0", fontSize: "16px" }}>
                  Are you sure you want to request a cancellation for this reservation?
                </p>
                <div className="policy-box">
                  <h4>Refund Policy</h4>
                  <ul>
                    <li><span>≥ 48h before:</span> <span className="gold-text">100% Refund</span></li>
                    <li><span>24h - 48h before:</span> <span className="gold-text">80% Refund</span></li>
                    <li><span>&lt; 24h before:</span> <span className="gold-text">No Refund</span></li>
                  </ul>
                  <p className="policy-note">Admin will review and process your refund shortly.</p>
                </div>
              </>
            ) : (
              <p className="modal-desc" style={{ marginBottom: "25px", color: "#f0f0f0", fontSize: "16px", lineHeight: "1.6" }}>
                Are you sure you want to permanently delete this cancelled history? <br />
                <span style={{ color: "#ffc107", fontWeight: "600", display: "block", marginTop: "10px" }}>This action cannot be undone.</span>
              </p>
            )}

            <div className="modal-actions">
              <button
                className="btn-action outline-light"
                onClick={closeConfirmModal}
              >
                No, Keep It
              </button>
              <button
                className="btn-action outline-danger"
                style={{ background: "transparent", color: "#dc3545" }}
                onClick={executeConfirmAction}
              >
                {confirmModal.actionType === "CANCEL" ? "Yes, Cancel" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYPAL MODAL */}
      {paymentModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ textAlign: "center", maxWidth: "400px" }}>
            <h3 className="modal-title">Complete Payment</h3>
            <p className="modal-desc">
              Amount to pay: <b className="gold-text">${paymentModal.amount.toLocaleString()}</b>
            </p>
            <div className="paypal-wrapper">
              <PayPalScriptProvider options={{ "client-id": "test", currency: "USD" }}>
                <PayPalButtons
                  style={{ layout: "vertical", shape: "rect", color: "gold", height: 40 }}
                  createOrder={async () => {
                    try {
                      const res = await api.post("/payment/create-order", { totalAmount: paymentModal.amount });
                      return res.data.orderID;
                    } catch (err) { toast.error("Could not initialize PayPal: " + err.message); } // Thay alert
                  }}
                  onApprove={async (data, actions) => {
                    setLoading(true);
                    try {
                      await api.post("/payment/capture-order", { orderID: data.orderID, reservationId: paymentModal.reservationId });
                      toast.success("🎉 Payment successful! Your reservation is confirmed."); // Thay alert
                      setPaymentModal({ isOpen: false, reservationId: null, amount: 0 });
                      fetchData();
                    } catch (err) { toast.error("Payment failed: " + (err.response?.data?.message || err.message)); } finally { setLoading(false); } // Thay alert
                  }}
                  onCancel={() => { }}
                />
              </PayPalScriptProvider>
            </div>
            <div className="modal-actions" style={{ justifyContent: "center" }}>
              <button className="btn-action outline-light" style={{ width: "100%" }} onClick={() => setPaymentModal({ isOpen: false, reservationId: null, amount: 0 })}>Cancel / Pay Later</button>
            </div>
          </div>
        </div>
      )}

      {/* REVIEW MODAL */}
      {reviewModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h3 className="modal-title">Rate your experience</h3>
            <div className="star-rating">{renderInteractiveStars()}</div>
            <textarea
              className="review-textarea"
              placeholder="Tell us what you loved..."
              value={reviewModal.comment}
              onChange={(e) => setReviewModal({ ...reviewModal, comment: e.target.value })}
            ></textarea>
            <div className="modal-actions">
              <button className="btn-action outline-light" onClick={closeReviewModal}>Cancel</button>
              <button className="btn-action primary-gold" onClick={submitReview}>Submit Review</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyReservations;