from flask import Blueprint, request, jsonify, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from database import get_db
from utils import standard_response, generate_slug
import os
import uuid

products_bp = Blueprint('products', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@products_bp.route('', methods=['POST'])
@jwt_required()
def create_product():
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        shop_id = data.get('shop_id')
        name = data.get('name', '').strip()
        price = data.get('price')
        
        if not shop_id or not name or price is None:
            return jsonify(standard_response('error', 'Shop ID, name, and price are required')), 400
        
        # Verify shop ownership
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT owner_id FROM shops WHERE id = ?', (shop_id,))
        shop = cursor.fetchone()
        if not shop or shop['owner_id'] != user_id:
            conn.close()
            return jsonify(standard_response('error', 'Unauthorized or shop not found')), 403
        
        slug = generate_slug(name)
        base_slug = slug
        counter = 1
        while True:
            cursor.execute('SELECT id FROM products WHERE slug = ? AND shop_id = ?', (slug, shop_id))
            if not cursor.fetchone():
                break
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        # Calculate discount if original_price provided
        original_price = data.get('original_price')
        discount_percentage = None
        if original_price and original_price > price:
            discount_percentage = ((original_price - price) / original_price) * 100
        
        cursor.execute('''
            INSERT INTO products (shop_id, name, slug, description, price, original_price, discount_percentage,
                                 stock_quantity, min_order_quantity, max_order_quantity, sku, barcode, weight,
                                 dimensions, category, tags, is_available, is_in_stock, is_featured)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            shop_id, name, slug, data.get('description'), price, original_price, discount_percentage,
            data.get('stock_quantity', 0), data.get('min_order_quantity', 1), data.get('max_order_quantity'),
            data.get('sku'), data.get('barcode'), data.get('weight'), data.get('dimensions'),
            data.get('category'), data.get('tags'), data.get('is_available', 1),
            1 if data.get('stock_quantity', 0) > 0 else 0, data.get('is_featured', 0)
        ))
        
        product_id = cursor.lastrowid
        
        # Update shop product count
        cursor.execute('UPDATE shops SET product_count = product_count + 1 WHERE id = ?', (shop_id,))
        
        conn.commit()
        
        cursor.execute('SELECT * FROM products WHERE id = ?', (product_id,))
        product = cursor.fetchone()
        conn.close()
        
        return jsonify(standard_response('success', 'Product created successfully', dict(product))), 201
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@products_bp.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM products WHERE id = ? AND is_available = 1', (product_id,))
        product = cursor.fetchone()
        
        if product:
            # Increment views
            cursor.execute('UPDATE products SET views_count = views_count + 1 WHERE id = ?', (product_id,))
            conn.commit()
        
        conn.close()
        
        if not product:
            return jsonify(standard_response('error', 'Product not found')), 404
        
        return jsonify(standard_response('success', 'Product retrieved', dict(product))), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@products_bp.route('/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Get product and verify ownership
        cursor.execute('SELECT shop_id FROM products WHERE id = ?', (product_id,))
        product = cursor.fetchone()
        if not product:
            conn.close()
            return jsonify(standard_response('error', 'Product not found')), 404
        
        cursor.execute('SELECT owner_id FROM shops WHERE id = ?', (product['shop_id'],))
        shop = cursor.fetchone()
        if shop['owner_id'] != user_id:
            conn.close()
            return jsonify(standard_response('error', 'Unauthorized')), 403
        
        # Build update query
        updates = []
        values = []
        
        allowed_fields = ['name', 'description', 'price', 'original_price', 'stock_quantity', 'min_order_quantity',
                         'max_order_quantity', 'sku', 'barcode', 'weight', 'dimensions', 'category', 'tags',
                         'is_available', 'is_featured']
        
        for field in allowed_fields:
            if field in data:
                updates.append(f'{field} = ?')
                values.append(data[field])
        
        # Recalculate discount if price or original_price changed
        if 'price' in data or 'original_price' in data:
            cursor.execute('SELECT price, original_price FROM products WHERE id = ?', (product_id,))
            current = cursor.fetchone()
            current_dict = dict(current)
            price = data.get('price', current_dict['price'])
            original_price = data.get('original_price', current_dict.get('original_price'))
            if original_price and original_price > price:
                discount_percentage = ((original_price - price) / original_price) * 100
                updates.append('discount_percentage = ?')
                values.append(discount_percentage)
            else:
                updates.append('discount_percentage = ?')
                values.append(None)
        
        # Update is_in_stock based on stock_quantity
        if 'stock_quantity' in data:
            updates.append('is_in_stock = ?')
            values.append(1 if data['stock_quantity'] > 0 else 0)
        
        if 'name' in data:
            slug = generate_slug(data['name'])
            base_slug = slug
            counter = 1
            while True:
                cursor.execute('SELECT id FROM products WHERE slug = ? AND shop_id = ? AND id != ?', 
                             (slug, product['shop_id'], product_id))
                if not cursor.fetchone():
                    break
                slug = f"{base_slug}-{counter}"
                counter += 1
            updates.append('slug = ?')
            values.append(slug)
        
        if not updates:
            conn.close()
            return jsonify(standard_response('error', 'No valid fields to update')), 400
        
        values.append(product_id)
        query = f"UPDATE products SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        cursor.execute(query, values)
        conn.commit()
        
        cursor.execute('SELECT * FROM products WHERE id = ?', (product_id,))
        updated_product = cursor.fetchone()
        conn.close()
        
        return jsonify(standard_response('success', 'Product updated', dict(updated_product))), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@products_bp.route('/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    try:
        user_id = int(get_jwt_identity())
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('SELECT shop_id FROM products WHERE id = ?', (product_id,))
        product = cursor.fetchone()
        if not product:
            conn.close()
            return jsonify(standard_response('error', 'Product not found')), 404
        
        cursor.execute('SELECT owner_id FROM shops WHERE id = ?', (product['shop_id'],))
        shop = cursor.fetchone()
        if shop['owner_id'] != user_id:
            conn.close()
            return jsonify(standard_response('error', 'Unauthorized')), 403
        
        # Soft delete
        cursor.execute('UPDATE products SET is_available = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', (product_id,))
        cursor.execute('UPDATE shops SET product_count = product_count - 1 WHERE id = ?', (product['shop_id'],))
        conn.commit()
        conn.close()
        
        return jsonify(standard_response('success', 'Product deleted')), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@products_bp.route('/<int:product_id>/upload-image', methods=['POST'])
@jwt_required()
def upload_product_image(product_id):
    try:
        user_id = int(get_jwt_identity())
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT shop_id FROM products WHERE id = ?', (product_id,))
        product = cursor.fetchone()
        if not product:
            conn.close()
            return jsonify(standard_response('error', 'Product not found')), 404
        
        cursor.execute('SELECT owner_id FROM shops WHERE id = ?', (product['shop_id'],))
        shop = cursor.fetchone()
        if shop['owner_id'] != user_id:
            conn.close()
            return jsonify(standard_response('error', 'Unauthorized')), 403
        conn.close()
        
        if 'file' not in request.files:
            return jsonify(standard_response('error', 'No file provided')), 400
        
        file = request.files['file']
        if file.filename == '' or not allowed_file(file.filename):
            return jsonify(standard_response('error', 'Invalid file')), 400
        
        filename = f"{product_id}_{uuid.uuid4().hex[:8]}.{file.filename.rsplit('.', 1)[1].lower()}"
        upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'products')
        os.makedirs(upload_dir, exist_ok=True)
        full_path = os.path.join(upload_dir, filename)
        file.save(full_path)
        
        # Update product
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('UPDATE products SET image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
                      (f'/api/uploads/products/{filename}', product_id))
        conn.commit()
        conn.close()
        
        return jsonify(standard_response('success', 'Image uploaded', {'image_url': f'/api/uploads/products/{filename}'})), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@products_bp.route('/uploads/products/<filename>')
def uploaded_file(filename):
    return send_from_directory(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'products'), filename)

