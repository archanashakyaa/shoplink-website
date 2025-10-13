# ShopLink Flask Backend

Complete Flask + MySQL backend for the ShopLink project.

## Prerequisites

- Python 3.8 or higher
- MySQL 8.0 or higher
- pip (Python package manager)

## Setup Instructions

### 1. Install MySQL

Make sure MySQL is installed and running on your system.

### 2. Create Database

Run the SQL script to create the database and tables:

```bash
mysql -u root -p < database.sql
```

Or open MySQL Workbench and execute the `database.sql` file.

### 3. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Copy `.env.example` to `.env` and update with your MySQL credentials:

```bash
cp .env.example .env
```

Edit `.env` file:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=shoplink_db
JWT_SECRET_KEY=your-secret-key-change-this
```

### 5. Run the Flask Server

```bash
python app.py
```

The server will start at `http://localhost:5000`

## API Endpoints

### Authentication

- **POST** `/api/auth/signup` - Register new user
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "full_name": "John Doe"
  }
  ```

- **POST** `/api/auth/login` - Login user
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

- **GET** `/api/auth/user` - Get current user (requires JWT token)

### Shops

- **GET** `/api/shops` - Get all shops
- **GET** `/api/shops/:id` - Get shop by ID
- **POST** `/api/shops` - Create new shop (requires authentication)
- **PUT** `/api/shops/:id` - Update shop (requires authentication & ownership)
- **DELETE** `/api/shops/:id` - Delete shop (requires authentication & ownership)

### Health Check

- **GET** `/api/health` - Check if API is running

## Testing with Sample Data

The database.sql file includes sample data:
- **Test User**: email: `test@example.com`, password: `password123`
- **3 Sample Shops** already created

## Connecting Frontend to Backend

Update your React frontend API calls to point to `http://localhost:5000`

For example, in your frontend code:
```typescript
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ email, password })
});
```

## Project Structure

```
backend/
├── app.py              # Main Flask application
├── database.sql        # MySQL database schema
├── requirements.txt    # Python dependencies
├── .env.example        # Environment variables template
└── README.md          # This file
```

## For College Submission

This backend demonstrates:
- ✅ Flask (Python) web framework
- ✅ MySQL database integration
- ✅ RESTful API design
- ✅ JWT authentication
- ✅ Password hashing with bcrypt
- ✅ CRUD operations
- ✅ Proper error handling
- ✅ Database relationships (Foreign Keys)

## Notes

- Make sure MySQL service is running before starting the Flask server
- The default password for test user is `password123`
- Change the JWT_SECRET_KEY in production
- CORS is enabled for all origins (adjust in production)
