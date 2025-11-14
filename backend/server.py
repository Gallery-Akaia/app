from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import re
import httpx


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    picture: str
    is_admin: bool = False
    is_owner: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    user_id: str
    session_token: str
    expires_at: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = ""
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = ""

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: float
    category: str
    imageUrl: str
    stock: int = 0
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    imageUrl: str
    stock: int = 0

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    imageUrl: Optional[str] = None
    stock: Optional[int] = None

class AdminUpdate(BaseModel):
    email: str
    is_admin: bool


# Auth Helper Functions
async def get_current_user(request: Request) -> Optional[User]:
    # Try cookie first
    session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        return None
    
    # Find session
    session = await db.user_sessions.find_one({"session_token": session_token})
    if not session:
        return None
    
    # Check expiry
    expires_at = datetime.fromisoformat(session["expires_at"])
    if expires_at < datetime.now(timezone.utc):
        await db.user_sessions.delete_one({"session_token": session_token})
        return None
    
    # Get user
    user = await db.users.find_one({"id": session["user_id"]}, {"_id": 0})
    if not user:
        return None
    
    return User(**user)

async def require_admin(request: Request) -> User:
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if not user.is_admin and not user.is_owner:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# Auth Routes
@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Get user data from Emergent auth service
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id},
                timeout=10.0
            )
            auth_response.raise_for_status()
            user_data = auth_response.json()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to validate session: {str(e)}")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data["email"]}, {"_id": 0})
    
    if existing_user:
        user = User(**existing_user)
    else:
        # Check if this is the first user (becomes owner)
        user_count = await db.users.count_documents({})
        is_owner = user_count == 0
        
        user = User(
            email=user_data["email"],
            name=user_data["name"],
            picture=user_data["picture"],
            is_admin=is_owner,
            is_owner=is_owner
        )
        await db.users.insert_one(user.model_dump())
    
    # Create session
    session_token = user_data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    session = UserSession(
        user_id=user.id,
        session_token=session_token,
        expires_at=expires_at.isoformat()
    )
    
    # Delete old sessions for this user
    await db.user_sessions.delete_many({"user_id": user.id})
    await db.user_sessions.insert_one(session.model_dump())
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    return user

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}


# Admin Management Routes
@api_router.get("/admin/users", response_model=List[User])
async def get_all_users(request: Request, current_user: User = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    return users

@api_router.put("/admin/users/{user_email}")
async def update_user_admin_status(
    user_email: str,
    admin_update: AdminUpdate,
    request: Request,
    current_user: User = Depends(require_admin)
):
    # Only owner can modify admin status
    if not current_user.is_owner:
        raise HTTPException(status_code=403, detail="Only owner can modify admin access")
    
    # Can't modify owner status
    target_user = await db.users.find_one({"email": user_email}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if target_user.get("is_owner"):
        raise HTTPException(status_code=400, detail="Cannot modify owner's admin status")
    
    result = await db.users.update_one(
        {"email": user_email},
        {"$set": {"is_admin": admin_update.is_admin}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User admin status updated"}


# Category Routes (Admin Protected)
@api_router.post("/categories", response_model=Category)
async def create_category(category: CategoryCreate, request: Request, current_user: User = Depends(require_admin)):
    category_dict = category.model_dump()
    category_obj = Category(**category_dict)
    doc = category_obj.model_dump()
    await db.categories.insert_one(doc)
    return category_obj

@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(1000)
    return categories

@api_router.get("/categories/{category_id}", response_model=Category)
async def get_category(category_id: str):
    category = await db.categories.find_one({"id": category_id}, {"_id": 0})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@api_router.put("/categories/{category_id}", response_model=Category)
async def update_category(category_id: str, category_update: CategoryUpdate, request: Request, current_user: User = Depends(require_admin)):
    update_data = {k: v for k, v in category_update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.categories.update_one({"id": category_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    updated_category = await db.categories.find_one({"id": category_id}, {"_id": 0})
    return updated_category

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, request: Request, current_user: User = Depends(require_admin)):
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}


# Product Routes (Admin Protected for CUD operations)
@api_router.post("/products", response_model=Product)
async def create_product(product: ProductCreate, request: Request, current_user: User = Depends(require_admin)):
    product_dict = product.model_dump()
    product_obj = Product(**product_dict)
    doc = product_obj.model_dump()
    await db.products.insert_one(doc)
    return product_obj

@api_router.get("/products", response_model=List[Product])
async def get_products(
    search: Optional[str] = None,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    stock_status: Optional[str] = None,
    sort_by: Optional[str] = None
):
    query = {}
    
    # Fuzzy search across name, description, and category
    if search:
        search_pattern = re.compile(search.replace(' ', '.*'), re.IGNORECASE)
        query["$or"] = [
            {"name": {"$regex": search_pattern}},
            {"description": {"$regex": search_pattern}},
            {"category": {"$regex": search_pattern}}
        ]
    
    # Category filter
    if category:
        query["category"] = category
    
    # Price range filter
    if min_price is not None or max_price is not None:
        query["price"] = {}
        if min_price is not None:
            query["price"]["$gte"] = min_price
        if max_price is not None:
            query["price"]["$lte"] = max_price
    
    # Stock status filter
    if stock_status:
        if stock_status == "in_stock":
            query["stock"] = {"$gte": 10}
        elif stock_status == "low_stock":
            query["stock"] = {"$gt": 0, "$lt": 10}
        elif stock_status == "out_of_stock":
            query["stock"] = 0
    
    # Sorting
    sort_order = []
    if sort_by == "price_asc":
        sort_order = [("price", 1)]
    elif sort_by == "price_desc":
        sort_order = [("price", -1)]
    elif sort_by == "newest":
        sort_order = [("createdAt", -1)]
    else:
        sort_order = [("createdAt", -1)]
    
    products = await db.products.find(query, {"_id": 0}).sort(sort_order).to_list(1000)
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_update: ProductUpdate, request: Request, current_user: User = Depends(require_admin)):
    update_data = {k: v for k, v in product_update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.products.update_one({"id": product_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    updated_product = await db.products.find_one({"id": product_id}, {"_id": 0})
    return updated_product

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, request: Request, current_user: User = Depends(require_admin)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
