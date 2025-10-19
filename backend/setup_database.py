#!/usr/bin/env python3
"""
Database Setup Script for LockIN
This script helps you set up the database connection and initialize tables
"""
import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from pathlib import Path

def setup_database():
    """Interactive database setup"""
    print("🗄️ LockIN Database Setup")
    print("=" * 50)
    
    # Get database credentials
    print("\n📋 Database Configuration:")
    print("Your RDS endpoint: database-1.cluster-cw18kkw8mg9c.us-east-1.rds.amazonaws.com")
    
    username = input("Enter database username: ")
    password = input("Enter database password: ")
    database_name = input("Enter database name (default: lockin_db): ") or "lockin_db"
    
    # Construct database URL
    database_url = f"postgresql://{username}:{password}@database-1.cluster-cw18kkw8mg9c.us-east-1.rds.amazonaws.com:5432/{database_name}"
    
    print(f"\n🔗 Database URL: {database_url[:50]}...")
    
    # Test connection
    print("\n🔍 Testing database connection...")
    try:
        conn = psycopg2.connect(
            host="database-1.cluster-cw18kkw8mg9c.us-east-1.rds.amazonaws.com",
            port=5432,
            user=username,
            password=password,
            database=database_name
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        print("✅ Database connection successful!")
        
        # Check if database exists and create if needed
        cursor.execute("SELECT 1")
        cursor.close()
        conn.close()
        
    except psycopg2.OperationalError as e:
        if "database" in str(e).lower() and "does not exist" in str(e).lower():
            print("❌ Database doesn't exist. Creating it...")
            try:
                # Connect to default postgres database to create our database
                conn = psycopg2.connect(
                    host="database-1.cluster-cw18kkw8mg9c.us-east-1.rds.amazonaws.com",
                    port=5432,
                    user=username,
                    password=password,
                    database="postgres"
                )
                conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
                cursor = conn.cursor()
                
                cursor.execute(f"CREATE DATABASE {database_name}")
                print(f"✅ Database '{database_name}' created successfully!")
                
                cursor.close()
                conn.close()
                
            except Exception as create_error:
                print(f"❌ Failed to create database: {create_error}")
                return False
        else:
            print(f"❌ Database connection failed: {e}")
            return False
    
    # Initialize schema
    print("\n📋 Initializing database schema...")
    try:
        conn = psycopg2.connect(
            host="database-1.cluster-cw18kkw8mg9c.us-east-1.rds.amazonaws.com",
            port=5432,
            user=username,
            password=password,
            database=database_name
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Read and execute schema.sql
        schema_path = Path(__file__).parent / "schema.sql"
        if not schema_path.exists():
            print(f"❌ Schema file not found: {schema_path}")
            return False
        
        print(f"📖 Reading schema from: {schema_path}")
        with open(schema_path, 'r') as f:
            schema_sql = f.read()
        
        print("🔧 Executing schema...")
        cursor.execute(schema_sql)
        
        print("✅ Database schema initialized successfully!")
        
        # Test the schema by checking if tables exist
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        
        tables = cursor.fetchall()
        print(f"📊 Created tables: {[table[0] for table in tables]}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Schema initialization failed: {e}")
        return False
    
    # Create .env file
    print("\n📝 Creating environment configuration...")
    env_content = f"""# Database Configuration
DATABASE_URL={database_url}

# AWS Cognito Configuration
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=your-user-pool-id
COGNITO_CLIENT_ID=your-client-id

# AWS S3 Configuration
S3_BUCKET_NAME=lockin-avatars
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1

# JWT Configuration
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
"""
    
    env_path = Path(__file__).parent / ".env"
    with open(env_path, 'w') as f:
        f.write(env_content)
    
    print(f"✅ Environment file created: {env_path}")
    
    print("\n🎉 Database setup complete!")
    print("\n📋 Next steps:")
    print("1. Update the .env file with your AWS Cognito and S3 credentials")
    print("2. Run: python run.py (for development)")
    print("3. Or deploy to EC2 using: ./deploy.sh")
    
    return True

if __name__ == "__main__":
    setup_database()
