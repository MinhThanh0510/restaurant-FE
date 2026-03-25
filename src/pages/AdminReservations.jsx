import { useState, useEffect } from "react";
import api from "../api";
import { toast } from "react-toastify";
import "./AdminReservations.css";
import { useSearchParams } from "react-router-dom";

function AdminReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [urlQuery, setUrlQuery] = useSearchParams();
  const itemsPerPage = 10;

  const [filters, setFilters] = useState({
    search: "",
    date: "",
    time: "all",
    status: "all"
  });

  const [modalData, setModalData] = useState({
    isOpen: false,
    data: null,
    preorders: [],
    loadingPreorder: false
  });

  const timeSlots = ["all", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"];

  // ====== FETCH DATA ======
  const fetchAllReservations = async (isManual = false) => {
    try {
      setLoading(true);
      const res = await api.get("/reservations/admin");
      setReservations(res.data.reservations || []);
      
      if (isManual) toast.success("Data synchronized!");
    } catch (err) {
      console.error("Error fetching admin reservations", err);
      toast.error("Failed to load reservations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllReservations();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // ====== BẮT TÍN HIỆU TỪ DASHBOARD ======
  useEffect(() => {
    const openId = urlQuery.get("id");
    if (openId && reservations.length > 0) {
      const targetRes = reservations.find(r => r._id === openId);
      if (targetRes) {
        handleViewDetail(targetRes); 
        setUrlQuery({}); 
      }
    }
  }, [urlQuery, reservations]);

  // ====== FILTER & SORT ======
  const filteredReservations = reservations
    .filter(res => {
      const matchStatus = filters.status === "all" || res.status === filters.status;
      const resDateStr = new Date(res.reservationDate).toISOString().split("T")[0];
      const matchDate = !filters.date || resDateStr === filters.date;
      
      const resTimeStr = new Date(res.startTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      const matchTime = filters.time === "all" || resTimeStr === filters.time;
      
      const searchLower = filters.search.toLowerCase();
      const matchSearch = !filters.search || 
        res.bookingCode?.toLowerCase().includes(searchLower) ||
        res.customerInfo?.fullName?.toLowerCase().includes(searchLower) ||
        res.customerInfo?.phone?.includes(searchLower);

      return matchStatus && matchDate && matchTime && matchSearch;
    })
    .sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;
      
      const timeA = new Date(a.reservationDate).getTime() + new Date(a.startTime).getTime();
      const timeB = new Date(b.reservationDate).getTime() + new Date(b.startTime).getTime();
      return timeB - timeA;
    });

  // ====== PAGINATION ======
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentReservations = filteredReservations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // ====== MODAL ACTIONS ======
  const handleViewDetail = async (reservation) => {
    setModalData({ isOpen: true, data: reservation, preorders: [], loadingPreorder: true });
    try {
      const pRes = await api.get(`/preorders/reservation/${reservation._id}`);
      const itemsArray = pRes.data?.preorder?.items || pRes.data?.items || [];
      setModalData(prev => ({ ...prev, preorders: itemsArray, loadingPreorder: false }));
    } catch (error) {
      setModalData(prev => ({ ...prev, preorders: [], loadingPreorder: false }));
    }
  };

  const closeModal = () => setModalData({ isOpen: false, data: null, preorders: [], loadingPreorder: false });

  const handleUpdateStatus = async (id, newStatus) => {
    if (window.confirm(`Change status to: ${newStatus.toUpperCase()}?`)) {
      try {
        await api.put(`/reservations/admin/${id}/status`, { status: newStatus });
        toast.success(`Status updated to: ${newStatus}`);
        closeModal();
        fetchAllReservations(); 
      } catch (err) {
        toast.error(err.response?.data?.message || "Error updating status");
      }
    }
  };

  return (
    <div className="admin-res-wrapper">
      <div className="admin-res-header">
        <h3>Reservation Management</h3>
      </div>

      <div className="admin-filters">
        <input 
          type="text" 
          placeholder="Filter booking code, name, phone..." 
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value})}
          className="filter-input search-input"
        />
        <input 
          type="date" 
          value={filters.date}
          onChange={(e) => setFilters({...filters, date: e.target.value})}
          className="filter-input"
        />
        <select value={filters.time} onChange={(e) => setFilters({...filters, time: e.target.value})} className="filter-input">
          <option value="all">All time slots</option>
          {timeSlots.filter(t => t !== "all").map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} className="filter-input">
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button className="btn-reset" onClick={() => setFilters({search: "", date: "", time: "all", status: "all"})}>
          Clear Filters
        </button>
        <button className="btn-refresh" onClick={() => fetchAllReservations(true)} disabled={loading}>
          {loading ? (
            <svg className="spin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
          )}
          Refresh
        </button>
      </div>

      <div className="stats-bar">
        Displaying: <b className="text-gold">{filteredReservations.length}</b> reservations 
        ( <b className="text-danger">{filteredReservations.filter(r => r.status === "pending").length}</b> pending )
        {" "} | Page <b className="text-gold">{currentPage}</b> of {totalPages || 1}
      </div>

      <div className="admin-table-container">
        {loading ? <p className="loading-text">Loading data...</p> : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Booking Code</th>
                <th>Customer</th>
                <th>Time</th>
                <th>Table</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentReservations.length === 0 ? (
                <tr><td colSpan="6" className="empty-cell">No matching reservations found.</td></tr>
              ) : (
                currentReservations.map(res => (
                  <tr key={res._id} className="table-row">
                    <td className="font-bold text-gold">{res.bookingCode}</td>
                    <td>
                      <div className="cust-name">{res.customerInfo?.fullName}</div>
                      <div className="cust-phone">{res.customerInfo?.phone}</div>
                    </td>
                    <td>
                      <div className="res-time">{new Date(res.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="res-date">{new Date(res.reservationDate).toLocaleDateString("en-GB")}</div>
                    </td>
                    <td>{res.tableId?.tableNumber ? `Table ${res.tableId.tableNumber}` : "N/A"}</td>
                    <td><span className={`status-badge status-${res.status}`}>{res.status}</span></td>
                    <td>
                      <button className="btn-small-blue" onClick={() => handleViewDetail(res)}>Details</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination-container">
          <button className="page-btn" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>&laquo; Prev</button>
          {[...Array(totalPages)].map((_, i) => (
            <button key={i+1} className={`page-btn ${currentPage === i+1 ? 'active' : ''}`} onClick={() => paginate(i+1)}>{i+1}</button>
          ))}
          <button className="page-btn" onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>Next &raquo;</button>
        </div>
      )}

      {/* ===== MODAL DETAILS ===== */}
      {modalData.isOpen && modalData.data && (
        <div className="admin-modal-overlay" onClick={(e) => e.target.className === "admin-modal-overlay" && closeModal()}>
          <div className="admin-modal-content">
            <div className="modal-header">
              <h2>Booking: <span className="text-gold">{modalData.data.bookingCode}</span></h2>
              <button className="btn-close-modal" onClick={closeModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div className="modal-body">
              {/* LEFT COLUMN: INFO */}
              <div className="info-section">
                <h4>Booking Information</h4>
                <p><strong>Customer:</strong> {modalData.data.customerInfo?.fullName}</p>
                <p><strong>Phone:</strong> {modalData.data.customerInfo?.phone}</p>
                <p>
                  <strong>Time:</strong> {new Date(modalData.data.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(modalData.data.reservationDate).toLocaleDateString("en-GB")}
                </p>
                <p>
                  <strong>Guests:</strong> {modalData.data.numberOfGuests} pax
                </p>
                <div className="divider"></div>
                <p>
                  <strong>Table:</strong> {modalData.data.tableId?.tableNumber ? `Table ${modalData.data.tableId.tableNumber} (${modalData.data.tableId.location || "indoor"})` : "N/A"}
                </p>
                <p>
                  <strong>Table Surcharge:</strong> <span className="text-gold">{(modalData.data.tablePrice || 0).toLocaleString()} $</span>
                </p>
                <div className="divider"></div>
                <p><strong>Notes:</strong> <span className="note-text">{modalData.data.note || "No notes provided"}</span></p>
              </div>

              {/* RIGHT COLUMN: PREORDER */}
              <div className="preorder-section">
                <h4>Pre-order Menu</h4>
                {modalData.loadingPreorder ? <p className="text-muted">Loading...</p> : modalData.preorders.length === 0 ? <p className="empty-text">No pre-orders.</p> : (
                  <ul className="modal-preorder-list">
                    {modalData.preorders.map((item, idx) => (
                      <li key={idx} className="modal-preorder-item">
                        <img src={item.menuId?.image || "https://via.placeholder.com/50"} alt="" />
                        <div className="item-details">
                          <span className="item-name">{item.menuId?.name || "Unknown"}</span>
                          <span className="item-qty">{(item.price || item.menuId?.price || 0).toLocaleString()} $ &times; {item.quantity}</span>
                        </div>
                        <span className="item-price">{((item.price || item.menuId?.price || 0) * item.quantity).toLocaleString()} $</span>
                      </li>
                    ))}
                  </ul>
                )}
                
                {/* SUMMARY */}
                <div className="modal-total">
                  {modalData.preorders.length > 0 && (
                    <div className="sub-total">
                      Meals Total: {modalData.preorders.reduce((sum, item) => sum + ((item.price || item.menuId?.price || 0) * item.quantity), 0).toLocaleString()} $
                    </div>
                  )}
                  {modalData.data.tablePrice > 0 && (
                    <div className="sub-total">
                      Table Surcharge: {(modalData.data.tablePrice).toLocaleString()} $
                    </div>
                  )}
                  <div className="grand-total">
                    GRAND TOTAL: 
                    <span>
                      {(
                        modalData.preorders.reduce((sum, item) => sum + ((item.price || item.menuId?.price || 0) * item.quantity), 0) + 
                        (modalData.data.tablePrice || 0)
                      ).toLocaleString()} $
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer-actions">
              <span className={`status-badge status-${modalData.data.status}`}>{modalData.data.status}</span>
              <div className="action-buttons">
                {modalData.data.status === "pending" && <button className="btn-action confirm" onClick={() => handleUpdateStatus(modalData.data._id, "confirmed")}>Confirm Booking</button>}
                {modalData.data.status === "confirmed" && <button className="btn-action complete" onClick={() => handleUpdateStatus(modalData.data._id, "completed")}>Mark as Done</button>}
                {(modalData.data.status === "pending" || modalData.data.status === "confirmed") && <button className="btn-action cancel" onClick={() => handleUpdateStatus(modalData.data._id, "cancelled")}>Cancel Booking</button>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReservations;