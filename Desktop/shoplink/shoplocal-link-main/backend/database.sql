-- ShopLink Enhanced Database Schema for SQLite
-- Enhanced with Events, User Management, and User-Friendly Features

-- Users table (Enhanced)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    profile_image TEXT,
    bio TEXT,
    location TEXT,
    website TEXT,
    is_active BOOLEAN DEFAULT 1,
    is_verified BOOLEAN DEFAULT 0,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Categories table (for better organization)
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Shops table (Enhanced)
CREATE TABLE IF NOT EXISTS shops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    category_id INTEGER,
    description TEXT,
    location TEXT,
    phone TEXT,
    email TEXT,
    business_hours TEXT,
    image_url TEXT,
    cover_image TEXT,
    rating REAL DEFAULT 0.0,
    reviews_count INTEGER DEFAULT 0,
    followers_count INTEGER DEFAULT 0,
    product_count INTEGER DEFAULT 0,
    is_online BOOLEAN DEFAULT 1,
    is_verified BOOLEAN DEFAULT 0,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    latitude REAL,
    longitude REAL,
    website TEXT,
    facebook TEXT,
    instagram TEXT,
    twitter TEXT,
    average_delivery_time INTEGER, -- in minutes
    minimum_order_amount REAL DEFAULT 0,
    delivery_charge REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shops_owner_id ON shops(owner_id);
CREATE INDEX IF NOT EXISTS idx_shops_category_id ON shops(category_id);
CREATE INDEX IF NOT EXISTS idx_shops_rating ON shops(rating);
CREATE INDEX IF NOT EXISTS idx_shops_location ON shops(city, state);

-- Products table (Enhanced)
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    original_price REAL DEFAULT 0.0,
    discount_percentage INTEGER DEFAULT 0,
    image_url TEXT,
    stock_quantity INTEGER DEFAULT 0,
    min_order_quantity INTEGER DEFAULT 1,
    max_order_quantity INTEGER DEFAULT 100,
    sku TEXT, -- Stock Keeping Unit
    barcode TEXT,
    weight REAL, -- in grams
    dimensions TEXT, -- LxWxH format
    brand TEXT,
    tags TEXT, -- JSON array of tags
    is_available BOOLEAN DEFAULT 1,
    is_in_stock BOOLEAN DEFAULT 1,
    is_featured BOOLEAN DEFAULT 0,
    is_vegetarian BOOLEAN DEFAULT 0,
    is_vegan BOOLEAN DEFAULT 0,
    is_gluten_free BOOLEAN DEFAULT 0,
    calories INTEGER,
    ingredients TEXT,
    allergens TEXT,
    expiry_date DATE,
    manufacturing_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);

-- Product variations table (for different sizes, colors, etc.)
CREATE TABLE IF NOT EXISTS product_variations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    name TEXT NOT NULL, -- e.g., "Small", "Red", "Cotton"
    value TEXT NOT NULL, -- e.g., "S", "#FF0000", "Cotton"
    price_modifier REAL DEFAULT 0, -- Additional price for this variation
    stock_quantity INTEGER DEFAULT 0,
    sku TEXT,
    is_available BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_availability ON products(is_available, is_in_stock);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_product_variations_product_id ON product_variations(product_id);

-- Product photos table for gallery (Enhanced)
CREATE TABLE IF NOT EXISTS product_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_id INTEGER NOT NULL,
    product_id INTEGER,
    photo_url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    alt_text TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    is_primary BOOLEAN DEFAULT 0, -- Primary photo for the product
    width INTEGER,
    height INTEGER,
    file_size INTEGER, -- in bytes
    mime_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Shop gallery photos (for shop images not tied to specific products)
CREATE TABLE IF NOT EXISTS shop_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_id INTEGER NOT NULL,
    photo_url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    alt_text TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    is_cover BOOLEAN DEFAULT 0, -- Cover photo for the shop
    width INTEGER,
    height INTEGER,
    file_size INTEGER,
    mime_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_photos_shop_id ON product_photos(shop_id);
CREATE INDEX IF NOT EXISTS idx_product_photos_product_id ON product_photos(product_id);
CREATE INDEX IF NOT EXISTS idx_product_photos_display_order ON product_photos(display_order);
CREATE INDEX IF NOT EXISTS idx_product_photos_primary ON product_photos(is_primary);
CREATE INDEX IF NOT EXISTS idx_shop_photos_shop_id ON shop_photos(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_photos_display_order ON shop_photos(display_order);

-- ==================== EVENTS SYSTEM ====================

-- Events table (Main events)
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organizer_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'sale', 'workshop', 'festival', 'promotion', etc.
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    location TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    latitude REAL,
    longitude REAL,
    image_url TEXT,
    cover_image TEXT,
    max_attendees INTEGER,
    current_attendees INTEGER DEFAULT 0,
    ticket_price REAL DEFAULT 0,
    is_free BOOLEAN DEFAULT 0,
    is_virtual BOOLEAN DEFAULT 0,
    virtual_link TEXT,
    meeting_id TEXT,
    meeting_password TEXT,
    status TEXT DEFAULT 'draft', -- 'draft', 'published', 'ongoing', 'completed', 'cancelled'
    is_featured BOOLEAN DEFAULT 0,
    tags TEXT, -- JSON array of tags
    requirements TEXT, -- Special requirements or instructions
    contact_email TEXT,
    contact_phone TEXT,
    website TEXT,
    facebook_event TEXT,
    instagram_post TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Event attendees (for tracking registrations)
CREATE TABLE IF NOT EXISTS event_attendees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    ticket_count INTEGER DEFAULT 1,
    total_amount REAL DEFAULT 0,
    payment_status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'refunded', 'cancelled'
    attendance_status TEXT DEFAULT 'registered', -- 'registered', 'attended', 'no_show'
    special_requests TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(event_id, user_id)
);

-- Event photos/gallery
CREATE TABLE IF NOT EXISTS event_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    photo_url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    uploaded_by INTEGER NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- ==================== ENHANCED FEATURES ====================

-- Reviews table (Enhanced)
CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_id INTEGER NOT NULL,
    product_id INTEGER,
    user_id INTEGER NOT NULL,
    order_id INTEGER, -- Reference to orders table (for future use)
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,
    pros TEXT, -- JSON array of positive points
    cons TEXT, -- JSON array of negative points
    is_verified_purchase BOOLEAN DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    images TEXT, -- JSON array of review images
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User favorites/bookmarks
CREATE TABLE IF NOT EXISTS user_favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    shop_id INTEGER,
    product_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(user_id, shop_id, product_id)
);

-- Shopping cart (for future e-commerce functionality)
CREATE TABLE IF NOT EXISTS cart (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    variation_id INTEGER,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price REAL NOT NULL,
    total_price REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (variation_id) REFERENCES product_variations(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_featured ON events(is_featured);
CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user_id ON event_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_event_photos_event_id ON event_photos(event_id);
CREATE INDEX IF NOT EXISTS idx_reviews_shop_id ON reviews(shop_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id);

-- ==================== SAMPLE DATA ====================

-- Insert sample categories
INSERT OR IGNORE INTO categories (name, description, icon) VALUES
('Electronics', 'Gadgets, computers, and electronic devices', 'smartphone'),
('Fashion', 'Clothing, accessories, and lifestyle', 'shirt'),
('Home & Living', 'Furniture, decor, and home essentials', 'home'),
('Food & Beverages', 'Restaurants, groceries, and food products', 'utensils'),
('Health & Beauty', 'Cosmetics, wellness, and personal care', 'sparkles'),
('Sports & Fitness', 'Sports equipment and fitness gear', 'dumbbell'),
('Books & Media', 'Books, movies, music, and entertainment', 'book'),
('Services', 'Professional and personal services', 'briefcase');

-- Insert sample users
INSERT OR IGNORE INTO users (email, password, full_name, phone, bio, location) VALUES
('test@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLhJ0.Sy', 'Test User', '+1234567890', 'Tech enthusiast and entrepreneur', 'New York, USA'),
('organizer@events.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLhJ0.Sy', 'Event Organizer', '+1234567891', 'Professional event planner', 'California, USA'),
('shopowner@techhaven.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLhJ0.Sy', 'Tech Haven Owner', '+1234567892', 'Electronics store owner', 'Texas, USA');

-- Insert sample shops
INSERT OR IGNORE INTO shops (owner_id, name, category_id, description, location, phone, email, business_hours, address, city, state, pincode, rating, reviews_count, followers_count, product_count, is_online, is_verified) VALUES
(3, 'Tech Haven', 1, 'Your one-stop shop for the latest gadgets and electronics', 'Downtown Plaza', '+1234567890', 'info@techhaven.com', '10:00 AM - 9:00 PM', '123 Tech Street', 'New York', 'NY', '10001', 4.5, 128, 1205, 45, 1, 1),
(1, 'Fashion Forward', 2, 'Trendy clothing and accessories for all occasions', 'Mall Street', '+1234567891', 'contact@fashionforward.com', '11:00 AM - 8:00 PM', '456 Fashion Ave', 'Los Angeles', 'CA', '90210', 4.8, 256, 2341, 128, 1, 1),
(1, 'Home Decor Studio', 3, 'Beautiful pieces to transform your living space', 'Design District', '+1234567892', 'hello@homedecorstudio.com', '9:00 AM - 7:00 PM', '789 Design Blvd', 'Miami', 'FL', '33101', 4.3, 89, 892, 67, 1, 0);

-- Insert sample products
INSERT OR IGNORE INTO products (shop_id, name, description, price, original_price, discount_percentage, image_url, stock_quantity, sku, brand, tags, is_featured) VALUES
(1, 'iPhone 15 Pro', 'Latest iPhone with advanced camera system and titanium design', 99999, 109999, 9, 'https://example.com/iphone15.jpg', 25, 'IPH15P-128-TIT', 'Apple', '["smartphone", "premium", "camera"]', 1),
(1, 'Samsung Galaxy S24', 'Flagship Android smartphone with AI features', 79999, 84999, 6, 'https://example.com/galaxy24.jpg', 30, 'SGS24-256-BLK', 'Samsung', '["smartphone", "android", "ai"]', 1),
(1, 'MacBook Air M3', '13-inch laptop with M3 chip and all-day battery', 114999, 119999, 4, 'https://example.com/macbook.jpg', 15, 'MBA13-M3-512-SGR', 'Apple', '["laptop", "ultrabook", "m3"]', 0),
(2, 'Designer Handbag', 'Premium leather handbag with multiple compartments', 5999, 7999, 25, 'https://example.com/handbag.jpg', 8, 'DHB-LTH-BRN-M', 'Fashion Brand', '["handbag", "leather", "designer"]', 1),
(2, 'Cotton T-Shirt', 'Comfortable 100% organic cotton t-shirt', 999, 1299, 23, 'https://example.com/tshirt.jpg', 50, 'CTS-COT-NVY-L', 'EcoWear', '["tshirt", "cotton", "organic"]', 0),
(3, 'Ceramic Vase', 'Handcrafted decorative vase with modern design', 2499, 2999, 17, 'https://example.com/vase.jpg', 12, 'CV-MOD-WHT-L', 'Artisan Pottery', '["vase", "ceramic", "decor"]', 0),
(3, 'Wall Art Canvas', 'Modern abstract wall art - Blue Ocean theme', 3999, 4999, 20, 'https://example.com/canvas.jpg', 6, 'WAC-ABS-BLU-60', 'Art Studio', '["canvas", "abstract", "modern"]', 1);

-- Insert sample events
INSERT OR IGNORE INTO events (organizer_id, title, description, category, event_type, start_date, end_date, location, address, city, state, max_attendees, ticket_price, is_free, status, is_featured, tags) VALUES
(2, 'Tech Startup Meetup 2024', 'Connect with fellow entrepreneurs and investors in the tech space', 'Technology', 'networking', '2024-02-15 18:00:00', '2024-02-15 22:00:00', 'Tech Hub Downtown', '123 Innovation Drive', 'San Francisco', 'CA', 100, 25.00, 0, 'published', 1, '["technology", "startup", "networking"]'),
(2, 'Fashion Week After Party', 'Exclusive after party for fashion week attendees', 'Fashion', 'party', '2024-02-20 20:00:00', '2024-02-21 02:00:00', 'Sky Lounge Rooftop', '456 Fashion Plaza', 'New York', 'NY', 200, 50.00, 0, 'published', 1, '["fashion", "party", "exclusive"]'),
(2, 'Home Decor Workshop', 'Learn interior design tips from professional decorators', 'Home & Living', 'workshop', '2024-02-25 10:00:00', '2024-02-25 16:00:00', 'Design Studio', '789 Creative Street', 'Los Angeles', 'CA', 30, 75.00, 0, 'published', 0, '["workshop", "design", "interior"]'),
(2, 'Food Festival 2024', 'Annual food festival featuring local restaurants and chefs', 'Food & Beverages', 'festival', '2024-03-01 11:00:00', '2024-03-03 20:00:00', 'Central Park', 'Park Avenue', 'Chicago', 'IL', 500, 0.00, 1, 'published', 1, '["food", "festival", "local"]'),
(2, 'Wellness and Beauty Expo', 'Discover the latest in health, beauty, and wellness products', 'Health & Beauty', 'expo', '2024-03-10 09:00:00', '2024-03-12 18:00:00', 'Convention Center', '321 Expo Boulevard', 'Miami', 'FL', 300, 15.00, 0, 'draft', 0, '["wellness", "beauty", "health"]');

-- Insert sample product photos
INSERT OR IGNORE INTO product_photos (shop_id, product_id, photo_url, caption, display_order, is_primary) VALUES
(1, 1, 'https://example.com/iphone15-1.jpg', 'iPhone 15 Pro in Natural Titanium', 1, 1),
(1, 1, 'https://example.com/iphone15-2.jpg', 'Camera system close-up', 2, 0),
(1, 2, 'https://example.com/galaxy24-1.jpg', 'Samsung Galaxy S24 in Phantom Black', 1, 1),
(1, 3, 'https://example.com/macbook-1.jpg', 'MacBook Air M3 in Space Gray', 1, 1),
(2, 4, 'https://example.com/handbag-1.jpg', 'Premium leather handbag - main view', 1, 1),
(2, 4, 'https://example.com/handbag-2.jpg', 'Interior compartment view', 2, 0),
(2, 5, 'https://example.com/tshirt-1.jpg', 'Cotton T-Shirt in Navy Blue', 1, 1),
(3, 6, 'https://example.com/vase-1.jpg', 'Ceramic Vase in Living Room Setting', 1, 1),
(3, 7, 'https://example.com/canvas-1.jpg', 'Abstract Canvas Wall Art Display', 1, 1);

-- Insert sample shop photos
INSERT OR IGNORE INTO shop_photos (shop_id, photo_url, caption, display_order, is_cover) VALUES
(1, 'https://example.com/techhaven-store.jpg', 'Tech Haven Store Front', 1, 1),
(1, 'https://example.com/techhaven-interior.jpg', 'Store Interior', 2, 0),
(2, 'https://example.com/fashion-store.jpg', 'Fashion Forward Boutique', 1, 1),
(3, 'https://example.com/decor-studio.jpg', 'Home Decor Studio Showroom', 1, 1);

-- Insert sample event attendees
INSERT OR IGNORE INTO event_attendees (event_id, user_id, ticket_count, total_amount, payment_status) VALUES
(1, 1, 1, 25.00, 'completed'),
(1, 3, 2, 50.00, 'completed'),
(2, 1, 1, 50.00, 'completed'),
(3, 1, 1, 75.00, 'pending');

-- Insert sample reviews
INSERT OR IGNORE INTO reviews (shop_id, product_id, user_id, rating, title, comment, is_verified_purchase) VALUES
(1, 1, 1, 5, 'Amazing phone!', 'The iPhone 15 Pro exceeded my expectations. Great camera and performance.', 1),
(1, 2, 1, 4, 'Good Android phone', 'Solid build quality and great display. Battery life could be better.', 1),
(2, 4, 1, 5, 'Beautiful handbag', 'High quality leather and perfect size for daily use.', 1),
(3, 6, 1, 4, 'Nice vase', 'Beautiful design and good quality ceramic.', 0);

-- Insert sample user favorites
INSERT OR IGNORE INTO user_favorites (user_id, shop_id, product_id) VALUES
(1, 1, 1),
(1, 1, 2),
(1, 2, 4),
(1, 3, 6);
