-- ShopLink Database Schema for SQLite

-- Users table

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Shops table
CREATE TABLE IF NOT EXISTS shops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    business_hours VARCHAR(255),
    image_url TEXT,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    reviews_count INT DEFAULT 0,
    followers_count INT DEFAULT 0,
    product_count INT DEFAULT 0,
    is_online BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_owner_id (owner_id),
    INDEX idx_category (category),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shop_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2) DEFAULT 0.00,
    discount_percentage INT DEFAULT 0,
    image_url TEXT,
    stock_quantity INT DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    is_in_stock BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    INDEX idx_shop_id (shop_id),
    INDEX idx_price (price),
    INDEX idx_availability (is_available, is_in_stock)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product photos table for gallery
CREATE TABLE IF NOT EXISTS product_photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shop_id INT NOT NULL,
    product_id INT NULL,
    photo_url TEXT NOT NULL,
    caption VARCHAR(255),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_shop_id (shop_id),
    INDEX idx_product_id (product_id),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reviews table (optional, for future use)
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shop_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_shop_id (shop_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for testing
INSERT INTO users (email, password, full_name) VALUES 
('test@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLhJ0.Sy', 'Test User');
-- Password is: 'password123'

INSERT INTO shops (owner_id, name, category, description, location, phone, email, business_hours, rating, reviews_count, followers_count, product_count, is_online) VALUES
(1, 'Tech Haven', 'Electronics', 'Your one-stop shop for the latest gadgets and electronics', 'Downtown Plaza', '+1234567890', 'info@techhaven.com', '10:00 AM - 9:00 PM', 4.5, 128, 1205, 45, TRUE),
(1, 'Fashion Forward', 'Fashion', 'Trendy clothing and accessories for all occasions', 'Mall Street', '+1234567891', 'contact@fashionforward.com', '11:00 AM - 8:00 PM', 4.8, 256, 2341, 128, TRUE),
(1, 'Home Decor Studio', 'Home & Living', 'Beautiful pieces to transform your living space', 'Design District', '+1234567892', 'hello@homedecorstudio.com', '9:00 AM - 7:00 PM', 4.3, 89, 892, 67, TRUE);

-- Insert sample products
INSERT INTO products (shop_id, name, description, price, original_price, discount_percentage, image_url, stock_quantity, is_available, is_in_stock) VALUES
(1, 'iPhone 15 Pro', 'Latest iPhone with advanced camera system', 99999, 109999, 9, 'https://example.com/iphone15.jpg', 25, TRUE, TRUE),
(1, 'Samsung Galaxy S24', 'Flagship Android smartphone', 79999, 84999, 6, 'https://example.com/galaxy24.jpg', 30, TRUE, TRUE),
(1, 'MacBook Air M3', '13-inch laptop with M3 chip', 114999, 119999, 4, 'https://example.com/macbook.jpg', 15, TRUE, TRUE),
(2, 'Designer Handbag', 'Premium leather handbag', 5999, 7999, 25, 'https://example.com/handbag.jpg', 8, TRUE, TRUE),
(2, 'Cotton T-Shirt', 'Comfortable 100% cotton t-shirt', 999, 1299, 23, 'https://example.com/tshirt.jpg', 50, TRUE, TRUE),
(3, 'Ceramic Vase', 'Handcrafted decorative vase', 2499, 2999, 17, 'https://example.com/vase.jpg', 12, TRUE, TRUE),
(3, 'Wall Art Canvas', 'Modern abstract wall art', 3999, 4999, 20, 'https://example.com/canvas.jpg', 6, TRUE, TRUE);

-- Insert sample product photos
INSERT INTO product_photos (shop_id, product_id, photo_url, caption, display_order) VALUES
(1, 1, 'https://example.com/iphone15-1.jpg', 'iPhone 15 Pro in Natural Titanium', 1),
(1, 1, 'https://example.com/iphone15-2.jpg', 'Camera system close-up', 2),
(1, 2, 'https://example.com/galaxy24-1.jpg', 'Samsung Galaxy S24 in Phantom Black', 1),
(1, 3, 'https://example.com/macbook-1.jpg', 'MacBook Air M3 in Space Gray', 1),
(2, 4, 'https://example.com/handbag-1.jpg', 'Premium leather handbag - main view', 1),
(2, 4, 'https://example.com/handbag-2.jpg', 'Interior compartment view', 2),
(2, 5, 'https://example.com/tshirt-1.jpg', 'Cotton T-Shirt in Navy Blue', 1),
(3, 6, 'https://example.com/vase-1.jpg', 'Ceramic Vase in Living Room Setting', 1),
(3, 7, 'https://example.com/canvas-1.jpg', 'Abstract Canvas Wall Art Display', 1);
