-- Migration script to update old user emails to new domain
-- Run this script if you have existing users with @arits.ltd emails

-- Update user emails from @arits.ltd to @southerneleven.com
UPDATE users 
SET email = REPLACE(email, '@arits.ltd', '@southerneleven.com')
WHERE email LIKE '%@arits.ltd';

-- Verify the changes
SELECT id, email, "fullName", "createdAt" 
FROM users 
WHERE email LIKE '%@southerneleven.com';
