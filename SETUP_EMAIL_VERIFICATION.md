# Email Verification Setup Guide

## ✅ Completed Steps

1. **Backend Implementation**
   - ✅ Installed nodemailer package
   - ✅ Created `backend/utils/emailService.js` with email sending functionality
   - ✅ Updated `backend/controllers/authController.js` with validation and verification logic
   - ✅ Added validation functions:
     - Username: 3-20 characters, alphanumeric + underscore only
     - Password: minimum 8 characters, requires uppercase, lowercase, and digit
     - Email: standard email format validation
   - ✅ Added endpoints: `/verify-email`, `/resend-code`
   - ✅ Modified `/register` to create unverified users
   - ✅ Modified `/login` to check verification status

2. **Frontend Implementation**
   - ✅ Created `src/components/VerifyEmail.jsx` component
   - ✅ Updated `src/components/Register.jsx` with validation UI
   - ✅ Updated `src/components/Login.jsx` to handle unverified users
   - ✅ Added API functions: `verifyEmail`, `resendVerificationCode`
   - ✅ Added password strength indicator
   - ✅ Added username format hints

3. **Configuration Files**
   - ✅ Created database migration SQL
   - ✅ Updated `.env` with email configuration template

## 🚀 Steps You Need to Complete

### 1. Configure Email Credentials

Edit the `.env` file in the root directory and update the email settings:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com        # ⚠️ Update this
EMAIL_PASS=your_app_password_here      # ⚠️ Update this
```

**For Gmail:**
1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Go to https://myaccount.google.com/apppasswords
4. Generate a new "App Password" for "Mail"
5. Copy the 16-character password (spaces are optional)
6. Use that password in `EMAIL_PASS` (NOT your regular Gmail password)

**For other email providers:**
- Use their SMTP settings (host, port)
- Some providers require app-specific passwords

### 2. Run Database Migration

Execute the following SQL in your MySQL client (e.g., phpMyAdmin, MySQL Workbench, or command line):

```sql
-- Додавання полів для підтвердження email
ALTER TABLE users 
ADD COLUMN is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN verification_code VARCHAR(6),
ADD COLUMN code_expiry DATETIME;

-- Оновлення існуючих користувачів як підтверджених
UPDATE users SET is_verified = TRUE WHERE is_verified IS NULL;
```

Or run this command in MySQL command line:
```bash
mysql -u root -p TaskFlow < backend/migrations/add_email_verification.sql
```

### 3. Restart Backend Server

Stop the current backend server and restart it:
```bash
cd backend
npm start
```

The server will now load the email configuration from `.env`.

### 4. Test the Flow

1. **Register a new user:**
   - Username: 3-20 characters, letters/numbers/underscores only
   - Password: minimum 8 characters, must have uppercase, lowercase, and digit
   - Email: your valid email address

2. **Check your email:**
   - You should receive an email with a 6-digit code
   - Check spam folder if not in inbox
   - Code is valid for 15 minutes

3. **Verify email:**
   - Enter the 6-digit code
   - Click "Підтвердити Email"
   - You'll be logged in and redirected to dashboard

4. **Test unverified login:**
   - Try logging in with unverified account
   - Should show verification screen instead

5. **Test resend code:**
   - Click "Відправити код ще раз"
   - New code should be sent to email

## 📋 Validation Rules

### Username
- **Length:** 3-20 characters
- **Allowed characters:** Letters (a-z, A-Z), numbers (0-9), underscore (_)
- **Examples:**
  - ✅ `john_doe`
  - ✅ `user123`
  - ❌ `ab` (too short)
  - ❌ `user@name` (special characters not allowed)

### Password
- **Minimum length:** 8 characters
- **Required:** At least one uppercase letter
- **Required:** At least one lowercase letter
- **Required:** At least one digit
- **Examples:**
  - ✅ `Password123`
  - ✅ `MyPass99`
  - ❌ `password` (no uppercase, no digit)
  - ❌ `Pass1` (too short)

### Email
- Standard email format validation
- Must have @ symbol and valid domain

## 🎨 Features Implemented

### Register Page
- Real-time password strength indicator (Weak/Medium/Strong)
- Username and password format hints
- Frontend validation before submission
- Error messages displayed inline
- Loading states on submission

### Verification Page
- Clean UI with gradient background
- 6-digit code input with auto-formatting
- Verify button (disabled until 6 digits entered)
- Resend code button
- Error and success messages
- Tips section about checking spam folder

### Login Page
- Handles unverified users automatically
- Shows verification screen if account not verified
- Error messages for invalid credentials
- Loading states

## 🔧 Troubleshooting

### Email Not Sending
- Check `.env` has correct EMAIL_USER and EMAIL_PASS
- Verify EMAIL_PASS is an app password, not your regular password
- Check console logs in backend for errors
- Try sending test email to verify SMTP settings

### Code Not Working
- Codes expire after 15 minutes
- Use "Resend Code" to get a new one
- Check that you're entering exactly 6 digits
- Verify backend is running and connected to database

### Database Errors
- Make sure migration SQL has been executed
- Check that database name is correct (TaskFlow)
- Verify database connection in `.env`

### Frontend Errors
- Check browser console for errors
- Verify backend is running on port 5000
- Check that axios requests are going to correct URL

## 📁 Modified Files

### Backend
- `backend/utils/emailService.js` (NEW)
- `backend/controllers/authController.js` (MODIFIED)
- `backend/routes/authRoutes.js` (MODIFIED)
- `backend/migrations/add_email_verification.sql` (NEW)

### Frontend
- `src/components/VerifyEmail.jsx` (NEW)
- `src/components/Register.jsx` (MODIFIED)
- `src/components/Login.jsx` (MODIFIED)
- `src/api.js` (MODIFIED)

### Configuration
- `.env` (MODIFIED)
- `.env.example` (NEW - in backend folder)

## 🎯 Next Steps

After completing the setup:
1. Test the complete registration flow
2. Verify email delivery is working
3. Test password validation rules
4. Test username validation rules
5. Test code expiry (wait 15+ minutes)
6. Test resend code functionality
7. Test unverified user login flow

## 📞 Support

If you encounter any issues:
1. Check backend console logs for errors
2. Check browser console for frontend errors
3. Verify all environment variables are set
4. Ensure database migration was successful
5. Test email sending with a simple test script if needed
