# AusDrive Premium - Complete API Reference

## Base URL
```
http://localhost:3000
```

## Authentication
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 🔐 Authentication Endpoints

### POST /api/auth/register
Register a new user account.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123"
}
```

**Response (201):**
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

### POST /api/auth/login
Login with email and password.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "Password123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER",
    "branch": "Sydney"
  }
}
```

**Note:** Session is automatically created on successful login.

---

### GET /api/auth/me
Get current authenticated user information.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER",
    "branch": "Sydney",
    "isVerified": true
  }
}
```

---

## 📱 Session Management Endpoints

### GET /api/sessions
Get all active sessions for the current user.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200):**
```json
{
  "sessions": [
    {
      "id": "session-uuid-1",
      "deviceName": "Chrome on Windows",
      "deviceType": "web",
      "ipAddress": "192.168.1.100",
      "lastActivityAt": "2026-05-01T10:30:00Z",
      "createdAt": "2026-04-30T15:20:00Z"
    },
    {
      "id": "session-uuid-2",
      "deviceName": "Safari on iPhone",
      "deviceType": "mobile",
      "ipAddress": "192.168.1.101",
      "lastActivityAt": "2026-05-01T09:15:00Z",
      "createdAt": "2026-04-29T12:00:00Z"
    }
  ],
  "total": 2
}
```

---

### DELETE /api/sessions/:sessionId
Terminate a specific session.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**URL Parameters:**
- `sessionId` (string, required) - UUID of the session to terminate

**Response (200):**
```json
{
  "message": "Session terminated successfully"
}
```

**Error Responses:**
- `401` - Unauthorized (no JWT token)
- `403` - Forbidden (session belongs to another user)
- `404` - Session not found

---

### DELETE /api/sessions
Logout from all devices (terminate all active sessions).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200):**
```json
{
  "message": "All sessions terminated successfully"
}
```

---

## 👤 User Account Management Endpoints

### GET /api/users/profile
Get current user's profile information.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+61412345678",
    "profileImage": "https://example.com/image.jpg",
    "licenseNumber": "ABC123456",
    "licenseExpiry": "2026-12-31T00:00:00Z",
    "role": "USER",
    "isVerified": true,
    "createdAt": "2026-04-01T10:00:00Z",
    "updatedAt": "2026-05-01T10:00:00Z"
  }
}
```

---

### PUT /api/users/profile
Update user profile information.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request (all fields optional):**
```json
{
  "name": "Jane Doe",
  "phone": "+61412345678",
  "profileImage": "https://example.com/new-image.jpg",
  "licenseNumber": "XYZ789012",
  "licenseExpiry": "2027-12-31T00:00:00Z"
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "john@example.com",
    "phone": "+61412345678",
    "profileImage": "https://example.com/new-image.jpg",
    "licenseNumber": "XYZ789012",
    "licenseExpiry": "2027-12-31T00:00:00Z",
    "role": "USER",
    "isVerified": true,
    "updatedAt": "2026-05-01T11:00:00Z"
  }
}
```

**Error Responses:**
- `400` - Invalid input (e.g., invalid URL for profileImage)
- `401` - Unauthorized
- `404` - User not found

---

### POST /api/users/change-password
Change user password.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword456"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number

**Error Responses:**
- `400` - Invalid password format or missing fields
- `401` - Current password is incorrect
- `401` - Unauthorized (no JWT token)

---

### DELETE /api/users/account
Delete user account permanently.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request:**
```json
{
  "password": "UserPassword123"
}
```

**Response (200):**
```json
{
  "message": "Account deleted successfully"
}
```

**Important Notes:**
- This action is irreversible
- All user data will be deleted (bookings, reviews, etc.)
- Requires password confirmation for security
- User will be logged out from all devices

**Error Responses:**
- `400` - Password is required
- `401` - Password is incorrect
- `401` - Unauthorized (no JWT token)

---

## 🚗 Booking Endpoints

### POST /api/bookings
Create a new booking.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request:**
```json
{
  "carId": "car-uuid",
  "pickupDate": "2026-05-10T10:00:00Z",
  "dropoffDate": "2026-05-15T10:00:00Z",
  "pickupLocation": "Sydney Airport",
  "dropoffLocation": "Sydney CBD",
  "specialRequests": "Extra insurance needed"
}
```

**Response (201):**
```json
{
  "booking": {
    "id": "booking-uuid",
    "userId": "user-uuid",
    "carId": "car-uuid",
    "status": "PENDING_PAYMENT",
    "pickupDate": "2026-05-10T10:00:00Z",
    "dropoffDate": "2026-05-15T10:00:00Z",
    "pickupLocation": "Sydney Airport",
    "dropoffLocation": "Sydney CBD",
    "totalPrice": 500.00,
    "pricePerDay": 100.00,
    "specialRequests": "Extra insurance needed",
    "createdAt": "2026-05-01T10:00:00Z"
  },
  "paymentRequired": true,
  "message": "Booking created. Payment required before confirmation."
}
```

**Error Responses:**
- `400` - Invalid input or missing fields
- `409` - Car is not available (double-booking or maintenance)
- `401` - Unauthorized

---

### GET /api/bookings
Get user's bookings.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `status` (optional) - Filter by status (PENDING_PAYMENT, CONFIRMED, ACTIVE, COMPLETED, CANCELLED)
- `limit` (optional) - Number of results (default: 10)
- `offset` (optional) - Pagination offset (default: 0)

**Response (200):**
```json
{
  "bookings": [
    {
      "id": "booking-uuid",
      "carId": "car-uuid",
      "status": "CONFIRMED",
      "pickupDate": "2026-05-10T10:00:00Z",
      "dropoffDate": "2026-05-15T10:00:00Z",
      "totalPrice": 500.00,
      "createdAt": "2026-05-01T10:00:00Z"
    }
  ],
  "total": 1
}
```

---

## 🚙 Car Endpoints

### GET /api/cars
Get available cars.

**Query Parameters:**
- `city` (optional) - Filter by city
- `date` (optional) - Check availability for specific date
- `limit` (optional) - Number of results (default: 10)
- `offset` (optional) - Pagination offset (default: 0)

**Response (200):**
```json
{
  "cars": [
    {
      "id": "car-uuid",
      "make": "Toyota",
      "model": "Camry",
      "year": 2024,
      "rego": "ABC123",
      "color": "Silver",
      "seats": 5,
      "transmission": "Automatic",
      "fuelType": "Petrol",
      "dailyRate": 100.00,
      "city": "Sydney",
      "location": "Sydney Airport",
      "rating": 4.5,
      "isAvailable": true,
      "features": "[\"GPS\", \"WiFi\", \"Backup Camera\"]"
    }
  ],
  "total": 1
}
```

---

## 💳 Payment Endpoints

### POST /api/payments/create-intent
Create a Stripe payment intent.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request:**
```json
{
  "bookingId": "booking-uuid",
  "amount": 50000,
  "currency": "AUD"
}
```

**Response (200):**
```json
{
  "clientSecret": "pi_1234567890_secret_abcdefghij",
  "paymentIntentId": "pi_1234567890",
  "amount": 50000,
  "currency": "AUD"
}
```

---

### POST /api/payments/webhook
Stripe webhook for payment confirmation.

**Headers:**
```
Content-Type: application/json
Stripe-Signature: <signature>
```

**Note:** This endpoint is called by Stripe, not by clients.

---

## 📊 Dashboard Endpoints

### GET /api/dashboard/stats
Get dashboard statistics (admin only).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200):**
```json
{
  "stats": {
    "totalBookings": 150,
    "totalRevenue": 15000.00,
    "activeBookings": 12,
    "totalCars": 50,
    "availableCars": 35,
    "totalUsers": 200
  }
}
```

---

## 🗺️ GPS Endpoints

### GET /api/gps/live/:carId
Get live GPS location of a car.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**URL Parameters:**
- `carId` (string, required) - UUID of the car

**Response (200):**
```json
{
  "carId": "car-uuid",
  "latitude": -33.8688,
  "longitude": 151.2093,
  "speed": 60,
  "accuracy": 10,
  "timestamp": "2026-05-01T10:30:00Z"
}
```

---

## Error Handling

### Standard Error Response
```json
{
  "error": "Error message describing what went wrong"
}
```

### HTTP Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing or invalid JWT)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., double-booking)
- `500` - Internal Server Error

---

## Rate Limiting

- Login endpoint: 10 attempts per minute per IP
- Other endpoints: No rate limit (implement as needed)

---

## Pagination

For endpoints that return lists:
- `limit` - Number of results (default: 10, max: 100)
- `offset` - Pagination offset (default: 0)
- `total` - Total number of results

Example:
```
GET /api/bookings?limit=20&offset=40
```

---

## Timestamps

All timestamps are in ISO 8601 format (UTC):
```
2026-05-01T10:30:00Z
```

---

## Examples

### Complete Login Flow
```bash
# 1. Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123"
  }'

# 2. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123"
  }'

# Response includes JWT token
# Save token for subsequent requests
TOKEN="eyJhbGciOiJIUzI1NiIs..."

# 3. Get user profile
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer $TOKEN"

# 4. View sessions
curl -X GET http://localhost:3000/api/sessions \
  -H "Authorization: Bearer $TOKEN"
```

### Complete Booking Flow
```bash
# 1. Get available cars
curl -X GET "http://localhost:3000/api/cars?city=Sydney"

# 2. Create booking
curl -X POST http://localhost:3000/api/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "carId": "car-uuid",
    "pickupDate": "2026-05-10T10:00:00Z",
    "dropoffDate": "2026-05-15T10:00:00Z",
    "pickupLocation": "Sydney Airport",
    "dropoffLocation": "Sydney CBD"
  }'

# 3. Create payment intent
curl -X POST http://localhost:3000/api/payments/create-intent \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "booking-uuid",
    "amount": 50000,
    "currency": "AUD"
  }'

# 4. Complete payment in Stripe
# (Use clientSecret from response)

# 5. Booking automatically confirmed after payment
```

---

## Support

For API issues or questions:
1. Check this documentation
2. Review error messages
3. Check server logs
4. Contact support team

---

**Last Updated:** May 1, 2026
**Version:** 1.0.0
