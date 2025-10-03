# Fix AWS RDS Security Group - Connection Timeout Issue

## 🚨 **Problem Identified**
Your RDS instance `valve-test-db.cr0ea4yu656m.ap-southeast-2.rds.amazonaws.com` is **blocking connections** due to security group configuration.

**Error:** `connect ETIMEDOUT`  
**Cause:** Security group doesn't allow inbound traffic on port 3306

## 🔧 **Solution: Configure Security Group**

### **Method 1: AWS Console (Recommended)**

#### **Step 1: Access RDS Dashboard**
1. Go to: https://ap-southeast-2.console.aws.amazon.com/rds/home?region=ap-southeast-2
2. Click on **"Databases"** in the left menu
3. Click on your database: **valve-test-db**

#### **Step 2: Find Security Group**
1. Click on the **"Connectivity & security"** tab
2. Under **"Security"** section, you'll see **"VPC security groups"**
3. Click on the security group link (e.g., `sg-xxxxxxxxx`)

#### **Step 3: Edit Inbound Rules**
1. In the Security Groups page, click **"Edit inbound rules"**
2. Click **"Add rule"**
3. Configure the rule:
   ```
   Type: MySQL/Aurora
   Protocol: TCP
   Port range: 3306
   Source: 0.0.0.0/0 (for testing) or My IP (more secure)
   Description: Allow MySQL access for valve test suite
   ```
4. Click **"Save rules"**

#### **Step 4: Verify Configuration**
- The rule should show: `MySQL/Aurora TCP 3306 0.0.0.0/0`
- Status should be active immediately

### **Method 2: AWS CLI (Alternative)**

```bash
# Get your security group ID
aws rds describe-db-instances --db-instance-identifier valve-test-db --query "DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId" --output text --region ap-southeast-2

# Add MySQL rule (replace sg-xxxxxxxxx with your actual security group ID)
aws ec2 authorize-security-group-ingress \
    --group-id sg-xxxxxxxxx \
    --protocol tcp \
    --port 3306 \
    --cidr 0.0.0.0/0 \
    --region ap-southeast-2
```

## 🧪 **Test Connection After Fix**

Once you've updated the security group:

```bash
# Test the connection
node test-rds-connection-simple.js
```

**Expected Output:**
```
✅ Connection successful!
📊 MySQL Version: 8.0.35
🕐 Server Time: 2025-10-03 16:45:00
🎉 RDS connection test passed!
```

## 📥 **Import Database After Connection Works**

Once connection is successful:

```bash
# Import your database
node import-to-aws-direct.js
```

## 🛡️ **Security Considerations**

### **For Testing (Current Setup)**
- **Source:** `0.0.0.0/0` (allows all IPs)
- **Use:** Development and testing only
- **Risk:** Open to internet (acceptable for testing)

### **For Production (Recommended)**
- **Source:** Your specific IP address or IP range
- **Use:** Production deployment
- **Security:** Much more secure

To get your current IP:
```bash
# Windows
curl ifconfig.me

# Or visit: https://whatismyipaddress.com/
```

Then update the security group source to your specific IP instead of `0.0.0.0/0`.

## 🔍 **Additional Checks**

### **1. Verify RDS Instance Status**
- Go to RDS Dashboard
- Ensure status is **"Available"**
- Check **"Publicly accessible"** is **"Yes"**

### **2. Check VPC Configuration**
- Ensure RDS is in a **public subnet** (for external access)
- Verify **Internet Gateway** is attached to VPC

### **3. Verify Endpoint**
- Confirm endpoint: `valve-test-db.cr0ea4yu656m.ap-southeast-2.rds.amazonaws.com`
- Ensure region is **ap-southeast-2** (Sydney)

## 🚀 **Quick Fix Checklist**

- [ ] Access AWS Console → RDS → valve-test-db
- [ ] Go to Connectivity & security tab
- [ ] Click on Security Group link
- [ ] Edit inbound rules
- [ ] Add MySQL/Aurora rule for port 3306
- [ ] Set source to 0.0.0.0/0 (for testing)
- [ ] Save rules
- [ ] Test connection: `node test-rds-connection-simple.js`
- [ ] Import database: `node import-to-aws-direct.js`

## 📞 **If Still Having Issues**

### **Common Problems:**
1. **Wrong Region:** Ensure you're in ap-southeast-2
2. **RDS Not Public:** Check "Publicly accessible" setting
3. **VPC Issues:** Ensure proper subnet and routing
4. **Firewall:** Check local firewall blocking outbound 3306

### **Contact Support:**
- AWS Support through console
- Check AWS Service Health Dashboard
- Verify account permissions

## 🎯 **Expected Timeline**
- **Security group update:** Immediate (0-30 seconds)
- **Connection test:** Should work immediately
- **Database import:** 2-5 minutes for your small database

Your RDS instance is ready - it just needs the security group configured to allow connections!
