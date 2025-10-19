#!/usr/bin/env python3
"""
Database Name Helper for LockIN
This script helps you check existing databases and create the lockin_db database
"""
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def check_existing_databases():
    """Check what databases exist on your RDS instance"""
    
    print("🗄️ Database Name Helper for LockIN")
    print("=" * 50)
    
    print("\n📍 Your RDS Endpoint:")
    print("   database-1.cluster-cw18kkw8mg9c.us-east-1.rds.amazonaws.com")
    
    print("\n🔍 Let's check what databases exist...")
    print("-" * 40)
    
    # Get credentials
    username = input("Enter your RDS username (usually 'postgres' or 'admin'): ").strip()
    password = input("Enter your RDS password: ").strip()
    
    try:
        # Connect to default postgres database
        conn = psycopg2.connect(
            host="database-1.cluster-cw18kkw8mg9c.us-east-1.rds.amazonaws.com",
            port=5432,
            user=username,
            password=password,
            database="postgres"  # Connect to default database
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        print("✅ Connected to RDS successfully!")
        
        # List all databases
        cursor.execute("""
            SELECT datname 
            FROM pg_database 
            WHERE datistemplate = false
            ORDER BY datname;
        """)
        
        databases = cursor.fetchall()
        
        print(f"\n📊 Found {len(databases)} databases:")
        for db in databases:
            db_name = db[0]
            if db_name == "lockin_db":
                print(f"   ✅ {db_name} (PERFECT! This is what we need)")
            elif db_name == "postgres":
                print(f"   📋 {db_name} (default database)")
            else:
                print(f"   📁 {db_name}")
        
        # Check if lockin_db exists
        lockin_db_exists = any(db[0] == "lockin_db" for db in databases)
        
        if lockin_db_exists:
            print("\n🎉 Great! 'lockin_db' already exists!")
            print("   You can use this database name in your URL:")
            print(f"   postgresql://{username}:password@database-1.cluster-cw18kkw8mg9c.us-east-1.rds.amazonaws.com:5432/lockin_db")
        else:
            print("\n⚠️ 'lockin_db' doesn't exist yet.")
            create_choice = input("Would you like to create it? (y/n): ").strip().lower()
            
            if create_choice == 'y':
                create_lockin_database(cursor, username, password)
            else:
                print("\n💡 You can also use the default 'postgres' database:")
                print(f"   postgresql://{username}:password@database-1.cluster-cw18kkw8mg9c.us-east-1.rds.amazonaws.com:5432/postgres")
        
        cursor.close()
        conn.close()
        
    except psycopg2.OperationalError as e:
        print(f"❌ Connection failed: {e}")
        print("\n💡 Common issues:")
        print("   • Wrong username/password")
        print("   • Security group not allowing connections")
        print("   • RDS instance not accessible")
        
        print("\n🔧 Try these database names:")
        print("   • postgres (default)")
        print("   • lockin_db (recommended)")
        print("   • admin")
        print("   • root")
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

def create_lockin_database(cursor, username, password):
    """Create the lockin_db database"""
    try:
        print("\n🔧 Creating 'lockin_db' database...")
        cursor.execute("CREATE DATABASE lockin_db")
        print("✅ Database 'lockin_db' created successfully!")
        
        print(f"\n🎯 Your database URL should be:")
        print(f"   postgresql://{username}:password@database-1.cluster-cw18kkw8mg9c.us-east-1.rds.amazonaws.com:5432/lockin_db")
        
    except Exception as e:
        print(f"❌ Failed to create database: {e}")

def show_database_url_examples():
    """Show examples of database URLs"""
    print("\n📝 Database URL Examples:")
    print("-" * 40)
    
    base_url = "postgresql://username:password@database-1.cluster-cw18kkw8mg9c.us-east-1.rds.amazonaws.com:5432"
    
    print("Using 'lockin_db' database (recommended):")
    print(f"   {base_url}/lockin_db")
    
    print("\nUsing 'postgres' database (default):")
    print(f"   {base_url}/postgres")
    
    print("\nUsing 'admin' database (if exists):")
    print(f"   {base_url}/admin")

def main():
    """Main function"""
    print("🔧 What would you like to do?")
    print("1. Check existing databases")
    print("2. Show database URL examples")
    print("3. Both")
    print("0. Exit")
    
    choice = input("\nEnter your choice (0-3): ").strip()
    
    if choice == "1" or choice == "3":
        check_existing_databases()
    
    if choice == "2" or choice == "3":
        show_database_url_examples()
    
    if choice == "0":
        print("👋 Goodbye!")
        return
    
    print("\n📋 Next Steps:")
    print("1. Use the correct database name in your .env file")
    print("2. Run: python init_rds.py")
    print("3. Run: python test_db_connection.py")

if __name__ == "__main__":
    main()
