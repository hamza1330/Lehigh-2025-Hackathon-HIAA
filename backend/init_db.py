#!/usr/bin/env python3
"""
Database initialization script for LockIN
This script runs the schema.sql file to set up the PostgreSQL database
"""
import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from pathlib import Path

def init_database():
    """Initialize the database with schema.sql"""
    
    # Get database URL from environment
    database_url = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/lockin_db")
    
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
            database = "lockin_db"
    else:
        raise ValueError("Invalid database URL format")
    
    print(f"Connecting to database: {host}:{port}/{database}")
    
    try:
        # Connect to PostgreSQL server
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=username,
            password=password,
            database=database
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        
        cursor = conn.cursor()
        
        # Read and execute schema.sql
        schema_path = Path(__file__).parent / "schema.sql"
        if not schema_path.exists():
            raise FileNotFoundError(f"Schema file not found: {schema_path}")
        
        print(f"Reading schema from: {schema_path}")
        with open(schema_path, 'r') as f:
            schema_sql = f.read()
        
        print("Executing schema...")
        cursor.execute(schema_sql)
        
        print("Database initialized successfully!")
        
        # Test the schema by checking if tables exist
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        
        tables = cursor.fetchall()
        print(f"Created tables: {[table[0] for table in tables]}")
        
        cursor.close()
        conn.close()
        
    except psycopg2.Error as e:
        print(f"Database error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    init_database()
