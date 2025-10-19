from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import boto3
from botocore.exceptions import ClientError
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.config import settings
from app.models import Profile
from app.schemas import AvatarUploadResponse
from app.api.routes.auth import get_current_user

router = APIRouter()

# S3 client
s3_client = boto3.client(
    's3',
    region_name=settings.aws_region,
    aws_access_key_id=settings.aws_access_key_id,
    aws_secret_access_key=settings.aws_secret_access_key
)

@router.post("/profiles/avatar/upload-url", response_model=AvatarUploadResponse)
async def get_avatar_upload_url(
    current_user: Profile = Depends(get_current_user)
):
    """Generate presigned URL for avatar upload"""
    try:
        # Generate unique filename
        filename = f"avatars/{current_user.id}/{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
        
        # Generate presigned URL for PUT request
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': settings.s3_bucket_name,
                'Key': filename,
                'ContentType': 'image/jpeg'
            },
            ExpiresIn=3600  # 1 hour
        )
        
        # Construct the public URL
        avatar_url = f"https://{settings.s3_bucket_name}.s3.{settings.aws_region}.amazonaws.com/{filename}"
        
        return AvatarUploadResponse(
            upload_url=presigned_url,
            avatar_url=avatar_url,
            expires_in=3600
        )
        
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate upload URL: {str(e)}"
        )
