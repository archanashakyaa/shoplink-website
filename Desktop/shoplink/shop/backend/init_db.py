#!/usr/bin/env python3
"""
Database initialization script.
Run this to initialize the database without starting the Flask server.
"""
from database import init_db

if __name__ == '__main__':
    print("Initializing database...")
    init_db()
    print("Database initialized successfully!")

