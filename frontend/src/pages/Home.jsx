import { useState, useEffect } from "react";
import axios from "axios";
import { Search, ShoppingCart, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import ProductCard from "@/components/ProductCard";
import ProductModal from "@/components/ProductModal";
import { Slider } from "@/components/ui/slider";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

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
  }, [searchQuery, selectedCategory, priceRange]);

  const handleOrderWhatsApp = (product) => {
    const message = `Hi! I'm interested in ordering: ${product.name} - $${product.price}`;
    const phoneNumber = "96171294697";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-orange-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-600 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          {/* Header */}
          <nav className="flex items-center justify-between mb-16">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 accent-gradient rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-white">I</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight" data-testid="brand-logo">incho</h1>
            </div>
            <Button
              data-testid="admin-panel-button"
              variant="outline"
              className="border-white/20 hover:bg-white/10"
              onClick={() => window.location.href = '/admin'}
            >
              Admin Panel
            </Button>
          </nav>

          {/* Hero Content */}
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6" data-testid="hero-title">
              Professional Tools for
              <span className="block text-transparent bg-clip-text accent-gradient mt-2">
                Professional Builders
              </span>
            </h2>
            <p className="text-lg text-gray-300 mb-12 max-w-2xl mx-auto" data-testid="hero-subtitle">
              Your trusted source for screws, tool guns, hand guns, and everything you need for construction and building projects.
            </p>

            {/* Search Bar */}
            <div className="max-w-3xl mx-auto">
              <div className="search-bar glass-effect rounded-full p-2 flex items-center gap-2">
                <Search className="ml-4 text-gray-400" size={24} />
                <Input
                  data-testid="search-input"
                  type="text"
                  placeholder="Search for tools, screws, guns... (fuzzy search enabled)"
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
                    <X size={20} />
                  </Button>
                )}
                <Button
                  data-testid="filter-toggle-button"
                  className="btn-primary"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter size={20} className="mr-2" />
                  Filters
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      {showFilters && (
        <section className="bg-[#1a1a1d] border-b border-white/10" data-testid="filters-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-6">
              {/* Categories */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Categories</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    data-testid="category-all"
                    className={`filter-chip ${!selectedCategory ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(null)}
                  >
                    All Products
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      data-testid={`category-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                      className={`filter-chip ${selectedCategory === cat.name ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat.name)}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Price Range: ${priceRange[0]} - ${priceRange[1]}</h3>
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
            </div>
          </div>
        </section>
      )}

      {/* Products Section */}
      <section className="bg-[#0f0f10] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
              <p className="mt-4 text-gray-400">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20" data-testid="no-products-message">
              <ShoppingCart size={64} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-2xl font-semibold mb-2">No products found</h3>
              <p className="text-gray-400">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold" data-testid="products-heading">
                  {selectedCategory ? `${selectedCategory}` : 'All Products'}
                </h2>
                <p className="text-gray-400" data-testid="products-count">{products.length} items</p>
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
    </div>
  );
};

export default Home;
