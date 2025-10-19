#!/usr/bin/env python3
"""
Direct RDS Database Initialization for LockIN
"""
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from pathlib import Path

# Your RDS configuration
RDS_ENDPOINT = "database-1.cluster-cw18kkw8mg9c.us-east-1.rds.amazonaws.com"
RDS_PORT = 5432
RDS_DATABASE = "postgres"

def init_rds_database(username, password):
    """Initialize the RDS database with schema"""
    print(f"🗄️ Initializing LockIN Database on RDS")
    print(f"📍 Endpoint: {RDS_ENDPOINT}")
    print(f"📊 Database: {RDS_DATABASE}")
    print("=" * 60)
    
    try:
        # Connect to RDS
        print("🔗 Connecting to RDS...")
        conn = psycopg2.connect(
            host=RDS_ENDPOINT,
            port=RDS_PORT,
            user=username,
            password=password,
            database=RDS_DATABASE
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        print("✅ Connected to RDS successfully!")
        
        # Read and execute schema.sql
        schema_path = Path(__file__).parent / "schema.sql"
        if not schema_path.exists():
            raise FileNotFoundError(f"Schema file not found: {schema_path}")
        
        print(f"📖 Reading schema from: {schema_path}")
        with open(schema_path, 'r') as f:
            schema_sql = f.read()
        
        print("🔧 Executing schema...")
        cursor.execute(schema_sql)
        
        print("✅ Database schema initialized successfully!")
        
        # Verify tables were created
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        
        tables = cursor.fetchall()
        print(f"\n📊 Created {len(tables)} tables:")
        for table in tables:
            print(f"   ✅ {table[0]}")
        
        # Check for views
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.views 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        
        views = cursor.fetchall()
        if views:
            print(f"\n👁️ Created {len(views)} views:")
            for view in views:
                print(f"   ✅ {view[0]}")
        
        cursor.close()
        conn.close()
        
        print("\n🎉 Database initialization complete!")
        print("\n📋 Next steps:")
        print("1. Create .env file with your database URL")
        print("2. Configure AWS Cognito and S3 credentials")
        print("3. Run: python run.py (for development)")
        
        return True
        
    except psycopg2.OperationalError as e:
        if "database" in str(e).lower() and "does not exist" in str(e).lower():
            print("❌ Database 'lockin_db' doesn't exist.")
            print("💡 Please create the database first in your RDS console or run:")
            print(f"   CREATE DATABASE {RDS_DATABASE};")
            return False
        else:
            print(f"❌ Connection failed: {e}")
            print("💡 Check your username, password, and security groups")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🔐 Enter your RDS credentials:")
    username = input("Username: ")
    password = input("Password: ")
    
    init_rds_database(username, password)
