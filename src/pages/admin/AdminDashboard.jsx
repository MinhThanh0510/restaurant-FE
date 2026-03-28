import { useState, useEffect } from "react";
import api from "../../api";
import { toast } from "react-toastify";
import "./AdminDashboard.css";
import { useNavigate } from "react-router-dom";
// 🔥 Import thư viện biểu đồ
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    revenue: { daily: 0, weekly: 0, monthly: 0, yearly: 0 },
    chartData: [],
    stats: { todayBookingsCount: 0, lowStockCount: 0, avgRating: 0, totalReviews: 0 },
    upcomingBookings: [],
    lowStockItems: []
  });

  // State cho bộ chọn ngày của phần Lịch (Calendar)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [calendarDays, setCalendarDays] = useState([]);

  const fetchDashboardData = async (isManual = false) => {
    try {
      setLoading(true);
      const res = await api.get("/dashboard");
      setData(res.data);
      if (isManual) toast.success("Dashboard data refreshed!");
    } catch (err) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Tạo mảng 7 ngày tới cho thanh Calendar
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push({
        fullDate: d.toISOString().split('T')[0],
        dayName: i === 0 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" }),
        dateNum: d.getDate()
      });
    }
    setCalendarDays(days);
  }, []);

  // Lọc bookings theo ngày đang được chọn trên Calendar
  const displayBookings = data.upcomingBookings.filter(bk =>
    new Date(bk.reservationDate).toISOString().split('T')[0] === selectedDate
  );

  if (loading && !data.chartData.length) {
    return <div className="admin-loading">Initializing Dashboard...</div>;
  }

  return (
    <div className="admin-dash-wrapper">

      {/* HEADER & REFRESH */}
      <div className="admin-dash-header">
        <div>
          <h3>Restaurant Overview</h3>
          <p className="subtitle">Real-time insights and analytics.</p>
        </div>
        <button className="btn-refresh" onClick={() => fetchDashboardData(true)} disabled={loading}>
          {loading ? (
            <svg className="spin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 21v-5h5" /></svg>
          )}
          Refresh Data
        </button>
      </div>

      {/* ===== KHU VỰC DOANH THU & BIỂU ĐỒ ===== */}
      <div className="dashboard-top-grid">
        {/* Box Doanh Thu */}
        <div className="revenue-summary-box">
          <h4>Revenue Summary</h4>
          <div className="rev-grid">
            <div className="rev-item">
              <span>Today</span>
              <strong>{data.revenue.daily.toLocaleString()} $</strong>
            </div>
            <div className="rev-item">
              <span>This Week</span>
              <strong>{data.revenue.weekly.toLocaleString()} $</strong>
            </div>
            <div className="rev-item">
              <span>This Month</span>
              <strong>{data.revenue.monthly.toLocaleString()} $</strong>
            </div>
            <div className="rev-item highlight">
              <span>Year to Date</span>
              <strong>{data.revenue.yearly.toLocaleString()} $</strong>
            </div>
          </div>
        </div>

        {/* Biểu đồ Recharts */}
        <div className="chart-box">
          <h4>Revenue Last 7 Days</h4>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dx={-10} />
                <Tooltip
                  cursor={{ fill: '#f4f4f4' }}
                  formatter={(value) => `${value.toLocaleString()} $`}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="revenue" fill="#D4AF37" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ===== METRIC NHANH ===== */}
      <div className="dash-metrics-grid">
        <div className="metric-card">
          <div className="m-icon blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg></div>
          <div className="m-info"><span>Today's Bookings</span><h4>{data.stats.todayBookingsCount}</h4></div>
        </div>
        <div className="metric-card">
          <div className="m-icon red"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg></div>
          <div className="m-info"><span>Low Stock Alerts</span><h4>{data.stats.lowStockCount}</h4></div>
        </div>
        <div className="metric-card">
          <div className="m-icon gold"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg></div>
          <div className="m-info"><span>Average Rating</span><h4>{data.stats.avgRating} <small>/ 5</small></h4></div>
        </div>
      </div>

      {/* ===== DANH SÁCH CHI TIẾT ===== */}
      <div className="dash-lists-grid">

        {/* LỊCH TRÌNH 7 NGÀY (CALENDAR UI) */}
        <div className="dash-list-panel">
          <div className="panel-header">
            <h4>Weekly Schedule</h4>
            <button onClick={() => navigate("/admin/reservations")}>Manage</button>
          </div>

          {/* Thanh chọn ngày */}
          <div className="calendar-tabs">
            {calendarDays.map(day => (
              <div
                key={day.fullDate}
                className={`cal-day ${selectedDate === day.fullDate ? 'active' : ''}`}
                onClick={() => setSelectedDate(day.fullDate)}
              >
                <span className="d-name">{day.dayName}</span>
                <span className="d-num">{day.dateNum}</span>
              </div>
            ))}
          </div>

          <div className="panel-body">
            {displayBookings.length === 0 ? (
              <p className="empty-text">No bookings scheduled for this date.</p>
            ) : (
              <ul className="quick-list">
                {displayBookings.map(bk => (
                  <li key={bk._id} className="quick-item">
                    <div className="time-badge">
                      {new Date(bk.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="item-details">
                      <strong>{bk.customerInfo.fullName}</strong>
                      <span>Table {bk.tableId?.tableNumber || "N/A"} - {bk.numberOfGuests} pax</span>
                    </div>
                    <span className={`status-tag ${bk.status}`} style={{ marginRight: "10px" }}>{bk.status}</span>

                    {/* 🔥 THÊM NÚT UPDATE Ở ĐÂY */}
                    <button className="btn-small-blue" onClick={() => navigate(`/admin/reservations?id=${bk._id}`)}>
                      Update
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* KHO HÀNG CẢNH BÁO */}
        <div className="dash-list-panel">
          <div className="panel-header">
            <h4>Inventory Alerts</h4>
            <button onClick={() => navigate("/admin/inventory")}>All Items</button>
          </div>
          <div className="panel-body">
            {data.lowStockItems.length === 0 ? (
              <p className="empty-text">Stock levels are optimal.</p>
            ) : (
              <ul className="quick-list">
                {data.lowStockItems.map(item => (
                  <li key={item._id} className="quick-item warning-item">
                    <div className="item-details">
                      <strong>{item.name}</strong>
                      <span className="text-danger">Current: {item.quantity} {item.unit}</span>
                    </div>
                    {/* 🔥 NÚT FIX TRUYỀN ID VÀO QUERY PARAMS ĐỂ AUTO MỞ MODAL */}
                    <button className="btn-small-gold" onClick={() => navigate(`/admin/inventory?edit=${item._id}`)}>
                      Fix Item
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default AdminDashboard;