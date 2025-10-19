#!/usr/bin/env python3
"""
Database URL Builder for LockIN
This script helps you construct the correct database URL
"""
import psycopg2
from urllib.parse import quote_plus

def build_database_url():
    """Interactive database URL builder"""
    
    print("🔗 LockIN Database URL Builder")
    print("=" * 50)
    
    print("\n📍 Your RDS Endpoint:")
    print("   database-1.cluster-cw18kkw8mg9c.us-east-1.rds.amazonaws.com")
    print("   Port: 5432")
    
    print("\n📋 Database URL Format:")
    print("   postgresql://username:password@host:port/database_name")
    
    print("\n🔧 Let's build your database URL:")
    print("-" * 40)
    
    # Get user input
    username = input("Enter your RDS username (usually 'postgres' or 'admin'): ").strip()
    password = input("Enter your RDS password: ").strip()
    database_name = input("Enter database name (default: 'lockin_db'): ").strip() or "lockin_db"
    
    # Build the URL
    host = "database-1.cluster-cw18kkw8mg9c.us-east-1.rds.amazonaws.com"
    port = 5432
    
    # URL encode the password in case it has special characters
    encoded_password = quote_plus(password)
    
    database_url = f"postgresql://{username}:{encoded_password}@{host}:{port}/{database_name}"
    
    print(f"\n✅ Your Database URL:")
    print(f"   {database_url}")
    
    # Test the connection
    print(f"\n🔍 Testing connection...")
    try:
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=username,
            password=password,
            database=database_name
        )
        print("✅ Connection successful!")
        conn.close()
        
        # Create .env file
        create_env_file(database_url)
        
    except psycopg2.OperationalError as e:
        if "database" in str(e).lower() and "does not exist" in str(e).lower():
            print("❌ Database doesn't exist. Let's create it...")
            create_database(username, password, database_name)
        else:
            print(f"❌ Connection failed: {e}")
            print("\n💡 Common issues:")
            print("   • Wrong username/password")
            print("   • Security group not allowing connections")
            print("   • Database not accessible from your IP")
            
            # Still create .env file for them to fix later
            create_env_file(database_url)
    
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        create_env_file(database_url)

def create_database(username, password, database_name):
    """Create the database if it doesn't exist"""
    try:
        # Connect to default postgres database
        conn = psycopg2.connect(
            host="database-1.cluster-cw18kkw8mg9c.us-east-1.rds.amazonaws.com",
            port=5432,
            user=username,
            password=password,
            database="postgres"
        )
        conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        cursor.execute(f"CREATE DATABASE {database_name}")
        print(f"✅ Database '{database_name}' created successfully!")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Failed to create database: {e}")

def create_env_file(database_url):
    """Create .env file with the database URL"""
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
    
    env_path = "backend/.env"
    with open(env_path, 'w') as f:
        f.write(env_content)
    
    print(f"\n📄 Created .env file: {env_path}")
    print("   You can now run: python init_rds.py")

def show_examples():
    """Show example database URLs"""
    print("\n📝 Example Database URLs:")
    print("-" * 30)
    print("postgresql://postgres:mypassword@database-1.cluster-cw18kkw8mg9c.us-east-1.rds.amazonaws.com:5432/lockin_db")
    print("postgresql://admin:admin123@database-1.cluster-cw18kkw8mg9c.us-east-1.rds.amazonaws.com:5432/lockin_db")
    print("postgresql://root:password123@database-1.cluster-cw18kkw8mg9c.us-east-1.rds.amazonaws.com:5432/lockin_db")

def main():
    """Main function"""
    print("🔧 What would you like to do?")
    print("1. Build database URL interactively")
    print("2. Show example URLs")
    print("3. Both")
    print("0. Exit")
    
    choice = input("\nEnter your choice (0-3): ").strip()
    
    if choice == "1" or choice == "3":
        build_database_url()
    
    if choice == "2" or choice == "3":
        show_examples()
    
    if choice == "0":
        print("👋 Goodbye!")
        return
    
    print("\n🎯 Next Steps:")
    print("1. Run: python init_rds.py (to initialize database)")
    print("2. Run: python test_db_connection.py (to test connection)")
    print("3. Run: python run.py (to start the API)")

if __name__ == "__main__":
    main()
