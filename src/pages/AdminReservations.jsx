import { useState, useEffect } from "react";
import api from "../api";
import { toast } from "react-toastify"; // 🔥 Import Toast
import "./AdminReservations.css";

function AdminReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  // States cho Bộ Lọc (Filters)
  const [filters, setFilters] = useState({
    search: "",
    date: "",
    time: "all",
    status: "all"
  });

  // 🔥 States cho Phân trang (Pagination)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Số lượng đơn trên 1 trang

  // States cho Modal Chi tiết
  const [modalData, setModalData] = useState({
    isOpen: false,
    data: null,
    preorders: [],
    loadingPreorder: false
  });

  const timeSlots = ["all", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"];

  // Lấy toàn bộ danh sách đặt bàn
  const fetchAllReservations = async () => {
    try {
      setLoading(true);
      const res = await api.get("/reservations/admin");
      setReservations(res.data.reservations || []);
    } catch (err) {
      console.error("Error fetching admin reservations", err);
      toast.error("Failed to load reservations."); // 🔥 Hiện toast lỗi
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllReservations();
  }, []);

  // 🔥 Tự động đưa về trang 1 nếu người dùng thay đổi bộ lọc tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // ====== XỬ LÝ LỌC & SẮP XẾP DỮ LIỆU ======
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
      // 1. Đưa đơn "Pending" lên đầu
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;
      
      // 2. Xếp theo ngày giờ gần nhất
      const timeA = new Date(a.reservationDate).getTime() + new Date(a.startTime).getTime();
      const timeB = new Date(b.reservationDate).getTime() + new Date(b.startTime).getTime();
      return timeB - timeA; // Mới nhất lên trước
    });

  // ====== XỬ LÝ PHÂN TRANG ======
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  // 🔥 Dữ liệu thực tế sẽ render trên bảng (chỉ lấy 10 item)
  const currentReservations = filteredReservations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // ====== XỬ LÝ MỞ MODAL CHI TIẾT & LẤY PREORDER ======
  const handleViewDetail = async (reservation) => {
    setModalData({ isOpen: true, data: reservation, preorders: [], loadingPreorder: true });
    
    try {
      const pRes = await api.get(`/preorders/reservation/${reservation._id}`);
      const itemsArray = pRes.data?.preorder?.items || pRes.data?.items || [];
      setModalData(prev => ({ ...prev, preorders: itemsArray, loadingPreorder: false }));
    } catch (error) {
      console.log("This reservation has no pre-ordered items.");
      setModalData(prev => ({ ...prev, preorders: [], loadingPreorder: false }));
    }
  };

  const closeModal = () => {
    setModalData({ isOpen: false, data: null, preorders: [], loadingPreorder: false });
  };

  // ====== XỬ LÝ CẬP NHẬT TRẠNG THÁI ======
  const handleUpdateStatus = async (id, newStatus) => {
    if (window.confirm(`Are you sure you want to change this reservation's status to: ${newStatus.toUpperCase()}?`)) {
      try {
        await api.put(`/reservations/admin/${id}/status`, { status: newStatus });
        toast.success(`🎉 Status updated to: ${newStatus}`); // 🔥 Đổi alert thành toast success
        closeModal();
        fetchAllReservations(); 
      } catch (err) {
        toast.error(err.response?.data?.message || "Error updating status"); // 🔥 Đổi alert thành toast error
      }
    }
  };

  return (
    <div className="admin-res-wrapper">
      <div className="admin-res-header">
        <h3>Reservation & Pre-order Management</h3>
      </div>

      {/* ===== BỘ LỌC (FILTERS) ===== */}
      <div className="admin-filters">
        <input 
          type="text" 
          placeholder="Filter by booking code, customer name, or phone..." 
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
        <select 
          value={filters.time} 
          onChange={(e) => setFilters({...filters, time: e.target.value})}
          className="filter-input"
        >
          <option value="all">All time slots</option>
          {timeSlots.filter(t => t !== "all").map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select 
          value={filters.status} 
          onChange={(e) => setFilters({...filters, status: e.target.value})}
          className="filter-input"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button className="btn-reset" onClick={() => setFilters({search: "", date: "", time: "all", status: "all"})}>
          Clear Filters
        </button>
        <button 
          className="btn-reset" 
          style={{ background: "#D4AF37", color: "white", borderColor: "#D4AF37" }} 
          onClick={fetchAllReservations}
          disabled={loading}
        >
          {loading ? "Loading..." : "🔄 Refresh"}
        </button>
      </div>

      {/* THỐNG KÊ NHANH & THÔNG TIN TRANG */}
      <div style={{ marginBottom: "15px", fontSize: "14.5px", color: "#555", fontWeight: "500" }}>
        Displaying: <b className="text-gold">{filteredReservations.length}</b> reservations 
        (including <b style={{color: "#dc3545"}}>{filteredReservations.filter(r => r.status === "pending").length}</b> pending)
        {" "} | Page <b className="text-gold">{currentPage}</b> of {totalPages || 1}
      </div>

      {/* ===== BẢNG DANH SÁCH ===== */}
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
                <tr><td colSpan="6" style={{textAlign: "center", padding: "20px"}}>No matching reservations found.</td></tr>
              ) : (
                // 🔥 Đổi thành currentReservations thay vì filteredReservations
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
                    <td>
                      <span className={`status-badge status-${res.status}`}>
                        {res.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn-view" onClick={() => handleViewDetail(res)}>View Details</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ===== THANH PHÂN TRANG (PAGINATION) ===== */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <button 
            className="page-btn" 
            onClick={() => paginate(currentPage - 1)} 
            disabled={currentPage === 1}
          >
            &laquo; Prev
          </button>
          
          {[...Array(totalPages)].map((_, i) => (
            <button 
              key={i + 1} 
              className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`} 
              onClick={() => paginate(i + 1)}
            >
              {i + 1}
            </button>
          ))}

          <button 
            className="page-btn" 
            onClick={() => paginate(currentPage + 1)} 
            disabled={currentPage === totalPages}
          >
            Next &raquo;
          </button>
        </div>
      )}

      {/* ===== MODAL CHI TIẾT ĐƠN (RESERVATION DETAIL) ===== */}
      {modalData.isOpen && modalData.data && (
        <div 
          className="admin-modal-overlay" 
          onClick={(e) => {
            if (e.target.className === "admin-modal-overlay") closeModal();
          }}
        >
          <div className="admin-modal-content">
            <div className="modal-header">
              <h2>Booking Details: <span className="text-gold">{modalData.data.bookingCode}</span></h2>
              <button className="btn-close-modal" onClick={closeModal}>✕</button>
            </div>

            <div className="modal-body">
              {/* Cột 1: Thông tin khách & Bàn */}
              <div className="info-section">
                <h4>Booking Information</h4>
                <p><strong>Customer:</strong> {modalData.data.customerInfo?.fullName}</p>
                <p><strong>Phone:</strong> {modalData.data.customerInfo?.phone}</p>
                <p><strong>Email:</strong> {modalData.data.customerInfo?.email}</p>
                <div className="divider"></div>
                <p><strong>Arrival Date:</strong> {new Date(modalData.data.reservationDate).toLocaleDateString("en-GB")}</p>
                <p><strong>Arrival Time:</strong> {new Date(modalData.data.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                <p><strong>Number of Guests:</strong> {modalData.data.numberOfGuests} people</p>
                <p><strong>Assigned Table:</strong> {modalData.data.tableId?.tableNumber ? `Table ${modalData.data.tableId.tableNumber}` : "Not assigned"}</p>
                <div className="divider"></div>
                <p><strong>Notes:</strong> <span className="note-text">{modalData.data.note || "No notes"}</span></p>
              </div>

              {/* Cột 2: Thông tin món ăn (Pre-order) */}
              <div className="preorder-section">
                <h4>Pre-order Menu</h4>
                {modalData.loadingPreorder ? (
                  <p>Loading menu items...</p>
                ) : modalData.preorders.length === 0 ? (
                  <p className="empty-text">Customer has not pre-ordered any dishes.</p>
                ) : (
                  <>
                    <ul className="modal-preorder-list">
                      {modalData.preorders.map((item, idx) => {
                        const validPrice = item.price || item.menuId?.price || 0;
                        const subTotal = validPrice * item.quantity;
                        
                        return (
                          <li key={idx} className="modal-preorder-item">
                            <img src={item.menuId?.image || "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg"} alt="Food" />
                            <div className="item-details">
                              <span className="item-name">{item.menuId?.name || "Unknown Item"}</span>
                              <span className="item-qty">{validPrice.toLocaleString()} $ &times; {item.quantity}</span>
                            </div>
                            <span className="item-price">{subTotal.toLocaleString()} $</span>
                          </li>
                        );
                      })}
                    </ul>
                    <div className="modal-total">
                      Total Menu Price: 
                      <span>
                        {modalData.preorders.reduce((sum, item) => sum + ((item.price || item.menuId?.price || 0) * item.quantity), 0).toLocaleString()} $
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Chân Modal: Các nút thao tác Duyệt/Hủy */}
            <div className="modal-footer">
              <div className="current-status-box">
                Current Status: <span className={`status-badge status-${modalData.data.status}`}>{modalData.data.status}</span>
              </div>
              
              <div className="action-buttons">
                {modalData.data.status === "pending" && (
                  <button className="btn-action confirm" onClick={() => handleUpdateStatus(modalData.data._id, "confirmed")}>
                    Confirm Order
                  </button>
                )}
                
                {modalData.data.status === "confirmed" && (
                  <button className="btn-action complete" onClick={() => handleUpdateStatus(modalData.data._id, "completed")}>
                    Customer has finished eating 
                  </button>
                )}

                {(modalData.data.status === "pending" || modalData.data.status === "confirmed") && (
                  <button className="btn-action cancel" onClick={() => handleUpdateStatus(modalData.data._id, "cancelled")}>
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReservations;