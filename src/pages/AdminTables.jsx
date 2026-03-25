import { useState, useEffect } from "react";
import api from "../api";
import { toast } from "react-toastify";
import "./AdminTables.css";

function AdminTables() {
  const [tables, setTables] = useState([]);
  const [reservations, setReservations] = useState([]); 
  const [loading, setLoading] = useState(false);

  const [modal, setModal] = useState({ isOpen: false, mode: "add", data: null });
  const [form, setForm] = useState({ 
    tableNumber: "", 
    capacity: "", 
    status: "available",
    location: "indoor", 
    price: ""           
  });

  const [scheduleModal, setScheduleModal] = useState({ 
    isOpen: false, 
    table: null, 
    date: "" 
  });

  // ====== FETCH DATA ======
  const fetchData = async (isManual = false) => {
    setLoading(true);
    try {
      const [tableRes, resRes] = await Promise.all([
        api.get("/tables"),
        api.get("/reservations/admin")
      ]);
      
      setTables(tableRes.data.tables || []);
      setReservations(resRes.data.reservations || []);
      
      if (isManual) toast.success("Tables & Schedules synchronized!");
    } catch (error) {
      toast.error("Failed to load data.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ====== TABLE SCHEDULE ======
  const openSchedule = (table) => {
    setScheduleModal({ ...scheduleModal, isOpen: true, table });
  };

  const getTableBookings = () => {
    if (!scheduleModal.table) return [];
    
    return reservations.filter(res => {
      if (res.status === "cancelled") return false;
      
      const tableId = res.tableId?._id || res.tableId;
      if (tableId !== scheduleModal.table._id) return false;

      if (scheduleModal.date) {
        const resDate = new Date(res.reservationDate).toISOString().split("T")[0];
        return resDate === scheduleModal.date;
      }
      
      return true; 
    }).sort((a, b) => new Date(a.startTime) - new Date(b.startTime)); 
  };

  // ====== CRUD MODAL ======
  const openModal = (mode, table = null) => {
    if (mode === "edit" && table) {
      setForm({ 
        tableNumber: table.tableNumber, 
        capacity: table.capacity, 
        status: table.status,
        location: table.location || "indoor", 
        price: table.price || 0               
      });
    } else {
      setForm({ tableNumber: "", capacity: "", status: "available", location: "indoor", price: "" });
    }
    setModal({ isOpen: true, mode, data: table });
  };

  const closeModal = () => {
    setModal({ isOpen: false, mode: "add", data: null });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (modal.mode === "add") {
        await api.post("/tables", form);
        toast.success("New table added successfully!");
      } else {
        await api.put(`/tables/${modal.data._id}`, form);
        toast.success("Table updated successfully!");
      }
      closeModal();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving table.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this table?")) {
      try {
        await api.delete(`/tables/${id}`);
        toast.success("Table deleted successfully!");
        fetchData();
      } catch (err) {
        toast.error(err.response?.data?.message || "Error deleting table.");
      }
    }
  };

  const totalCapacity = tables.reduce((sum, t) => sum + (t.status === 'available' ? t.capacity : 0), 0);
  const maintenanceCount = tables.filter(t => t.status === 'maintenance').length;

  return (
    <div className="admin-tables-wrapper">
      <div className="admin-tables-header">
        <h3>Table Management</h3>
      </div>

      <div className="admin-tables-actions">
        <div className="stats-bar">
          Total Tables: <b className="text-gold">{tables.length}</b> | 
          Available Capacity: <b className="text-gold">{totalCapacity}</b> seats | 
          In Maintenance: <b className={maintenanceCount > 0 ? "text-danger" : "text-success"}>{maintenanceCount}</b>
        </div>
        <div className="btn-group">
          <button className="btn-primary" onClick={() => openModal("add")}>Add New Table</button>
          <button className="btn-refresh" onClick={() => fetchData(true)} disabled={loading}>
            {loading ? (
              <svg className="spin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
            )}
            Refresh
          </button>
        </div>
      </div>

      <div className="admin-table-container">
        {loading ? <p className="loading-text">Loading tables...</p> : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Table Number</th>
                <th>Capacity</th>
                <th>Location & Price</th>
                <th>Condition</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tables.length === 0 ? (
                <tr><td colSpan="5" className="empty-cell">No tables found.</td></tr>
              ) : (
                tables.map(table => (
                  <tr key={table._id} className="table-row">
                    <td><div className="table-badge">Table {table.tableNumber}</div></td>
                    <td className="font-bold">{table.capacity} <span className="text-muted" style={{fontWeight: "normal"}}>persons</span></td>

                    <td>
                      <div className="location-text">
                        {table.location === 'window' ? 'Window' : table.location === 'outdoor' ? 'Outdoor' : 'Indoor'}
                      </div>
                      <div className="price-text">
                        {table.price > 0 ? `+ ${table.price.toLocaleString()} $` : "Free"}
                      </div>
                    </td>

                    <td><span className={`status-badge status-${table.status}`}>{table.status}</span></td>
                    <td>
                      <div className="action-buttons-sm">
                        <button className="btn-small-blue" onClick={() => openSchedule(table)}>Schedule</button>
                        <button className="btn-small-gold" onClick={() => openModal("edit", table)}>Edit</button>
                        <button className="btn-small-red" onClick={() => handleDelete(table._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ===== SCHEDULE MODAL ===== */}
      {scheduleModal.isOpen && (
        <div className="admin-modal-overlay" onClick={(e) => e.target.className === "admin-modal-overlay" && setScheduleModal({...scheduleModal, isOpen: false})}>
          <div className="admin-modal-content">
            <div className="modal-header">
              <h2>Schedule: <span className="text-gold">Table {scheduleModal.table?.tableNumber}</span></h2>
              <button className="btn-close-modal" onClick={() => setScheduleModal({...scheduleModal, isOpen: false})}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div className="modal-body-form">
              <div className="input-group">
                <label>Filter by Date</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input 
                    type="date" 
                    value={scheduleModal.date} 
                    onChange={(e) => setScheduleModal({...scheduleModal, date: e.target.value})}
                    style={{ flex: 1 }}
                  />
                  <button 
                    type="button" 
                    className="btn-cancel" 
                    onClick={() => setScheduleModal({...scheduleModal, date: ""})}
                    disabled={!scheduleModal.date}
                    style={{ border: "1px solid #ddd", padding: "0 15px", borderRadius: "8px" }}
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="schedule-list">
                <h4>
                  {scheduleModal.date 
                    ? `Bookings on ${new Date(scheduleModal.date).toLocaleDateString("en-GB")}:` 
                    : "All Upcoming & Past Bookings:"}
                </h4>
                
                {getTableBookings().length === 0 ? (
                  <div className="empty-schedule">
                    <p>{scheduleModal.date ? "No bookings for this date." : "No bookings found for this table."}</p>
                    <span className="status-badge status-available">Available</span>
                  </div>
                ) : (
                  <ul className="timeline-list">
                    {getTableBookings().map(booking => {
                      const start = new Date(booking.startTime);
                      const end = new Date(start.getTime() + 2.5 * 60 * 60 * 1000);
                      
                      const dateStr = new Date(booking.reservationDate).toLocaleDateString("en-GB");
                      const startTimeStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const endTimeStr = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                      return (
                        <li key={booking._id} className="timeline-item">
                          <div className="time-block">
                            <span className="time-date">{dateStr}</span>
                            <span className="time-start">{startTimeStr}</span>
                            <span className="time-end">to {endTimeStr}</span>
                          </div>
                          <div className="booking-info">
                            <strong>{booking.customerInfo?.fullName || "Guest"}</strong> ({booking.numberOfGuests} pax)
                            <div className="booking-code">Code: {booking.bookingCode}</div>
                            <span className={`status-badge status-${booking.status}`} style={{marginTop: "8px", padding: "4px 8px"}}>{booking.status}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== CRUD MODAL ===== */}
      {modal.isOpen && (
        <div className="admin-modal-overlay" onClick={(e) => e.target.className === "admin-modal-overlay" && closeModal()}>
          <div className="admin-modal-content small-modal">
            <div className="modal-header">
              <h2>{modal.mode === "add" ? "Add New Table" : "Edit Table"}</h2>
              <button className="btn-close-modal" onClick={closeModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="modal-body-form" autoComplete="off">
              <div className="form-grid-2">
                <div className="input-group">
                  <label>Table Number <span className="req">*</span></label>
                  <input type="number" required min="1" value={form.tableNumber} onChange={e => setForm({...form, tableNumber: e.target.value === '' ? '' : Number(e.target.value)})} />
                </div>
                <div className="input-group">
                  <label>Capacity (Seats) <span className="req">*</span></label>
                  <input type="number" required min="1" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value === '' ? '' : Number(e.target.value)})} />
                </div>

                <div className="input-group">
                  <label>Table Location <span className="req">*</span></label>
                  <select value={form.location} onChange={e => setForm({...form, location: e.target.value})}>
                    <option value="indoor">Indoor (Standard)</option>
                    <option value="window">Window (Premium View)</option>
                    <option value="outdoor">Outdoor (Patio/Garden)</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Booking Surcharge ($)</label>
                  <input 
                    type="number" 
                    min="0" 
                    step="any" 
                    value={form.price} 
                    onChange={e => setForm({...form, price: e.target.value === '' ? '' : Number(e.target.value)})} 
                    placeholder="e.g. 5" 
                  />
                </div>
              </div>

              {modal.mode === "edit" && (
                <div className="input-group">
                  <label>Table Condition</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="available">Available (In use)</option>
                    <option value="maintenance">Maintenance (Broken/Out of service)</option>
                  </select>
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-submit-form">Save Table</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTables;