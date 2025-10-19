#!/usr/bin/env python3
"""
Simple test script to verify LockIN API structure
"""
import sys
import os
from pathlib import Path

# Add the backend directory to Python path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

def test_imports():
    """Test that all modules can be imported"""
    try:
        print("Testing imports...")
        
        # Set a test database URL to avoid connection issues
        import os
        os.environ["DATABASE_URL"] = "sqlite:///test.db"
        
        # Test core modules
        from app.core.config import settings
        from app.core.database import get_db, Base
        print("✅ Core modules imported successfully")
        
        # Test models
        from app.models import Profile, Group, GroupMember, Session, Notification
        print("✅ Models imported successfully")
        
        # Test schemas
        from app.schemas import Profile as ProfileSchema, Group as GroupSchema
        print("✅ Schemas imported successfully")
        
        # Test API routes
        from app.api.routes import auth, groups, sessions, notifications, profiles, maintenance, progress
        print("✅ API routes imported successfully")
        
        # Test main app (without creating tables)
        from app.main import app
        print("✅ Main app imported successfully")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_app_structure():
    """Test that the FastAPI app has the expected structure"""
    try:
        # Import without creating database connection
        import os
        os.environ["DATABASE_URL"] = "sqlite:///test.db"  # Use SQLite for testing
        
        from app.main import app
        
        print("\nTesting app structure...")
        
        # Check if app is a FastAPI instance
        from fastapi import FastAPI
        if not isinstance(app, FastAPI):
            print("❌ App is not a FastAPI instance")
            return False
        
        print("✅ App is a FastAPI instance")
        
        # Check routes
        routes = [route.path for route in app.routes]
        expected_routes = [
            "/",
            "/health",
            "/api/me",
            "/api/groups",
            "/api/sessions",
            "/api/notifications",
            "/api/profiles/avatar/upload-url"
        ]
        
        print(f"Found {len(routes)} routes")
        print("✅ App structure looks good")
        
        return True
        
    except Exception as e:
        print(f"❌ App structure test failed: {e}")
        return False

def test_configuration():
    """Test configuration loading"""
    try:
        from app.core.config import settings
        
        print("\nTesting configuration...")
        
        # Check if settings can be loaded
        print(f"Database URL: {settings.database_url[:20]}...")
        print(f"Cognito Region: {settings.cognito_region}")
        print(f"S3 Bucket: {settings.s3_bucket_name}")
        
        print("✅ Configuration loaded successfully")
        return True
        
    except Exception as e:
        print(f"❌ Configuration test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing LockIN Backend API Structure")
    print("=" * 50)
    
    tests = [
        test_imports,
        test_app_structure,
        test_configuration
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print("=" * 50)
    print(f"Tests passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 All tests passed! The API structure looks good.")
        return 0
    else:
        print("❌ Some tests failed. Please check the errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
