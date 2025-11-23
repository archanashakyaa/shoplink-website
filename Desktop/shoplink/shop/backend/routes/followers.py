from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import get_db
from utils import standard_response

followers_bp = Blueprint('followers', __name__)

@followers_bp.route('/shop/<int:shop_id>', methods=['POST'])
@jwt_required()
def follow_shop(shop_id):
    try:
        user_id = int(get_jwt_identity())
        conn = get_db()
        cursor = conn.cursor()
        
        # Verify shop exists
        cursor.execute('SELECT id FROM shops WHERE id = ?', (shop_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify(standard_response('error', 'Shop not found')), 404
        
        # Check if already following
        cursor.execute('SELECT id FROM shop_followers WHERE shop_id = ? AND user_id = ?', (shop_id, user_id))
        if cursor.fetchone():
            conn.close()
            return jsonify(standard_response('error', 'Already following')), 400
        
        cursor.execute('INSERT INTO shop_followers (shop_id, user_id) VALUES (?, ?)', (shop_id, user_id))
        cursor.execute('UPDATE shops SET followers_count = followers_count + 1 WHERE id = ?', (shop_id,))
        
        conn.commit()
        conn.close()
        
        return jsonify(standard_response('success', 'Shop followed')), 201
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@followers_bp.route('/shop/<int:shop_id>', methods=['DELETE'])
@jwt_required()
def unfollow_shop(shop_id):
    try:
        user_id = int(get_jwt_identity())
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM shop_followers WHERE shop_id = ? AND user_id = ?', (shop_id, user_id))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify(standard_response('error', 'Not following')), 404
        
        cursor.execute('UPDATE shops SET followers_count = followers_count - 1 WHERE id = ?', (shop_id,))
        conn.commit()
        conn.close()
        
        return jsonify(standard_response('success', 'Shop unfollowed')), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@followers_bp.route('/shop/<int:shop_id>/check', methods=['GET'])
@jwt_required()
def check_follow_status(shop_id):
    try:
        user_id = int(get_jwt_identity())
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('SELECT id FROM shop_followers WHERE shop_id = ? AND user_id = ?', (shop_id, user_id))
        is_following = cursor.fetchone() is not None
        conn.close()
        
        return jsonify(standard_response('success', 'Status retrieved', {'is_following': is_following})), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@followers_bp.route('/shop/<int:shop_id>/followers', methods=['GET'])
def get_shop_followers(shop_id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT u.id, u.full_name, u.profile_photo, sf.created_at
            FROM shop_followers sf
            JOIN users u ON sf.user_id = u.id
            WHERE sf.shop_id = ?
            ORDER BY sf.created_at DESC
        ''', (shop_id,))
        followers = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify(standard_response('success', 'Followers retrieved', followers)), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

