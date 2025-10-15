import sqlite3
import os
import json
import codecs
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-this')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)

CORS(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# Database configuration - using SQLite for development
DATABASE = 'shoplink.db'

def get_db_connection():
    """Create database connection"""
    try:
        connection = sqlite3.connect(DATABASE)
        connection.row_factory = sqlite3.Row  # Enable column access by name
        return connection
    except Exception as e:
        print(f"Error connecting to SQLite: {e}")
        return None

def init_database():
    """Initialize database with enhanced tables"""
    connection = sqlite3.connect(DATABASE)
    cursor = connection.cursor()

    # Enable foreign keys
    cursor.execute('PRAGMA foreign_keys = ON')

    # Users table (Enhanced)
    cursor.execute('''
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
        )
    ''')

    # Categories table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            icon TEXT,
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Shops table (Enhanced)
    cursor.execute('''
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
            average_delivery_time INTEGER,
            minimum_order_amount REAL DEFAULT 0,
            delivery_charge REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (category_id) REFERENCES categories(id)
        )
    ''')

    # Products table (Enhanced)
    cursor.execute('''
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
            sku TEXT,
            barcode TEXT,
            weight REAL,
            dimensions TEXT,
            brand TEXT,
            tags TEXT,
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
        )
    ''')

    # Product variations table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS product_variations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            value TEXT NOT NULL,
            price_modifier REAL DEFAULT 0,
            stock_quantity INTEGER DEFAULT 0,
            sku TEXT,
            is_available BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )
    ''')

    # Product photos table (Enhanced)
    cursor.execute('''
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
            is_primary BOOLEAN DEFAULT 0,
            width INTEGER,
            height INTEGER,
            file_size INTEGER,
            mime_type TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )
    ''')

    # Shop photos table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS shop_photos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shop_id INTEGER NOT NULL,
            photo_url TEXT NOT NULL,
            thumbnail_url TEXT,
            caption TEXT,
            alt_text TEXT,
            display_order INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT 1,
            is_cover BOOLEAN DEFAULT 0,
            width INTEGER,
            height INTEGER,
            file_size INTEGER,
            mime_type TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
        )
    ''')

    # ==================== EVENTS SYSTEM ====================

    # Events table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            organizer_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT NOT NULL,
            event_type TEXT NOT NULL,
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
            status TEXT DEFAULT 'draft',
            is_featured BOOLEAN DEFAULT 0,
            tags TEXT,
            requirements TEXT,
            contact_email TEXT,
            contact_phone TEXT,
            website TEXT,
            facebook_event TEXT,
            instagram_post TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')

    # Event attendees table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS event_attendees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            ticket_count INTEGER DEFAULT 1,
            total_amount REAL DEFAULT 0,
            payment_status TEXT DEFAULT 'pending',
            attendance_status TEXT DEFAULT 'registered',
            special_requests TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(event_id, user_id)
        )
    ''')

    # Event photos table
    cursor.execute('''
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
        )
    ''')

    # ==================== ENHANCED FEATURES ====================

    # Reviews table (Enhanced)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shop_id INTEGER NOT NULL,
            product_id INTEGER,
            user_id INTEGER NOT NULL,
            order_id INTEGER,
            rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
            title TEXT,
            comment TEXT,
            pros TEXT,
            cons TEXT,
            is_verified_purchase BOOLEAN DEFAULT 0,
            helpful_count INTEGER DEFAULT 0,
            images TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')

    # User favorites table
    cursor.execute('''
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
        )
    ''')

    # Cart table
    cursor.execute('''
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
        )
    ''')

    # Create indexes for better performance
    indexes = [
        'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
        'CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active)',
        'CREATE INDEX IF NOT EXISTS idx_shops_owner_id ON shops(owner_id)',
        'CREATE INDEX IF NOT EXISTS idx_shops_category_id ON shops(category_id)',
        'CREATE INDEX IF NOT EXISTS idx_shops_rating ON shops(rating)',
        'CREATE INDEX IF NOT EXISTS idx_shops_location ON shops(city, state)',
        'CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id)',
        'CREATE INDEX IF NOT EXISTS idx_products_price ON products(price)',
        'CREATE INDEX IF NOT EXISTS idx_products_availability ON products(is_available, is_in_stock)',
        'CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured)',
        'CREATE INDEX IF NOT EXISTS idx_product_variations_product_id ON product_variations(product_id)',
        'CREATE INDEX IF NOT EXISTS idx_product_photos_shop_id ON product_photos(shop_id)',
        'CREATE INDEX IF NOT EXISTS idx_product_photos_product_id ON product_photos(product_id)',
        'CREATE INDEX IF NOT EXISTS idx_product_photos_primary ON product_photos(is_primary)',
        'CREATE INDEX IF NOT EXISTS idx_shop_photos_shop_id ON shop_photos(shop_id)',
        'CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_id)',
        'CREATE INDEX IF NOT EXISTS idx_events_category ON events(category)',
        'CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date)',
        'CREATE INDEX IF NOT EXISTS idx_events_status ON events(status)',
        'CREATE INDEX IF NOT EXISTS idx_events_featured ON events(is_featured)',
        'CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON event_attendees(event_id)',
        'CREATE INDEX IF NOT EXISTS idx_event_attendees_user_id ON event_attendees(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_event_photos_event_id ON event_photos(event_id)',
        'CREATE INDEX IF NOT EXISTS idx_reviews_shop_id ON reviews(shop_id)',
        'CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id)',
        'CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating)',
        'CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id)'
    ]

    for index_sql in indexes:
        cursor.execute(index_sql)

    connection.commit()
    connection.close()

# Initialize database on startup
init_database()

# ==================== UTILITY FUNCTIONS ====================

def safe_json_loads(json_string):
    """
    Safely parse JSON string with UTF-8 encoding handling
    """
    try:
        # First try normal parsing
        return json.loads(json_string)
    except (UnicodeDecodeError, json.JSONDecodeError) as e:
        print(f"JSON parsing error: {e}")
        print(f"Attempting to fix encoding...")

        try:
            # Try to decode and re-encode as UTF-8
            fixed_string = json_string.encode('utf-8', 'ignore').decode('utf-8')
            return json.loads(fixed_string)
        except (UnicodeDecodeError, json.JSONDecodeError) as e2:
            print(f"Failed to fix encoding: {e2}")
            # Return a basic error structure
            return {'error': 'Invalid JSON data', 'original_error': str(e)}

def validate_and_sanitize_text(text):
    """
    Validate and sanitize text input to prevent Unicode issues
    """
    if not isinstance(text, str):
        return text

    try:
        # Encode to UTF-8 bytes and decode back to remove invalid sequences
        sanitized = text.encode('utf-8', 'ignore').decode('utf-8')
        return sanitized
    except Exception as e:
        print(f"Text sanitization error: {e}")
        return text

# ==================== AUTH ROUTES ====================

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    """User registration"""
    try:
        # Use safe JSON parsing to handle Unicode issues
        json_data = request.get_data(as_text=True)
        if not json_data:
            return jsonify({'error': 'No data provided'}), 400

        data = safe_json_loads(json_data)

        # Handle case where JSON parsing failed
        if 'error' in data:
            return jsonify({'error': f'Invalid request data: {data.get("original_error", "Unknown error")}'}), 400

        email = data.get('email')
        password = data.get('password')
        full_name = data.get('full_name')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Hash password
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = connection.cursor()
        
        # Check if user already exists
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        if cursor.fetchone():
            cursor.close()
            connection.close()
            return jsonify({'error': 'User already exists'}), 400

        # Insert new user
        cursor.execute(
            "INSERT INTO users (email, password, full_name) VALUES (?, ?, ?)",
            (email, hashed_password, full_name)
        )
        connection.commit()
        user_id = cursor.lastrowid
        
        cursor.close()
        connection.close()
        
        # Create access token
        access_token = create_access_token(identity=str(user_id))
        
        return jsonify({
            'message': 'User created successfully',
            'access_token': access_token,
            'user': {
                'id': user_id,
                'email': email,
                'full_name': full_name
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login"""
    try:
        # Use safe JSON parsing to handle Unicode issues
        json_data = request.get_data(as_text=True)
        if not json_data:
            return jsonify({'error': 'No data provided'}), 400

        data = safe_json_loads(json_data)

        # Handle case where JSON parsing failed
        if 'error' in data:
            return jsonify({'error': f'Invalid request data: {data.get("original_error", "Unknown error")}'}), 400

        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = connection.cursor()
        cursor.execute(
            "SELECT id, email, password, full_name FROM users WHERE email = ?",
            (email,)
        )
        user = cursor.fetchone()
        
        cursor.close()
        connection.close()
        
        if not user or not bcrypt.check_password_hash(user['password'], password):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Create access token
        access_token = create_access_token(identity=str(user['id']))
        
        return jsonify({
            'access_token': access_token,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'full_name': user['full_name']
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/user', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user info"""
    try:
        user_id = get_jwt_identity()
        
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = connection.cursor()
        cursor.execute(
            "SELECT id, email, full_name, created_at FROM users WHERE id = ?",
            (user_id,)
        )
        user = cursor.fetchone()
        
        cursor.close()
        connection.close()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({'user': dict(user)}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== SHOP ROUTES ====================

@app.route('/api/shops', methods=['GET'])
def get_shops():
    """Get all shops"""
    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = connection.cursor()
        cursor.execute("""
            SELECT s.*, u.full_name as owner_name
            FROM shops s
            LEFT JOIN users u ON s.owner_id = u.id
            ORDER BY s.created_at DESC
        """)
        rows = cursor.fetchall()
        shops = [dict(row) for row in rows]
        
        cursor.close()
        connection.close()
        
        return jsonify({'data': shops}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/shops/<int:shop_id>', methods=['GET'])
def get_shop(shop_id):
    """Get single shop by ID"""
    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = connection.cursor()
        cursor.execute("""
            SELECT s.*, u.full_name as owner_name, u.email as owner_email
            FROM shops s
            LEFT JOIN users u ON s.owner_id = u.id
            WHERE s.id = ?
        """, (shop_id,))
        row = cursor.fetchone()
        shop = dict(row) if row else None
        
        cursor.close()
        connection.close()
        
        if not shop:
            return jsonify({'error': 'Shop not found'}), 404
        
        return jsonify({'data': shop}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/shops', methods=['POST'])
@jwt_required()
def create_shop():
    """Create new shop"""
    try:
        user_id = get_jwt_identity()

        # Use safe JSON parsing to handle Unicode issues
        json_data = request.get_data(as_text=True)
        if not json_data:
            return jsonify({'error': 'No data provided'}), 400

        data = safe_json_loads(json_data)

        # Handle case where JSON parsing failed
        if 'error' in data:
            return jsonify({'error': f'Invalid request data: {data.get("original_error", "Unknown error")}'}), 400
        
        # Sanitize text inputs to prevent Unicode issues
        name = validate_and_sanitize_text(data.get('name'))
        category = validate_and_sanitize_text(data.get('category'))
        description = validate_and_sanitize_text(data.get('description'))
        location = validate_and_sanitize_text(data.get('location'))
        phone = validate_and_sanitize_text(data.get('phone'))
        email = validate_and_sanitize_text(data.get('email'))
        business_hours = validate_and_sanitize_text(data.get('business_hours'))
        image_url = validate_and_sanitize_text(data.get('image_url'))
        is_online = data.get('is_online', True)

        if not name or not category:
            return jsonify({'error': 'Name and category are required'}), 400

        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = connection.cursor()
        cursor.execute("""
            INSERT INTO shops (owner_id, name, category, description, location, phone, email, business_hours, image_url, is_online)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, name, category, description, location, phone, email, business_hours, image_url, is_online))
        connection.commit()
        shop_id = cursor.lastrowid
        
        cursor.close()
        connection.close()
        
        return jsonify({
            'message': 'Shop created successfully',
            'shop_id': shop_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/shops/<int:shop_id>', methods=['PUT'])
@jwt_required()
def update_shop(shop_id):
    """Update shop"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = connection.cursor()

        # Check ownership
        cursor.execute("SELECT owner_id FROM shops WHERE id = ?", (shop_id,))
        shop = cursor.fetchone()
        
        if not shop:
            cursor.close()
            connection.close()
            return jsonify({'error': 'Shop not found'}), 404
        
        if shop['owner_id'] != user_id:
            cursor.close()
            connection.close()
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Update shop
        update_fields = []
        values = []
        
        for field in ['name', 'category', 'description', 'location', 'phone', 'email', 'business_hours', 'image_url', 'is_online']:
            if field in data:
                update_fields.append(f"{field} = ?")
                values.append(data[field])

        if not update_fields:
            cursor.close()
            connection.close()
            return jsonify({'error': 'No fields to update'}), 400

        values.append(shop_id)
        query = f"UPDATE shops SET {', '.join(update_fields)} WHERE id = ?"
        
        cursor.execute(query, values)
        connection.commit()
        
        cursor.close()
        connection.close()
        
        return jsonify({'message': 'Shop updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/shops/<int:shop_id>', methods=['DELETE'])
@jwt_required()
def delete_shop(shop_id):
    """Delete shop"""
    try:
        user_id = get_jwt_identity()
        
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = connection.cursor()

        # Check ownership
        cursor.execute("SELECT owner_id FROM shops WHERE id = ?", (shop_id,))
        shop = cursor.fetchone()
        
        if not shop:
            cursor.close()
            connection.close()
            return jsonify({'error': 'Shop not found'}), 404
        
        if shop['owner_id'] != user_id:
            cursor.close()
            connection.close()
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Delete shop
        cursor.execute("DELETE FROM shops WHERE id = ?", (shop_id,))
        connection.commit()
        
        cursor.close()
        connection.close()
        
        return jsonify({'message': 'Shop deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== PRODUCT ROUTES ====================

@app.route('/api/shops/<int:shop_id>/products', methods=['GET'])
def get_shop_products(shop_id):
    """Get all products for a shop"""
    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = connection.cursor()
        cursor.execute("""
            SELECT p.*, s.name as shop_name
            FROM products p
            JOIN shops s ON p.shop_id = s.id
            WHERE p.shop_id = ? AND p.is_available = 1
            ORDER BY p.created_at DESC
        """, (shop_id,))
        rows = cursor.fetchall()
        products = [dict(row) for row in rows]

        cursor.close()
        connection.close()

        return jsonify({'data': products}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/shops/<int:shop_id>/products', methods=['POST'])
@jwt_required()
def create_product(shop_id):
    """Create new product for a shop"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        name = data.get('name')
        description = data.get('description')
        price = data.get('price')
        original_price = data.get('original_price', 0)
        discount_percentage = data.get('discount_percentage', 0)
        image_url = data.get('image_url')
        stock_quantity = data.get('stock_quantity', 0)
        is_in_stock = data.get('is_in_stock', True)

        if not name or not price:
            return jsonify({'error': 'Name and price are required'}), 400

        # Verify shop ownership
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = connection.cursor()
        cursor.execute("SELECT owner_id FROM shops WHERE id = ?", (shop_id,))
        shop = cursor.fetchone()

        if not shop:
            cursor.close()
            connection.close()
            return jsonify({'error': 'Shop not found'}), 404

        if shop['owner_id'] != user_id:
            cursor.close()
            connection.close()
            return jsonify({'error': 'Unauthorized'}), 403

        # Insert product
        cursor.execute("""
            INSERT INTO products (shop_id, name, description, price, original_price, discount_percentage, image_url, stock_quantity, is_available, is_in_stock)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
        """, (shop_id, name, description, price, original_price, discount_percentage, image_url, stock_quantity, is_in_stock))
        connection.commit()
        product_id = cursor.lastrowid

        # Update shop product count
        cursor.execute("UPDATE shops SET product_count = product_count + 1 WHERE id = ?", (shop_id,))
        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({
            'message': 'Product created successfully',
            'product_id': product_id
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Get single product by ID"""
    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = connection.cursor()
        cursor.execute("""
            SELECT p.*, s.name as shop_name, s.owner_id
            FROM products p
            JOIN shops s ON p.shop_id = s.id
            WHERE p.id = ? AND p.is_available = 1
        """, (product_id,))
        row = cursor.fetchone()
        product = dict(row) if row else None

        cursor.close()
        connection.close()

        if not product:
            return jsonify({'error': 'Product not found'}), 404

        return jsonify({'data': product}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    """Update product"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = connection.cursor()

        # Get product with shop info
        cursor.execute("""
            SELECT p.*, s.owner_id
            FROM products p
            JOIN shops s ON p.shop_id = s.id
            WHERE p.id = ?
        """, (product_id,))
        row = cursor.fetchone()
        product = dict(row) if row else None

        if not product:
            cursor.close()
            connection.close()
            return jsonify({'error': 'Product not found'}), 404

        if product['owner_id'] != user_id:
            cursor.close()
            connection.close()
            return jsonify({'error': 'Unauthorized'}), 403

        # Update product
        update_fields = []
        values = []

        for field in ['name', 'description', 'price', 'original_price', 'discount_percentage', 'image_url', 'stock_quantity', 'is_in_stock']:
            if field in data:
                update_fields.append(f"{field} = ?")
                values.append(data[field])

        if not update_fields:
            cursor.close()
            connection.close()
            return jsonify({'error': 'No fields to update'}), 400

        values.append(product_id)
        query = f"UPDATE products SET {', '.join(update_fields)} WHERE id = ?"

        cursor.execute(query, values)
        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({'message': 'Product updated successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    """Delete product"""
    try:
        user_id = get_jwt_identity()

        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = connection.cursor()

        # Get product with shop info
        cursor.execute("""
            SELECT p.*, s.owner_id
            FROM products p
            JOIN shops s ON p.shop_id = s.id
            WHERE p.id = ?
        """, (product_id,))
        row = cursor.fetchone()
        product = dict(row) if row else None

        if not product:
            cursor.close()
            connection.close()
            return jsonify({'error': 'Product not found'}), 404

        if product['owner_id'] != user_id:
            cursor.close()
            connection.close()
            return jsonify({'error': 'Unauthorized'}), 403

        # Delete product
        cursor.execute("DELETE FROM products WHERE id = ?", (product_id,))
        connection.commit()

        # Update shop product count
        cursor.execute("UPDATE shops SET product_count = product_count - 1 WHERE id = ?", (product['shop_id'],))
        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({'message': 'Product deleted successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== PRODUCT PHOTO ROUTES ====================

@app.route('/api/shops/<int:shop_id>/photos', methods=['GET'])
def get_shop_photos(shop_id):
    """Get all photos for a shop"""
    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = connection.cursor()
        cursor.execute("""
            SELECT pp.*, s.name as shop_name
            FROM product_photos pp
            JOIN shops s ON pp.shop_id = s.id
            WHERE pp.shop_id = ? AND pp.is_active = 1
            ORDER BY pp.display_order ASC, pp.created_at DESC
        """, (shop_id,))
        rows = cursor.fetchall()
        photos = [dict(row) for row in rows]

        cursor.close()
        connection.close()

        return jsonify({'data': photos}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/shops/<int:shop_id>/photos', methods=['POST'])
@jwt_required()
def create_shop_photo(shop_id):
    """Create new photo for a shop"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        photo_url = data.get('photo_url')
        caption = data.get('caption', '')
        display_order = data.get('display_order', 0)
        product_id = data.get('product_id')  # Optional, for product-specific photos

        if not photo_url:
            return jsonify({'error': 'Photo URL is required'}), 400

        # Verify shop ownership
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = connection.cursor()
        cursor.execute("SELECT owner_id FROM shops WHERE id = ?", (shop_id,))
        shop = cursor.fetchone()

        if not shop:
            cursor.close()
            connection.close()
            return jsonify({'error': 'Shop not found'}), 404

        if shop['owner_id'] != user_id:
            cursor.close()
            connection.close()
            return jsonify({'error': 'Unauthorized'}), 403

        # Insert photo
        cursor.execute("""
            INSERT INTO product_photos (shop_id, product_id, photo_url, caption, display_order, is_active)
            VALUES (?, ?, ?, ?, ?, 1)
        """, (shop_id, product_id, photo_url, caption, display_order))
        connection.commit()
        photo_id = cursor.lastrowid

        cursor.close()
        connection.close()

        return jsonify({
            'message': 'Photo added successfully',
            'photo_id': photo_id
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/photos/<int:photo_id>', methods=['DELETE'])
@jwt_required()
def delete_photo(photo_id):
    """Delete photo"""
    try:
        user_id = get_jwt_identity()

        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = connection.cursor()

        # Get photo with shop info
        cursor.execute("""
            SELECT pp.*, s.owner_id
            FROM product_photos pp
            JOIN shops s ON pp.shop_id = s.id
            WHERE pp.id = ?
        """, (photo_id,))
        row = cursor.fetchone()
        photo = dict(row) if row else None

        if not photo:
            cursor.close()
            connection.close()
            return jsonify({'error': 'Photo not found'}), 404

        if photo['owner_id'] != user_id:
            cursor.close()
            connection.close()
            return jsonify({'error': 'Unauthorized'}), 403

        # Delete photo
        cursor.execute("DELETE FROM product_photos WHERE id = ?", (photo_id,))
        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({'message': 'Photo deleted successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== FILE UPLOAD ROUTES ====================

import os
from werkzeug.utils import secure_filename
from flask import send_from_directory

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Create uploads directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/upload/shop-photo', methods=['POST'])
@jwt_required()
def upload_shop_photo():
    """Upload shop photo"""
    try:
        user_id = get_jwt_identity()

        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']

        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if file and allowed_file(file.filename):
            filename = secure_filename(f"shop_{user_id}_{int(__import__('time').time() * 1000)}.{file.filename.rsplit('.', 1)[1].lower()}")
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)

            # Return relative URL for frontend use
            return jsonify({
                'message': 'File uploaded successfully',
                'filename': filename,
                'url': f'/api/uploads/{filename}'
            }), 200

        return jsonify({'error': 'Invalid file type'}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload/product-photos', methods=['POST'])
@jwt_required()
def upload_product_photos():
    """Upload multiple product photos"""
    try:
        user_id = get_jwt_identity()

        if 'files' not in request.files:
            return jsonify({'error': 'No files provided'}), 400

        files = request.files.getlist('files')
        uploaded_files = []

        for file in files:
            if file.filename == '':
                continue

            if file and allowed_file(file.filename):
                filename = secure_filename(f"product_{user_id}_{int(__import__('time').time() * 1000)}_{len(uploaded_files)}.{file.filename.rsplit('.', 1)[1].lower()}")
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)

                uploaded_files.append({
                    'filename': filename,
                    'url': f'/api/uploads/{filename}'
                })

        if not uploaded_files:
            return jsonify({'error': 'No valid files uploaded'}), 400

        return jsonify({
            'message': f'{len(uploaded_files)} files uploaded successfully',
            'files': uploaded_files
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/uploads/<filename>')
def get_uploaded_file(filename):
    """Serve uploaded files"""
    try:
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    except FileNotFoundError:
        return jsonify({'error': 'File not found'}), 404

# ==================== ANALYTICS ROUTES ====================

@app.route('/api/analytics/shops/<int:shop_id>/metrics', methods=['GET'])
def get_shop_metrics(shop_id):
    """Get shop analytics metrics"""
    try:
        period = request.args.get('period', '30d')

        # Mock analytics data - in real app, this would come from database
        metrics = {
            'totalViews': 15420,
            'totalInquiries': 342,
            'totalRevenue': 125800,
            'totalOrders': 89,
            'conversionRate': 26.0,
            'averageOrderValue': 1413,
            'customerCount': 156,
            'productCount': 24
        }

        return jsonify({'data': metrics}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analytics/shops/<int:shop_id>/products', methods=['GET'])
def get_product_performance(shop_id):
    """Get product performance analytics"""
    try:
        period = request.args.get('period', '30d')

        # Mock product performance data
        products = [
            {
                'id': 1,
                'name': 'Premium Cotton T-Shirt',
                'views': 1250,
                'orders': 45,
                'revenue': 22500,
                'conversionRate': 3.6
            },
            {
                'id': 2,
                'name': 'Designer Jeans',
                'views': 980,
                'orders': 32,
                'revenue': 25600,
                'conversionRate': 3.3
            },
            {
                'id': 3,
                'name': 'Casual Sneakers',
                'views': 1450,
                'orders': 28,
                'revenue': 16800,
                'conversionRate': 1.9
            },
            {
                'id': 4,
                'name': 'Leather Handbag',
                'views': 890,
                'orders': 15,
                'revenue': 22500,
                'conversionRate': 1.7
            },
            {
                'id': 5,
                'name': 'Smart Watch',
                'views': 2100,
                'orders': 12,
                'revenue': 36000,
                'conversionRate': 0.6
            }
        ]

        return jsonify({'data': products}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analytics/shops/<int:shop_id>/daily', methods=['GET'])
def get_daily_analytics(shop_id):
    """Get daily analytics data"""
    try:
        period = request.args.get('period', '30d')

        # Mock daily analytics data
        daily_data = [
            {'date': '2024-01-01', 'views': 120, 'orders': 3, 'revenue': 4500},
            {'date': '2024-01-02', 'views': 150, 'orders': 5, 'revenue': 7200},
            {'date': '2024-01-03', 'views': 180, 'orders': 7, 'revenue': 9800},
            {'date': '2024-01-04', 'views': 140, 'orders': 4, 'revenue': 5600},
            {'date': '2024-01-05', 'views': 200, 'orders': 8, 'revenue': 11200},
            {'date': '2024-01-06', 'views': 160, 'orders': 6, 'revenue': 8400},
            {'date': '2024-01-07', 'views': 220, 'orders': 9, 'revenue': 12600}
        ]

        return jsonify({'data': daily_data}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analytics/shops/<int:shop_id>/revenue', methods=['GET'])
def get_revenue_analytics(shop_id):
    """Get revenue analytics"""
    try:
        period = request.args.get('period', '30d')

        # Mock revenue data
        total_revenue = 125800
        revenue_by_product = [
            {
                'id': 1,
                'name': 'Premium Cotton T-Shirt',
                'views': 1250,
                'orders': 45,
                'revenue': 22500,
                'conversionRate': 3.6
            },
            {
                'id': 2,
                'name': 'Designer Jeans',
                'views': 980,
                'orders': 32,
                'revenue': 25600,
                'conversionRate': 3.3
            },
            {
                'id': 3,
                'name': 'Casual Sneakers',
                'views': 1450,
                'orders': 28,
                'revenue': 16800,
                'conversionRate': 1.9
            },
            {
                'id': 4,
                'name': 'Leather Handbag',
                'views': 890,
                'orders': 15,
                'revenue': 22500,
                'conversionRate': 1.7
            },
            {
                'id': 5,
                'name': 'Smart Watch',
                'views': 2100,
                'orders': 12,
                'revenue': 36000,
                'conversionRate': 0.6
            }
        ]

        return jsonify({
            'data': {
                'totalRevenue': total_revenue,
                'revenueByProduct': revenue_by_product
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== EVENTS API ROUTES ====================

@app.route('/api/events', methods=['GET'])
def get_events():
    """Get all events with optional filtering"""
    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = connection.cursor()

        # Get query parameters
        category = request.args.get('category')
        status = request.args.get('status', 'published')
        featured = request.args.get('featured')
        limit = request.args.get('limit', 50)
        offset = request.args.get('offset', 0)

        # Build query
        query = """
            SELECT e.*, u.full_name as organizer_name
            FROM events e
            LEFT JOIN users u ON e.organizer_id = u.id
            WHERE e.status = ?
        """
        params = [status]

        if category:
            query += " AND e.category = ?"
            params.append(category)

        if featured == '1':
            query += " AND e.is_featured = 1"

        query += " ORDER BY e.start_date DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        cursor.execute(query, params)
        rows = cursor.fetchall()
        events = [dict(row) for row in rows]

        cursor.close()
        connection.close()

        return jsonify({'data': events}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/events/<int:event_id>', methods=['GET'])
def get_event(event_id):
    """Get single event by ID"""
    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = connection.cursor()
        cursor.execute("""
            SELECT e.*, u.full_name as organizer_name
            FROM events e
            LEFT JOIN users u ON e.organizer_id = u.id
            WHERE e.id = ?
        """, (event_id,))
        row = cursor.fetchone()
        event = dict(row) if row else None

        cursor.close()
        connection.close()

        if not event:
            return jsonify({'error': 'Event not found'}), 404

        return jsonify({'data': event}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/events', methods=['POST'])
@jwt_required()
def create_event():
    """Create new event"""
    try:
        user_id = get_jwt_identity()

        # Use safe JSON parsing
        json_data = request.get_data(as_text=True)
        if not json_data:
            return jsonify({'error': 'No data provided'}), 400

        data = safe_json_loads(json_data)

        if 'error' in data:
            return jsonify({'error': f'Invalid request data: {data.get("original_error", "Unknown error")}'}), 400

        # Extract and sanitize data
        title = validate_and_sanitize_text(data.get('title'))
        description = validate_and_sanitize_text(data.get('description'))
        category = validate_and_sanitize_text(data.get('category'))
        event_type = validate_and_sanitize_text(data.get('event_type'))
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        location = validate_and_sanitize_text(data.get('location'))
        max_attendees = data.get('max_attendees')
        ticket_price = data.get('ticket_price', 0)
        is_free = data.get('is_free', 0)

        if not title or not category or not event_type or not start_date or not end_date:
            return jsonify({'error': 'Title, category, event_type, start_date, and end_date are required'}), 400

        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = connection.cursor()
        cursor.execute("""
            INSERT INTO events (organizer_id, title, description, category, event_type, start_date, end_date, location, max_attendees, ticket_price, is_free)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, title, description, category, event_type, start_date, end_date, location, max_attendees, ticket_price, is_free))
        connection.commit()
        event_id = cursor.lastrowid

        cursor.close()
        connection.close()

        return jsonify({
            'message': 'Event created successfully',
            'event_id': event_id
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/events/<int:event_id>/register', methods=['POST'])
@jwt_required()
def register_for_event(event_id):
    """Register user for an event"""
    try:
        user_id = get_jwt_identity()

        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = connection.cursor()

        # Check if event exists and has space
        cursor.execute("SELECT * FROM events WHERE id = ?", (event_id,))
        event = cursor.fetchone()

        if not event:
            cursor.close()
            connection.close()
            return jsonify({'error': 'Event not found'}), 404

        if event['current_attendees'] >= event['max_attendees']:
            cursor.close()
            connection.close()
            return jsonify({'error': 'Event is full'}), 400

        # Check if user is already registered
        cursor.execute("SELECT id FROM event_attendees WHERE event_id = ? AND user_id = ?", (event_id, user_id))
        if cursor.fetchone():
            cursor.close()
            connection.close()
            return jsonify({'error': 'Already registered for this event'}), 400

        # Register user for event
        cursor.execute("""
            INSERT INTO event_attendees (event_id, user_id, ticket_count, total_amount, payment_status)
            VALUES (?, ?, 1, ?, 'pending')
        """, (event_id, user_id, event['ticket_price']))

        # Update attendee count
        cursor.execute("UPDATE events SET current_attendees = current_attendees + 1 WHERE id = ?", (event_id,))
        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({'message': 'Successfully registered for event'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== USER FAVORITES API ====================

@app.route('/api/user/favorites', methods=['GET'])
@jwt_required()
def get_user_favorites():
    """Get user's favorite shops and products"""
    try:
        user_id = get_jwt_identity()

        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = connection.cursor()

        # Get favorite shops
        cursor.execute("""
            SELECT s.*, 'shop' as favorite_type
            FROM shops s
            JOIN user_favorites uf ON s.id = uf.shop_id
            WHERE uf.user_id = ? AND uf.product_id IS NULL
        """, (user_id,))
        favorite_shops = [dict(row) for row in cursor.fetchall()]

        # Get favorite products
        cursor.execute("""
            SELECT p.*, s.name as shop_name, 'product' as favorite_type
            FROM products p
            JOIN shops s ON p.shop_id = s.id
            JOIN user_favorites uf ON p.id = uf.product_id
            WHERE uf.user_id = ? AND uf.shop_id IS NULL
        """, (user_id,))
        favorite_products = [dict(row) for row in cursor.fetchall()]

        cursor.close()
        connection.close()

        return jsonify({
            'data': {
                'shops': favorite_shops,
                'products': favorite_products
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/favorites', methods=['POST'])
@jwt_required()
def add_favorite():
    """Add shop or product to favorites"""
    try:
        user_id = get_jwt_identity()

        json_data = request.get_data(as_text=True)
        if not json_data:
            return jsonify({'error': 'No data provided'}), 400

        data = safe_json_loads(json_data)
        if 'error' in data:
            return jsonify({'error': f'Invalid request data: {data.get("original_error", "Unknown error")}'}), 400

        shop_id = data.get('shop_id')
        product_id = data.get('product_id')

        if not shop_id and not product_id:
            return jsonify({'error': 'shop_id or product_id is required'}), 400

        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = connection.cursor()

        # Insert favorite (will be ignored if already exists due to UNIQUE constraint)
        cursor.execute("""
            INSERT OR IGNORE INTO user_favorites (user_id, shop_id, product_id)
            VALUES (?, ?, ?)
        """, (user_id, shop_id, product_id))
        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({'message': 'Added to favorites'}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/favorites/<int:favorite_id>', methods=['DELETE'])
@jwt_required()
def remove_favorite(favorite_id):
    """Remove from favorites"""
    try:
        user_id = get_jwt_identity()

        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = connection.cursor()
        cursor.execute("DELETE FROM user_favorites WHERE id = ? AND user_id = ?", (favorite_id, user_id))
        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({'message': 'Removed from favorites'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== ENHANCED USER API ====================

@app.route('/api/user/profile', methods=['PUT'])
@jwt_required()
def update_user_profile():
    """Update user profile"""
    try:
        user_id = get_jwt_identity()

        json_data = request.get_data(as_text=True)
        if not json_data:
            return jsonify({'error': 'No data provided'}), 400

        data = safe_json_loads(json_data)
        if 'error' in data:
            return jsonify({'error': f'Invalid request data: {data.get("original_error", "Unknown error")}'}), 400

        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = connection.cursor()

        # Update user profile fields
        update_fields = []
        values = []

        for field in ['full_name', 'phone', 'bio', 'location', 'website']:
            if field in data:
                update_fields.append(f"{field} = ?")
                values.append(validate_and_sanitize_text(data[field]))

        if not update_fields:
            cursor.close()
            connection.close()
            return jsonify({'error': 'No fields to update'}), 400

        values.append(user_id)
        query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = ?"

        cursor.execute(query, values)
        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({'message': 'Profile updated successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== HEALTH CHECK ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'message': 'ShopLink API is running'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
