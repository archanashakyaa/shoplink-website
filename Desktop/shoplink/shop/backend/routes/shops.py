from flask import Blueprint, request, jsonify, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from database import get_db
from utils import standard_response, generate_slug
import os
import uuid

shops_bp = Blueprint('shops', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@shops_bp.route('', methods=['POST'])
@jwt_required()
def create_shop():
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        name = data.get('name', '').strip()
        if not name:
            return jsonify(standard_response('error', 'Shop name is required')), 400
        
        slug = generate_slug(name)
        # Ensure unique slug
        conn = get_db()
        cursor = conn.cursor()
        base_slug = slug
        counter = 1
        while True:
            cursor.execute('SELECT id FROM shops WHERE slug = ?', (slug,))
            if not cursor.fetchone():
                break
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        cursor.execute('''
            INSERT INTO shops (owner_id, name, slug, category, description, location, address, city, state, country,
                             latitude, longitude, phone, email, website, business_hours, is_online_selling,
                             is_offline_selling, accepts_online_payment, accepts_cash)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_id, name, slug, data.get('category'), data.get('description'), data.get('location'),
            data.get('address'), data.get('city'), data.get('state'), data.get('country'),
            data.get('latitude'), data.get('longitude'), data.get('phone'), data.get('email'),
            data.get('website'), data.get('business_hours'), data.get('is_online_selling', 1),
            data.get('is_offline_selling', 0), data.get('accepts_online_payment', 1), data.get('accepts_cash', 1)
        ))
        
        shop_id = cursor.lastrowid
        conn.commit()
        
        cursor.execute('SELECT * FROM shops WHERE id = ?', (shop_id,))
        shop = cursor.fetchone()
        conn.close()
        
        return jsonify(standard_response('success', 'Shop created successfully', dict(shop))), 201
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@shops_bp.route('/<int:shop_id>', methods=['GET'])
def get_shop(shop_id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM shops WHERE id = ? AND is_active = 1', (shop_id,))
        shop = cursor.fetchone()
        conn.close()
        
        if not shop:
            return jsonify(standard_response('error', 'Shop not found')), 404
        
        return jsonify(standard_response('success', 'Shop retrieved', dict(shop))), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@shops_bp.route('', methods=['GET'])
def list_shops():
    try:
        category = request.args.get('category')
        limit = int(request.args.get('limit', 20))
        offset = int(request.args.get('offset', 0))
        
        conn = get_db()
        cursor = conn.cursor()
        
        query = 'SELECT * FROM shops WHERE is_active = 1'
        params = []
        
        if category:
            query += ' AND category = ?'
            params.append(category)
        
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        shops = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify(standard_response('success', 'Shops retrieved', shops)), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@shops_bp.route('/<int:shop_id>', methods=['PUT'])
@jwt_required()
def update_shop(shop_id):
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Check ownership
        cursor.execute('SELECT owner_id FROM shops WHERE id = ?', (shop_id,))
        shop = cursor.fetchone()
        if not shop:
            conn.close()
            return jsonify(standard_response('error', 'Shop not found')), 404
        
        if shop['owner_id'] != user_id:
            conn.close()
            return jsonify(standard_response('error', 'Unauthorized')), 403
        
        # Build update query
        updates = []
        values = []
        
        allowed_fields = ['name', 'category', 'description', 'location', 'address', 'city', 'state', 'country',
                         'latitude', 'longitude', 'phone', 'email', 'website', 'business_hours',
                         'is_online_selling', 'is_offline_selling', 'accepts_online_payment', 'accepts_cash']
        
        for field in allowed_fields:
            if field in data:
                updates.append(f'{field} = ?')
                values.append(data[field])
        
        if 'name' in data:
            # Regenerate slug if name changed
            slug = generate_slug(data['name'])
            base_slug = slug
            counter = 1
            while True:
                cursor.execute('SELECT id FROM shops WHERE slug = ? AND id != ?', (slug, shop_id))
                if not cursor.fetchone():
                    break
                slug = f"{base_slug}-{counter}"
                counter += 1
            updates.append('slug = ?')
            values.append(slug)
        
        if not updates:
            conn.close()
            return jsonify(standard_response('error', 'No valid fields to update')), 400
        
        values.append(shop_id)
        query = f"UPDATE shops SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        cursor.execute(query, values)
        conn.commit()
        
        cursor.execute('SELECT * FROM shops WHERE id = ?', (shop_id,))
        updated_shop = cursor.fetchone()
        conn.close()
        
        return jsonify(standard_response('success', 'Shop updated', dict(updated_shop))), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@shops_bp.route('/<int:shop_id>/upload-logo', methods=['POST'])
@jwt_required()
def upload_logo(shop_id):
    try:
        user_id = int(get_jwt_identity())
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT owner_id FROM shops WHERE id = ?', (shop_id,))
        shop = cursor.fetchone()
        if not shop or shop['owner_id'] != user_id:
            conn.close()
            return jsonify(standard_response('error', 'Unauthorized')), 403
        conn.close()
        
        if 'file' not in request.files:
            return jsonify(standard_response('error', 'No file provided')), 400
        
        file = request.files['file']
        if file.filename == '' or not allowed_file(file.filename):
            return jsonify(standard_response('error', 'Invalid file')), 400
        
        filename = f"{shop_id}_{uuid.uuid4().hex[:8]}.{file.filename.rsplit('.', 1)[1].lower()}"
        upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'shops')
        os.makedirs(upload_dir, exist_ok=True)
        full_path = os.path.join(upload_dir, filename)
        file.save(full_path)
        
        # Update shop
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('UPDATE shops SET logo_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
                      (f'/api/uploads/shops/{filename}', shop_id))
        conn.commit()
        conn.close()
        
        return jsonify(standard_response('success', 'Logo uploaded', {'logo_url': f'/api/uploads/shops/{filename}'})), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@shops_bp.route('/<int:shop_id>/upload-cover', methods=['POST'])
@jwt_required()
def upload_cover(shop_id):
    try:
        user_id = int(get_jwt_identity())
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT owner_id FROM shops WHERE id = ?', (shop_id,))
        shop = cursor.fetchone()
        if not shop or shop['owner_id'] != user_id:
            conn.close()
            return jsonify(standard_response('error', 'Unauthorized')), 403
        conn.close()
        
        if 'file' not in request.files:
            return jsonify(standard_response('error', 'No file provided')), 400
        
        file = request.files['file']
        if file.filename == '' or not allowed_file(file.filename):
            return jsonify(standard_response('error', 'Invalid file')), 400
        
        filename = f"{shop_id}_{uuid.uuid4().hex[:8]}.{file.filename.rsplit('.', 1)[1].lower()}"
        upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'shops')
        os.makedirs(upload_dir, exist_ok=True)
        full_path = os.path.join(upload_dir, filename)
        file.save(full_path)
        
        # Update shop
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('UPDATE shops SET cover_photo_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
                      (f'/api/uploads/shops/{filename}', shop_id))
        conn.commit()
        conn.close()
        
        return jsonify(standard_response('success', 'Cover photo uploaded', {'cover_photo_url': f'/api/uploads/shops/{filename}'})), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@shops_bp.route('/<int:shop_id>/products', methods=['GET'])
def get_shop_products(shop_id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM products WHERE shop_id = ? AND is_available = 1 ORDER BY created_at DESC', (shop_id,))
        products = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify(standard_response('success', 'Products retrieved', products)), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@shops_bp.route('/uploads/shops/<filename>')
def uploaded_file(filename):
    return send_from_directory(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'shops'), filename)

