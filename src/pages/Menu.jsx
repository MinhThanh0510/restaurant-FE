import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api";
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

  // Hàm xử lý data trước khi render (Lọc theo Category và Tìm kiếm)
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
      <Navbar />

      {/* HERO & SEARCH */}
      <div className="menu-hero">
        <h1>Our Culinary Masterpieces</h1>
        <p>Explore our carefully curated menu, featuring the finest ingredients and exquisite flavors crafted by our master chefs.</p>
        
        <div className="menu-search">
          <input 
            type="text" 
            placeholder="Search for a dish..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

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
          <p style={{ textAlign: "center", color: "#aaa" }}>Loading menu...</p>
        ) : filteredData.length === 0 ? (
          <p style={{ textAlign: "center", color: "#aaa", fontSize: "18px" }}>No dishes found matching your criteria.</p>
        ) : (
          filteredData.map(category => (
            <div key={category.categoryId} className="menu-category-section">
              <h2 className="category-title">{category.categoryName}</h2>
              
              <div className="menu-list-layout">
                {category.items.map(item => (
                  <div key={item._id} className="menu-list-item">
                    <img 
                      src={item.image || "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg"} 
                      alt={item.name} 
                    />
                    <div className="menu-info">
                      <div className="menu-info-header">
                        <h3>{item.name}</h3>
                        <span className="menu-price">{item.price.toLocaleString()} $</span>
                      </div>
                      <p className="menu-desc">{item.description}</p>
                      <button 
                        className="btn-book-mini"
                        onClick={() => navigate("/reservation")}
                      >
                        Book Table to Order
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
  );
}

export default Menu;