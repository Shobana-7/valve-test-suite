#!/bin/bash

# AWS RDS MySQL Setup Script for Valve Test Suite
# Account ID: 853452245266

set -e  # Exit on any error

# Configuration
PROJECT_NAME="valve-test-suite"
DB_INSTANCE_ID="valve-test-db"
DB_NAME="valve_test_suite"
MASTER_USERNAME="admin"
REGION="us-east-1"  # Change as needed

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 AWS RDS MySQL Setup for Valve Test Suite${NC}"
echo -e "${BLUE}Account ID: 853452245266${NC}"
echo ""

# Check if AWS CLI is installed and configured
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI is configured${NC}"

# Get account ID and verify
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${BLUE}Current AWS Account: ${ACCOUNT_ID}${NC}"

if [ "$ACCOUNT_ID" != "853452245266" ]; then
    echo -e "${YELLOW}⚠️  Warning: Current account ($ACCOUNT_ID) doesn't match expected account (853452245266)${NC}"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Get default VPC
echo -e "${BLUE}🔍 Getting default VPC...${NC}"
DEFAULT_VPC=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query "Vpcs[0].VpcId" --output text)

if [ "$DEFAULT_VPC" = "None" ] || [ -z "$DEFAULT_VPC" ]; then
    echo -e "${RED}❌ No default VPC found. Please create a VPC first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Using VPC: ${DEFAULT_VPC}${NC}"

# Get subnets in different AZs
echo -e "${BLUE}🔍 Getting subnets...${NC}"
SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$DEFAULT_VPC" --query "Subnets[*].SubnetId" --output text)
SUBNET_ARRAY=($SUBNETS)

if [ ${#SUBNET_ARRAY[@]} -lt 2 ]; then
    echo -e "${RED}❌ Need at least 2 subnets in different AZs for RDS. Found: ${#SUBNET_ARRAY[@]}${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found ${#SUBNET_ARRAY[@]} subnets${NC}"

# Prompt for master password
echo -e "${YELLOW}🔐 Please enter a master password for the database:${NC}"
echo -e "${YELLOW}   - At least 8 characters${NC}"
echo -e "${YELLOW}   - Must contain uppercase, lowercase, number, and special character${NC}"
read -s -p "Master Password: " MASTER_PASSWORD
echo
read -s -p "Confirm Password: " MASTER_PASSWORD_CONFIRM
echo

if [ "$MASTER_PASSWORD" != "$MASTER_PASSWORD_CONFIRM" ]; then
    echo -e "${RED}❌ Passwords don't match${NC}"
    exit 1
fi

if [ ${#MASTER_PASSWORD} -lt 8 ]; then
    echo -e "${RED}❌ Password must be at least 8 characters${NC}"
    exit 1
fi

# Create security group
echo -e "${BLUE}🔧 Creating security group...${NC}"
SG_ID=$(aws ec2 create-security-group \
    --group-name "${PROJECT_NAME}-rds-sg" \
    --description "Security group for ${PROJECT_NAME} RDS MySQL" \
    --vpc-id "$DEFAULT_VPC" \
    --query "GroupId" \
    --output text 2>/dev/null || echo "exists")

if [ "$SG_ID" = "exists" ]; then
    echo -e "${YELLOW}⚠️  Security group already exists, getting ID...${NC}"
    SG_ID=$(aws ec2 describe-security-groups \
        --filters "Name=group-name,Values=${PROJECT_NAME}-rds-sg" "Name=vpc-id,Values=$DEFAULT_VPC" \
        --query "SecurityGroups[0].GroupId" \
        --output text)
fi

echo -e "${GREEN}✅ Security Group ID: ${SG_ID}${NC}"

# Add inbound rule for MySQL
echo -e "${BLUE}🔧 Adding MySQL inbound rule...${NC}"
aws ec2 authorize-security-group-ingress \
    --group-id "$SG_ID" \
    --protocol tcp \
    --port 3306 \
    --cidr 0.0.0.0/0 \
    --output text 2>/dev/null || echo -e "${YELLOW}⚠️  Rule may already exist${NC}"

# Create DB subnet group
echo -e "${BLUE}🔧 Creating DB subnet group...${NC}"
aws rds create-db-subnet-group \
    --db-subnet-group-name "${PROJECT_NAME}-subnet-group" \
    --db-subnet-group-description "Subnet group for ${PROJECT_NAME} database" \
    --subnet-ids ${SUBNET_ARRAY[0]} ${SUBNET_ARRAY[1]} \
    --tags Key=Project,Value="$PROJECT_NAME" \
    --output text 2>/dev/null || echo -e "${YELLOW}⚠️  Subnet group may already exist${NC}"

# Create parameter group
echo -e "${BLUE}🔧 Creating parameter group...${NC}"
aws rds create-db-parameter-group \
    --db-parameter-group-name "${PROJECT_NAME}-mysql-params" \
    --db-parameter-group-family mysql8.0 \
    --description "Custom parameters for ${PROJECT_NAME} MySQL" \
    --output text 2>/dev/null || echo -e "${YELLOW}⚠️  Parameter group may already exist${NC}"

# Create RDS instance
echo -e "${BLUE}🚀 Creating RDS MySQL instance...${NC}"
echo -e "${YELLOW}This may take 10-15 minutes...${NC}"

aws rds create-db-instance \
    --db-instance-identifier "$DB_INSTANCE_ID" \
    --db-instance-class db.t3.micro \
    --engine mysql \
    --engine-version 8.0.35 \
    --master-username "$MASTER_USERNAME" \
    --master-user-password "$MASTER_PASSWORD" \
    --allocated-storage 20 \
    --storage-type gp2 \
    --storage-encrypted \
    --vpc-security-group-ids "$SG_ID" \
    --db-subnet-group-name "${PROJECT_NAME}-subnet-group" \
    --db-parameter-group-name "${PROJECT_NAME}-mysql-params" \
    --backup-retention-period 7 \
    --publicly-accessible \
    --tags Key=Project,Value="$PROJECT_NAME" Key=Environment,Value=Production \
    --output text

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ RDS instance creation initiated${NC}"
else
    echo -e "${RED}❌ Failed to create RDS instance${NC}"
    exit 1
fi

# Wait for instance to be available
echo -e "${BLUE}⏳ Waiting for RDS instance to be available...${NC}"
aws rds wait db-instance-available --db-instance-identifier "$DB_INSTANCE_ID"

# Get RDS endpoint
RDS_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier "$DB_INSTANCE_ID" \
    --query "DBInstances[0].Endpoint.Address" \
    --output text)

echo -e "${GREEN}🎉 RDS MySQL instance created successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Connection Details:${NC}"
echo -e "  Endpoint: ${GREEN}${RDS_ENDPOINT}${NC}"
echo -e "  Port: ${GREEN}3306${NC}"
echo -e "  Username: ${GREEN}${MASTER_USERNAME}${NC}"
echo -e "  Database: ${GREEN}${DB_NAME}${NC}"
echo ""

# Create .env file for AWS
cat > .env.aws << EOF
# AWS RDS Configuration
DB_HOST=${RDS_ENDPOINT}
DB_PORT=3306
DB_USER=${MASTER_USERNAME}
DB_PASSWORD=${MASTER_PASSWORD}
DB_NAME=${DB_NAME}

# SSL Configuration (recommended)
DB_SSL=true
DB_SSL_CA=rds-ca-2019-root.pem

# JWT Configuration (keep your existing values)
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=production
EOF

echo -e "${GREEN}✅ Created .env.aws file with connection details${NC}"

# Download SSL certificate
echo -e "${BLUE}📥 Downloading RDS SSL certificate...${NC}"
curl -o rds-ca-2019-root.pem https://s3.amazonaws.com/rds-downloads/rds-ca-2019-root.pem
echo -e "${GREEN}✅ SSL certificate downloaded${NC}"

echo ""
echo -e "${GREEN}🚀 Next Steps:${NC}"
echo -e "1. Run: ${YELLOW}node export-local-database.js${NC} (to export your local data)"
echo -e "2. Run: ${YELLOW}./import-to-aws.sh ${RDS_ENDPOINT} ${MASTER_USERNAME} <password>${NC} (to import data)"
echo -e "3. Update your .env file with AWS RDS details"
echo -e "4. Run: ${YELLOW}node test-aws-rds-connection.js${NC} (to test connection)"
echo -e "5. Start your application with the new database"
echo ""
echo -e "${BLUE}💡 Tips:${NC}"
echo -e "- Keep your master password secure"
echo -e "- Consider using IAM database authentication for production"
echo -e "- Monitor costs in AWS console"
echo -e "- Set up CloudWatch alarms for monitoring"
