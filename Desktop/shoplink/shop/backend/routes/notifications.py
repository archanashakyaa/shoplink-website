from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import get_db
from utils import standard_response

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('', methods=['GET'])
@jwt_required()
def get_notifications():
    try:
        user_id = int(get_jwt_identity())
        is_read = request.args.get('is_read')
        
        conn = get_db()
        cursor = conn.cursor()
        
        query = 'SELECT * FROM notifications WHERE user_id = ?'
        params = [user_id]
        
        if is_read is not None:
            query += ' AND is_read = ?'
            params.append(int(is_read))
        
        query += ' ORDER BY created_at DESC LIMIT 50'
        
        cursor.execute(query, params)
        notifications = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify(standard_response('success', 'Notifications retrieved', notifications)), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@notifications_bp.route('/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_read(notification_id):
    try:
        user_id = int(get_jwt_identity())
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', 
                      (notification_id, user_id))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify(standard_response('error', 'Notification not found')), 404
        
        conn.commit()
        conn.close()
        
        return jsonify(standard_response('success', 'Notification marked as read')), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@notifications_bp.route('/read-all', methods=['PUT'])
@jwt_required()
def mark_all_read():
    try:
        user_id = int(get_jwt_identity())
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', (user_id,))
        conn.commit()
        conn.close()
        
        return jsonify(standard_response('success', 'All notifications marked as read')), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@notifications_bp.route('/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    try:
        user_id = int(get_jwt_identity())
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0', (user_id,))
        result = cursor.fetchone()
        conn.close()
        
        return jsonify(standard_response('success', 'Count retrieved', {'count': result['count']})), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

