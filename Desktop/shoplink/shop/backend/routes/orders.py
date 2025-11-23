from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import get_db
from utils import standard_response

orders_bp = Blueprint('orders', __name__)

@orders_bp.route('', methods=['POST'])
@jwt_required()
def create_order():
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        shop_id = data.get('shop_id')
        items = data.get('items', [])  # [{product_id, quantity}, ...]
        payment_method = data.get('payment_method', 'cash')
        shipping_address = data.get('shipping_address')
        
        if not shop_id or not items:
            return jsonify(standard_response('error', 'Shop ID and items are required')), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Verify shop exists
        cursor.execute('SELECT id FROM shops WHERE id = ? AND is_active = 1', (shop_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify(standard_response('error', 'Shop not found')), 404
        
        # Calculate total and verify stock
        total_amount = 0
        order_items_data = []
        
        for item in items:
            product_id = item.get('product_id')
            quantity = int(item.get('quantity', 1))
            
            cursor.execute('SELECT price, stock_quantity, is_available FROM products WHERE id = ? AND shop_id = ?', 
                          (product_id, shop_id))
            product = cursor.fetchone()
            
            if not product or not product['is_available']:
                conn.close()
                return jsonify(standard_response('error', f'Product {product_id} not available')), 400
            
            if product['stock_quantity'] < quantity:
                conn.close()
                return jsonify(standard_response('error', f'Insufficient stock for product {product_id}')), 400
            
            unit_price = product['price']
            subtotal = unit_price * quantity
            total_amount += subtotal
            order_items_data.append({
                'product_id': product_id,
                'quantity': quantity,
                'unit_price': unit_price,
                'subtotal': subtotal
            })
        
        # Create order
        cursor.execute('''
            INSERT INTO orders (user_id, shop_id, status, total_amount, currency, payment_method, shipping_address)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, shop_id, 'pending', total_amount, 'USD', payment_method, shipping_address))
        
        order_id = cursor.lastrowid
        
        # Create order items and update stock
        for item_data in order_items_data:
            cursor.execute('''
                INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
                VALUES (?, ?, ?, ?, ?)
            ''', (order_id, item_data['product_id'], item_data['quantity'], 
                  item_data['unit_price'], item_data['subtotal']))
            
            # Update product stock
            cursor.execute('''
                UPDATE products 
                SET stock_quantity = stock_quantity - ?, 
                    sales_count = sales_count + ?,
                    is_in_stock = CASE WHEN stock_quantity - ? > 0 THEN 1 ELSE 0 END
                WHERE id = ?
            ''', (item_data['quantity'], item_data['quantity'], item_data['quantity'], item_data['product_id']))
        
        # Update shop total sales
        cursor.execute('UPDATE shops SET total_sales = total_sales + ? WHERE id = ?', (total_amount, shop_id))
        
        # Create payment record
        cursor.execute('''
            INSERT INTO payments (order_id, provider, amount, currency, status)
            VALUES (?, ?, ?, ?, ?)
        ''', (order_id, payment_method, total_amount, 'USD', 'pending'))
        
        conn.commit()
        
        # Get created order with items
        cursor.execute('SELECT * FROM orders WHERE id = ?', (order_id,))
        order = cursor.fetchone()
        
        cursor.execute('''
            SELECT oi.*, p.name, p.image_url
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        ''', (order_id,))
        order_items = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        order_dict = dict(order)
        order_dict['items'] = order_items
        
        return jsonify(standard_response('success', 'Order created', order_dict)), 201
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@orders_bp.route('', methods=['GET'])
@jwt_required()
def get_orders():
    try:
        user_id = int(get_jwt_identity())
        shop_id = request.args.get('shop_id')
        
        conn = get_db()
        cursor = conn.cursor()
        
        if shop_id:
            # Verify shop ownership
            cursor.execute('SELECT owner_id FROM shops WHERE id = ?', (shop_id,))
            shop = cursor.fetchone()
            if not shop or shop['owner_id'] != user_id:
                conn.close()
                return jsonify(standard_response('error', 'Unauthorized')), 403
            
            cursor.execute('SELECT * FROM orders WHERE shop_id = ? ORDER BY created_at DESC', (shop_id,))
        else:
            cursor.execute('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', (user_id,))
        
        orders = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify(standard_response('success', 'Orders retrieved', orders)), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@orders_bp.route('/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id):
    try:
        user_id = int(get_jwt_identity())
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM orders WHERE id = ?', (order_id,))
        order = cursor.fetchone()
        
        if not order:
            conn.close()
            return jsonify(standard_response('error', 'Order not found')), 404
        
        # Verify access (user or shop owner)
        if order['user_id'] != user_id:
            cursor.execute('SELECT owner_id FROM shops WHERE id = ?', (order['shop_id'],))
            shop = cursor.fetchone()
            if not shop or shop['owner_id'] != user_id:
                conn.close()
                return jsonify(standard_response('error', 'Unauthorized')), 403
        
        cursor.execute('''
            SELECT oi.*, p.name, p.image_url
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        ''', (order_id,))
        order_items = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        order_dict = dict(order)
        order_dict['items'] = order_items
        
        return jsonify(standard_response('success', 'Order retrieved', order_dict)), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@orders_bp.route('/<int:order_id>/status', methods=['PUT'])
@jwt_required()
def update_order_status(order_id):
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        status = data.get('status')
        
        if not status:
            return jsonify(standard_response('error', 'Status is required')), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('SELECT shop_id FROM orders WHERE id = ?', (order_id,))
        order = cursor.fetchone()
        if not order:
            conn.close()
            return jsonify(standard_response('error', 'Order not found')), 404
        
        # Verify shop ownership
        cursor.execute('SELECT owner_id FROM shops WHERE id = ?', (order['shop_id'],))
        shop = cursor.fetchone()
        if not shop or shop['owner_id'] != user_id:
            conn.close()
            return jsonify(standard_response('error', 'Unauthorized')), 403
        
        cursor.execute('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
                      (status, order_id))
        
        # Update payment status if order completed
        if status == 'completed':
            cursor.execute('UPDATE payments SET status = ? WHERE order_id = ?', ('completed', order_id))
        
        conn.commit()
        conn.close()
        
        return jsonify(standard_response('success', 'Order status updated')), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

