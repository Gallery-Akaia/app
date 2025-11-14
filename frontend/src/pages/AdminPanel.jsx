import { useState, useEffect } from "react";
import axios from "axios";
import { ArrowLeft, Plus, Pencil, Trash2, Package, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminPanel = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [openProductDialog, setOpenProductDialog] = useState(false);
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    imageUrl: "",
    stock: ""
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: ""
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await axios.put(`${API}/products/${editingProduct.id}`, {
          ...productForm,
          price: parseFloat(productForm.price),
          stock: parseInt(productForm.stock)
        });
        toast.success("Product updated successfully");
      } else {
        await axios.post(`${API}/products`, {
          ...productForm,
          price: parseFloat(productForm.price),
          stock: parseInt(productForm.stock)
        });
        toast.success("Product created successfully");
      }
      setOpenProductDialog(false);
      setEditingProduct(null);
      setProductForm({ name: "", description: "", price: "", category: "", imageUrl: "", stock: "" });
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product");
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await axios.put(`${API}/categories/${editingCategory.id}`, categoryForm);
        toast.success("Category updated successfully");
      } else {
        await axios.post(`${API}/categories`, categoryForm);
        toast.success("Category created successfully");
      }
      setOpenCategoryDialog(false);
      setEditingCategory(null);
      setCategoryForm({ name: "", description: "" });
      fetchCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error("Failed to save category");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await axios.delete(`${API}/products/${id}`);
      toast.success("Product deleted successfully");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await axios.delete(`${API}/categories/${id}`);
      toast.success("Category deleted successfully");
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    }
  };

  const openEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      imageUrl: product.imageUrl,
      stock: product.stock.toString()
    });
    setOpenProductDialog(true);
  };

  const openEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description
    });
    setOpenCategoryDialog(true);
  };

  return (
    <div className="min-h-screen bg-[#0f0f10]">
      {/* Header */}
      <div className="bg-[#1a1a1d] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                data-testid="back-to-home-button"
                variant="ghost"
                onClick={() => window.location.href = '/'}
              >
                <ArrowLeft className="mr-2" size={20} />
                Back to Store
              </Button>
              <h1 className="text-3xl font-bold" data-testid="admin-panel-title">Admin Panel</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="products" data-testid="products-tab">
              <Package className="mr-2" size={18} />
              Products
            </TabsTrigger>
            <TabsTrigger value="categories" data-testid="categories-tab">
              <FolderOpen className="mr-2" size={18} />
              Categories
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Manage Products</h2>
              <Dialog open={openProductDialog} onOpenChange={setOpenProductDialog}>
                <DialogTrigger asChild>
                  <Button
                    data-testid="add-product-button"
                    className="btn-primary"
                    onClick={() => {
                      setEditingProduct(null);
                      setProductForm({ name: "", description: "", price: "", category: "", imageUrl: "", stock: "" });
                    }}
                  >
                    <Plus className="mr-2" size={20} />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-[#1a1a1d] border-white/10">
                  <DialogHeader>
                    <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleProductSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Product Name</Label>
                      <Input
                        id="name"
                        data-testid="product-name-input"
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        data-testid="product-description-input"
                        value={productForm.description}
                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                        required
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">Price ($)</Label>
                        <Input
                          id="price"
                          data-testid="product-price-input"
                          type="number"
                          step="0.01"
                          value={productForm.price}
                          onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="stock">Stock</Label>
                        <Input
                          id="stock"
                          data-testid="product-stock-input"
                          type="number"
                          value={productForm.stock}
                          onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        data-testid="product-category-input"
                        value={productForm.category}
                        onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="imageUrl">Image URL</Label>
                      <Input
                        id="imageUrl"
                        data-testid="product-image-input"
                        value={productForm.imageUrl}
                        onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" data-testid="save-product-button" className="w-full btn-primary">
                      {editingProduct ? 'Update Product' : 'Create Product'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {products.map((product) => (
                <div key={product.id} className="admin-card flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div>
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <p className="text-sm text-gray-400">{product.description.substring(0, 80)}...</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-orange-500 font-bold">${product.price}</span>
                        <span className="category-badge">{product.category}</span>
                        <span className="text-sm text-gray-400">Stock: {product.stock}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      data-testid={`edit-product-${product.id}`}
                      variant="outline"
                      size="icon"
                      onClick={() => openEditProduct(product)}
                    >
                      <Pencil size={18} />
                    </Button>
                    <Button
                      data-testid={`delete-product-${product.id}`}
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Manage Categories</h2>
              <Dialog open={openCategoryDialog} onOpenChange={setOpenCategoryDialog}>
                <DialogTrigger asChild>
                  <Button
                    data-testid="add-category-button"
                    className="btn-primary"
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryForm({ name: "", description: "" });
                    }}
                  >
                    <Plus className="mr-2" size={20} />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl bg-[#1a1a1d] border-white/10">
                  <DialogHeader>
                    <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCategorySubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="cat-name">Category Name</Label>
                      <Input
                        id="cat-name"
                        data-testid="category-name-input"
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cat-description">Description</Label>
                      <Textarea
                        id="cat-description"
                        data-testid="category-description-input"
                        value={categoryForm.description}
                        onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <Button type="submit" data-testid="save-category-button" className="w-full btn-primary">
                      {editingCategory ? 'Update Category' : 'Create Category'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((category) => (
                <div key={category.id} className="admin-card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-xl mb-2">{category.name}</h3>
                      <p className="text-gray-400 text-sm">{category.description || 'No description'}</p>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button
                        data-testid={`edit-category-${category.id}`}
                        variant="outline"
                        size="icon"
                        onClick={() => openEditCategory(category)}
                      >
                        <Pencil size={18} />
                      </Button>
                      <Button
                        data-testid={`delete-category-${category.id}`}
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
