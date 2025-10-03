# AWS RDS MySQL Setup Guide for Valve Test Suite

## 🎯 **Overview**
This guide will help you migrate your local valve test suite database to AWS RDS MySQL with proper security and configuration.

**AWS Account ID:** 853452245266

## 📋 **Step 1: AWS RDS Instance Setup**

### **1.1 Create RDS Subnet Group**
```bash
# Create subnet group for RDS (replace subnet IDs with your VPC subnets)
aws rds create-db-subnet-group \
    --db-subnet-group-name valve-test-subnet-group \
    --db-subnet-group-description "Subnet group for valve test suite database" \
    --subnet-ids subnet-xxxxxxxxx subnet-yyyyyyyyy \
    --tags Key=Project,Value=ValveTestSuite
```

### **1.2 Create Security Group**
```bash
# Create security group for RDS
aws ec2 create-security-group \
    --group-name valve-test-rds-sg \
    --description "Security group for valve test suite RDS MySQL" \
    --vpc-id vpc-xxxxxxxxx

# Add inbound rule for MySQL (port 3306)
aws ec2 authorize-security-group-ingress \
    --group-id sg-xxxxxxxxx \
    --protocol tcp \
    --port 3306 \
    --source-group sg-xxxxxxxxx  # Replace with your application security group
```

### **1.3 Create RDS Parameter Group**
```bash
# Create custom parameter group for MySQL 8.0
aws rds create-db-parameter-group \
    --db-parameter-group-name valve-test-mysql-params \
    --db-parameter-group-family mysql8.0 \
    --description "Custom parameters for valve test suite MySQL"

# Set important parameters
aws rds modify-db-parameter-group \
    --db-parameter-group-name valve-test-mysql-params \
    --parameters "ParameterName=innodb_buffer_pool_size,ParameterValue={DBInstanceClassMemory*3/4},ApplyMethod=pending-reboot" \
                 "ParameterName=max_connections,ParameterValue=200,ApplyMethod=pending-reboot"
```

### **1.4 Create RDS MySQL Instance**
```bash
# Create RDS MySQL instance
aws rds create-db-instance \
    --db-instance-identifier valve-test-db \
    --db-instance-class db.t3.micro \
    --engine mysql \
    --engine-version 8.0.35 \
    --master-username admin \
    --master-user-password 'YourSecurePassword123!' \
    --allocated-storage 20 \
    --storage-type gp2 \
    --storage-encrypted \
    --vpc-security-group-ids sg-xxxxxxxxx \
    --db-subnet-group-name valve-test-subnet-group \
    --db-parameter-group-name valve-test-mysql-params \
    --backup-retention-period 7 \
    --multi-az \
    --publicly-accessible \
    --tags Key=Project,Value=ValveTestSuite Key=Environment,Value=Production
```

## 📋 **Step 2: Database Schema Migration**

### **2.1 Export Local Database**
```bash
# Export schema and data from local MySQL
mysqldump -u root -p \
    --routines \
    --triggers \
    --single-transaction \
    --lock-tables=false \
    valve_test_suite > valve_test_suite_backup.sql

# Export schema only (for verification)
mysqldump -u root -p \
    --no-data \
    --routines \
    --triggers \
    valve_test_suite > valve_test_suite_schema.sql
```

### **2.2 Prepare for AWS Import**
```bash
# Create a clean import script
sed 's/DEFINER=[^*]*\*/\*/g' valve_test_suite_backup.sql > valve_test_suite_aws.sql
```

### **2.3 Import to AWS RDS**
```bash
# Get RDS endpoint (replace with your actual endpoint)
RDS_ENDPOINT="valve-test-db.xxxxxxxxx.us-east-1.rds.amazonaws.com"

# Create database
mysql -h $RDS_ENDPOINT -u admin -p -e "CREATE DATABASE valve_test_suite;"

# Import schema and data
mysql -h $RDS_ENDPOINT -u admin -p valve_test_suite < valve_test_suite_aws.sql
```

## 📋 **Step 3: Application Configuration**

### **3.1 Update Environment Variables**
Create/update your `.env` file:
```env
# AWS RDS Configuration
DB_HOST=valve-test-db.xxxxxxxxx.us-east-1.rds.amazonaws.com
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=YourSecurePassword123!
DB_NAME=valve_test_suite

# SSL Configuration (recommended)
DB_SSL=true
DB_SSL_CA=rds-ca-2019-root.pem
```

### **3.2 Download RDS SSL Certificate**
```bash
# Download AWS RDS SSL certificate
wget https://s3.amazonaws.com/rds-downloads/rds-ca-2019-root.pem
```

## 📋 **Step 4: Security Configuration**

### **4.1 Create IAM Role for Application**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "rds-db:connect"
            ],
            "Resource": [
                "arn:aws:rds-db:us-east-1:853452245266:dbuser:valve-test-db/app_user"
            ]
        }
    ]
}
```

### **4.2 Configure Database Users**
```sql
-- Connect to RDS and create application user
CREATE USER 'app_user'@'%' IDENTIFIED BY 'AppUserPassword123!';
GRANT SELECT, INSERT, UPDATE, DELETE ON valve_test_suite.* TO 'app_user'@'%';
FLUSH PRIVILEGES;
```

## 📋 **Step 5: Testing and Validation**

### **5.1 Test Connection**
```bash
# Test connection to RDS
mysql -h valve-test-db.xxxxxxxxx.us-east-1.rds.amazonaws.com -u admin -p -e "SHOW DATABASES;"
```

### **5.2 Validate Data**
```sql
-- Check table counts
SELECT 
    table_name,
    table_rows
FROM information_schema.tables 
WHERE table_schema = 'valve_test_suite';

-- Verify sample data
SELECT COUNT(*) FROM pop_test_headers;
SELECT COUNT(*) FROM pop_test_valves;
SELECT COUNT(*) FROM users;
```

## 🔧 **Cost Optimization Tips**

1. **Instance Sizing:** Start with `db.t3.micro` for development
2. **Storage:** Use `gp2` for cost-effective storage
3. **Backup:** Set retention period based on needs (7 days recommended)
4. **Multi-AZ:** Enable for production, disable for development

## 🛡️ **Security Best Practices**

1. **Encryption:** Always enable encryption at rest
2. **SSL:** Use SSL connections for data in transit
3. **Security Groups:** Restrict access to specific IP ranges
4. **IAM:** Use IAM database authentication when possible
5. **Monitoring:** Enable CloudWatch monitoring

## 📊 **Monitoring Setup**

```bash
# Enable enhanced monitoring
aws rds modify-db-instance \
    --db-instance-identifier valve-test-db \
    --monitoring-interval 60 \
    --monitoring-role-arn arn:aws:iam::853452245266:role/rds-monitoring-role
```

## 🚀 **Next Steps**

1. Create RDS instance using AWS Console or CLI
2. Export and import database
3. Update application configuration
4. Test connectivity and functionality
5. Set up monitoring and backups
6. Configure SSL connections
7. Implement proper security groups

This setup will provide a production-ready MySQL database on AWS RDS for your valve test suite application.
