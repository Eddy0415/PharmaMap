# Admin Management Scripts

This directory contains scripts to manage admin users in the PharmaMap system.

## Prerequisites

- Node.js installed
- MongoDB connection configured in `.env` file
- User must exist in the database before being promoted to admin

## Available Scripts

### 1. List All Users

View all users in the database with their email, name, type, and creation date.

```bash
npm run admin:list
```

Or directly:
```bash
node scripts/listUsers.js
```

**Output Example:**
```
✅ Connected to MongoDB

Found 5 user(s):

Email                                    Name                          Type           Created
----------------------------------------------------------------------------------------------------
admin@example.com                        Admin User                    admin          12/15/2024
user@example.com                          John Doe                      customer       12/10/2024
pharmacy@example.com                       Pharmacy Owner                pharmacist     12/08/2024
```

### 2. Create Admin User

Promote an existing user to admin by their email address.

```bash
npm run admin:create <email>
```

Or directly:
```bash
node scripts/createAdmin.js <email>
```

**Example:**
```bash
npm run admin:create user@example.com
```

**Output:**
```
✅ Connected to MongoDB
✅ Successfully set user "John Doe" (user@example.com) as admin
   User ID: 507f1f77bcf86cd799439011
   User Type: admin
```

## Alternative Methods

### Method 1: Using MongoDB Compass or MongoDB Shell

1. Connect to your MongoDB database
2. Navigate to the `users` collection
3. Find the user document by email
4. Update the `userType` field to `"admin"`

**MongoDB Shell Command:**
```javascript
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { userType: "admin" } }
)
```

### Method 2: Using MongoDB Compass (GUI)

1. Open MongoDB Compass
2. Connect to your database
3. Select the `users` collection
4. Find the user by email
5. Edit the document
6. Change `userType` from `"customer"` or `"pharmacist"` to `"admin"`
7. Save the document

### Method 3: Using the Admin API (if you already have an admin)

If you already have an admin user, you can use the admin API to update users:

```javascript
PUT /api/admin/users/:id
{
  "userType": "admin"
}
```

## Important Notes

- ⚠️ **Security**: Admin users have full access to all data and can delete users, pharmacies, medications, orders, and reviews
- 🔒 **First Admin**: The first admin must be created using one of the methods above (script, MongoDB, etc.)
- ✅ **Verification**: After creating an admin, verify by logging in and accessing `/admin` route
- 📧 **Email**: Make sure the email matches exactly (case-insensitive, but must exist in database)

## Troubleshooting

### "User not found" Error
- Make sure the user exists in the database
- Check the email spelling
- Verify the user was created through the registration process

### "MongoDB Connection Error"
- Check your `.env` file has the correct `MONGODB_URI`
- Ensure MongoDB is running
- Verify network connectivity

### "Permission Denied" Error
- Make sure you have write permissions to the database
- Check MongoDB user permissions

## Security Best Practices

1. **Limit Admin Users**: Only create admin users for trusted personnel
2. **Strong Passwords**: Ensure admin users have strong Firebase authentication passwords
3. **Audit Logs**: Consider adding logging for admin actions
4. **Regular Review**: Periodically review admin user list and remove unnecessary admins

