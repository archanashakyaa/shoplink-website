import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'shoplink.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database with all tables"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            full_name TEXT,
            phone TEXT,
            profile_photo TEXT,
            bio TEXT,
            address TEXT,
            city TEXT,
            state TEXT,
            country TEXT,
            is_verified INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Shops table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS shops (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            slug TEXT UNIQUE,
            category TEXT,
            description TEXT,
            logo_url TEXT,
            cover_photo_url TEXT,
            location TEXT,
            address TEXT,
            city TEXT,
            state TEXT,
            country TEXT,
            latitude REAL,
            longitude REAL,
            phone TEXT,
            email TEXT,
            website TEXT,
            business_hours TEXT,
            rating REAL DEFAULT 0,
            reviews_count INTEGER DEFAULT 0,
            followers_count INTEGER DEFAULT 0,
            product_count INTEGER DEFAULT 0,
            total_sales INTEGER DEFAULT 0,
            is_verified INTEGER DEFAULT 0,
            is_online_selling INTEGER DEFAULT 1,
            is_offline_selling INTEGER DEFAULT 0,
            accepts_online_payment INTEGER DEFAULT 1,
            accepts_cash INTEGER DEFAULT 1,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (owner_id) REFERENCES users(id)
        )
    ''')
    
    # Products table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shop_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            slug TEXT,
            description TEXT,
            price REAL NOT NULL,
            original_price REAL,
            discount_percentage REAL,
            image_url TEXT,
            stock_quantity INTEGER DEFAULT 0,
            min_order_quantity INTEGER DEFAULT 1,
            max_order_quantity INTEGER,
            sku TEXT,
            barcode TEXT,
            weight REAL,
            dimensions TEXT,
            category TEXT,
            tags TEXT,
            rating REAL DEFAULT 0,
            reviews_count INTEGER DEFAULT 0,
            views_count INTEGER DEFAULT 0,
            sales_count INTEGER DEFAULT 0,
            is_available INTEGER DEFAULT 1,
            is_in_stock INTEGER DEFAULT 1,
            is_featured INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (shop_id) REFERENCES shops(id)
        )
    ''')
    
    # Product photos table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS product_photos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            shop_id INTEGER NOT NULL,
            url TEXT NOT NULL,
            is_primary INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id),
            FOREIGN KEY (shop_id) REFERENCES shops(id)
        )
    ''')
    
    # Events table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            organizer_id INTEGER NOT NULL,
            shop_id INTEGER,
            title TEXT NOT NULL,
            slug TEXT,
            description TEXT,
            event_type TEXT,
            category TEXT,
            start_date TEXT NOT NULL,
            end_date TEXT,
            location TEXT,
            venue_name TEXT,
            venue_address TEXT,
            venue_city TEXT,
            venue_state TEXT,
            venue_country TEXT,
            latitude REAL,
            longitude REAL,
            meeting_url TEXT,
            max_attendees INTEGER,
            ticket_price REAL DEFAULT 0,
            is_free INTEGER DEFAULT 1,
            is_published INTEGER DEFAULT 0,
            status TEXT DEFAULT 'draft',
            views_count INTEGER DEFAULT 0,
            registrations_count INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (organizer_id) REFERENCES users(id),
            FOREIGN KEY (shop_id) REFERENCES shops(id)
        )
    ''')
    
    # Event registrations table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS event_registrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            status TEXT DEFAULT 'registered',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (event_id) REFERENCES events(id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(event_id, user_id)
        )
    ''')
    
    # Shop followers table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS shop_followers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shop_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (shop_id) REFERENCES shops(id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(shop_id, user_id)
        )
    ''')
    
    # Shop reviews table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS shop_reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shop_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
            title TEXT,
            body TEXT,
            is_verified_purchase INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (shop_id) REFERENCES shops(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # Product reviews table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS product_reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
            title TEXT,
            body TEXT,
            is_verified_purchase INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # Cart items table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cart_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (product_id) REFERENCES products(id),
            UNIQUE(user_id, product_id)
        )
    ''')
    
    # Wishlist table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS wishlist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (product_id) REFERENCES products(id),
            UNIQUE(user_id, product_id)
        )
    ''')
    
    # Orders table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            shop_id INTEGER NOT NULL,
            status TEXT DEFAULT 'pending',
            total_amount REAL NOT NULL,
            currency TEXT DEFAULT 'USD',
            payment_method TEXT,
            shipping_address TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (shop_id) REFERENCES shops(id)
        )
    ''')
    
    # Order items table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price REAL NOT NULL,
            subtotal REAL NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    ''')
    
    # Payments table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            provider TEXT,
            reference TEXT,
            amount REAL NOT NULL,
            currency TEXT DEFAULT 'USD',
            status TEXT DEFAULT 'pending',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES orders(id)
        )
    ''')
    
    # Notifications table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            message TEXT NOT NULL,
            is_read INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # Create indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_shops_owner ON shops(owner_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_products_shop ON products(shop_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_events_shop ON events(shop_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_orders_shop ON orders(shop_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)')
    
    conn.commit()
    conn.close()
    print("Database initialized successfully!")

