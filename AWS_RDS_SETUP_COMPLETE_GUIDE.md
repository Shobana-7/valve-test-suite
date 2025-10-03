# Complete AWS RDS MySQL Setup Guide for Valve Test Suite

## 🎯 **Overview**
This guide provides step-by-step instructions to migrate your valve test suite database from local MySQL to AWS RDS MySQL.

**AWS Account ID:** 853452245266  
**Current Database:** valve_test_suite (11 tables, 67 rows, 0.57 MB)

## ✅ **Step 1: Database Export (COMPLETED)**

Your local database has been successfully exported:

### **Export Summary:**
- **Tables:** 11 (pop_test_headers, pop_test_valves, users, valve_brands, etc.)
- **Data:** 67 total rows across all tables
- **Size:** 0.57 MB total database size
- **Files Created:**
  - `valve_test_suite_backup_2025-10-03T16-36-31-817Z.sql` - Full backup
  - `valve_test_suite_schema_2025-10-03T16-36-31-817Z.sql` - Schema only
  - `.env.aws-template` - Environment configuration template
  - `import-to-aws.bat` - Windows import script
  - `import-to-aws.ps1` - PowerShell import script

## 🚀 **Step 2: Create AWS RDS Instance**

### **Option A: Using AWS Console (Recommended for beginners)**

1. **Login to AWS Console**
   - Go to https://console.aws.amazon.com
   - Login with account 853452245266

2. **Navigate to RDS**
   - Search for "RDS" in the services
   - Click "Create database"

3. **Database Configuration**
   ```
   Engine: MySQL
   Version: 8.0.35 (latest)
   Template: Free tier (for testing) or Production (for live use)
   
   DB Instance Identifier: valve-test-db
   Master Username: admin
   Master Password: [Create a strong password]
   
   DB Instance Class: db.t3.micro (free tier) or db.t3.small (production)
   Storage Type: General Purpose SSD (gp2)
   Allocated Storage: 20 GB
   
   VPC: Default VPC
   Subnet Group: Create new or use default
   Public Access: Yes (for initial setup)
   Security Group: Create new "valve-test-rds-sg"
   ```

4. **Security Group Configuration**
   - Allow inbound traffic on port 3306
   - Source: Your IP address or 0.0.0.0/0 (for testing)

### **Option B: Using AWS CLI (Advanced)**

1. **Install AWS CLI** (if not already installed)
   ```bash
   # Download from: https://aws.amazon.com/cli/
   # Configure with: aws configure
   ```

2. **Run the automated script**
   ```bash
   # Make script executable (Linux/Mac)
   chmod +x create-aws-rds.sh
   ./create-aws-rds.sh
   
   # Or run manually on Windows using Git Bash or WSL
   ```

## 📥 **Step 3: Import Database to AWS RDS**

Once your RDS instance is created and available:

### **Get RDS Endpoint**
- From AWS Console: RDS → Databases → valve-test-db → Endpoint
- Example: `valve-test-db.xxxxxxxxx.us-east-1.rds.amazonaws.com`

### **Import Using Windows Batch Script**
```cmd
import-to-aws.bat valve-test-db.xxxxxxxxx.us-east-1.rds.amazonaws.com admin YourPassword123
```

### **Import Using PowerShell**
```powershell
.\import-to-aws.ps1 -RdsEndpoint "valve-test-db.xxxxxxxxx.us-east-1.rds.amazonaws.com" -Username "admin" -Password "YourPassword123"
```

### **Manual Import (Alternative)**
```bash
# If you have MySQL client installed
mysql -h valve-test-db.xxxxxxxxx.us-east-1.rds.amazonaws.com -u admin -p valve_test_suite < valve_test_suite_backup_2025-10-03T16-36-31-817Z.sql
```

## ⚙️ **Step 4: Update Application Configuration**

### **Update Environment Variables**

1. **Copy the template**
   ```bash
   copy .env.aws-template .env
   ```

2. **Edit .env file with your RDS details**
   ```env
   # AWS RDS Configuration
   DB_HOST=valve-test-db.xxxxxxxxx.us-east-1.rds.amazonaws.com
   DB_PORT=3306
   DB_USER=admin
   DB_PASSWORD=YourActualPassword123
   DB_NAME=valve_test_suite
   
   # SSL Configuration (recommended)
   DB_SSL=true
   DB_SSL_CA=rds-ca-2019-root.pem
   
   # Keep your existing JWT and server settings
   JWT_SECRET=your_existing_jwt_secret
   JWT_EXPIRES_IN=24h
   PORT=5000
   NODE_ENV=production
   ```

### **Download SSL Certificate (Optional but recommended)**
```bash
# Download AWS RDS SSL certificate
curl -o rds-ca-2019-root.pem https://s3.amazonaws.com/rds-downloads/rds-ca-2019-root.pem
```

## 🧪 **Step 5: Test Connection**

### **Test AWS RDS Connection**
```bash
node test-aws-rds-connection.js
```

This will verify:
- ✅ Database connection
- ✅ Schema validation (11 tables)
- ✅ Sample data (67 rows)
- ✅ Application queries
- ✅ Performance metrics

### **Start Your Application**
```bash
# Start backend server
npm run dev

# Start frontend (in another terminal)
cd client
npm start
```

## 🛡️ **Step 6: Security Configuration**

### **Database Security**
1. **Create Application User** (recommended)
   ```sql
   -- Connect to RDS as admin
   CREATE USER 'app_user'@'%' IDENTIFIED BY 'AppUserPassword123!';
   GRANT SELECT, INSERT, UPDATE, DELETE ON valve_test_suite.* TO 'app_user'@'%';
   FLUSH PRIVILEGES;
   ```

2. **Update Security Group**
   - Restrict access to specific IP ranges
   - Remove 0.0.0.0/0 if used for testing

3. **Enable SSL**
   - Set `DB_SSL=true` in .env
   - Use the downloaded SSL certificate

## 💰 **Step 7: Cost Optimization**

### **Instance Sizing**
- **Development:** db.t3.micro (free tier eligible)
- **Production:** db.t3.small or larger based on load

### **Storage**
- Start with 20 GB, auto-scaling enabled
- Use gp2 for cost-effective storage

### **Backup & Monitoring**
- Set backup retention: 7 days (recommended)
- Enable CloudWatch monitoring
- Set up billing alerts

## 📊 **Step 8: Monitoring Setup**

### **CloudWatch Metrics**
- CPU Utilization
- Database Connections
- Read/Write IOPS
- Free Storage Space

### **Alarms**
```bash
# Example: High CPU alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "RDS-HighCPU" \
    --alarm-description "RDS CPU > 80%" \
    --metric-name CPUUtilization \
    --namespace AWS/RDS \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=DBInstanceIdentifier,Value=valve-test-db
```

## 🔄 **Step 9: Backup Strategy**

### **Automated Backups**
- Enabled by default with 7-day retention
- Point-in-time recovery available

### **Manual Snapshots**
```bash
# Create manual snapshot
aws rds create-db-snapshot \
    --db-instance-identifier valve-test-db \
    --db-snapshot-identifier valve-test-db-manual-snapshot-$(date +%Y%m%d)
```

## 🚀 **Step 10: Production Readiness**

### **Performance Optimization**
1. **Parameter Group Tuning**
   - `innodb_buffer_pool_size`: 75% of available memory
   - `max_connections`: Based on application needs

2. **Connection Pooling**
   - Use connection pooling in your application
   - Monitor connection usage

### **High Availability**
1. **Multi-AZ Deployment**
   ```bash
   aws rds modify-db-instance \
       --db-instance-identifier valve-test-db \
       --multi-az \
       --apply-immediately
   ```

2. **Read Replicas** (if needed)
   ```bash
   aws rds create-db-instance-read-replica \
       --db-instance-identifier valve-test-db-replica \
       --source-db-instance-identifier valve-test-db
   ```

## ✅ **Verification Checklist**

- [ ] RDS instance created and available
- [ ] Database imported successfully (11 tables, 67 rows)
- [ ] Application connects to RDS
- [ ] All features working (login, reports, master data)
- [ ] SSL connection enabled
- [ ] Security groups configured
- [ ] Monitoring enabled
- [ ] Backup strategy in place

## 🆘 **Troubleshooting**

### **Connection Issues**
- Check security group rules (port 3306)
- Verify RDS endpoint and credentials
- Test from local machine first

### **Import Issues**
- Check SQL file format
- Verify user permissions
- Check for character encoding issues

### **Performance Issues**
- Monitor CloudWatch metrics
- Check connection pool settings
- Consider instance size upgrade

## 📞 **Support Resources**

- **AWS Documentation:** https://docs.aws.amazon.com/rds/
- **MySQL Documentation:** https://dev.mysql.com/doc/
- **AWS Support:** Available through AWS Console

Your valve test suite is now ready for production deployment on AWS RDS MySQL!
