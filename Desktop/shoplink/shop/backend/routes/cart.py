from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import get_db
from utils import standard_response

cart_bp = Blueprint('cart', __name__)

@cart_bp.route('', methods=['GET'])
@jwt_required()
def get_cart():
    try:
        user_id = int(get_jwt_identity())
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT ci.*, p.name, p.price, p.image_url, p.shop_id, s.name as shop_name
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            JOIN shops s ON p.shop_id = s.id
            WHERE ci.user_id = ? AND p.is_available = 1
            ORDER BY ci.created_at DESC
        ''', (user_id,))
        items = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify(standard_response('success', 'Cart retrieved', items)), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@cart_bp.route('', methods=['POST'])
@jwt_required()
def add_to_cart():
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        product_id = data.get('product_id')
        quantity = int(data.get('quantity', 1))
        
        if not product_id:
            return jsonify(standard_response('error', 'Product ID is required')), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Verify product exists and is available
        cursor.execute('SELECT id, stock_quantity, is_available FROM products WHERE id = ?', (product_id,))
        product = cursor.fetchone()
        if not product or not product['is_available']:
            conn.close()
            return jsonify(standard_response('error', 'Product not available')), 404
        
        if product['stock_quantity'] < quantity:
            conn.close()
            return jsonify(standard_response('error', 'Insufficient stock')), 400
        
        # Check if already in cart
        cursor.execute('SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?', (user_id, product_id))
        existing = cursor.fetchone()
        
        if existing:
            new_quantity = existing['quantity'] + quantity
            if product['stock_quantity'] < new_quantity:
                conn.close()
                return jsonify(standard_response('error', 'Insufficient stock')), 400
            cursor.execute('UPDATE cart_items SET quantity = ? WHERE id = ?', (new_quantity, existing['id']))
        else:
            cursor.execute('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)', 
                          (user_id, product_id, quantity))
        
        conn.commit()
        conn.close()
        
        return jsonify(standard_response('success', 'Item added to cart')), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@cart_bp.route('/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_cart_item(product_id):
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        quantity = int(data.get('quantity', 1))
        
        if quantity < 1:
            return jsonify(standard_response('error', 'Quantity must be at least 1')), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Verify product stock
        cursor.execute('SELECT stock_quantity FROM products WHERE id = ?', (product_id,))
        product = cursor.fetchone()
        if not product:
            conn.close()
            return jsonify(standard_response('error', 'Product not found')), 404
        
        if product['stock_quantity'] < quantity:
            conn.close()
            return jsonify(standard_response('error', 'Insufficient stock')), 400
        
        cursor.execute('UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?', 
                      (quantity, user_id, product_id))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify(standard_response('error', 'Item not in cart')), 404
        
        conn.commit()
        conn.close()
        
        return jsonify(standard_response('success', 'Cart updated')), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@cart_bp.route('/<int:product_id>', methods=['DELETE'])
@jwt_required()
def remove_from_cart(product_id):
    try:
        user_id = int(get_jwt_identity())
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', (user_id, product_id))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify(standard_response('error', 'Item not in cart')), 404
        
        conn.commit()
        conn.close()
        
        return jsonify(standard_response('success', 'Item removed from cart')), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@cart_bp.route('/clear', methods=['DELETE'])
@jwt_required()
def clear_cart():
    try:
        user_id = int(get_jwt_identity())
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM cart_items WHERE user_id = ?', (user_id,))
        conn.commit()
        conn.close()
        
        return jsonify(standard_response('success', 'Cart cleared')), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

