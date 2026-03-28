import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import "./Menu.css";

function Menu() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const res = await api.get("/menus");
        setCategories(res.data.data || []);
      } catch (err) {
        console.error("Error fetching menu:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenus();
  }, []);

  const getFilteredCategories = () => {
    return categories
      .map(category => {
        if (activeTab !== "All" && activeTab !== category.categoryName) {
          return null;
        }

        const filteredItems = category.items.filter(item =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return { ...category, items: filteredItems };
      })
      .filter(category => category !== null && category.items.length > 0);
  };

  const filteredData = getFilteredCategories();

  return (
    <div className="menu-page">
      {/* HERO & SEARCH */}
      <div className="menu-hero">
        <div className="hero-content">
          <span className="gold-subtitle">A Symphony of Tastes</span>
          <h1>Culinary Masterpieces</h1>
          <p>Explore our carefully curated menu, featuring the finest ingredients and exquisite flavors crafted by our master chefs.</p>

          <div className="menu-search-wrapper glass-panel">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              type="text"
              placeholder="Search for a dish, ingredient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="menu-content-wrapper">
        {/* CATEGORY TABS */}
        <div className="menu-nav">
          <button
            className={`menu-tab ${activeTab === "All" ? "active" : ""}`}
            onClick={() => setActiveTab("All")}
          >
            All Menus
          </button>
          {categories.map(cat => (
            <button
              key={cat.categoryId}
              className={`menu-tab ${activeTab === cat.categoryName ? "active" : ""}`}
              onClick={() => setActiveTab(cat.categoryName)}
            >
              {cat.categoryName}
            </button>
          ))}
        </div>

        {/* MENU CONTENT */}
        <div className="menu-container">
          {loading ? (
            <div className="menu-empty-state">
              <div className="loading-spinner"></div>
              <p>Preparing the menu...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="menu-empty-state">
              <p>No dishes found matching your criteria.</p>
            </div>
          ) : (
            filteredData.map(category => (
              <div key={category.categoryId} className="menu-category-section">
                <div className="category-header">
                  <h2 className="category-title">{category.categoryName}</h2>
                  <div className="category-ornament">✦</div>
                </div>

                <div className="menu-list-layout">
                  {category.items.map(item => (
                    <div key={item._id} className="menu-list-item glass-panel">
                      <div className="menu-item-img-wrapper">
                        <img
                          src={item.image || "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg"}
                          alt={item.name}
                        />
                      </div>

                      <div className="menu-info">
                        {/* Hàng Tiêu đề & Giá với nét đứt mang phong cách Fine Dining */}
                        <div className="menu-info-header">
                          <h3>{item.name}</h3>
                          <div className="menu-leader"></div>
                          <span className="menu-price">${item.price.toLocaleString()}</span>
                        </div>

                        <p className="menu-desc">{item.description}</p>

                        <button
                          className="btn-book-inline"
                          onClick={() => navigate("/reservation")}
                        >
                          Book Table to Order <span className="arrow">→</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Menu;