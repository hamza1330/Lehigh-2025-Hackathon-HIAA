const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// Initialize AWS services
const s3 = new AWS.S3();
const rekognition = new AWS.Rekognition();
const lambda = new AWS.Lambda();

// S3 Configuration for photo uploads
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET || 'goal-setting-app-photos',
    acl: 'public-read',
    key: function (req, file, cb) {
      const userId = req.user ? req.user.id : 'anonymous';
      const timestamp = Date.now();
      const filename = `goals/${userId}/${timestamp}-${file.originalname}`;
      cb(null, filename);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE
  }),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Photo verification using AWS Rekognition
const verifyPhoto = async (photoUrl, goalCategory) => {
  try {
    // Extract S3 key from URL
    const s3Key = photoUrl.split('/').slice(-2).join('/');
    
    const params = {
      Image: {
        S3Object: {
          Bucket: process.env.AWS_S3_BUCKET,
          Name: s3Key
        }
      },
      MaxLabels: 10,
      MinConfidence: 70
    };
    
    const result = await rekognition.detectLabels(params).promise();
    
    // Analyze labels based on goal category
    const verification = analyzeLabels(result.Labels, goalCategory);
    
    return {
      verified: verification.verified,
      confidence: verification.confidence,
      labels: result.Labels,
      analysis: verification.analysis
    };
  } catch (error) {
    console.error('Rekognition error:', error);
    return {
      verified: false,
      confidence: 0,
      error: error.message
    };
  }
};

// Analyze labels for goal verification
const analyzeLabels = (labels, category) => {
  const categoryKeywords = {
    fitness: ['gym', 'exercise', 'workout', 'fitness', 'sport', 'running', 'biking', 'swimming'],
    education: ['book', 'study', 'learning', 'education', 'school', 'library', 'computer'],
    health: ['food', 'healthy', 'nutrition', 'meal', 'vegetable', 'fruit', 'water'],
    career: ['office', 'work', 'computer', 'meeting', 'business', 'professional'],
    personal: ['home', 'family', 'friends', 'personal', 'self-care', 'meditation']
  };
  
  const keywords = categoryKeywords[category] || [];
  let confidence = 0;
  let verified = false;
  let analysis = '';
  
  // Check for relevant labels
  for (const label of labels) {
    const labelName = label.Name.toLowerCase();
    const labelConfidence = label.Confidence;
    
    for (const keyword of keywords) {
      if (labelName.includes(keyword)) {
        confidence += labelConfidence;
        analysis += `Found ${labelName} (${labelConfidence.toFixed(1)}% confidence). `;
      }
    }
  }
  
  // Normalize confidence
  confidence = Math.min(100, confidence / keywords.length);
  
  // Set verification threshold
  verified = confidence >= 60;
  
  if (!verified) {
    analysis += `Goal category "${category}" not clearly detected. `;
  }
  
  return { verified, confidence, analysis };
};

// Upload photo to S3
const uploadPhoto = (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: 'Photo upload failed',
        error: err.message
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No photo provided'
      });
    }
    
    req.photoUrl = req.file.location;
    next();
  });
};

// Delete photo from S3
const deletePhoto = async (photoUrl) => {
  try {
    const s3Key = photoUrl.split('/').slice(-2).join('/');
    
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key
    };
    
    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error('Error deleting photo:', error);
    return false;
  }
};

// Generate presigned URL for direct upload
const generatePresignedUrl = (userId, filename) => {
  const key = `goals/${userId}/${Date.now()}-${filename}`;
  
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    ContentType: 'image/jpeg',
    Expires: 300 // 5 minutes
  };
  
  return s3.getSignedUrl('putObject', params);
};

// Lambda function for advanced image processing
const processImageWithLambda = async (photoUrl, goalData) => {
  try {
    const params = {
      FunctionName: 'goal-verification-processor',
      Payload: JSON.stringify({
        photoUrl: photoUrl,
        goalData: goalData
      })
    };
    
    const result = await lambda.invoke(params).promise();
    return JSON.parse(result.Payload);
  } catch (error) {
    console.error('Lambda processing error:', error);
    return null;
  }
};

module.exports = {
  uploadPhoto,
  verifyPhoto,
  deletePhoto,
  generatePresignedUrl,
  processImageWithLambda,
  s3,
  rekognition
};
