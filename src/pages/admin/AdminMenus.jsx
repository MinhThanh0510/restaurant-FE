import { useState, useEffect } from "react";
import api from "../../api";
import { toast } from "react-toastify";
import "./AdminMenus.css";

function AdminMenus() {
  const [activeTab, setActiveTab] = useState("menus");
  const [loading, setLoading] = useState(false);

  const [menus, setMenus] = useState([]);
  const [categories, setCategories] = useState([]);
  const [inventory, setInventory] = useState([]);

  const [menuModal, setMenuModal] = useState({ isOpen: false, mode: "add", data: null });
  const [catModal, setCatModal] = useState({ isOpen: false, mode: "add", data: null });

  const [menuForm, setMenuForm] = useState({
    name: "", description: "", price: "", image: "", categoryId: "", isAvailable: true, ingredients: []
  });
  const [catForm, setCatForm] = useState({ name: "", description: "" });

  // ====== FETCH DATA ======
  const fetchData = async (isManual = false) => {
    setLoading(true);
    try {
      const [menuRes, catRes, invRes] = await Promise.all([
        api.get("/menus/admin"),
        api.get("/categories"),
        api.get("/inventory")
      ]);

      const fetchedCats = catRes.data.categories || catRes.data;
      setCategories(Array.isArray(fetchedCats) ? fetchedCats : []);

      const fetchedInv = invRes.data.inventory || invRes.data;
      setInventory(Array.isArray(fetchedInv) ? fetchedInv : []);

      const fetchedMenus = menuRes.data.menus || menuRes.data;
      setMenus(Array.isArray(fetchedMenus) ? fetchedMenus : []);

      if (isManual) toast.success("Data synchronized!");
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

  // ====== CATEGORY ACTIONS ======
  const openCatModal = (mode, category = null) => {
    if (mode === "edit" && category) {
      setCatForm({ name: category.name, description: category.description || "" });
    } else {
      setCatForm({ name: "", description: "" });
    }
    setCatModal({ isOpen: true, mode, data: category });
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (catModal.mode === "add") {
        await api.post("/categories", catForm);
        toast.success("New category added!");
      } else {
        await api.put(`/categories/${catModal.data._id}`, catForm);
        toast.success("Category updated!");
      }
      setCatModal({ isOpen: false, mode: "add", data: null });
      setCatForm({ name: "", description: "" });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving category");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm("Are you sure? This may affect items in this category.")) {
      try {
        await api.delete(`/categories/${id}`);
        toast.success("Category deleted!");
        fetchData();
      } catch (err) {
        toast.error("Error deleting category");
      }
    }
  };

  // ====== MENU ITEM ACTIONS ======
  const openMenuModal = (mode, menu = null) => {
    if (mode === "edit" && menu) {
      setMenuForm({
        name: menu.name,
        description: menu.description || "",
        price: menu.price,
        image: menu.image || "",
        categoryId: menu.categoryId?._id || menu.categoryId || "",
        isAvailable: menu.isAvailable,
        ingredients: menu.ingredients?.map(ing => {
          let extractedId = ing.ingredientId;
          if (typeof extractedId === 'object' && extractedId !== null) {
            extractedId = extractedId._id || extractedId;
          }
          return {
            ingredientId: extractedId ? String(extractedId) : "",
            quantity: ing.quantity || 1
          };
        }) || []
      });
    } else {
      setMenuForm({
        name: "", description: "", price: "", image: "",
        categoryId: categories[0]?._id || "", isAvailable: true, ingredients: []
      });
    }
    setMenuModal({ isOpen: true, mode, data: menu });
  };

  const handleSaveMenu = async (e) => {
    e.preventDefault();
    try {
      if (menuModal.mode === "add") {
        await api.post("/menus", menuForm);
        toast.success("New menu item added successfully!");
      } else {
        await api.put(`/menus/${menuModal.data._id}`, menuForm);
        toast.success("Menu item updated successfully!");
      }
      setMenuModal({ isOpen: false, mode: "add", data: null });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving menu item!");
    }
  };

  const handleDeleteMenu = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await api.delete(`/menus/${id}`);
        toast.success("Item deleted successfully!");
        fetchData();
      } catch (err) {
        toast.error(err.response?.data?.message || "Error deleting menu item!");
      }
    }
  };

  // ====== INGREDIENTS ROW ACTIONS ======
  const handleAddIngredientRow = () => {
    setMenuForm({
      ...menuForm,
      ingredients: [...menuForm.ingredients, { ingredientId: "", quantity: 1 }]
    });
  };

  const handleRemoveIngredientRow = (index) => {
    const newIngredients = [...menuForm.ingredients];
    newIngredients.splice(index, 1);
    setMenuForm({ ...menuForm, ingredients: newIngredients });
  };

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...menuForm.ingredients];
    newIngredients[index][field] = value;
    setMenuForm({ ...menuForm, ingredients: newIngredients });
  };

  return (
    <div className="admin-menus-wrapper">
      <div className="admin-header-flex">
        <h3>Menu & Category Management</h3>
      </div>

      <div className="admin-tabs">
        <button className={`tab-btn ${activeTab === "menus" ? "active" : ""}`} onClick={() => setActiveTab("menus")}>
          Menu Items
        </button>
        <button className={`tab-btn ${activeTab === "categories" ? "active" : ""}`} onClick={() => setActiveTab("categories")}>
          Categories
        </button>
      </div>

      {/* ===== MENU TAB ===== */}
      {activeTab === "menus" && (
        <div className="tab-content">
          <div className="tab-actions">
            <button className="btn-primary" onClick={() => openMenuModal("add")}>Add New Item</button>
            <button className="btn-refresh" onClick={() => fetchData(true)} disabled={loading}>
              {loading ? (
                <svg className="spin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 21v-5h5" /></svg>
              )}
              Refresh
            </button>
          </div>

          {loading ? <p className="loading-text">Loading data...</p> : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {menus.length === 0 ? (
                    <tr><td colSpan="6" className="empty-cell">No menu items found.</td></tr>
                  ) : (
                    menus.map(menu => (
                      <tr key={menu._id} className="table-row">
                        <td>
                          <img
                            src={menu.image || "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg"}
                            alt={menu.name}
                            className="menu-thumbnail"
                          />
                        </td>
                        <td className="font-bold text-dark">{menu.name}</td>
                        <td>{menu.categoryId?.name || "N/A"}</td>
                        <td className="text-gold font-bold">{menu.price?.toLocaleString()} $</td>
                        <td>
                          <span className={`status-badge ${menu.isAvailable ? "status-visible" : "status-hidden"}`}>
                            {menu.isAvailable ? "Available" : "Out of Stock"}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons-sm">
                            <button className="btn-small-blue" onClick={() => openMenuModal("edit", menu)}>Edit</button>
                            <button className="btn-small-red" onClick={() => handleDeleteMenu(menu._id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===== CATEGORIES TAB ===== */}
      {activeTab === "categories" && (
        <div className="tab-content">
          <div className="tab-actions">
            <button className="btn-primary" onClick={() => openCatModal("add")}>Add Category</button>
            <button className="btn-refresh" onClick={() => fetchData(true)} disabled={loading}>
              {loading ? (
                <svg className="spin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 21v-5h5" /></svg>
              )}
              Refresh
            </button>
          </div>
          {loading ? <p className="loading-text">Loading data...</p> : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Category Name</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(cat => (
                    <tr key={cat._id} className="table-row">
                      <td className="font-bold">{cat.name}</td>
                      <td className="text-muted">{cat.description || "No description"}</td>
                      <td>
                        <div className="action-buttons-sm">
                          <button className="btn-small-blue" onClick={() => openCatModal("edit", cat)}>Edit</button>
                          <button className="btn-small-red" onClick={() => handleDeleteCategory(cat._id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===== MENU MODAL ===== */}
      {menuModal.isOpen && (
        <div className="admin-modal-overlay" onClick={(e) => e.target.className === "admin-modal-overlay" && setMenuModal({ isOpen: false, mode: 'add', data: null })}>
          <div className="admin-modal-content large">
            <div className="modal-header">
              <h2>{menuModal.mode === "add" ? "Add New Menu Item" : "Edit Menu Item"}</h2>
              <button className="btn-close-modal" onClick={() => setMenuModal({ isOpen: false, mode: 'add', data: null })}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSaveMenu} className="modal-body-form">
              <div className="form-grid-2">
                <div className="input-group">
                  <label>Item Name <span className="req">*</span></label>
                  <input type="text" required value={menuForm.name} onChange={e => setMenuForm({ ...menuForm, name: e.target.value })} placeholder="e.g. Beef Steak" />
                </div>
                <div className="input-group">
                  <label>Category <span className="req">*</span></label>
                  <select required value={menuForm.categoryId} onChange={e => setMenuForm({ ...menuForm, categoryId: e.target.value })}>
                    <option value="" disabled>-- Select Category --</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="input-group">
                  <label>Price ($) <span className="req">*</span></label>
                  <input type="number" required min="0" step="any" value={menuForm.price} onChange={e => setMenuForm({ ...menuForm, price: Number(e.target.value) })} placeholder="e.g. 25" />
                </div>
                <div className="input-group">
                  <label>Image URL</label>
                  <input type="text" value={menuForm.image} onChange={e => setMenuForm({ ...menuForm, image: e.target.value })} placeholder="https://image-link.jpg" />
                </div>
              </div>

              <div className="input-group">
                <label>Description</label>
                <textarea rows="3" value={menuForm.description} onChange={e => setMenuForm({ ...menuForm, description: e.target.value })} placeholder="Enter an appetizing description..." />
              </div>

              <div className="ingredients-section">
                <div className="ingredients-header">
                  <label>Recipe Ingredients</label>
                  <button type="button" className="btn-add-ing" onClick={handleAddIngredientRow}>Add Ingredient</button>
                </div>
                {menuForm.ingredients.length === 0 ? (
                  <p className="empty-ing">No ingredients added yet.</p>
                ) : (
                  <div className="ingredients-list">
                    {menuForm.ingredients.map((ing, idx) => (
                      <div key={idx} className="ingredient-row">
                        <select
                          required
                          value={ing.ingredientId}
                          onChange={(e) => handleIngredientChange(idx, "ingredientId", e.target.value)}
                        >
                          <option value="" disabled>-- Select --</option>
                          {inventory.map(inv => (
                            <option key={inv._id} value={inv._id}>{inv.name} (Stock: {inv.quantity} {inv.unit})</option>
                          ))}
                        </select>
                        <input
                          type="number" required min="0.1" step="any" placeholder="Qty"
                          value={ing.quantity} onChange={(e) => handleIngredientChange(idx, "quantity", Number(e.target.value))}
                        />
                        <button type="button" className="btn-remove-ing" onClick={() => handleRemoveIngredientRow(idx)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="input-group checkbox-group">
                <label>
                  <input type="checkbox" checked={menuForm.isAvailable} onChange={e => setMenuForm({ ...menuForm, isAvailable: e.target.checked })} />
                  Item is available
                </label>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setMenuModal({ isOpen: false, mode: 'add', data: null })}>Cancel</button>
                <button type="submit" className="btn-submit-form">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== CATEGORY MODAL ===== */}
      {catModal.isOpen && (
        <div className="admin-modal-overlay" onClick={(e) => e.target.className === "admin-modal-overlay" && setCatModal({ isOpen: false, mode: 'add', data: null })}>
          <div className="admin-modal-content">
            <div className="modal-header">
              <h2>{catModal.mode === "add" ? "Add New Category" : "Edit Category"}</h2>
              <button className="btn-close-modal" onClick={() => setCatModal({ isOpen: false, mode: 'add', data: null })}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="modal-body-form">
              <div className="input-group">
                <label>Category Name <span className="req">*</span></label>
                <input type="text" required value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} />
              </div>
              <div className="input-group">
                <label>Description</label>
                <textarea rows="3" value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setCatModal({ isOpen: false, mode: 'add', data: null })}>Cancel</button>
                <button type="submit" className="btn-submit-form">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminMenus;