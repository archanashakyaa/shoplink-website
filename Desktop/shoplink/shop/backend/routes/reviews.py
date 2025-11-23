from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import get_db
from utils import standard_response

reviews_bp = Blueprint('reviews', __name__)

@reviews_bp.route('/shop/<int:shop_id>', methods=['POST'])
@jwt_required()
def create_shop_review(shop_id):
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        rating = int(data.get('rating', 0))
        if rating < 1 or rating > 5:
            return jsonify(standard_response('error', 'Rating must be between 1 and 5')), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Verify shop exists
        cursor.execute('SELECT id FROM shops WHERE id = ?', (shop_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify(standard_response('error', 'Shop not found')), 404
        
        # Check if already reviewed
        cursor.execute('SELECT id FROM shop_reviews WHERE shop_id = ? AND user_id = ?', (shop_id, user_id))
        if cursor.fetchone():
            conn.close()
            return jsonify(standard_response('error', 'Already reviewed')), 400
        
        cursor.execute('''
            INSERT INTO shop_reviews (shop_id, user_id, rating, title, body, is_verified_purchase)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (shop_id, user_id, rating, data.get('title'), data.get('body'), data.get('is_verified_purchase', 0)))
        
        # Update shop rating
        cursor.execute('''
            UPDATE shops 
            SET reviews_count = reviews_count + 1,
                rating = (SELECT AVG(rating) FROM shop_reviews WHERE shop_id = ?)
            WHERE id = ?
        ''', (shop_id, shop_id))
        
        conn.commit()
        conn.close()
        
        return jsonify(standard_response('success', 'Review created')), 201
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@reviews_bp.route('/shop/<int:shop_id>', methods=['GET'])
def get_shop_reviews(shop_id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT sr.*, u.full_name, u.profile_photo
            FROM shop_reviews sr
            JOIN users u ON sr.user_id = u.id
            WHERE sr.shop_id = ?
            ORDER BY sr.created_at DESC
        ''', (shop_id,))
        reviews = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify(standard_response('success', 'Reviews retrieved', reviews)), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@reviews_bp.route('/product/<int:product_id>', methods=['POST'])
@jwt_required()
def create_product_review(product_id):
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        rating = int(data.get('rating', 0))
        if rating < 1 or rating > 5:
            return jsonify(standard_response('error', 'Rating must be between 1 and 5')), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Verify product exists
        cursor.execute('SELECT id FROM products WHERE id = ?', (product_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify(standard_response('error', 'Product not found')), 404
        
        # Check if already reviewed
        cursor.execute('SELECT id FROM product_reviews WHERE product_id = ? AND user_id = ?', (product_id, user_id))
        if cursor.fetchone():
            conn.close()
            return jsonify(standard_response('error', 'Already reviewed')), 400
        
        cursor.execute('''
            INSERT INTO product_reviews (product_id, user_id, rating, title, body, is_verified_purchase)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (product_id, user_id, rating, data.get('title'), data.get('body'), data.get('is_verified_purchase', 0)))
        
        # Update product rating
        cursor.execute('''
            UPDATE products 
            SET reviews_count = reviews_count + 1,
                rating = (SELECT AVG(rating) FROM product_reviews WHERE product_id = ?)
            WHERE id = ?
        ''', (product_id, product_id))
        
        conn.commit()
        conn.close()
        
        return jsonify(standard_response('success', 'Review created')), 201
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@reviews_bp.route('/product/<int:product_id>', methods=['GET'])
def get_product_reviews(product_id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT pr.*, u.full_name, u.profile_photo
            FROM product_reviews pr
            JOIN users u ON pr.user_id = u.id
            WHERE pr.product_id = ?
            ORDER BY pr.created_at DESC
        ''', (product_id,))
        reviews = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify(standard_response('success', 'Reviews retrieved', reviews)), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

