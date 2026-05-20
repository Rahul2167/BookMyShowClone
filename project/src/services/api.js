import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
});

// Intercept requests to add token
API.interceptors.request.use((req) => {
    const token = localStorage.getItem('token');
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

// Auth & Users
export const login = (credentials) => API.post('/users/login', credentials);
export const googleLogin = (tokenPayload) => API.post('/users/google-login', tokenPayload);
export const register = (userData) => API.post('/users/add', userData);
export const getUsers = () => API.get('/users/fetch/all');
export const getUserById = (id) => API.get(`/users/fetch/${id}`);
export const updateUser = (id, userData) => API.put(`/users/update/${id}`, userData);
export const deleteUser = (id) => API.delete(`/users/delete/${id}`);
export const changePassword = (id, newPassword) => API.put(`/users/change-password/${id}`, { newPassword });
export const verifyUserAdmin = (id) => API.put(`/users/verify-admin/${id}`);

// Movies
export const getMovies = () => API.get('/movies/fetch/all');
export const getMovieById = (id) => API.get(`/movies/fetch/${id}`);
export const searchMovies = (title) => API.get(`/movies/search`, { params: { title } });
export const addMovie = (movieData) => API.post('/movies/add', movieData);
export const updateMovie = (id, movieData) => API.put(`/movies/update/${id}`, movieData);
export const deleteMovie = (id) => API.delete(`/movies/delete/${id}`);

// Theatres
export const getTheatres = () => API.get('/theatres/fetch/all');
export const getTheatreById = (id) => API.get(`/theatres/fetch/${id}`);
export const addTheatre = (theatreData) => API.post('/theatres/add', theatreData);
export const updateTheatre = (id, theatreData) => API.put(`/theatres/update/${id}`, theatreData);
export const deleteTheatre = (id) => API.delete(`/theatres/delete/${id}`);

// Shows
export const getShows = () => API.get('/shows/fetch/all');
export const getShowById = (showId) => API.get(`/shows/fetch/${showId}`);
export const getShowsByMovie = (movieId) => API.get(`/shows/movie/${movieId}`);
export const getShowSeats = (showId) => API.get(`/shows/${showId}/seats`);
export const addShow = (showData) => API.post('/shows/add', showData);
export const updateShow = (id, showData) => API.put(`/shows/update/${id}`, showData);
export const deleteShow = (id) => API.delete(`/shows/delete/${id}`);
export const syncShowSeats = (id) => API.post(`/shows/${id}/sync-seats`);

// Screens
export const getScreensByTheatre = (theatreId) => API.get(`/screens/theatre/${theatreId}`);
export const addScreen = (theatreId, screenData) => API.post(`/screens/add/${theatreId}`, screenData);
export const updateScreen = (id, screenData) => API.put(`/screens/update/${id}`, screenData);
export const deleteScreen = (id) => API.delete(`/screens/delete/${id}`);

// Booking
export const getBookings = () => API.get('/bookings/fetch/all');
export const getBookingById = (id) => API.get(`/bookings/fetch/${id}`);
export const addBooking = (bookingData) => API.post('/bookings/create', bookingData);
export const confirmBooking = (id) => API.put(`/bookings/confirm/${id}`);
export const deleteBooking = (id) => API.delete(`/bookings/delete/${id}`);

// Food Items
export const getFoodItems = () => API.get('/food/all');
export const getFoodItemsByTheatre = (theatreId) => API.get(`/food/theatre/${theatreId}`);
export const addFoodItem = (foodData) => API.post('/food/add', foodData);
export const updateFoodItem = (foodData) => API.put('/food/update', foodData);
export const deleteFoodItem = (id) => API.delete(`/food/delete/${id}`);

// Payments
export const initiatePayment = (bookingId, amount, method) => API.post('/payments/add', null, { params: { bookingId, amount, method } });
export const createRazorpayOrder = (bookingId, amount) => API.post('/payments/create-razorpay-order', null, { params: { bookingId, amount } });
export const verifyRazorpayPayment = (payload) => API.post('/payments/verify-razorpay-payment', payload);
export const addPayment = (bookingId, amount, method) => API.post('/payments/add', null, { params: { bookingId, amount, method } });
export const getPaymentByBookingId = (bookingId) => API.get(`/payments/fetch/booking/${bookingId}`);
export const confirmPayment = (bookingId, transactionId) => API.put(`/payments/confirm/${bookingId}`, null, { params: transactionId ? { transactionId } : {} });


// Wallets
export const getWalletByUserId = (userId) => API.get(`/wallet/fetch/user/${userId}`);
export const addWalletMoney = (userId, amount, description) => 
    API.post('/wallet/add-money', null, { params: { userId, amount, description } });

// Admin
export const getAdminDashboard = () => API.get('/admin/dashboard');
export const getRevenueStats = () => API.get('/admin/revenue/stats');
export const getWeeklyRevenueStats = () => API.get('/admin/revenue/weekly');
export const getFoodStats = () => API.get('/admin/food/stats');
export const getWeeklyFoodStats = () => API.get('/admin/food/weekly');
export const getFoodBreakdown = () => API.get('/admin/food/breakdown');
export const getShowAnalytics = () => API.get('/admin/analytics/shows');

// Complaints
export const getAllComplaints = () => API.get('/complaints/all');
export const getUserComplaints = (userId) => API.get(`/complaints/user/${userId}`);
export const submitComplaint = (complaintData) => API.post('/complaints/save', complaintData);
export const updateComplaint = (complaintData) => API.put('/complaints/update', complaintData);
export const deleteComplaint = (id) => API.delete(`/complaints/delete/${id}`);

export default API;
