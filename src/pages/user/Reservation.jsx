import { useState, useEffect } from "react";
import api from "../../api";
import { useAuth } from "../../context/AuthContext";
import "./Reservation.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { toast } from "react-toastify"; // 🔥 Dùng Toastify thay cho Alert

const DEFAULT_FOOD_IMG = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&h=150&fit=crop";

function Reservation() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [urlQuery] = useSearchParams();

  const [createdReservationId, setCreatedReservationId] = useState(null);

  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const [searchParams, setSearchParams] = useState({
    date: "",
    time: "18:00",
    guests: 2,
  });

  const allTimeSlots = ["17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"];

  // 🔥 CUSTOM MODAL STATE
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const getValidTimeSlots = () => {
    if (!searchParams.date) return allTimeSlots;

    if (searchParams.date === todayString) {
      const currentHour = new Date().getHours();
      const currentMinute = new Date().getMinutes();

      return allTimeSlots.filter(slot => {
        const [slotHour, slotMinute] = slot.split(':').map(Number);
        if (slotHour > currentHour) return true;
        if (slotHour === currentHour && slotMinute > currentMinute) return true;
        return false;
      });
    }
    return allTimeSlots;
  };

  const validTimeSlots = getValidTimeSlots();

  useEffect(() => {
    if (searchParams.date) {
      const slots = getValidTimeSlots();
      if (slots.length > 0 && !slots.includes(searchParams.time)) {
        setSearchParams(prev => ({ ...prev, time: slots[0] }));
      }
      else if (slots.length === 0) {
        setSearchParams(prev => ({ ...prev, time: "" }));
      }
    }
  }, [searchParams.date]);

  useEffect(() => {
    const qDate = urlQuery.get("date");
    const qTime = urlQuery.get("time");
    const qGuests = urlQuery.get("guests");

    if (qDate && qTime && qGuests) {
      setSearchParams({
        date: qDate,
        time: qTime,
        guests: parseInt(qGuests)
      });

      const autoFetchTables = async () => {
        setLoading(true);
        try {
          const res = await api.get(`/tables/available?date=${qDate}&time=${qTime}&guests=${qGuests}`);
          setAvailableTables(res.data.tables);
          setStep(2);
        } catch (err) {
          toast.error("Error finding tables: " + (err.response?.data?.message || err.message));
        } finally {
          setLoading(false);
        }
      };

      autoFetchTables();
    }
  }, []);

  const [bookingInfo, setBookingInfo] = useState({
    tableId: "",
    selectedTable: null,
    fullName: user?.fullName || "",
    phone: user?.phone || "",
    email: user?.email || "",
    note: "",
  });

  const [availableTables, setAvailableTables] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [cart, setCart] = useState([]);

  const filteredTables = availableTables.filter(table => {
    if (table.capacity < searchParams.guests) return false;
    if (searchParams.guests <= 2) return table.capacity <= 2;
    return table.capacity > 2;
  });

  // 🔥 CUSTOM HỦY QUÁ TRÌNH
  const handleCancelProcess = () => setCancelModalOpen(true);

  const confirmCancelProcess = () => {
    setStep(1);
    setCart([]);
    setBookingInfo({ ...bookingInfo, tableId: "", selectedTable: null });
    setCancelModalOpen(false);
    toast.info("Reservation process cancelled.");
  };

  const handleSearchTables = async (e) => {
    e.preventDefault();
    if (!searchParams.date || !searchParams.time) return toast.warning("Please select a valid date and time!");

    setLoading(true);
    try {
      const res = await api.get(`/tables/available?date=${searchParams.date}&time=${searchParams.time}&guests=${searchParams.guests}`);
      setAvailableTables(res.data.tables);
      setStep(2);
    } catch (err) {
      toast.error("Error searching for tables: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTable = (table) => {
    setBookingInfo({ ...bookingInfo, tableId: table._id, selectedTable: table });
    setStep(3);
    fetchMenus();
  };

  const fetchMenus = async () => {
    try {
      const res = await api.get("/menus");
      const fetchedData = res.data.data || [];
      setCategories(fetchedData);
      if (fetchedData.length > 0) setActiveCategory(fetchedData[0].categoryId);
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

  const totalMealAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tableSurcharge = bookingInfo.selectedTable?.price || 0;
  const grandTotal = totalMealAmount + tableSurcharge;

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
        } catch (preorderErr) {
          toast.error("Reservation created, but pre-order items failed to save.");
        }
      }

      if (grandTotal > 0) {
        setCreatedReservationId(newReservationId);
        setStep(5);
      } else {
        toast.success("Reservation completed successfully!");
        navigate("/my-reservations");
      }
    } catch (err) {
      toast.error("System error: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const activeMenuData = categories.find(cat => cat.categoryId === activeCategory);
  const displayItems = activeMenuData ? activeMenuData.items : [];

  // 🔥 SVG Icons thay thế Emoji
  const iconWindow = <svg className="loc-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="12" y1="3" x2="12" y2="21" /></svg>;
  const iconOutdoor = <svg className="loc-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22v-8" /><path d="M5.5 14c-1.66 0-3-1.34-3-3s1.34-3 3-3c.53 0 1.03.14 1.47.38A3.99 3.99 0 0 1 12 5a3.99 3.99 0 0 1 5.03 3.38c.44-.24.94-.38 1.47-.38 1.66 0 3 1.34 3 3s-1.34 3-3 3h-13z" /></svg>;
  const iconIndoor = <svg className="loc-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;

  return (
    <div className="reservation-page">
      <div className="reservation-card glass-panel">

        <div className="step-indicator">
          <div className={`step-circle ${step >= 1 ? "active" : ""}`}>1</div>
          <div className="step-line"></div>
          <div className={`step-circle ${step >= 2 ? "active" : ""}`}>2</div>
          <div className="step-line"></div>
          <div className={`step-circle ${step >= 3 ? "active" : ""}`}>3</div>
          <div className="step-line"></div>
          <div className={`step-circle ${step >= 4 ? "active" : ""}`}>4</div>
          <div className="step-line"></div>
          <div className={`step-circle ${step === 5 ? "active" : ""}`}>5</div>
        </div>

        {/* ===== BƯỚC 1 ===== */}
        {step === 1 && (
          <form className="step-content" onSubmit={handleSearchTables}>
            <div className="step-header">
              <span className="gold-subtitle">Step 1</span>
              <h3>Select Time & Guests</h3>
            </div>
            <div className="form-group">
              <label>Date of Arrival</label>
              <input type="date" min={todayString} value={searchParams.date} onChange={(e) => setSearchParams({ ...searchParams, date: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Time of Arrival</label>
              <select value={searchParams.time} onChange={(e) => setSearchParams({ ...searchParams, time: e.target.value })} required disabled={validTimeSlots.length === 0}>
                {validTimeSlots.length > 0 ? (
                  validTimeSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)
                ) : (
                  <option value="">No available slots today</option>
                )}
              </select>
            </div>
            <div className="form-group">
              <label>Number of Guests</label>
              <input type="number" min="1" max="20" value={searchParams.guests} onChange={(e) => setSearchParams({ ...searchParams, guests: parseInt(e.target.value) })} required />
            </div>
            <div className="btn-row" style={{ marginTop: '20px' }}>
              <button type="submit" className="btn-gold" disabled={loading || validTimeSlots.length === 0}>
                {loading ? "Searching..." : validTimeSlots.length === 0 ? "Fully Booked Today" : "Find Available Tables"}
              </button>
            </div>
          </form>
        )}

        {/* ===== BƯỚC 2: CHỌN BÀN ===== */}
        {step === 2 && (
          <div className="step-content">
            <div className="step-header">
              <span className="gold-subtitle">Step 2</span>
              <h3>Available Tables at {searchParams.time}</h3>
            </div>
            {filteredTables.length === 0 ? (
              <p className="loading-state">Sorry, no matching tables found for {searchParams.guests} guests. Please try a different time.</p>
            ) : (
              <div className="table-list">
                {filteredTables.map(table => {
                  let tableType = "Standard";
                  if (table.capacity <= 2) tableType = "Couple Table";
                  else if (table.capacity >= 6) tableType = "Family / Group";

                  let locationSvg = iconIndoor;
                  let locationText = "Indoor";
                  if (table.location === 'window') { locationSvg = iconWindow; locationText = "Window"; }
                  else if (table.location === 'outdoor') { locationSvg = iconOutdoor; locationText = "Outdoor"; }

                  const priceText = table.price > 0 ? `(+$${table.price})` : "";

                  return (
                    <div key={table._id} className={`table-card ${bookingInfo.tableId === table._id ? 'selected' : ''}`} onClick={() => handleSelectTable(table)}>
                      <svg className="table-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 16h16M12 16v6M8 22h8M6 16l-2-6h16l-2 6M7 10V4h10v6" />
                      </svg>
                      <div className="table-info">
                        <h4>Table {table.tableNumber}</h4>
                        <span className="table-tag">{tableType}</span>
                        <p>Max: <b>{table.capacity}</b> pax</p>
                        <div className="table-location">
                          {locationSvg} <span>{locationText}</span> <span className="loc-price">{priceText}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="btn-row" style={{ marginTop: '20px' }}>
              <button className="btn-outline" onClick={() => setStep(1)}>Go Back</button>
            </div>
          </div>
        )}

        {/* ===== BƯỚC 3: PRE-ORDER ===== */}
        {step === 3 && (
          <div className="step-content">
            <div className="step-header">
              <span className="gold-subtitle">Step 3</span>
              <h3>Pre-Order Meals (Optional)</h3>
            </div>

            <div className="menu-categories">
              {categories.map(cat => (
                <button key={cat.categoryId} type="button" className={`cat-tab ${activeCategory === cat.categoryId ? 'active' : ''}`} onClick={() => setActiveCategory(cat.categoryId)}>
                  {cat.categoryName}
                </button>
              ))}
            </div>

            <div className="menu-layout">
              <div className="menu-list">
                {displayItems.map(item => (
                  <div key={item._id} className="menu-item glass-panel-sm">
                    <img src={item.image || DEFAULT_FOOD_IMG} alt={item.name} />
                    <div className="menu-item-info">
                      <p>{item.name}</p>
                      <span>${item.price.toLocaleString()}</span>
                    </div>
                    <button type="button" className="btn-add-cart" onClick={() => addToCart(item)}>+</button>
                  </div>
                ))}
                {displayItems.length === 0 && <p className="empty-state">No items available.</p>}
              </div>

              <div className="cart-box glass-panel-sm">
                <h4 className="cart-title">Selected Items</h4>
                {cart.length === 0 ? <p className="empty-state">No items selected</p> : cart.map(item => (
                  <div key={item.menuId} className="cart-item">
                    <span>{item.name} <span className="cart-qty">x{item.quantity}</span></span>
                    <button type="button" className="btn-minus" onClick={() => decreaseQuantity(item.menuId)}>-</button>
                  </div>
                ))}

                {(cart.length > 0 || tableSurcharge > 0) && (
                  <div className="cart-total">
                    {tableSurcharge > 0 && <div className="cart-subline">Table Surcharge: ${tableSurcharge.toLocaleString()}</div>}
                    {cart.length > 0 && <div className="cart-subline">Meals Subtotal: ${totalMealAmount.toLocaleString()}</div>}
                    <div className="cart-grand">Current Total: <span>${grandTotal.toLocaleString()}</span></div>
                  </div>
                )}
              </div>
            </div>

            <div className="btn-row" style={{ marginTop: '20px' }}>
              <button type="button" className="btn-outline outline-danger" onClick={handleCancelProcess}>Cancel</button>
              <button type="button" className="btn-outline" onClick={() => setStep(2)}>Change Table</button>
              <button type="button" className="btn-gold" onClick={() => setStep(4)}>Continue</button>
            </div>
          </div>
        )}

        {/* ===== BƯỚC 4: XÁC NHẬN THÔNG TIN ===== */}
        {step === 4 && (
          <form className="step-content" onSubmit={handleSubmitReservation}>
            <div className="step-header">
              <span className="gold-subtitle">Step 4</span>
              <h3>Confirm Information</h3>
            </div>

            <div className="confirm-section glass-panel-sm">
              <div className="confirm-row"><span>Time:</span> <b>{searchParams.time} - {searchParams.date}</b></div>
              <div className="confirm-row">
                <span>Table:</span>
                <b>Table {bookingInfo.selectedTable?.tableNumber} ({bookingInfo.selectedTable?.location || "indoor"})</b>
              </div>
              <div className="confirm-row"><span>Guests:</span> <b>{searchParams.guests} people</b></div>

              <div className="confirm-divider"></div>

              {tableSurcharge > 0 && <div className="confirm-row sm"><span>Table Surcharge:</span> <span>${tableSurcharge.toLocaleString()}</span></div>}
              {cart.length > 0 && <div className="confirm-row sm"><span>Pre-ordered Meals:</span> <span>${totalMealAmount.toLocaleString()}</span></div>}

              <div className="confirm-row total">
                <span>Grand Total:</span>
                <b className="gold-text">${grandTotal.toLocaleString()}</b>
              </div>
            </div>

            <div className="policy-alert glass-panel-sm">
              <div className="policy-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="info-icon">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <span>Cancellation Policy</span>
              </div>
              <ul className="policy-list">
                <li>Cancel <b>≥ 48 hours</b> before arrival: <span className="text-green">100% Refund</span></li>
                <li>Cancel <b>24h - 48h</b> before arrival: <span className="text-orange">80% Refund</span></li>
                <li>Cancel <b>&lt; 24 hours</b> before arrival: <span className="text-red">No Refund</span></li>
              </ul>
            </div>

            <div className="form-group">
              <input type="text" placeholder="Full Name" value={bookingInfo.fullName} onChange={(e) => setBookingInfo({ ...bookingInfo, fullName: e.target.value })} required />
            </div>
            <div className="form-group">
              <input type="tel" placeholder="Phone Number" value={bookingInfo.phone} onChange={(e) => setBookingInfo({ ...bookingInfo, phone: e.target.value })} required />
            </div>
            <div className="form-group">
              <input type="email" placeholder="Email Address" value={bookingInfo.email} onChange={(e) => setBookingInfo({ ...bookingInfo, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <textarea placeholder="Notes (Anniversary, allergies...)" value={bookingInfo.note} onChange={(e) => setBookingInfo({ ...bookingInfo, note: e.target.value })} />
            </div>

            <div className="btn-row" style={{ marginTop: '20px' }}>
              <button type="button" className="btn-outline outline-danger" onClick={handleCancelProcess}>Cancel</button>
              <button type="button" className="btn-outline" onClick={() => setStep(3)}>Back</button>
              <button type="submit" className="btn-gold" disabled={loading}>
                {loading ? "Processing..." : (grandTotal > 0 ? "Agree & Continue" : "Confirm Reservation")}
              </button>
            </div>
          </form>
        )}

        {/* ===== BƯỚC 5: THANH TOÁN PAYPAL ===== */}
        {step === 5 && (
          <div className="step-content payment-step">
            <div className="payment-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="secure-icon">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <h3>Secure Checkout</h3>
            </div>
            <p className="payment-subtitle">Your table is reserved! Please complete the payment to finalize your booking.</p>

            <div className="payment-summary-card glass-panel-sm">
              <span className="summary-label">Amount Due</span>
              <span className="summary-amount">${grandTotal.toLocaleString()}</span>
            </div>

            <div className="paypal-container glass-panel-sm">
              <PayPalScriptProvider options={{ "client-id": "test", currency: "USD" }}>
                <PayPalButtons
                  style={{ layout: "vertical", shape: "rect", color: "gold", label: "pay" }}
                  createOrder={async () => {
                    try {
                      const res = await api.post("/payment/create-order", { totalAmount: grandTotal });
                      return res.data.orderID;
                    } catch (err) { toast.error("Could not initialize PayPal: " + err.message); }
                  }}
                  onApprove={async (data, actions) => {
                    setLoading(true);
                    try {
                      await api.post("/payment/capture-order", {
                        orderID: data.orderID,
                        reservationId: createdReservationId
                      });
                      toast.success("Payment successful! Your reservation is confirmed.");
                      navigate("/my-reservations");
                    } catch (err) { toast.error("Payment failed: " + (err.response?.data?.message || err.message)); } finally { setLoading(false); }
                  }}
                />
              </PayPalScriptProvider>
            </div>

            <button type="button" className="btn-skip-payment" onClick={() => {
              toast.info("Reservation saved. You can pay later in 'My Reservations'.");
              navigate("/my-reservations");
            }}>
              Skip & Pay Later
            </button>
          </div>
        )}

      </div>

      {/* ===== CUSTOM CANCEL MODAL ===== */}
      {cancelModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: "400px" }}>
            <div className="modal-warning-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h3 className="modal-title" style={{ fontSize: "22px" }}>Cancel Booking?</h3>
            <p className="modal-desc" style={{ marginBottom: "25px", color: "#ccc", fontSize: "15px" }}>
              Are you sure you want to cancel the reservation process? All selected items and table will be cleared.
            </p>
            <div className="modal-actions">
              <button className="btn-action outline-light" onClick={() => setCancelModalOpen(false)}>No, Continue</button>
              <button className="btn-action outline-danger" style={{ background: "transparent", color: "#dc3545" }} onClick={confirmCancelProcess}>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Reservation;