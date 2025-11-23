import hashlib
import secrets
from werkzeug.security import generate_password_hash, check_password_hash
import re

def hash_password(password):
    """Hash a password for storing"""
    return generate_password_hash(password)

def verify_password(password_hash, password):
    """Verify a stored password against provided password"""
    return check_password_hash(password_hash, password)

def generate_slug(text):
    """Generate a URL-friendly slug from text"""
    if not text:
        return ""
    # Convert to lowercase and replace spaces with hyphens
    slug = text.lower().strip()
    # Remove special characters except hyphens
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    # Replace multiple spaces/hyphens with single hyphen
    slug = re.sub(r'[\s-]+', '-', slug)
    # Remove leading/trailing hyphens
    slug = slug.strip('-')
    return slug

def standard_response(status, message, data=None, timestamp=None):
    """Create a standardized API response"""
    from datetime import datetime
    return {
        'status': status,
        'message': message,
        'data': data,
        'timestamp': timestamp or datetime.utcnow().isoformat()
    }

