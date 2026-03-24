import { useState, useEffect } from "react";
import api from "../api";
import { toast } from "react-toastify";
import "./AdminInventory.css";

function AdminInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [modal, setModal] = useState({ isOpen: false, mode: "add", data: null });
  const [form, setForm] = useState({ name: "", quantity: "", unit: "" });

  // ====== FETCH DATA ======
  const fetchInventory = async (isManual = false) => {
    setLoading(true);
    try {
      const res = await api.get("/inventory");
      const data = res.data.inventory || res.data;
      setInventory(Array.isArray(data) ? data : []);
      
      if (isManual) toast.success("Inventory synchronized!");
    } catch (error) {
      toast.error("Failed to load inventory data.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // ====== TÌM KIẾM & LỌC ======
  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ====== XỬ LÝ MODAL ======
  const openModal = (mode, item = null) => {
    if (mode === "edit" && item) {
      setForm({ name: item.name, quantity: item.quantity, unit: item.unit });
    } else {
      setForm({ name: "", quantity: "", unit: "" });
    }
    setModal({ isOpen: true, mode, data: item });
  };

  const closeModal = () => {
    setModal({ isOpen: false, mode: "add", data: null });
    setForm({ name: "", quantity: "", unit: "" });
  };

  // ====== CRUD ACTIONS ======
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (modal.mode === "add") {
        await api.post("/inventory", form);
        toast.success("New item added to inventory!");
      } else {
        await api.put(`/inventory/${modal.data._id}`, form);
        toast.success("Inventory item updated!");
      }
      closeModal();
      fetchInventory();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving item.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this item? This may affect menu recipes.")) {
      try {
        await api.delete(`/inventory/${id}`);
        toast.success("Item deleted from inventory!");
        fetchInventory();
      } catch (err) {
        toast.error(err.response?.data?.message || "Error deleting item.");
      }
    }
  };

  return (
    <div className="admin-inv-wrapper">
      <div className="admin-inv-header">
        <h3>Inventory Management</h3>
      </div>

      <div className="admin-inv-actions">
        <input 
          type="text" 
          placeholder="Search ingredients..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="inv-search-input"
        />
        <div className="btn-group">
          <button className="btn-primary" onClick={() => openModal("add")}>+ Add New Item</button>
          <button className="btn-refresh" onClick={() => fetchInventory(true)} disabled={loading}>
            {loading ? "..." : "🔄 Refresh"}
          </button>
        </div>
      </div>

      <div className="stats-bar">
        Total Ingredients: <b className="text-gold">{filteredInventory.length}</b> items | 
        Low Stock Warnings: <b className="text-danger">{filteredInventory.filter(i => i.quantity < 100).length}</b> items
      </div>

      <div className="admin-table-container">
        {loading ? <p className="loading-text">Loading inventory...</p> : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ingredient Name</th>
                <th>Stock Quantity</th>
                <th>Unit</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length === 0 ? (
                <tr><td colSpan="5" className="empty-cell">No ingredients found.</td></tr>
              ) : (
                filteredInventory.map(item => (
                  <tr key={item._id} className="table-row">
                    <td className="font-bold">{item.name}</td>
                    <td>
                      <span className={`stock-badge ${item.quantity < 100 ? "stock-low" : "stock-good"}`}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="text-muted">{item.unit}</td>
                    <td className="text-muted">{new Date(item.updatedAt).toLocaleDateString('en-GB')}</td>
                    <td>
                      <div className="action-buttons-sm">
                        <button className="btn-icon edit" onClick={() => openModal("edit", item)}>✏️ Edit</button>
                        <button className="btn-icon delete" onClick={() => handleDelete(item._id)}>🗑️ Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ===== MODAL FORM ===== */}
      {modal.isOpen && (
        <div className="admin-modal-overlay" onClick={(e) => e.target.className === "admin-modal-overlay" && closeModal()}>
          <div className="admin-modal-content small-modal">
            <div className="modal-header">
              <h2>{modal.mode === "add" ? "Add Inventory Item" : "Edit Inventory Item"}</h2>
              <button className="btn-close-modal" onClick={closeModal}>✕</button>
            </div>
            
            <form onSubmit={handleSave} className="modal-body-form" autoComplete="off">
              <div className="input-group">
                <label>Ingredient Name <span className="req">*</span></label>
                <input 
                  type="text" 
                  required 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})} 
                  placeholder="e.g. Fresh Beef" 
                />
              </div>

              <div className="form-grid-2">
                <div className="input-group">
                  <label>Quantity <span className="req">*</span></label>
                  <input 
                    type="number" 
                    required 
                    min="0" 
                    step="any" 
                    value={form.quantity} 
                    onChange={e => setForm({...form, quantity: e.target.value === '' ? '' : Number(e.target.value)})} 
                    placeholder="e.g. 50" 
                  />
                </div>
                <div className="input-group">
                  <label>Unit <span className="req">*</span></label>
                  <input 
                    type="text" 
                    required 
                    list="unitOptions"
                    value={form.unit} 
                    onChange={e => setForm({...form, unit: e.target.value})} 
                    placeholder="e.g. kg, liters, pcs" 
                  />
                  {/* Datalist gợi ý nhanh các đơn vị phổ biến */}
                  <datalist id="unitOptions">
                    <option value="kg" />
                    <option value="g" />
                    <option value="liters" />
                    <option value="ml" />
                    <option value="pcs" />
                    <option value="boxes" />
                    <option value="packs" />
                  </datalist>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-submit-form">💾 Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminInventory;