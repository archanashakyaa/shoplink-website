from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import get_db
from utils import standard_response, generate_slug

events_bp = Blueprint('events', __name__)

@events_bp.route('', methods=['POST'])
@jwt_required()
def create_event():
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        title = data.get('title', '').strip()
        start_date = data.get('start_date')
        
        if not title or not start_date:
            return jsonify(standard_response('error', 'Title and start date are required')), 400
        
        slug = generate_slug(title)
        conn = get_db()
        cursor = conn.cursor()
        
        # Ensure unique slug
        base_slug = slug
        counter = 1
        while True:
            cursor.execute('SELECT id FROM events WHERE slug = ?', (slug,))
            if not cursor.fetchone():
                break
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        shop_id = data.get('shop_id')
        if shop_id:
            # Verify shop ownership
            cursor.execute('SELECT owner_id FROM shops WHERE id = ?', (shop_id,))
            shop = cursor.fetchone()
            if not shop or shop['owner_id'] != user_id:
                conn.close()
                return jsonify(standard_response('error', 'Unauthorized or shop not found')), 403
        
        ticket_price = data.get('ticket_price', 0)
        is_free = 1 if ticket_price == 0 or data.get('is_free', False) else 0
        
        cursor.execute('''
            INSERT INTO events (organizer_id, shop_id, title, slug, description, event_type, category,
                             start_date, end_date, location, venue_name, venue_address, venue_city,
                             venue_state, venue_country, latitude, longitude, meeting_url, max_attendees,
                             ticket_price, is_free, is_published, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_id, shop_id, title, slug, data.get('description'), data.get('event_type'),
            data.get('category'), start_date, data.get('end_date'), data.get('location'),
            data.get('venue_name'), data.get('venue_address'), data.get('venue_city'),
            data.get('venue_state'), data.get('venue_country'), data.get('latitude'),
            data.get('longitude'), data.get('meeting_url'), data.get('max_attendees'),
            ticket_price, is_free, data.get('is_published', 0), data.get('status', 'draft')
        ))
        
        event_id = cursor.lastrowid
        conn.commit()
        
        cursor.execute('SELECT * FROM events WHERE id = ?', (event_id,))
        event = cursor.fetchone()
        conn.close()
        
        return jsonify(standard_response('success', 'Event created successfully', dict(event))), 201
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@events_bp.route('/<int:event_id>', methods=['GET'])
def get_event(event_id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM events WHERE id = ?', (event_id,))
        event = cursor.fetchone()
        
        if event:
            # Increment views
            cursor.execute('UPDATE events SET views_count = views_count + 1 WHERE id = ?', (event_id,))
            conn.commit()
        
        conn.close()
        
        if not event:
            return jsonify(standard_response('error', 'Event not found')), 404
        
        return jsonify(standard_response('success', 'Event retrieved', dict(event))), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@events_bp.route('', methods=['GET'])
def list_events():
    try:
        status = request.args.get('status')
        is_published = request.args.get('is_published')
        limit = int(request.args.get('limit', 20))
        offset = int(request.args.get('offset', 0))
        
        conn = get_db()
        cursor = conn.cursor()
        
        query = 'SELECT * FROM events WHERE 1=1'
        params = []
        
        if status:
            query += ' AND status = ?'
            params.append(status)
        
        if is_published is not None:
            query += ' AND is_published = ?'
            params.append(int(is_published))
        
        query += ' ORDER BY start_date ASC LIMIT ? OFFSET ?'
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        events = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify(standard_response('success', 'Events retrieved', events)), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@events_bp.route('/<int:event_id>', methods=['PUT'])
@jwt_required()
def update_event(event_id):
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('SELECT organizer_id FROM events WHERE id = ?', (event_id,))
        event = cursor.fetchone()
        if not event:
            conn.close()
            return jsonify(standard_response('error', 'Event not found')), 404
        
        if event['organizer_id'] != user_id:
            conn.close()
            return jsonify(standard_response('error', 'Unauthorized')), 403
        
        # Build update query
        updates = []
        values = []
        
        allowed_fields = ['title', 'description', 'event_type', 'category', 'start_date', 'end_date',
                         'location', 'venue_name', 'venue_address', 'venue_city', 'venue_state',
                         'venue_country', 'latitude', 'longitude', 'meeting_url', 'max_attendees',
                         'ticket_price', 'is_free', 'is_published', 'status']
        
        for field in allowed_fields:
            if field in data:
                updates.append(f'{field} = ?')
                values.append(data[field])
        
        if 'title' in data:
            slug = generate_slug(data['title'])
            base_slug = slug
            counter = 1
            while True:
                cursor.execute('SELECT id FROM events WHERE slug = ? AND id != ?', (slug, event_id))
                if not cursor.fetchone():
                    break
                slug = f"{base_slug}-{counter}"
                counter += 1
            updates.append('slug = ?')
            values.append(slug)
        
        if not updates:
            conn.close()
            return jsonify(standard_response('error', 'No valid fields to update')), 400
        
        values.append(event_id)
        query = f"UPDATE events SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        cursor.execute(query, values)
        conn.commit()
        
        cursor.execute('SELECT * FROM events WHERE id = ?', (event_id,))
        updated_event = cursor.fetchone()
        conn.close()
        
        return jsonify(standard_response('success', 'Event updated', dict(updated_event))), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@events_bp.route('/<int:event_id>/register', methods=['POST'])
@jwt_required()
def register_event(event_id):
    try:
        user_id = int(get_jwt_identity())
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if event exists and has capacity
        cursor.execute('SELECT max_attendees, registrations_count FROM events WHERE id = ?', (event_id,))
        event = cursor.fetchone()
        if not event:
            conn.close()
            return jsonify(standard_response('error', 'Event not found')), 404
        
        if event['max_attendees'] and event['registrations_count'] >= event['max_attendees']:
            conn.close()
            return jsonify(standard_response('error', 'Event is full')), 400
        
        # Check if already registered
        cursor.execute('SELECT id FROM event_registrations WHERE event_id = ? AND user_id = ?', (event_id, user_id))
        if cursor.fetchone():
            conn.close()
            return jsonify(standard_response('error', 'Already registered')), 400
        
        # Register
        cursor.execute('INSERT INTO event_registrations (event_id, user_id) VALUES (?, ?)', (event_id, user_id))
        cursor.execute('UPDATE events SET registrations_count = registrations_count + 1 WHERE id = ?', (event_id,))
        conn.commit()
        conn.close()
        
        return jsonify(standard_response('success', 'Registered successfully')), 201
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@events_bp.route('/<int:event_id>/registrations', methods=['GET'])
@jwt_required()
def get_event_registrations(event_id):
    try:
        user_id = int(get_jwt_identity())
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Verify organizer
        cursor.execute('SELECT organizer_id FROM events WHERE id = ?', (event_id,))
        event = cursor.fetchone()
        if not event or event['organizer_id'] != user_id:
            conn.close()
            return jsonify(standard_response('error', 'Unauthorized')), 403
        
        cursor.execute('''
            SELECT er.*, u.full_name, u.email, u.phone
            FROM event_registrations er
            JOIN users u ON er.user_id = u.id
            WHERE er.event_id = ?
            ORDER BY er.created_at DESC
        ''', (event_id,))
        registrations = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify(standard_response('success', 'Registrations retrieved', registrations)), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

