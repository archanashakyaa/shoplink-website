#!/usr/bin/env python3
"""
Database initialization script for ShopLink
Executes the enhanced database schema with events support
"""

import sqlite3
import os

def init_database():
    """Initialize database with enhanced schema"""
    db_path = 'shoplink.db'

    # Check if database file exists
    if os.path.exists(db_path):
        print(f"Database file {db_path} already exists. Recreating...")
        os.remove(db_path)
        print(f"Removed existing database file: {db_path}")

    print("Creating new database with enhanced schema...")

    try:
        connection = sqlite3.connect(db_path)
        cursor = connection.cursor()

        # Enable foreign keys
        cursor.execute('PRAGMA foreign_keys = ON')

        # Read and execute SQL file
        with open('database.sql', 'r') as sql_file:
            sql_script = sql_file.read()

        # Split by semicolon and execute each statement
        statements = sql_script.split(';')
        for i, statement in enumerate(statements):
            statement = statement.strip()
            if statement and not statement.startswith('--'):
                try:
                    cursor.execute(statement)
                    print(f"Executed statement {i+1}")
                except sqlite3.Error as e:
                    if "no such table" in str(e).lower() and "CREATE INDEX" in statement.upper():
                        print(f"Skipping index creation (table doesn't exist yet): {i+1}")
                    else:
                        print(f"Error executing statement {i+1}: {e}")
                        print(f"Statement: {statement[:100]}...")

        connection.commit()
        print("✅ Database schema created successfully!")

        # Verify tables were created
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print(f"\n📋 Created tables: {[table[0] for table in tables]}")

        cursor.close()
        connection.close()

    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        return False

    return True

if __name__ == "__main__":
    success = init_database()
    if success:
        print("\n🎉 Database initialization completed!")
        print("You can now run the Flask application with: python3 app.py")
    else:
        print("\n💥 Database initialization failed!")