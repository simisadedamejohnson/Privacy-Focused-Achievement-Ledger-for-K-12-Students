# 📚 Privacy-Focused Achievement Ledger for K-12 Students

Welcome to a secure, blockchain-powered platform that empowers K-12 students to maintain a private ledger of their academic and extracurricular achievements! This Web3 project addresses the real-world problem of data privacy in education by allowing students to control their records on the Stacks blockchain, preventing unauthorized access while enabling selective sharing with trusted parties like parents or counselors. No more centralized databases vulnerable to breaches—everything is immutable, verifiable, and student-owned.

## ✨ Features

🔒 Private achievement storage with on-chain encryption hints for off-chain data  
📈 Track academic grades, awards, projects, and extracurriculars  
👥 Selective sharing via smart contract permissions  
🛡️ Role-based access for students, parents, and counselors  
✅ Immutable verification of shared achievements  
📅 Timestamped entries for audit trails  
🚫 Revokable shares to maintain control  
🔍 Queryable ledger for authorized users only  

## 🛠 How It Works

This project is built using Clarity smart contracts on the Stacks blockchain, ensuring security and scalability. The system involves 8 interconnected smart contracts to handle registration, storage, permissions, and sharing efficiently.

### Smart Contracts Overview
1. **UserRegistry.clar**: Registers users (students, parents, counselors) with unique IDs and roles.  
2. **AchievementStorage.clar**: Stores hashed achievements privately for students, with metadata like timestamps and categories.  
3. **PermissionManager.clar**: Manages access permissions, allowing students to grant/revoke view rights.  
4. **RoleVerifier.clar**: Verifies user roles before any interactions to enforce privacy.  
5. **SharingContract.clar**: Facilitates secure sharing of specific achievements via temporary access tokens.  
6. **AuditLog.clar**: Logs all access attempts and shares for transparency and dispute resolution.  
7. **NotificationHub.clar**: Sends on-chain notifications for share requests or approvals.  
8. **VerificationEngine.clar**: Allows authorized viewers to verify the authenticity of shared achievements without revealing the full ledger.

**For Students**  
- Register via UserRegistry with your wallet.  
- Add achievements to AchievementStorage (e.g., call `add-achievement` with a hash of your certificate, title like "Science Fair Winner", and description).  
- Use PermissionManager to grant access to specific parents or counselors for selected entries.  
- Revoke access anytime—your data, your rules!

**For Parents/Counselors**  
- Register your role in UserRegistry.  
- Request access via NotificationHub.  
- Once approved, use SharingContract to view shared achievements.  
- Verify details with VerificationEngine for authenticity checks.

**For Verifiers (e.g., Schools or Future Employers)**  
- With student permission, query shared data through RoleVerifier and VerificationEngine.  
- All interactions are logged in AuditLog for accountability.

That's it! A privacy-first system that puts students in control while solving the challenges of secure, shareable educational records. Built with Clarity for trustless execution on Stacks.