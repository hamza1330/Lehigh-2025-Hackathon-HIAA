# Lehigh 2025 Hackathon - HIAA
## Healthcare Innovation & AI Applications

🚀 **Live Website**: [http://54.90.157.246](http://54.90.157.246)

### 🎯 Project Overview
This repository contains our hackathon project for the Lehigh 2025 Hackathon, focused on Healthcare Innovation & AI Applications (HIAA).

### 🌐 Deployment Status
- ✅ **AWS EC2 Instance**: Running (i-0547d0c23792752a9)
- ✅ **Web Server**: Nginx configured and running
- ✅ **Public Access**: Available at http://54.90.157.246
- ✅ **Git Repository**: Synced with GitHub

### 🛠️ Development Setup

#### Local Development
```bash
# Clone the repository
git clone https://github.com/hamza1330/Lehigh-2025-Hackathon-HIAA.git
cd Lehigh-2025-Hackathon-HIAA

# Make deployment script executable
chmod +x deploy.sh
```

#### Deploy to AWS
```bash
# Quick deployment
./deploy.sh

# Or manual deployment
git add .
git commit -m "Update project"
git push origin main
ssh -i ~/.ssh/BiggerBacks123.pem ec2-user@54.90.157.246 "cd Lehigh-2025-Hackathon-HIAA && git pull"
```

#### Connect to AWS Server
```bash
ssh -i ~/.ssh/BiggerBacks123.pem ec2-user@54.90.157.246
```

### 📁 Project Structure
```
Lehigh-2025-Hackathon-HIAA/
├── index.html          # Landing page
├── deploy.sh           # Deployment script
├── README.md           # This file
└── [your project files]
```

### 🚀 Quick Start
1. **Local Development**: Edit files in this directory
2. **Test Locally**: Open `index.html` in your browser
3. **Deploy**: Run `./deploy.sh` to deploy to AWS
4. **View Live**: Visit http://54.90.157.246

### 🔧 Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: [Your choice - Node.js, Python, etc.]
- **Database**: [Your choice - MySQL, PostgreSQL, MongoDB, etc.]
- **Deployment**: AWS EC2, Nginx
- **Version Control**: Git, GitHub

### 📝 Development Notes
- The project is deployed on AWS EC2 instance `i-0547d0c23792752a9`
- Server IP: `54.90.157.246`
- SSH Key: `BiggerBacks123.pem`
- Web server root: `/home/ec2-user/Lehigh-2025-Hackathon-HIAA/`

### 🤝 Team
- **Repository**: https://github.com/hamza1330/Lehigh-2025-Hackathon-HIAA
- **Live Demo**: http://54.90.157.246

### 📞 Support
For questions about deployment or development, check the deployment script or connect to the AWS server directly.
