#!/usr/bin/env python3
"""
RDS Password Helper for LockIN
This script helps you find or reset your RDS password
"""
import webbrowser
import secrets
import string

def generate_secure_password(length=16):
    """Generate a secure password"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def print_rds_password_guide():
    """Print guide for finding RDS password"""
    
    print("🔐 RDS Password Guide for LockIN")
    print("=" * 50)
    
    print("\n📍 Your RDS Endpoint:")
    print("   database-1.cluster-cw18kkw8mg9c.us-east-1.rds.amazonaws.com")
    
    print("\n🔍 Method 1: Check RDS Console")
    print("-" * 30)
    print("1. Go to AWS RDS Console")
    print("2. Click 'Databases' → Your database")
    print("3. Look for 'Master username' (usually 'postgres' or 'admin')")
    print("4. Password might be displayed or you'll need to reset it")
    
    print("\n🔄 Method 2: Reset Password")
    print("-" * 30)
    print("1. In RDS Console → Click your database")
    print("2. Click 'Modify' button")
    print("3. Scroll to 'Master password' section")
    print("4. Select 'Change master password'")
    print("5. Enter new password and apply immediately")
    
    print("\n🔑 Method 3: Check These Places")
    print("-" * 30)
    print("• Your password manager")
    print("• AWS setup documentation/notes")
    print("• AWS Secrets Manager")
    print("• Any team documentation")
    
    print("\n💡 Common Default Usernames:")
    print("-" * 30)
    print("• postgres")
    print("• admin")
    print("• root")
    print("• master")

def open_rds_console():
    """Open RDS console"""
    print("\n🌐 Opening AWS RDS Console...")
    webbrowser.open("https://console.aws.amazon.com/rds/home")
    print("✅ RDS Console opened in your browser")

def generate_password_suggestion():
    """Generate a secure password suggestion"""
    password = generate_secure_password(16)
    print(f"\n🔐 Suggested secure password: {password}")
    print("💡 Save this password somewhere safe!")
    return password

def test_common_passwords():
    """Test common passwords"""
    print("\n🧪 Testing Common Passwords...")
    print("(This will try to connect with common passwords)")
    
    common_passwords = [
        "password",
        "admin",
        "postgres", 
        "123456",
        "password123",
        "admin123",
        "postgres123"
    ]
    
    import psycopg2
    
    for password in common_passwords:
        try:
            conn = psycopg2.connect(
                host="database-1.cluster-cw18kkw8mg9c.us-east-1.rds.amazonaws.com",
                port=5432,
                user="postgres",
                password=password,
                database="postgres"
            )
            print(f"✅ SUCCESS! Username: postgres, Password: {password}")
            conn.close()
            return password
        except:
            try:
                conn = psycopg2.connect(
                    host="database-1.cluster-cw18kkw8mg9c.us-east-1.rds.amazonaws.com",
                    port=5432,
                    user="admin",
                    password=password,
                    database="postgres"
                )
                print(f"✅ SUCCESS! Username: admin, Password: {password}")
                conn.close()
                return password
            except:
                continue
    
    print("❌ None of the common passwords worked")
    return None

def main():
    """Main function"""
    print_rds_password_guide()
    
    print("\n🔧 What would you like to do?")
    print("1. Open RDS Console to check/reset password")
    print("2. Generate a secure password suggestion")
    print("3. Test common passwords")
    print("4. All of the above")
    print("0. Skip")
    
    choice = input("\nEnter your choice (0-4): ").strip()
    
    if choice == "1" or choice == "4":
        open_rds_console()
    
    if choice == "2" or choice == "4":
        generate_password_suggestion()
    
    if choice == "3" or choice == "4":
        test_common_passwords()
    
    if choice == "0":
        print("⏭️ Skipped")
    
    print("\n📋 Next Steps:")
    print("1. Once you have your password, create .env file")
    print("2. Run: python init_rds.py")
    print("3. Run: python test_db_connection.py")

if __name__ == "__main__":
    main()
