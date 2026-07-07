# 🎬 Movie Ticket Booking System

A comprehensive online movie ticket booking platform built with React (frontend) and Spring Boot (backend). Users can browse movies, select theatres and showtimes, choose seats, order food, and complete payments securely. The system includes an admin dashboard for managing movies, theatres, shows, food inventory, users, and complaints, with real‑time analytics and a customizable dark/light theme.

---

## 📖 Description

This full‑stack application provides a seamless ticket booking experience for moviegoers. It integrates a modern React frontend with a Spring Boot REST API and a MySQL database. Key functionalities include:

- **User authentication** (email/password + Google OAuth) with JWT tokens.
- **Movie browsing** with filtering by genre and language.
- **Theatre selection** with dynamic showtime scheduling.
- **Interactive seat layout** with real‑time availability (auto‑generated from screen configurations).
- **Food & beverage ordering** before checkout.
- **Secure payment** via Razorpay (supports cards, UPI, net banking, and wallet).
- **Wallet system** for quick top‑ups and payments.
- **PDF ticket generation** with full order summary.
- **Admin dashboard** with analytics (revenue, food sales, movie popularity), and full CRUD for movies, theatres, screens, shows, food items, users, and complaints.
- **Theme system** with Light, Dark, and Custom modes (persisted in `localStorage`).

The interface is fully responsive and features a glassmorphism design with smooth animations and hover effects.

---

## ✨ Features

### 👤 User Features
- **Browse & Search Movies** – Filter by genre, language, and release date.
- **Movie Details** – View synopsis, cast, duration, and poster/banner images.
- **Theatre & Showtime Selection** – Choose from available theatres and showtimes (advance booking up to 7 days).
- **Interactive Seat Selection** – Visual seat map with real‑time availability; seats are grouped by category (Executive, Premium, etc.) with dynamic pricing.
- **Food Ordering** – Pre‑order snacks and beverages with quantity controls.
- **Secure Payment** – Razorpay integration with multiple payment options; wallet balance can be applied.
- **Wallet Management** – Add money via Razorpay and use balance for bookings.
- **Booking History** – View all past bookings with details.
- **PDF Ticket Download** – Generate a branded e‑ticket with QR‑like styling.
- **Support** – Submit complaints and track their status.
- **Theme Customization** – Switch between Light, Dark, or define custom colours.

### 👨‍💼 Admin Features
- **Dashboard Analytics** – Revenue trends (daily/weekly), food sales, most watched movies, and user statistics.
- **Movie Management** – Add, edit, delete movies (with poster and banner URLs).
- **Theatre Management** – Register theatres, add screens, and configure seat layouts (rows, columns, per‑row pricing).
- **Show Scheduling** – Schedule single or batch shows with conflict detection (3‑hour buffer between shows on the same screen).
- **Seat Sync** – Automatically generate or sync show seats based on screen layout.
- **Food Inventory** – Manage food items (name, price, description, availability, image).
- **User Management** – View, edit, verify users, and change passwords.
- **Booking Oversight** – View all bookings with payment details.
- **Complaint Resolution** – Respond to user complaints and update status.

---

## 🛠️ Tech Stack

| Layer        | Technology                                      |
|--------------|-------------------------------------------------|
| **Frontend** | React 18, Vite, React Router 6, React Bootstrap, Axios |
| **Charts**   | Recharts                                        |
| **PDF**      | html2canvas + jsPDF                             |
| **Auth**     | JWT (via Spring Security), Google OAuth         |
| **Payments** | Razorpay                                        |
| **State**    | React Context API (Auth, Theme)                 |
| **Styling**  | CSS variables, Bootstrap, custom glassmorphism |
| **Build**    | Vite                                            |
| **Backend**  | Spring Boot, Spring Security, JPA/Hibernate, MySQL |
| **API**      | RESTful with JSON payloads                      |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn
- MySQL (or any relational database)
- Backend Spring Boot application (see [Backend Setup](#backend-setup))

### Frontend Setup

# Install dependencies
npm install

# Navigate to backend folder
cd ../backend

# Update application.properties with your database and Razorpay credentials
# Run the Spring Boot application
mvn spring-boot:run

frontend/
├── public/
└── src/
    ├── components/
    │   ├── AuthModal.jsx           # Login/Register modal
    │   ├── Footer.jsx              # Global footer
    │   ├── MovieCard.jsx           # Movie card component
    │   ├── NavigationBar.jsx       # Main navbar with user actions
    │   ├── Sidebar.jsx             # Collapsible sidebar (admin/user)
    │   ├── ThemeToggle.jsx         # Theme switcher button
    │   └── TopBar.jsx              # Top bar for admin pages
    ├── context/
    │   ├── AuthContext.jsx         # Authentication state (token, user)
    │   └── ThemeContext.jsx        # Theme state (light/dark/custom)
    ├── pages/
    │   ├── HomePage.jsx            # Landing page with carousel
    │   ├── MoviesPage.jsx          # Movie listing with filters
    │   ├── MovieDetailsPage.jsx    # Movie details & book button
    │   ├── TheatreSelectionPage.jsx# Showtimes by movie/date
    │   ├── SeatLayoutPage.jsx      # Interactive seat map
    │   ├── FoodSelectionPage.jsx   # Food ordering
    │   ├── PaymentPage.jsx         # Payment & wallet
    │   ├── ConfirmationPage.jsx    # Booking confirmation & PDF
    │   ├── AdminDashboard.jsx      # Full admin panel
    │   ├── UserDashboard.jsx       # User profile & booking history
    │   ├── UserComplaints.jsx      # Complaint submission & tracking
    │   ├── TheatresPage.jsx        # Theatre listing
    │   ├── AboutUs.jsx
    │   ├── ContactUs.jsx
    │   ├── TermsConditions.jsx
    │   └── PrivacyPolicy.jsx
    ├── services/
    │   └── api.js                  # Axios instance with all API calls
    ├── App.jsx                     # Main App with routing and layout
    ├── App.css                     # Global styles (Bootstrap overrides)
    ├── index.css                   # Additional styles (themes, dashboard)
    └── main.jsx                    # Entry point with providers


    🔌 API Endpoints
The frontend communicates with the backend via the following REST endpoints (base URL: /api). All requests except login/register require a JWT token in the Authorization header.

Authentication & Users
Method	Endpoint	Description
POST	/users/login	Login with email/password
POST	/users/google-login	Google OAuth login
POST	/users/add	Register new user
PUT	/users/update/{id}	Update user profile
PUT	/users/change-password/{id}	Change user password
PUT	/users/verify-admin/{id}	Admin verify user
GET	/users/fetch/all	Get all users (admin)
Movies
Method	Endpoint	Description
GET	/movies/fetch/all	Get all movies
GET	/movies/fetch/{id}	Get movie by ID
POST	/movies/add	Add movie (admin)
PUT	/movies/update/{id}	Update movie (admin)
DELETE	/movies/delete/{id}	Delete movie (admin)
Theatres & Screens
Method	Endpoint	Description
GET	/theatres/fetch/all	Get all theatres
POST	/theatres/add	Register theatre (admin)
PUT	/theatres/update/{id}	Update theatre (admin)
DELETE	/theatres/delete/{id}	Delete theatre (admin)
GET	/screens/theatre/{theatreId}	Get screens by theatre
POST	/screens/add/{theatreId}	Add screen (admin)
PUT	/screens/update/{id}	Update screen (admin)
DELETE	/screens/delete/{id}	Delete screen (admin)
Shows & Seats
Method	Endpoint	Description
GET	/shows/fetch/all	Get all shows
GET	/shows/fetch/{id}	Get show by ID
GET	/shows/movie/{movieId}	Get shows for a movie
GET	/shows/{showId}/seats	Get all seats for a show
POST	/shows/add	Schedule show (admin)
PUT	/shows/update/{id}	Update show (admin)
DELETE	/shows/delete/{id}	Delete show (admin)
POST	/shows/{id}/sync-seats	Sync show seats with screen layout
Bookings
Method	Endpoint	Description
POST	/bookings/create	Create a new booking
PUT	/bookings/confirm/{id}	Confirm booking after payment
GET	/bookings/fetch/all	Get all bookings (admin)
GET	/bookings/fetch/{id}	Get booking by ID
DELETE	/bookings/delete/{id}	Delete booking (admin)
Payments
Method	Endpoint	Description
POST	/payments/add	Create payment record
POST	/payments/create-razorpay-order	Create Razorpay order
POST	/payments/verify-razorpay-payment	Verify Razorpay signature
PUT	/payments/confirm/{bookingId}	Confirm payment success
GET	/payments/fetch/booking/{bookingId}	Get payment by booking
Food
Method	Endpoint	Description
GET	/food/all	Get all food items
POST	/food/add	Add food item (admin)
PUT	/food/update	Update food item (admin)
DELETE	/food/delete/{id}	Delete food item (admin)
Wallet
Method	Endpoint	Description
GET	/wallet/fetch/user/{userId}	Get user wallet
POST	/wallet/add-money	Add money to wallet
Complaints
Method	Endpoint	Description
GET	/complaints/all	Get all complaints (admin)
GET	/complaints/user/{userId}	Get user complaints
POST	/complaints/save	Submit complaint
PUT	/complaints/update	Update complaint (admin)
DELETE	/complaints/delete/{id}	Delete complaint (admin)
Admin Dashboard
Method	Endpoint	Description
GET	/admin/dashboard	Dashboard statistics
GET	/admin/revenue/stats	Daily revenue data
GET	/admin/revenue/weekly	Weekly revenue data
GET	/admin/food/stats	Daily food sales data
GET	/admin/food/weekly	Weekly food sales data
GET	/admin/food/breakdown	Food item sales breakdown
GET	/admin/analytics/shows	Show analytics
🎨 Theming
The application supports three theme modes:

Light – Clean white/light grey background with dark text.

Dark – Deep navy background with light text (reduces eye strain).

Custom – User-defined primary, background, and text colours via a colour picker (stored in localStorage).

The theme is applied through CSS variables (e.g., --bg-color, --text-primary, --bms-red) defined in index.css. The ThemeContext injects the appropriate variables, and all components react accordingly.

🔐 Authentication
The authentication flow is JWT‑based:

User logs in via email/password or Google OAuth.

Backend returns a JWT token and user details.

Token is stored in localStorage and attached to all subsequent API requests via Axios interceptors.

Protected routes (e.g., /dashboard, /admin) check for token presence; unauthenticated users are redirected to the home page (login modal is triggered).

Demo Credentials (if backend seed data exists):

Email: Admin@gmail.com / Password: Admin (Admin role)

Email: rahulpotdar2167@gmail.com / Password: 123123 (User role)

📄 License
This project is for educational purposes. You are free to use, modify, and distribute it for personal or commercial use with proper attribution.

🤝 Contributing
Contributions are welcome! Please open an issue or submit a pull request.

📬 Contact
Project Maintainer: Rahul Potdar

Gmail Id: [rahulpotdar2167@gmail.com]
GitHub Issues: [https://github.com/Rahul2167/BookMyShowClone/issues]

Made with ❤️ for movie lovers everywhere.



# Start development server
npm run dev
