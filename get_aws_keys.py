#!/usr/bin/env python3
"""
AWS Access Keys Helper for LockIN
This script guides you through getting AWS access keys
"""
import webbrowser
import secrets
import string

def print_access_keys_guide():
    """Print comprehensive guide for getting AWS access keys"""
    
    print("🔑 AWS Access Keys Guide for LockIN")
    print("=" * 50)
    
    print("\n📍 Step 1: Go to AWS IAM Console")
    print("-" * 40)
    print("1. AWS Console → IAM → Users")
    print("2. Click 'Create user'")
    print("3. Enter username: 'lockin-backend-user'")
    print("4. Select 'Programmatic access'")
    print("5. Click 'Next: Permissions'")
    
    print("\n🔐 Step 2: Attach Policies")
    print("-" * 40)
    print("Attach these policies:")
    print("• AmazonS3FullAccess (for avatar uploads)")
    print("• AmazonCognitoPowerUser (for user management)")
    print("\nOR create custom policy (more secure):")
    
    custom_policy = """{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:PutObjectAcl"
            ],
            "Resource": "arn:aws:s3:::lockin-avatars/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "cognito-idp:AdminGetUser",
                "cognito-idp:AdminCreateUser",
                "cognito-idp:AdminUpdateUserAttributes"
            ],
            "Resource": "*"
        }
    ]
}"""
    
    print(custom_policy)
    
    print("\n📋 Step 3: Create Access Key")
    print("-" * 40)
    print("1. Click 'Next: Tags' (optional)")
    print("2. Click 'Next: Review'")
    print("3. Click 'Create user'")
    print("4. Click 'Create access key'")
    print("5. Select 'Application running outside AWS'")
    print("6. Click 'Next'")
    print("7. COPY your Access Key ID and Secret Access Key")
    
    print("\n⚠️ Important Security Notes:")
    print("-" * 40)
    print("• Save these keys securely - you can't see them again!")
    print("• Never commit them to version control")
    print("• Use environment variables or AWS Secrets Manager")
    print("• Rotate keys regularly")

def open_iam_console():
    """Open IAM console"""
    print("\n🌐 Opening AWS IAM Console...")
    webbrowser.open("https://console.aws.amazon.com/iam/home")
    print("✅ IAM Console opened in your browser")

def generate_example_keys():
    """Generate example key format"""
    print("\n📝 Example Access Key Format:")
    print("-" * 40)
    print("AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE")
    print("AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY")
    
    print("\n🔍 Your keys will look like:")
    print("• Access Key ID: Starts with 'AKIA' (20 characters)")
    print("• Secret Access Key: Random string (40 characters)")

def create_s3_bucket_guide():
    """Guide for creating S3 bucket"""
    print("\n☁️ S3 Bucket Setup:")
    print("-" * 40)
    print("1. AWS Console → S3 → Create bucket")
    print("2. Bucket name: 'lockin-avatars'")
    print("3. Region: us-east-1")
    print("4. Uncheck 'Block all public access'")
    print("5. Create bucket")
    print("6. Go to bucket → Permissions → Bucket Policy")
    print("7. Add this policy:")
    
    bucket_policy = """{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::lockin-avatars/*"
        }
    ]
}"""
    
    print(bucket_policy)

def test_aws_credentials():
    """Test AWS credentials"""
    print("\n🧪 Testing AWS Credentials:")
    print("-" * 40)
    print("Once you have your keys, test them with:")
    print("aws configure")
    print("aws s3 ls")
    print("aws cognito-idp list-user-pools --max-items 10")

def main():
    """Main function"""
    print_access_keys_guide()
    
    print("\n🔧 What would you like to do?")
    print("1. Open IAM Console")
    print("2. Show example key format")
    print("3. S3 bucket setup guide")
    print("4. All of the above")
    print("0. Skip")
    
    choice = input("\nEnter your choice (0-4): ").strip()
    
    if choice == "1" or choice == "4":
        open_iam_console()
    
    if choice == "2" or choice == "4":
        generate_example_keys()
    
    if choice == "3" or choice == "4":
        create_s3_bucket_guide()
    
    if choice == "0":
        print("⏭️ Skipped")
    
    print("\n📋 Next Steps:")
    print("1. Get your AWS access keys")
    print("2. Create S3 bucket 'lockin-avatars'")
    print("3. Update your .env file with the keys")
    print("4. Test the connection")

if __name__ == "__main__":
    main()
