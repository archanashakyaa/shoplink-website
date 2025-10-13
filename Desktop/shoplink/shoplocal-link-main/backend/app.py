import sqlite3
import os
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
    """Initialize database with tables"""
    connection = sqlite3.connect(DATABASE)
    cursor = connection.cursor()

    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
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
        CREATE TABLE IF NOT EXISTS shops (
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
            is_available BOOLEAN DEFAULT 1,
            is_in_stock BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
        )
    ''')

    # Product photos table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS product_photos (
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

    connection.commit()
    connection.close()

# Initialize database on startup
init_database()

# ==================== AUTH ROUTES ====================

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    """User registration"""
    try:
        data = request.get_json()
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
        data = request.get_json()
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
        data = request.get_json()
        
        name = data.get('name')
        category = data.get('category')
        description = data.get('description')
        location = data.get('location')
        phone = data.get('phone')
        email = data.get('email')
        business_hours = data.get('business_hours')
        image_url = data.get('image_url')
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

# ==================== HEALTH CHECK ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'message': 'ShopLink API is running'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
