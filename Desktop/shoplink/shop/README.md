# ShopLink - Multi-Shop Commerce Platform

A comprehensive web application where authenticated users can create and manage multiple shops, add and edit products, create and manage events, and enable online/offline selling with payments and map locations.

## Features

- **User Authentication**: Sign up, login, and JWT-based authentication
- **Shop Management**: Create and manage multiple shops with logos, cover photos, and location data
- **Product Management**: Add products with images, pricing, stock management, and categories
- **Event Management**: Create and manage events with registration system
- **Shopping Cart**: Add products to cart and manage quantities
- **Orders**: Create orders and track order status
- **Reviews & Ratings**: Review shops and products
- **Followers**: Follow/unfollow shops
- **Notifications**: User notification system

## Technology Stack

### Backend
- Flask (Python)
- SQLite (with migration path to PostgreSQL)
- JWT Authentication
- Flask-CORS
- Flask-JWT-Extended

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router

## Project Structure

```
shop/
├── backend/
│   ├── app.py                 # Flask application entry point
│   ├── database.py            # Database initialization and connection
│   ├── utils.py               # Utility functions
│   ├── routes/                # API route handlers
│   │   ├── auth.py           # Authentication routes
│   │   ├── users.py          # User profile routes
│   │   ├── shops.py           # Shop management routes
│   │   ├── products.py        # Product management routes
│   │   ├── events.py          # Event management routes
│   │   ├── cart.py            # Shopping cart routes
│   │   ├── orders.py          # Order management routes
│   │   ├── reviews.py         # Review routes
│   │   ├── followers.py       # Follower routes
│   │   └── notifications.py   # Notification routes
│   ├── uploads/               # File uploads directory
│   ├── requirements.txt       # Python dependencies
│   └── shoplink.db            # SQLite database (created on first run)
│
└── frontend/
    ├── src/
    │   ├── api/               # API client
    │   ├── components/        # React components
    │   ├── contexts/          # React contexts (Auth)
    │   ├── pages/             # Page components
    │   ├── App.tsx            # Main app component
    │   └── main.tsx           # Entry point
    ├── package.json           # Node dependencies
    └── vite.config.ts         # Vite configuration
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file (optional, for custom JWT secret):
```bash
JWT_SECRET_KEY=your-secret-key-change-in-production
FLASK_ENV=development
```

5. Initialize the database:
```bash
python app.py
```
This will create the SQLite database and all necessary tables.

6. Run the Flask server:
```bash
python app.py
```
The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional):
```bash
VITE_API_URL=http://localhost:5000/api
```

4. Run the development server:
```bash
npm run dev
```
The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (requires auth)

### Shops
- `GET /api/shops` - List all shops
- `GET /api/shops/:id` - Get shop details
- `POST /api/shops` - Create shop (requires auth)
- `PUT /api/shops/:id` - Update shop (requires auth, owner only)
- `GET /api/shops/:id/products` - Get shop products
- `POST /api/shops/:id/upload-logo` - Upload shop logo
- `POST /api/shops/:id/upload-cover` - Upload shop cover photo

### Products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (requires auth)
- `PUT /api/products/:id` - Update product (requires auth, owner only)
- `DELETE /api/products/:id` - Delete product (requires auth, owner only)
- `POST /api/products/:id/upload-image` - Upload product image

### Events
- `GET /api/events` - List events
- `GET /api/events/:id` - Get event details
- `POST /api/events` - Create event (requires auth)
- `PUT /api/events/:id` - Update event (requires auth, organizer only)
- `POST /api/events/:id/register` - Register for event (requires auth)

### Cart
- `GET /api/cart` - Get cart items (requires auth)
- `POST /api/cart` - Add to cart (requires auth)
- `PUT /api/cart/:product_id` - Update cart item (requires auth)
- `DELETE /api/cart/:product_id` - Remove from cart (requires auth)
- `DELETE /api/cart/clear` - Clear cart (requires auth)

### Orders
- `GET /api/orders` - Get orders (requires auth)
- `GET /api/orders/:id` - Get order details (requires auth)
- `POST /api/orders` - Create order (requires auth)
- `PUT /api/orders/:id/status` - Update order status (requires auth, shop owner)

### Reviews
- `GET /api/reviews/shop/:id` - Get shop reviews
- `POST /api/reviews/shop/:id` - Create shop review (requires auth)
- `GET /api/reviews/product/:id` - Get product reviews
- `POST /api/reviews/product/:id` - Create product review (requires auth)

### Followers
- `POST /api/followers/shop/:id` - Follow shop (requires auth)
- `DELETE /api/followers/shop/:id` - Unfollow shop (requires auth)
- `GET /api/followers/shop/:id/check` - Check follow status (requires auth)
- `GET /api/followers/shop/:id/followers` - Get shop followers

### Notifications
- `GET /api/notifications` - Get notifications (requires auth)
- `PUT /api/notifications/:id/read` - Mark notification as read (requires auth)
- `PUT /api/notifications/read-all` - Mark all as read (requires auth)
- `GET /api/notifications/unread-count` - Get unread count (requires auth)

## Database Schema

The application uses SQLite with the following main tables:
- `users` - User accounts
- `shops` - Shop information
- `products` - Product catalog
- `product_photos` - Product images
- `events` - Event listings
- `event_registrations` - Event registrations
- `shop_followers` - Shop follow relationships
- `shop_reviews` - Shop reviews
- `product_reviews` - Product reviews
- `cart_items` - Shopping cart
- `wishlist` - User wishlists
- `orders` - Order records
- `order_items` - Order line items
- `payments` - Payment records
- `notifications` - User notifications

## Development Notes

- The backend uses SQLite for simplicity. For production, consider migrating to PostgreSQL.
- JWT tokens are stored in localStorage. For better security, consider using HttpOnly cookies.
- File uploads are stored in the `backend/uploads` directory.
- CORS is currently configured to allow all origins. Restrict this in production.

## Future Improvements

- Payment gateway integration (Stripe, Razorpay, etc.)
- Map integration for shop locations
- Multi-image product galleries
- Search functionality
- Advanced filtering and pagination
- Email notifications
- Admin dashboard
- Analytics and reporting
- Mobile app support

## License

This project is open source and available for use.

