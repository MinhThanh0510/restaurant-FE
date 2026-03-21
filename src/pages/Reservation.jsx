import { useState, useEffect } from "react";
import api from "../api";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import "./Reservation.css";
import { useNavigate, useSearchParams } from "react-router-dom";

// Hình ảnh placeholder đẹp hơn khi món ăn bị thiếu ảnh
const DEFAULT_FOOD_IMG = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&h=150&fit=crop";

function Reservation() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // ===== TỰ ĐỘNG TÌM BÀN NẾU TỪ TRANG HOME CHUYỂN SANG =====
  const [urlQuery] = useSearchParams();

  useEffect(() => {
    // 1. Lấy data từ URL
    const qDate = urlQuery.get("date");
    const qTime = urlQuery.get("time");
    const qGuests = urlQuery.get("guests");

    // 2. Nếu có đủ data trên URL thì mới chạy
    if (qDate && qTime && qGuests) {
      
      // Update form Step 1 để hiển thị đúng những gì khách chọn ngoài Home
      setSearchParams({
        date: qDate,
        time: qTime,
        guests: parseInt(qGuests)
      });

      // 3. Tự động gọi API (Dùng thẳng biến qDate, qTime để tránh delay của State)
      const autoFetchTables = async () => {
        setLoading(true);
        try {
          const res = await api.get(`/tables/available?date=${qDate}&time=${qTime}&guests=${qGuests}`);
          setAvailableTables(res.data.tables);
          // 4. Tìm xong thì Ép chuyển sang Step 2
          setStep(2); 
        } catch (err) {
          alert("Error finding tables: " + (err.response?.data?.message || err.message));
        } finally {
          setLoading(false);
        }
      };

      autoFetchTables();
    }
  }, []);

  // ================= STATE DỮ LIỆU =================
  const [searchParams, setSearchParams] = useState({
    date: "",
    time: "18:00",
    guests: 2,
  });

  const [bookingInfo, setBookingInfo] = useState({
    tableId: "",
    selectedTable: null,
    fullName: user?.fullName || "",
    phone: user?.phone || "",
    email: user?.email || "",
    note: "",
  });

  const [availableTables, setAvailableTables] = useState([]);
  
  // NÂNG CẤP STATE MENU: Lưu cả Category
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [cart, setCart] = useState([]);

  const timeSlots = ["17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"];

  const handleCancelProcess = () => {
    if (window.confirm("Are you sure you want to cancel this reservation process?")) {
      setStep(1);
      setCart([]);
      setBookingInfo({ ...bookingInfo, tableId: "", selectedTable: null });
    }
  };

  // ================= STEP 1: TÌM BÀN TRỐNG =================
  const handleSearchTables = async (e) => {
    e.preventDefault();
    if (!searchParams.date || !searchParams.time) return alert("Please select a date and time!");

    setLoading(true);
    try {
      const res = await api.get(`/tables/available?date=${searchParams.date}&time=${searchParams.time}&guests=${searchParams.guests}`);
      setAvailableTables(res.data.tables);
      setStep(2);
    } catch (err) {
      alert("Error searching for tables: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // ================= STEP 2: CHỌN BÀN =================
  const handleSelectTable = (table) => {
    setBookingInfo({ ...bookingInfo, tableId: table._id, selectedTable: table });
    setStep(3);
    fetchMenus();
  };

  // ================= STEP 3: PRE-ORDER =================
  const fetchMenus = async () => {
    try {
      const res = await api.get("/menus");
      // Dữ liệu API trả về mảng các categories chứa items
      const fetchedData = res.data.data || [];
      setCategories(fetchedData);
      
      // Chọn mặc định category đầu tiên
      if (fetchedData.length > 0) {
        setActiveCategory(fetchedData[0].categoryId);
      }
    } catch (err) {
      console.log("Error fetching menu", err);
    }
  };

  const addToCart = (menu) => {
    const existing = cart.find(item => item.menuId === menu._id);
    if (existing) {
      setCart(cart.map(item => item.menuId === menu._id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { menuId: menu._id, name: menu.name, price: menu.price, image: menu.image, quantity: 1 }]);
    }
  };

  const decreaseQuantity = (menuId) => {
    const existing = cart.find(item => item.menuId === menuId);
    if (existing.quantity === 1) {
      setCart(cart.filter(item => item.menuId !== menuId));
    } else {
      setCart(cart.map(item => item.menuId === menuId ? { ...item, quantity: item.quantity - 1 } : item));
    }
  };

  const totalCartAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // ================= STEP 4: SUBMIT ĐẶT BÀN =================
  const handleSubmitReservation = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const reservationPayload = {
        tableId: bookingInfo.tableId,
        reservationDate: searchParams.date,
        startTime: searchParams.time,
        numberOfGuests: searchParams.guests,
        fullName: bookingInfo.fullName,
        phone: bookingInfo.phone,
        email: bookingInfo.email,
        note: bookingInfo.note,
      };

      const resReservation = await api.post("/reservations", reservationPayload);
      const newReservationId = resReservation.data.reservation._id;

      if (cart.length > 0) {
        try {
          await api.post("/preorders", {
            reservationId: newReservationId,
            items: cart.map(item => ({ menuId: item.menuId, quantity: item.quantity }))
          });
          alert("🎉 Reservation and pre-order submitted successfully!");
        } catch (preorderErr) {
          alert("⚠️ Reservation successful, but the pre-order system is currently experiencing issues.");
        }
      } else {
        alert("🎉 Reservation successful!");
      }
      navigate("/my-reservations");
    } catch (err) {
      alert("System error: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách món ăn thuộc Category đang được chọn
  const activeMenuData = categories.find(cat => cat.categoryId === activeCategory);
  const displayItems = activeMenuData ? activeMenuData.items : [];

  return (
    <>
      <Navbar />
      <div className="reservation-page">
        <div className="reservation-card">

          <div className="step-indicator">
            <div className={`step-circle ${step >= 1 ? "active" : ""}`}>1</div>
            <div className={`step-circle ${step >= 2 ? "active" : ""}`}>2</div>
            <div className={`step-circle ${step >= 3 ? "active" : ""}`}>3</div>
            <div className={`step-circle ${step >= 4 ? "active" : ""}`}>4</div>
          </div>

          {/* ===== BƯỚC 1 ===== */}
          {step === 1 && (
            <form className="step-content" onSubmit={handleSearchTables}>
              <h3 style={{ marginBottom: '10px' }}>Select Time & Guests</h3>
              <div className="form-group">
                <label>Date of Arrival</label>
                <input type="date" min={new Date().toISOString().split("T")[0]} value={searchParams.date} onChange={(e) => setSearchParams({ ...searchParams, date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Time of Arrival</label>
                <select value={searchParams.time} onChange={(e) => setSearchParams({ ...searchParams, time: e.target.value })} required>
                  {timeSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Number of Guests</label>
                <input type="number" min="1" max="20" value={searchParams.guests} onChange={(e) => setSearchParams({ ...searchParams, guests: parseInt(e.target.value) })} required />
              </div>
              <div className="btn-row" style={{ marginTop: '10px' }}>
                <button type="submit" className="btn-gold" disabled={loading}>
                  {loading ? "Searching for tables..." : "Find Available Tables"}
                </button>
              </div>
            </form>
          )}

          {/* ===== BƯỚC 2: UI BÀN NÂNG CẤP ===== */}
          {step === 2 && (
            <div className="step-content">
              <h3>Available Tables at {searchParams.time}</h3>
              {availableTables.length === 0 ? (
                <p className="loading">Sorry, no tables available at this time. Please select a different time.</p>
              ) : (
                <div className="table-list">
                  {availableTables.map(table => {
                    // Tự động phân loại bàn
                    let tableType = "Standard";
                    if (table.capacity <= 2) tableType = "Couple Table";
                    else if (table.capacity >= 6) tableType = "Family / Group";

                    return (
                      <div
                        key={table._id}
                        className={`table-card ${bookingInfo.tableId === table._id ? 'selected' : ''}`}
                        onClick={() => handleSelectTable(table)}
                      >
                        {/* Icon Bàn (Đồ họa SVG Luxury) */}
                        <svg className="table-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 16h16M12 16v6M8 22h8M6 16l-2-6h16l-2 6M7 10V4h10v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>

                        <div className="table-info">
                          <h4>Table {table.tableNumber}</h4>
                          <span className="table-tag">{tableType}</span>
                          <p>Maximum: <b>{table.capacity}</b> people</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="btn-row" style={{ marginTop: '10px' }}>
                <button className="btn-outline" onClick={() => setStep(1)}>Quay lại tìm kiếm</button>
              </div>
            </div>
          )}

          {/* ===== BƯỚC 3: MENU CÓ CATEGORY ===== */}
          {step === 3 && (
            <div className="step-content">
              <h3>Pre-Order Meals (Optional)</h3>
              
              {/* Category Tabs */}
              <div className="menu-categories">
                {categories.map(cat => (
                  <button
                    key={cat.categoryId}
                    type="button"
                    className={`cat-tab ${activeCategory === cat.categoryId ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat.categoryId)}
                  >
                    {cat.categoryName}
                  </button>
                ))}
              </div>

              <div className="menu-layout">
                {/* Danh sách món ăn theo Category */}
                <div className="menu-list">
                  {displayItems.map(item => (
                    <div key={item._id} className="menu-item">
                      <img src={item.image || DEFAULT_FOOD_IMG} alt={item.name} />
                      <div>
                        <p>{item.name}</p>
                        <span>{item.price.toLocaleString()} $</span>
                      </div>
                      <button type="button" className="btn-gold" style={{ padding: "5px 10px", flex: "none" }} onClick={() => addToCart(item)}>+</button>
                    </div>
                  ))}
                  {displayItems.length === 0 && <p style={{color: '#aaa', textAlign: 'center', marginTop: '20px'}}>No items available in this category.</p>}
                </div>

                <div className="cart-box">
                  <h4>Selected Items</h4>
                  {cart.length === 0 ? <p className="empty">No items selected</p> : cart.map(item => (
                    <div key={item.menuId} className="cart-item">
                      <span>{item.name} (x{item.quantity})</span>
                      <div className="quantity">
                        <button type="button" onClick={() => decreaseQuantity(item.menuId)}>-</button>
                      </div>
                    </div>
                  ))}
                  {cart.length > 0 && (
                    <div className="cart-total">Total: {totalCartAmount.toLocaleString()} $</div>
                  )}
                </div>
              </div>

              <div className="btn-row" style={{ marginTop: '10px' }}>
                <button type="button" className="btn-outline" style={{ borderColor: "#dc3545", color: "#dc3545" }} onClick={handleCancelProcess}>Cancel Reservation</button>
                <button type="button" className="btn-outline" onClick={() => setStep(2)}>Change Table</button>
                <button type="button" className="btn-gold" onClick={() => setStep(4)}>Continue</button>
              </div>
            </div>
          )}

          {/* ===== BƯỚC 4 ===== */}
          {step === 4 && (
            <form className="step-content" onSubmit={handleSubmitReservation}>
              <h3 style={{ marginBottom: "5px" }}>Confirm & Complete</h3>

              <div className="confirm-section" style={{ marginBottom: "10px" }}>
                <div className="confirm-row"><span>Time:</span> <b>{searchParams.time} - {searchParams.date}</b></div>
                <div className="confirm-row"><span>Table:</span> <b>Table {bookingInfo.selectedTable?.tableNumber}</b></div>
                <div className="confirm-row"><span>Guests:</span> <b>{searchParams.guests} people</b></div>
                {cart.length > 0 && (
                  <>
                    <div className="confirm-divider" style={{ height: "1px", background: "rgba(255,255,255,0.1)", margin: "10px 0" }}></div>
                    <div className="confirm-row total"><span>Total Meal Cost:</span> <b>{totalCartAmount.toLocaleString()} $</b></div>
                  </>
                )}
              </div>

              <div className="form-group">
                <input type="text" placeholder="Full Name" value={bookingInfo.fullName} onChange={(e) => setBookingInfo({ ...bookingInfo, fullName: e.target.value })} required />
              </div>
              <div className="form-group">
                <input type="tel" placeholder="Phone Number" value={bookingInfo.phone} onChange={(e) => setBookingInfo({ ...bookingInfo, phone: e.target.value })} required />
              </div>
              <div className="form-group">
                <input type="email" placeholder="Email" value={bookingInfo.email} onChange={(e) => setBookingInfo({ ...bookingInfo, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <textarea placeholder="Notes (Anniversary, allergies...)" value={bookingInfo.note} onChange={(e) => setBookingInfo({ ...bookingInfo, note: e.target.value })} />
              </div>

              <div className="btn-row" style={{ marginTop: '15px' }}>
                <button type="button" className="btn-outline" style={{ borderColor: "#dc3545", color: "#dc3545" }} onClick={handleCancelProcess}>Cancel</button>
                <button type="button" className="btn-outline" onClick={() => setStep(3)}>Back</button>
                <button type="submit" className="btn-gold" disabled={loading}>
                  {loading ? "Processing..." : "Confirm Reservation"}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </>
  );
}

export default Reservation;