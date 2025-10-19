#!/usr/bin/env python3
"""
AWS Configuration Helper for LockIN
This script helps you find all the AWS configuration data you need
"""
import webbrowser
from pathlib import Path

def print_aws_config_guide():
    """Print a comprehensive guide for finding AWS configuration"""
    
    print("🔍 AWS Configuration Guide for LockIN")
    print("=" * 60)
    
    print("\n📊 1. DATABASE CONFIGURATION (RDS)")
    print("-" * 40)
    print("✅ Your RDS Endpoint: database-1.cluster-cw18kkw8mg9c.us-east-1.rds.amazonaws.com")
    print("📍 AWS Console → RDS → Databases → Click your database")
    print("   • Master username: Usually 'postgres' or 'admin'")
    print("   • Password: Reset if you don't remember it")
    print("   • Database name: 'lockin_db' (create if doesn't exist)")
    
    print("\n🔐 2. AWS COGNITO CONFIGURATION")
    print("-" * 40)
    print("📍 AWS Console → Cognito → User Pools")
    print("   • Create a new User Pool or use existing")
    print("   • COGNITO_USER_POOL_ID: From Pool ARN (part after last '/')")
    print("   • COGNITO_CLIENT_ID: App Integration → App clients → Client ID")
    print("   • COGNITO_REGION: us-east-1")
    
    print("\n☁️ 3. AWS S3 CONFIGURATION")
    print("-" * 40)
    print("📍 AWS Console → S3")
    print("   • Create bucket: 'lockin-avatars'")
    print("   • Set public read permissions for uploaded avatars")
    print("📍 AWS Console → IAM → Users")
    print("   • Create user with S3 permissions")
    print("   • Create Access Key for programmatic access")
    print("   • AWS_ACCESS_KEY_ID: From access key")
    print("   • AWS_SECRET_ACCESS_KEY: From secret key")
    print("   • AWS_REGION: us-east-1")
    
    print("\n🔑 4. JWT CONFIGURATION")
    print("-" * 40)
    print("   • JWT_SECRET_KEY: Generate a random string (32+ characters)")
    print("   • JWT_ALGORITHM: HS256")
    print("   • JWT_ACCESS_TOKEN_EXPIRE_MINUTES: 30")
    
    print("\n📝 5. EXAMPLE .env FILE")
    print("-" * 40)
    print("""
# Database Configuration
DATABASE_URL=postgresql://postgres:your_password@database-1.cluster-cw18kkw8mg9c.us-east-1.rds.amazonaws.com:5432/lockin_db

# AWS Cognito Configuration
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=1234567890abcdefghijklmnop

# AWS S3 Configuration
S3_BUCKET_NAME=lockin-avatars
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
""")

def create_env_template():
    """Create a template .env file"""
    template_content = """# Database Configuration
DATABASE_URL=postgresql://username:password@database-1.cluster-cw18kkw8mg9c.us-east-1.rds.amazonaws.com:5432/lockin_db

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
    
    env_path = Path(__file__).parent / ".env.template"
    with open(env_path, 'w') as f:
        f.write(template_content)
    
    print(f"\n📄 Created template file: {env_path}")
    print("   Copy this to .env and fill in your actual values")

def open_aws_consoles():
    """Offer to open AWS console pages"""
    print("\n🌐 Would you like me to open AWS console pages?")
    print("1. RDS Console")
    print("2. Cognito Console") 
    print("3. S3 Console")
    print("4. IAM Console")
    print("5. All of the above")
    print("0. Skip")
    
    choice = input("\nEnter your choice (0-5): ").strip()
    
    urls = {
        "1": "https://console.aws.amazon.com/rds/home",
        "2": "https://console.aws.amazon.com/cognito/home",
        "3": "https://console.aws.amazon.com/s3/home",
        "4": "https://console.aws.amazon.com/iam/home",
    }
    
    if choice == "5":
        for url in urls.values():
            webbrowser.open(url)
        print("✅ Opened all AWS console pages")
    elif choice in urls:
        webbrowser.open(urls[choice])
        print(f"✅ Opened AWS console page")
    else:
        print("⏭️ Skipped opening console pages")

def main():
    """Main function"""
    print_aws_config_guide()
    create_env_template()
    open_aws_consoles()
    
    print("\n🎯 Next Steps:")
    print("1. Fill in your .env file with the actual values")
    print("2. Run: python init_rds.py (to initialize database)")
    print("3. Run: python test_db_connection.py (to test connection)")
    print("4. Run: python run.py (to start the API)")

if __name__ == "__main__":
    main()
