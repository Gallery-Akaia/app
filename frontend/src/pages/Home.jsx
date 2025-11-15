import { useState, useEffect } from "react";
import axios from "axios";
import { Search, Filter, X, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import ProductCard from "@/components/ProductCard";
import ProductModal from "@/components/ProductModal";
import AdminPasswordModal from "@/components/AdminPasswordModal";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [stockStatus, setStockStatus] = useState(null);
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchCategories();
    fetchProducts();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(response.data);
    } catch (error) {
      // User not logged in
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      setUser(null);
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedCategory) params.append("category", selectedCategory);
      params.append("min_price", priceRange[0]);
      params.append("max_price", priceRange[1]);
      if (stockStatus) params.append("stock_status", stockStatus);
      if (sortBy) params.append("sort_by", sortBy);

      const response = await axios.get(`${API}/products?${params.toString()}`);
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, selectedCategory, priceRange, stockStatus, sortBy]);

  const handleOrderWhatsApp = (product) => {
    const message = `Hi! I'm interested in ordering: ${product.name} - $${product.price}`;
    const phoneNumber = "96171294697";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const resetFilters = () => {
    setSelectedCategory(null);
    setPriceRange([0, 10000]);
    setStockStatus(null);
    setSortBy("newest");
    setSearchQuery("");
  };

  const handleAdminPanelClick = () => {
    setShowPasswordModal(true);
  };

  const handlePasswordSuccess = () => {
    window.location.href = '/admin';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* Hero Section */}
      <section className="hero-gradient relative overflow-hidden">
        {/* Animated Background Orbs */}
        <div className="floating-orb top-20 left-10 w-96 h-96 bg-orange-500" style={{animationDelay: '0s'}}></div>
        <div className="floating-orb bottom-20 right-10 w-[30rem] h-[30rem] bg-amber-600" style={{animationDelay: '10s'}}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          {/* Header */}
          <nav className="flex items-center justify-between mb-20">
            <div className="flex items-center space-x-3">
              <div className="w-14 h-14 accent-gradient rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">I</span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight" data-testid="brand-logo">incho</h1>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-300">Welcome, {user.name}</span>
                  {(user.is_admin || user.is_owner) && (
                    <Button
                      data-testid="admin-panel-button"
                      className="btn-secondary"
                      onClick={handleAdminPanelClick}
                    >
                      Admin Panel
                    </Button>
                  )}
                  <Button
                    data-testid="logout-button"
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                  >
                    <LogOut size={20} />
                  </Button>
                </>
              ) : (
                <Button
                  data-testid="login-button"
                  className="btn-primary"
                  onClick={() => {
                    const redirectUrl = encodeURIComponent(window.location.origin);
                    window.location.href = `https://auth.emergentagent.com/?redirect=${redirectUrl}`;
                  }}
                >
                  Admin Login
                </Button>
              )}
            </div>
          </nav>

          {/* Hero Content */}
          <div className="text-center max-w-5xl mx-auto">
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 leading-tight" data-testid="hero-title">
              Premium Tools for
              <span className="block text-transparent bg-clip-text accent-gradient mt-3">
                Master Craftsmen
              </span>
            </h2>
            <p className="text-xl text-gray-300 mb-14 max-w-3xl mx-auto leading-relaxed" data-testid="hero-subtitle">
              Your one-stop destination for professional-grade screws, power tools, hand tools, and comprehensive building equipment.
            </p>

            {/* Search Bar */}
            <div className="max-w-4xl mx-auto mb-12">
              <div className="search-bar glass-effect rounded-2xl p-3 flex items-center gap-3">
                <Search className="ml-4 text-orange-400" size={28} />
                <Input
                  data-testid="search-input"
                  type="text"
                  placeholder="Search tools, screws, equipment... (smart fuzzy search)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-gray-400 text-lg"
                />
                {searchQuery && (
                  <Button
                    data-testid="clear-search-button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchQuery("")}
                  >
                    <X size={22} />
                  </Button>
                )}
                <Button
                  data-testid="filter-toggle-button"
                  className="btn-primary"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter size={22} className="mr-2" />
                  Filters
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="bg-[#0f0f11] border-y border-white/5 py-12" data-testid="categories-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-2xl font-bold mb-8">Browse by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  data-testid={`category-card-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`category-card ${selectedCategory === cat.name ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
                >
                  <h4 className="text-lg font-semibold mb-2">{cat.name}</h4>
                  {cat.description && (
                    <p className="text-sm text-gray-400 line-clamp-2">{cat.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Filters Section */}
      {showFilters && (
        <section className="bg-[#0f0f11] border-b border-white/5" data-testid="filters-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="space-y-8">
              {/* Price Range */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Price Range</h3>
                  <span className="text-orange-400 font-semibold">${priceRange[0]} - ${priceRange[1]}</span>
                </div>
                <Slider
                  data-testid="price-range-slider"
                  min={0}
                  max={10000}
                  step={100}
                  value={priceRange}
                  onValueChange={setPriceRange}
                  className="max-w-md"
                />
              </div>

              {/* Stock Status */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Availability</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    data-testid="stock-all"
                    className={`filter-chip ${!stockStatus ? 'active' : ''}`}
                    onClick={() => setStockStatus(null)}
                  >
                    All Products
                  </button>
                  <button
                    data-testid="stock-in-stock"
                    className={`filter-chip ${stockStatus === 'in_stock' ? 'active' : ''}`}
                    onClick={() => setStockStatus('in_stock')}
                  >
                    In Stock (10+)
                  </button>
                  <button
                    data-testid="stock-low-stock"
                    className={`filter-chip ${stockStatus === 'low_stock' ? 'active' : ''}`}
                    onClick={() => setStockStatus('low_stock')}
                  >
                    Low Stock
                  </button>
                  <button
                    data-testid="stock-out-of-stock"
                    className={`filter-chip ${stockStatus === 'out_of_stock' ? 'active' : ''}`}
                    onClick={() => setStockStatus('out_of_stock')}
                  >
                    Out of Stock
                  </button>
                </div>
              </div>

              {/* Sort By */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Sort By</h3>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-64" data-testid="sort-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reset Filters */}
              <Button
                data-testid="reset-filters-button"
                className="btn-secondary"
                onClick={resetFilters}
              >
                Reset All Filters
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Products Section */}
      <section className="bg-[#0a0a0b] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-32">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
              <p className="mt-6 text-gray-400 text-lg">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-32" data-testid="no-products-message">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-orange-500/10 flex items-center justify-center">
                <X size={40} className="text-orange-400" />
              </div>
              <h3 className="text-3xl font-bold mb-3">No products found</h3>
              <p className="text-gray-400 mb-6">Try adjusting your search or filters</p>
              <Button className="btn-primary" onClick={resetFilters}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-4xl font-bold mb-2" data-testid="products-heading">
                    {selectedCategory ? selectedCategory : 'All Products'}
                  </h2>
                  <p className="text-gray-400" data-testid="products-count">{products.length} items available</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onViewDetails={() => setSelectedProduct(product)}
                    onOrder={() => handleOrderWhatsApp(product)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onOrder={() => handleOrderWhatsApp(selectedProduct)}
        />
      )}

      {/* Admin Password Modal */}
      <AdminPasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordSuccess}
      />
    </div>
  );
};

export default Home;
