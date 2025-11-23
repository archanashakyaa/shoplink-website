from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from database import get_db
from utils import hash_password, verify_password, standard_response
import re

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        full_name = data.get('full_name', '').strip()
        phone = data.get('phone', '').strip()
        
        # Validation
        if not email or not password:
            return jsonify(standard_response('error', 'Email and password are required')), 400
        
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
            return jsonify(standard_response('error', 'Invalid email format')), 400
        
        if len(password) < 6:
            return jsonify(standard_response('error', 'Password must be at least 6 characters')), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute('SELECT id FROM users WHERE email = ?', (email,))
        if cursor.fetchone():
            conn.close()
            return jsonify(standard_response('error', 'Email already registered')), 400
        
        # Create user
        password_hash = hash_password(password)
        cursor.execute('''
            INSERT INTO users (email, password, full_name, phone)
            VALUES (?, ?, ?, ?)
        ''', (email, password_hash, full_name, phone))
        
        user_id = cursor.lastrowid
        conn.commit()
        
        # Get created user
        cursor.execute('SELECT id, email, full_name, phone, profile_photo, bio, is_verified, is_active FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        conn.close()
        
        # Create token
        access_token = create_access_token(identity=str(user_id))
        
        return jsonify(standard_response('success', 'User created successfully', {
            'user': dict(user),
            'access_token': access_token
        })), 201
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify(standard_response('error', 'Email and password are required')), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('SELECT id, email, password, full_name, phone, profile_photo, bio, is_verified, is_active FROM users WHERE email = ?', (email,))
        user = cursor.fetchone()
        conn.close()
        
        if not user or not verify_password(user['password'], password):
            return jsonify(standard_response('error', 'Invalid email or password')), 401
        
        if not user['is_active']:
            return jsonify(standard_response('error', 'Account is deactivated')), 403
        
        # Create token
        access_token = create_access_token(identity=str(user['id']))
        
        user_dict = dict(user)
        del user_dict['password']
        
        return jsonify(standard_response('success', 'Login successful', {
            'user': user_dict,
            'access_token': access_token
        })), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        user_id = int(get_jwt_identity())
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('SELECT id, email, full_name, phone, profile_photo, bio, address, city, state, country, is_verified, is_active, created_at FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        conn.close()
        
        if not user:
            return jsonify(standard_response('error', 'User not found')), 404
        
        return jsonify(standard_response('success', 'User retrieved', dict(user))), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

