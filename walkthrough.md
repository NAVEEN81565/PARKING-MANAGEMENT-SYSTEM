# Backend Implementation Complete!

> [!TIP]
> **Recent Fix**: We resolved the "500 Internal Server Error" appearing in the Django Admin portal (`/admin/parking/parkingslot/add/`). This was caused by an incompatibility between Python 3.14.3 and Django 5.0.6 involving internal template context processing. The Django version has been successfully upgraded to **6.0.4** to fully support Python 3.14, and the backend dev server is back online!

I have built the entire Django backend precisely matching your React frontend's requirements. 

## What Was Built:

1. **Project Setup (`parking_backend`)**: Configured with MySQL, Django REST Framework, SimpleJWT, and CORS.
2. **`users` App**:
   - Custom `User` model (`email` as login, role `admin/employee`).
   - Authentication APIs: Login (returns embedded user info + JWT), Register, Logout.
   - Profile management APIs (read/update info and password).
   - Admin employee CRUD APIs.
3. **`parking` App**:
   - `ParkingSlot`, `Booking`, and `Fine` models.
   - Slot status APIs.
   - Booking creation (with atomic transactions to prevent double-booking for the same slot).
   - Checkout / Exit logic that calculates fines exactly as your frontend does (₹10/hr over due exit time).
   - History APIs with filtering and CSV export.
   - Secure QR token generation and validation flow.
4. **Custom Command**: A `seed_slots` command to automatically generate `A01-A30` and `B01-B20` into the database.

---

## 🚀 How to Run and Test the Backend

Follow these steps to spin up the completed backend on your local machine.

### 1. Database Setup
Ensure you have MySQL installed and running. Create a new database:
```sql
CREATE DATABASE parking_db CHARACTER SET utf8mb4;
```

### 2. Environment Variables
In the `backend` folder, duplicate the `.env.example` file and rename it to `.env`. Fill in your MySQL credentials:
```env
DB_NAME=parking_db
DB_USER=root
DB_PASSWORD=your_mysql_password
```

### 3. Install Dependencies
Open a terminal in the `backend` folder and run:
```bash
# Optional: create a virtual environment first
# python -m venv venv
# source venv/Scripts/activate  (on Windows)

pip install -r requirements.txt
```

### 4. Run Migrations & Setup Data
```bash
# 1. Apply the database schema
python manage.py makemigrations
python manage.py migrate

# 2. Seed the 50 parking slots (A01-A30, B01-B20)
python manage.py seed_slots

# 3. Create your Admin user
python manage.py createsuperuser
# (Enter admin@parksys.com, Admin, and a password)
```

### 5. Start the Server
```bash
python manage.py runserver
```
The backend is now live at `http://127.0.0.1:8000/`. You can immediately log into the Django Admin panel at `http://127.0.0.1:8000/admin/` with your superuser account.

---

## 🧪 Testing with Postman

Here are sample requests you can use to test the APIs independently of your frontend.

### 1. Login (Get JWT Token)
- **POST** `http://127.0.0.1:8000/api/v1/auth/login/`
- **Body** (Raw JSON):
```json
{
    "email": "admin@parksys.com",
    "password": "yourpassword"
}
```
*Copy the `access` token from the response. For all subsequent requests, go to the **Authorization** tab in Postman, select **Bearer Token**, and paste this token.*

### 2. View Parking Slots
- **GET** `http://127.0.0.1:8000/api/v1/parking/slots/`
- *(Requires Bearer Token)*

### 3. Book a Slot
- **POST** `http://127.0.0.1:8000/api/v1/parking/bookings/`
- **Body** (Raw JSON):
```json
{
    "slot_id": "A05",
    "vehicle_no": "KA01AB1234",
    "vehicle_type": "car",
    "customer_phone": "9876543210",
    "scheduled_exit_time": "2026-04-09T16:00:00Z"
}
```

### 4. Exit a Vehicle (Test Fine logic)
- **POST** `http://127.0.0.1:8000/api/v1/parking/bookings/<booking_id>/exit/`
- *(Requires Bearer Token)*

### 5. Validate a QR Code
- **POST** `http://127.0.0.1:8000/api/v1/parking/qr/validate/`
- **Body** (Raw JSON):
```json
{
    "qr_token": "your_64_character_hex_token"
}
```
