import sqlite3
import os

def init_database():
    """Initialize SQLite database with tables and sample data"""
    # Remove existing database if it exists
    if os.path.exists('shoplink.db'):
        os.remove('shoplink.db')

    connection = sqlite3.connect('shoplink.db')
    cursor = connection.cursor()

    # Users table
    cursor.execute('''
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            full_name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Shops table
    cursor.execute('''
        CREATE TABLE shops (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            location TEXT,
            phone TEXT,
            email TEXT,
            business_hours TEXT,
            image_url TEXT,
            rating REAL DEFAULT 0.0,
            reviews_count INTEGER DEFAULT 0,
            followers_count INTEGER DEFAULT 0,
            product_count INTEGER DEFAULT 0,
            is_online BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')

    # Products table
    cursor.execute('''
        CREATE TABLE products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shop_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            original_price REAL DEFAULT 0.0,
            discount_percentage INTEGER DEFAULT 0,
            image_url TEXT,
            stock_quantity INTEGER DEFAULT 0,
            is_available BOOLEAN DEFAULT 1,
            is_in_stock BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
        )
    ''')

    # Product photos table
    cursor.execute('''
        CREATE TABLE product_photos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shop_id INTEGER NOT NULL,
            product_id INTEGER,
            photo_url TEXT NOT NULL,
            caption TEXT,
            display_order INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )
    ''')

    # Insert sample data
    # Sample user (password is 'password123')
    cursor.execute('''
        INSERT INTO users (email, password, full_name)
        VALUES (?, ?, ?)
    ''', ('test@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLhJ0.Sy', 'Test User'))

    # Sample shops
    cursor.execute('''
        INSERT INTO shops (owner_id, name, category, description, location, phone, email, business_hours, rating, reviews_count, followers_count, product_count, is_online)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (1, 'Tech Haven', 'Electronics', 'Your one-stop shop for the latest gadgets and electronics', 'Downtown Plaza', '+1234567890', 'info@techhaven.com', '10:00 AM - 9:00 PM', 4.5, 128, 1205, 45, 1))

    cursor.execute('''
        INSERT INTO shops (owner_id, name, category, description, location, phone, email, business_hours, rating, reviews_count, followers_count, product_count, is_online)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (1, 'Fashion Forward', 'Fashion', 'Trendy clothing and accessories for all occasions', 'Mall Street', '+1234567891', 'contact@fashionforward.com', '11:00 AM - 8:00 PM', 4.8, 256, 2341, 128, 1))

    cursor.execute('''
        INSERT INTO shops (owner_id, name, category, description, location, phone, email, business_hours, rating, reviews_count, followers_count, product_count, is_online)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (1, 'Home Decor Studio', 'Home & Living', 'Beautiful pieces to transform your living space', 'Design District', '+1234567892', 'hello@homedecorstudio.com', '9:00 AM - 7:00 PM', 4.3, 89, 892, 67, 1))

    # Sample products
    cursor.execute('''
        INSERT INTO products (shop_id, name, description, price, original_price, discount_percentage, image_url, stock_quantity, is_available, is_in_stock)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (1, 'iPhone 15 Pro', 'Latest iPhone with advanced camera system', 99999, 109999, 9, 'https://example.com/iphone15.jpg', 25, 1, 1))

    cursor.execute('''
        INSERT INTO products (shop_id, name, description, price, original_price, discount_percentage, image_url, stock_quantity, is_available, is_in_stock)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (1, 'Samsung Galaxy S24', 'Flagship Android smartphone', 79999, 84999, 6, 'https://example.com/galaxy24.jpg', 30, 1, 1))

    cursor.execute('''
        INSERT INTO products (shop_id, name, description, price, original_price, discount_percentage, image_url, stock_quantity, is_available, is_in_stock)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (1, 'MacBook Air M3', '13-inch laptop with M3 chip', 114999, 119999, 4, 'https://example.com/macbook.jpg', 15, 1, 1))

    cursor.execute('''
        INSERT INTO products (shop_id, name, description, price, original_price, discount_percentage, image_url, stock_quantity, is_available, is_in_stock)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (2, 'Designer Handbag', 'Premium leather handbag', 5999, 7999, 25, 'https://example.com/handbag.jpg', 8, 1, 1))

    cursor.execute('''
        INSERT INTO products (shop_id, name, description, price, original_price, discount_percentage, image_url, stock_quantity, is_available, is_in_stock)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (2, 'Cotton T-Shirt', 'Comfortable 100% cotton t-shirt', 999, 1299, 23, 'https://example.com/tshirt.jpg', 50, 1, 1))

    cursor.execute('''
        INSERT INTO products (shop_id, name, description, price, original_price, discount_percentage, image_url, stock_quantity, is_available, is_in_stock)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (3, 'Ceramic Vase', 'Handcrafted decorative vase', 2499, 2999, 17, 'https://example.com/vase.jpg', 12, 1, 1))

    cursor.execute('''
        INSERT INTO products (shop_id, name, description, price, original_price, discount_percentage, image_url, stock_quantity, is_available, is_in_stock)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (3, 'Wall Art Canvas', 'Modern abstract wall art', 3999, 4999, 20, 'https://example.com/canvas.jpg', 6, 1, 1))

    # Sample product photos
    cursor.execute('''
        INSERT INTO product_photos (shop_id, product_id, photo_url, caption, display_order)
        VALUES (?, ?, ?, ?, ?)
    ''', (1, 1, 'https://example.com/iphone15-1.jpg', 'iPhone 15 Pro in Natural Titanium', 1))

    cursor.execute('''
        INSERT INTO product_photos (shop_id, product_id, photo_url, caption, display_order)
        VALUES (?, ?, ?, ?, ?)
    ''', (1, 1, 'https://example.com/iphone15-2.jpg', 'Camera system close-up', 2))

    cursor.execute('''
        INSERT INTO product_photos (shop_id, product_id, photo_url, caption, display_order)
        VALUES (?, ?, ?, ?, ?)
    ''', (1, 2, 'https://example.com/galaxy24-1.jpg', 'Samsung Galaxy S24 in Phantom Black', 1))

    cursor.execute('''
        INSERT INTO product_photos (shop_id, product_id, photo_url, caption, display_order)
        VALUES (?, ?, ?, ?, ?)
    ''', (1, 3, 'https://example.com/macbook-1.jpg', 'MacBook Air M3 in Space Gray', 1))

    cursor.execute('''
        INSERT INTO product_photos (shop_id, product_id, photo_url, caption, display_order)
        VALUES (?, ?, ?, ?, ?)
    ''', (2, 4, 'https://example.com/handbag-1.jpg', 'Premium leather handbag - main view', 1))

    cursor.execute('''
        INSERT INTO product_photos (shop_id, product_id, photo_url, caption, display_order)
        VALUES (?, ?, ?, ?, ?)
    ''', (2, 4, 'https://example.com/handbag-2.jpg', 'Interior compartment view', 2))

    cursor.execute('''
        INSERT INTO product_photos (shop_id, product_id, photo_url, caption, display_order)
        VALUES (?, ?, ?, ?, ?)
    ''', (2, 5, 'https://example.com/tshirt-1.jpg', 'Cotton T-Shirt in Navy Blue', 1))

    cursor.execute('''
        INSERT INTO product_photos (shop_id, product_id, photo_url, caption, display_order)
        VALUES (?, ?, ?, ?, ?)
    ''', (3, 6, 'https://example.com/vase-1.jpg', 'Ceramic Vase in Living Room Setting', 1))

    cursor.execute('''
        INSERT INTO product_photos (shop_id, product_id, photo_url, caption, display_order)
        VALUES (?, ?, ?, ?, ?)
    ''', (3, 7, 'https://example.com/canvas-1.jpg', 'Abstract Canvas Wall Art Display', 1))

    connection.commit()
    connection.close()
    print("Database initialized successfully!")

if __name__ == '__main__':
    init_database()