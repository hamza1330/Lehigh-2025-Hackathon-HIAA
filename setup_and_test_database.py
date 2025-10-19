#!/usr/bin/env python3
"""
LockIN Database Connection Tester & Initializer
This script reads your .env file, tests the connection, and initializes the database
"""
import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from pathlib import Path
import sys

def load_env_file():
    """Load environment variables from .env file"""
    env_path = Path(__file__).parent / "backend" / ".env"
    
    if not env_path.exists():
        print("❌ .env file not found!")
        print(f"   Expected location: {env_path}")
        print("\n🔧 Let's create one...")
        create_env_file()
        return False
    
    print(f"📖 Loading .env file from: {env_path}")
    
    # Load environment variables
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key] = value
    
    return True

def create_env_file():
    """Create .env file interactively"""
    print("\n🔧 Creating .env file...")
    
    # Get database credentials
    print("\n📊 Database Configuration:")
    username = input("Enter RDS username (usually 'postgres' or 'admin'): ").strip()
    password = input("Enter RDS password: ").strip()
    database_name = input("Enter database name (default: 'lockin_db'): ").strip() or "lockin_db"
    
    # Build database URL
    database_url = f"postgresql://{username}:{password}@database-1.cluster-cw18kkw8mg9c.us-east-1.rds.amazonaws.com:5432/{database_name}"
    
    # Get AWS credentials
    print("\n☁️ AWS Configuration:")
    cognito_user_pool_id = input("Enter Cognito User Pool ID (or 'skip' to fill later): ").strip()
    cognito_client_id = input("Enter Cognito Client ID (or 'skip' to fill later): ").strip()
    aws_access_key = input("Enter AWS Access Key ID (or 'skip' to fill later): ").strip()
    aws_secret_key = input("Enter AWS Secret Access Key (or 'skip' to fill later): ").strip()
    
    # Create .env content
    env_content = f"""# Database Configuration
DATABASE_URL={database_url}

# AWS Cognito Configuration
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID={cognito_user_pool_id if cognito_user_pool_id != 'skip' else 'your-user-pool-id'}
COGNITO_CLIENT_ID={cognito_client_id if cognito_client_id != 'skip' else 'your-client-id'}

# AWS S3 Configuration
S3_BUCKET_NAME=lockin-avatars
AWS_ACCESS_KEY_ID={aws_access_key if aws_access_key != 'skip' else 'your-access-key'}
AWS_SECRET_ACCESS_KEY={aws_secret_key if aws_secret_key != 'skip' else 'your-secret-key'}
AWS_REGION=us-east-1

# JWT Configuration
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
"""
    
    # Write .env file
    env_path = Path(__file__).parent / "backend" / ".env"
    with open(env_path, 'w') as f:
        f.write(env_content)
    
    print(f"✅ Created .env file: {env_path}")
    return True

def test_database_connection():
    """Test database connection"""
    print("\n🔍 Testing Database Connection...")
    print("-" * 40)
    
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL not found in environment")
        return False
    
    print(f"🔗 Database URL: {database_url[:50]}...")
    
    try:
        # Parse database URL
        if database_url.startswith("postgresql://"):
            database_url = database_url[13:]  # Remove postgresql:// prefix
        
        # Split into components
        if "@" in database_url:
            auth_part, host_part = database_url.split("@", 1)
            if ":" in auth_part:
                username, password = auth_part.split(":", 1)
            else:
                username = auth_part
                password = ""
            
            if "/" in host_part:
                host_port, database = host_part.split("/", 1)
                if ":" in host_port:
                    host, port = host_port.split(":", 1)
                    port = int(port)
                else:
                    host = host_port
                    port = 5432
            else:
                host = host_part
                port = 5432
                database = "postgres"
        else:
            raise ValueError("Invalid database URL format")
        
        # Test connection
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=username,
            password=password,
            database=database
        )
        
        cursor = conn.cursor()
        
        # Test basic query
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]
        print(f"✅ Connected to PostgreSQL: {version[:50]}...")
        
        # Check if database exists
        cursor.execute("SELECT 1")
        print(f"✅ Database '{database}' is accessible")
        
        cursor.close()
        conn.close()
        
        return True, host, port, username, password, database
        
    except psycopg2.OperationalError as e:
        if "database" in str(e).lower() and "does not exist" in str(e).lower():
            print("❌ Database doesn't exist. Let's create it...")
            return create_database_and_retry(host, port, username, password, database)
        else:
            print(f"❌ Connection failed: {e}")
            return False, None, None, None, None, None
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False, None, None, None, None, None

def create_database_and_retry(host, port, username, password, database_name):
    """Create database and retry connection"""
    try:
        # Connect to default postgres database
        conn = psycopg2.connect(
            host=host,
            port=port,
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
        
        # Retry connection to new database
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=username,
            password=password,
            database=database_name
        )
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        conn.close()
        
        return True, host, port, username, password, database_name
        
    except Exception as e:
        print(f"❌ Failed to create database: {e}")
        return False, None, None, None, None, None

def initialize_database_schema(host, port, username, password, database_name):
    """Initialize database with schema.sql"""
    print("\n🔧 Initializing Database Schema...")
    print("-" * 40)
    
    try:
        # Connect to database
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=username,
            password=password,
            database=database_name
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Read schema.sql
        schema_path = Path(__file__).parent / "backend" / "schema.sql"
        if not schema_path.exists():
            print(f"❌ Schema file not found: {schema_path}")
            return False
        
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
        
        return True
        
    except Exception as e:
        print(f"❌ Schema initialization failed: {e}")
        return False

def test_api_connection():
    """Test if the API can connect to the database"""
    print("\n🧪 Testing API Database Connection...")
    print("-" * 40)
    
    try:
        # Add backend to path
        backend_path = Path(__file__).parent / "backend"
        sys.path.insert(0, str(backend_path))
        
        # Import and test
        from app.core.database import get_db
        from app.models import Base
        
        print("✅ API modules imported successfully")
        
        # Test database connection through API
        db = next(get_db())
        print("✅ API database connection successful")
        
        return True
        
    except Exception as e:
        print(f"❌ API connection test failed: {e}")
        return False

def main():
    """Main function"""
    print("🚀 LockIN Database Connection Tester & Initializer")
    print("=" * 60)
    
    # Step 1: Load .env file
    if not load_env_file():
        print("\n🔄 Retrying with new .env file...")
        load_env_file()
    
    # Step 2: Test database connection
    connection_result = test_database_connection()
    if not connection_result[0]:
        print("\n❌ Database connection failed. Please check your credentials.")
        return
    
    host, port, username, password, database_name = connection_result[1:]
    
    # Step 3: Initialize database schema
    if initialize_database_schema(host, port, username, password, database_name):
        print("\n🎉 Database setup complete!")
        
        # Step 4: Test API connection
        if test_api_connection():
            print("\n✅ API connection test passed!")
        else:
            print("\n⚠️ API connection test failed, but database is ready")
        
        print("\n📋 Next Steps:")
        print("1. Run: cd backend && python run.py")
        print("2. Test API endpoints at: http://localhost:8000")
        print("3. View API docs at: http://localhost:8000/docs")
        
    else:
        print("\n❌ Database schema initialization failed")

if __name__ == "__main__":
    main()
