#!/usr/bin/env python3
"""
Quick database connection test for LockIN
"""
import psycopg2
import os
from pathlib import Path

def test_connection():
    """Test database connection"""
    print("🔍 Testing LockIN Database Connection")
    print("=" * 50)
    
    # Try to load from .env file
    env_path = Path(__file__).parent / ".env"
    if env_path.exists():
        print("📖 Loading configuration from .env file...")
        with open(env_path, 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value
    
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL not found in environment")
        print("Please run: python setup_database.py")
        return False
    
    print(f"🔗 Database URL: {database_url[:50]}...")
    
    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        # Test basic query
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]
        print(f"✅ Connected to PostgreSQL: {version[:50]}...")
        
        # Check if our tables exist
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        
        tables = cursor.fetchall()
        if tables:
            print(f"📊 Found {len(tables)} tables:")
            for table in tables:
                print(f"   - {table[0]}")
        else:
            print("⚠️  No tables found. Run: python setup_database.py")
        
        cursor.close()
        conn.close()
        
        print("\n🎉 Database connection test successful!")
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

if __name__ == "__main__":
    test_connection()
