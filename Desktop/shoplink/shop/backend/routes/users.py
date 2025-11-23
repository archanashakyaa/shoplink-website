from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import get_db
from utils import standard_response

users_bp = Blueprint('users', __name__)

@users_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        user_id = int(get_jwt_identity())
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, email, full_name, phone, profile_photo, bio, address, city, state, country, 
                   is_verified, is_active, created_at, updated_at
            FROM users WHERE id = ?
        ''', (user_id,))
        user = cursor.fetchone()
        conn.close()
        
        if not user:
            return jsonify(standard_response('error', 'User not found')), 404
        
        return jsonify(standard_response('success', 'Profile retrieved', dict(user))), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@users_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Build update query dynamically
        updates = []
        values = []
        
        allowed_fields = ['full_name', 'phone', 'bio', 'address', 'city', 'state', 'country']
        for field in allowed_fields:
            if field in data:
                updates.append(f'{field} = ?')
                values.append(data[field])
        
        if not updates:
            conn.close()
            return jsonify(standard_response('error', 'No valid fields to update')), 400
        
        values.append(user_id)
        query = f"UPDATE users SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        cursor.execute(query, values)
        conn.commit()
        
        # Get updated user
        cursor.execute('''
            SELECT id, email, full_name, phone, profile_photo, bio, address, city, state, country, 
                   is_verified, is_active, created_at, updated_at
            FROM users WHERE id = ?
        ''', (user_id,))
        user = cursor.fetchone()
        conn.close()
        
        return jsonify(standard_response('success', 'Profile updated', dict(user))), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@users_bp.route('/shops', methods=['GET'])
@jwt_required()
def get_user_shops():
    try:
        user_id = int(get_jwt_identity())
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, owner_id, name, slug, category, description, logo_url, cover_photo_url,
                   location, address, city, state, country, latitude, longitude, phone, email, website,
                   business_hours, rating, reviews_count, followers_count, product_count, total_sales,
                   is_verified, is_online_selling, is_offline_selling, accepts_online_payment, accepts_cash,
                   is_active, created_at, updated_at
            FROM shops WHERE owner_id = ? ORDER BY created_at DESC
        ''', (user_id,))
        shops = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify(standard_response('success', 'Shops retrieved', shops)), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@users_bp.route('/events', methods=['GET'])
@jwt_required()
def get_user_events():
    try:
        user_id = int(get_jwt_identity())
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, organizer_id, shop_id, title, slug, description, event_type, category,
                   start_date, end_date, location, venue_name, venue_address, venue_city, venue_state,
                   venue_country, latitude, longitude, meeting_url, max_attendees, ticket_price,
                   is_free, is_published, status, views_count, registrations_count, created_at, updated_at
            FROM events WHERE organizer_id = ? ORDER BY created_at DESC
        ''', (user_id,))
        events = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify(standard_response('success', 'Events retrieved', events)), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

