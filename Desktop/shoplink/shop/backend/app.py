from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False  # For development, set to timedelta in production
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directories exist
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'shops'), exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'products'), exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'users'), exist_ok=True)

CORS(app, resources={r"/api/*": {"origins": "*"}})  # Configure for production
jwt = JWTManager(app)

# Import routes
from routes.auth import auth_bp
from routes.users import users_bp
from routes.shops import shops_bp
from routes.products import products_bp
from routes.events import events_bp
from routes.cart import cart_bp
from routes.orders import orders_bp
from routes.reviews import reviews_bp
from routes.followers import followers_bp
from routes.notifications import notifications_bp
from routes.analytics import analytics_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(users_bp, url_prefix='/api/users')
app.register_blueprint(shops_bp, url_prefix='/api/shops')
app.register_blueprint(products_bp, url_prefix='/api/products')
app.register_blueprint(events_bp, url_prefix='/api/events')
app.register_blueprint(cart_bp, url_prefix='/api/cart')
app.register_blueprint(orders_bp, url_prefix='/api/orders')
app.register_blueprint(reviews_bp, url_prefix='/api/reviews')
app.register_blueprint(followers_bp, url_prefix='/api/followers')
app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
app.register_blueprint(analytics_bp, url_prefix='/api/analytics')

@app.route('/api/health')
def health():
    return {'status': 'ok', 'message': 'ShopLink API is running'}

# Serve uploaded files
@app.route('/api/uploads/shops/<filename>')
def uploaded_shop_file(filename):
    return send_from_directory(os.path.join(app.config['UPLOAD_FOLDER'], 'shops'), filename)

@app.route('/api/uploads/products/<filename>')
def uploaded_product_file(filename):
    return send_from_directory(os.path.join(app.config['UPLOAD_FOLDER'], 'products'), filename)

if __name__ == '__main__':
    from database import init_db
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)

