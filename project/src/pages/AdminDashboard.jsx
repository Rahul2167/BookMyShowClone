import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Table, Nav, Tab, Modal, Badge, ProgressBar } from 'react-bootstrap';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { 
    Users, Film, MapPin, Tv, Calendar, DollarSign, TrendingUp, Plus, Trash2, Edit, ChevronRight, Activity, ArrowLeft, LogOut, Ticket, Utensils, MessageSquare, Eye, Key, CheckCircle
} from 'lucide-react';
import * as API from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { 
        theme, setTheme, primaryColor, setPrimaryColor,
        customBg, setCustomBg, customText, setCustomText 
    } = useTheme();
    const [stats, setStats] = useState({
        totalUsers: 0, totalMovies: 0, totalTheatres: 0, totalBookings: 0, 
        totalRevenue: 0, totalScreens: 0, totalSeats: 0
    });
    const [revenueData, setRevenueData] = useState([]);
    const [foodData, setFoodData] = useState([]);
    const [foodBreakdown, setFoodBreakdown] = useState([]);
    const [showAnalytics, setShowAnalytics] = useState([]);
    const [movies, setMovies] = useState([]);
    const [theatres, setTheatres] = useState([]);
    const [shows, setShows] = useState([]);
    const [users, setUsers] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [foodItems, setFoodItems] = useState([]);
    const [complaints, setComplaints] = useState([]);
    
    // Trend Toggles
    const [revenuePeriod, setRevenuePeriod] = useState('daily');
    const [foodPeriod, setFoodPeriod] = useState('daily');
    const [weeklyRevenueData, setWeeklyRevenueData] = useState([]);
    const [weeklyFoodData, setWeeklyFoodData] = useState([]);

    const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];
    
    // Calculate most watched movies from actual bookings list
    const pieData = (movies || []).map(movie => {
        const movieShows = (shows || []).filter(s => String(s.movieId) === String(movie.movieId));
        let revenue = 0;
        const totalTickets = movieShows.reduce((sum, s) => {
            const showBookings = (bookings || []).filter(b => 
                String(b.showId) === String(s.showId) && 
                (String(b.status).toUpperCase() === 'CONFIRMED' || String(b.status).toUpperCase() === 'PENDING')
            );
            revenue += showBookings.reduce((rSum, b) => rSum + (b.totalAmount || 0), 0);
            return sum + showBookings.reduce((bSum, b) => bSum + (b.showSeatIds?.length || 0), 0);
        }, 0);
        return { name: movie.title, value: totalTickets, showCount: movieShows.length, revenue };
    }).sort((a, b) => b.value - a.value || b.showCount - a.showCount)
      .slice(0, 5);

    const hasAnySales = pieData.some(item => item.value > 0);

    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    // Form States
    const [movieForm, setMovieForm] = useState({ title: '', description: '', language: '', genre: '', duration: '', posterUrl: '', bannerUrl: '', releaseDate: '' });
    const [theatreForm, setTheatreForm] = useState({ name: '', city: '', address: '', contactInfo: '' });
    const [showForm, setShowForm] = useState({ movieId: '', theatreId: '', screenId: '', startTime: '', selectedDate: '', showType: '2D' });
    const [foodForm, setFoodForm] = useState({ name: '', price: '', description: '', isAvailable: true, imageUrl: '' });
    const [availableScreens, setAvailableScreens] = useState([]);
    const [screenAvailability, setScreenAvailability] = useState({}); // { screenId: [show, ...] }
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [complaintResponse, setComplaintResponse] = useState({ id: null, resolution: '', status: 'RESOLVED' });
    
    // Admin Password State
    const [adminPasswordForm, setAdminPasswordForm] = useState({ userId: null, userName: '', newPassword: '' });
    const [userForm, setUserForm] = useState({ name: '', email: '', phone: '', password: '', isAdmin: false });

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        try {
            // Prepare payload
            const payload = {
                ...userForm,
                role: userForm.isAdmin ? 'ADMIN' : 'USER'
            };
            
            if (isEditing) {
                await API.updateUser(editingId, payload);
                showMessage('success', 'User profile updated!');
            } else {
                await API.register(payload);
                showMessage('success', 'New user registered!');
            }
            resetForms();
            fetchAllData();
        } catch (err) {
            console.error("User submit error:", err);
            showMessage('danger', isEditing ? 'Update failed.' : 'Registration failed: ' + (err?.response?.data || err.message));
        }
    };

    const handleAdminPasswordChange = async (e) => {
        e.preventDefault();
        try {
            await API.changePassword(adminPasswordForm.userId, adminPasswordForm.newPassword);
            setShowModal(null);
            setAdminPasswordForm({ userId: null, userName: '', newPassword: '' });
            if (window.notify) window.notify('Password Updated', `Credentials for ${adminPasswordForm.userName} have been updated.`, 'success');
            showMessage('success', 'User password updated successfully!');
        } catch (err) {
            showMessage('danger', 'Failed to update user password.');
        }
    };

    const handleComplaintResponse = async (e) => {
        e.preventDefault();
        try {
            await API.updateComplaint({
                complaintId: complaintResponse.id,
                resolution: complaintResponse.resolution,
                status: complaintResponse.status
            });
            if (window.notify) window.notify('Response Sent', `Feedback provided for complaint #${complaintResponse.id}`, 'success');
            showMessage('success', 'Response sent to user!');
            resetForms();
            fetchAllData();
        } catch (err) {
            showMessage('danger', 'Failed to send response.');
        }
    };

    // Build 7-day date options for advance booking
    const bookingDateOptions = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        d.setHours(0, 0, 0, 0);
        return d;
    });
    const toDateStr = (d) => {
        if (!d) return '';
        const date = typeof d === 'string' ? new Date(d) : d;
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    useEffect(() => {
        if (showForm.theatreId) {
            setAvailableScreens([]);
            setScreenAvailability({});
            API.getScreensByTheatre(showForm.theatreId)
                .then(res => {
                    const screens = res.data || [];
                    setAvailableScreens(screens);
                })
                .catch(err => {
                    console.error("Error fetching available screens:", err);
                    setAvailableScreens([]);
                });
        } else {
            setAvailableScreens([]);
            setScreenAvailability({});
        }
    }, [showForm.theatreId]);

    // Re-check availability when date or screens change
    useEffect(() => {
        if (!showForm.selectedDate || availableScreens.length === 0) {
            setScreenAvailability({});
            return;
        }
        setCheckingAvailability(true);
        // Filter all shows for the selected date and map by screenId
        const selectedDateStr = showForm.selectedDate;
        const availMap = {};
        availableScreens.forEach(screen => {
            const showsOnDate = (shows || []).filter(s => {
                const sDate = s.date ? s.date.substring(0, 10) : (s.startTime ? toDateStr(s.startTime) : '');
                return String(s.screenId) === String(screen.screenId) && sDate === selectedDateStr;
            });
            availMap[screen.screenId] = showsOnDate;
        });
        setScreenAvailability(availMap);
        setCheckingAvailability(false);
    }, [showForm.selectedDate, availableScreens, shows]);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [selectedTheatre, setSelectedTheatre] = useState(null);
    const [selectedScreen, setSelectedScreen] = useState(null);
    const [showModal, setShowModal] = useState(null); 
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [bookingDetailsLoading, setBookingDetailsLoading] = useState(false);

    const handleViewBooking = async (booking) => {
        setSelectedBooking(booking);
        setSelectedPayment(null);
        setShowModal('view-booking');
        try {
            setBookingDetailsLoading(true);
            const payRes = await API.getPaymentByBookingId(booking.bookingId);
            setSelectedPayment(payRes.data);
        } catch (err) {
            console.warn("Could not fetch payment details for booking", err);
        } finally {
            setBookingDetailsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [statsRes, revenueRes, weeklyRevenueRes, foodStatsRes, weeklyFoodRes, foodBreakdownRes, analyticsRes, moviesRes, theatresRes, showsRes, usersRes, bookingsRes, foodItemsRes, complaintsRes] = await Promise.all([
                API.getAdminDashboard().catch(() => ({ data: {} })),
                API.getRevenueStats().catch(() => ({ data: [] })),
                API.getWeeklyRevenueStats().catch(() => ({ data: [] })),
                API.getFoodStats().catch(() => ({ data: [] })),
                API.getWeeklyFoodStats().catch(() => ({ data: [] })),
                API.getFoodBreakdown().catch(() => ({ data: [] })),
                API.getShowAnalytics().catch(() => ({ data: [] })),
                API.getMovies().catch(() => ({ data: [] })),
                API.getTheatres().catch(() => ({ data: [] })),
                API.getShows().catch(() => ({ data: [] })),
                API.getUsers().catch(() => ({ data: [] })),
                API.getBookings().catch(() => ({ data: [] })),
                API.getFoodItems().catch(() => ({ data: [] })),
                API.getAllComplaints().catch(() => ({ data: [] }))
            ]);
            
            setStats(statsRes.data || {});
            setRevenueData(revenueRes.data || []);
            setFoodData(foodStatsRes.data || []);

            // Weekly Revenue Fallback
            let weeklyRev = weeklyRevenueRes.data || [];
            if (weeklyRev.length === 0 && (bookingsRes.data || []).length > 0) {
                const now = new Date();
                const manualWeekly = [];
                for (let i = 3; i >= 0; i--) {
                    const start = new Date(now);
                    start.setDate(now.getDate() - (now.getDay() + 6) % 7 - (i * 7));
                    start.setHours(0,0,0,0);
                    const end = new Date(start);
                    end.setDate(start.getDate() + 6);
                    end.setHours(23,59,59,999);
                    const revenue = (bookingsRes.data || []).filter(b => {
                        const bDate = new Date(b.bookingTime);
                        return b.status === 'CONFIRMED' && bDate >= start && bDate <= end;
                    }).reduce((sum, b) => sum + (b.totalAmount || 0), 0);
                    manualWeekly.push({ period: `Wk ${start.getMonth() + 1}/${start.getDate()}`, revenue });
                }
                weeklyRev = manualWeekly;
            }
            setWeeklyRevenueData(weeklyRev);

            // Weekly Food Fallback
            let weeklyFood = weeklyFoodRes.data || [];
            if (weeklyFood.length === 0 && (bookingsRes.data || []).length > 0) {
                const now = new Date();
                const manualWeeklyFood = [];
                for (let i = 3; i >= 0; i--) {
                    const start = new Date(now);
                    start.setDate(now.getDate() - (now.getDay() + 6) % 7 - (i * 7));
                    start.setHours(0,0,0,0);
                    const end = new Date(start);
                    end.setDate(start.getDate() + 6);
                    end.setHours(23,59,59,999);
                    let sales = 0;
                    bookingsRes.data.forEach(b => {
                        if (b.concessionOrders) {
                            b.concessionOrders.forEach(o => {
                                const oDate = new Date(b.bookingTime);
                                if (oDate >= start && oDate <= end) sales += (o.totalPrice || 0);
                            });
                        }
                    });
                    manualWeeklyFood.push({ period: `Wk ${start.getMonth() + 1}/${start.getDate()}`, sales });
                }
                weeklyFood = manualWeeklyFood;
            }
            setWeeklyFoodData(weeklyFood);
            
            // Calculate breakdown from API, with a fallback to manual calculation from bookings
            let breakdown = foodBreakdownRes.data || [];
            if (breakdown.length === 0 && (bookingsRes.data || []).length > 0) {
                const manualMap = {};
                bookingsRes.data.forEach(b => {
                    if (b.concessionOrders && b.concessionOrders.length > 0) {
                        b.concessionOrders.forEach(co => {
                            const name = (foodItemsRes.data || []).find(f => f.foodItemId === co.foodItemId)?.name || "Concession Item";
                            if (!manualMap[name]) manualMap[name] = { name, quantity: 0, revenue: 0 };
                            manualMap[name].quantity += (co.quantity || 0);
                            manualMap[name].revenue += (co.totalPrice || 0);
                        });
                    }
                });
                breakdown = Object.values(manualMap);
            }
            setFoodBreakdown(breakdown);

            setShowAnalytics(analyticsRes.data || []);
            setMovies(moviesRes.data || []);
            setTheatres(theatresRes.data || []);
            setShows(showsRes.data || []);
            setUsers(usersRes.data || []);
            setBookings(bookingsRes.data || []);
            setFoodItems(foodItemsRes.data || []);
            setComplaints(complaintsRes.data || []);
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
            showMessage('danger', 'Failed to connect to backend.');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type, message) => {
        setStatus({ type, message });
        setTimeout(() => setStatus({ type: '', message: '' }), 4000);
    };

    const resetForms = () => {
        setMovieForm({ title: '', description: '', language: '', genre: '', duration: '', posterUrl: '', bannerUrl: '', releaseDate: '' });
        setTheatreForm({ name: '', city: '', address: '', contactInfo: '' });
        setShowForm({ movieId: '', theatreId: '', screenId: '', startTime: '', showType: '2D' });
        setFoodForm({ name: '', price: '', description: '', isAvailable: true, imageUrl: '' });
        setAvailableScreens([]);
        setUserForm({ name: '', email: '', phone: '', password: '', isAdmin: false });
        setIsEditing(false);
        setEditingId(null);
        setShowModal(null);
    };

    const handleEditClick = (type, item) => {
        setIsEditing(true);
        if (type === 'movie') {
            setEditingId(item.movieId);
            setMovieForm({ 
                ...item, 
                releaseDate: item.releaseDate?.split('T')[0],
                bannerUrl: item.bannerUrl || ''
            });
            setShowModal('movie');
        } else if (type === 'theatre') {
            setEditingId(item.theatreId);
            setTheatreForm({ ...item });
            setShowModal('theatre');
        } else if (type === 'show') {
            setEditingId(item.showId);
            setShowForm({ 
                movieId: item.movieId, 
                theatreId: item.theatreId, 
                screenId: item.screenId, 
                startTime: item.startTime?.split('.')[0],
                showType: item.showType || '2D'
            });
            setShowModal('show');
        } else if (type === 'food') {
            setEditingId(item.foodItemId);
            setFoodForm({ ...item });
            setShowModal('food');
        } else if (type === 'user') {
            setEditingId(item.userId);
            setUserForm({ 
                name: item.name || '', 
                email: item.email || '', 
                phone: item.phone || '', 
                password: '', // Don't show password on edit
                isAdmin: item.isAdmin || item.role === 'ADMIN' 
            });
            setShowModal('user');
        }
    };

    // --- Handlers ---
    const handleMovieSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await API.updateMovie(editingId, movieForm);
                showMessage('success', 'Movie updated!');
            } else {
                await API.addMovie(movieForm);
                showMessage('success', 'Movie added!');
            }
            resetForms();
            fetchAllData();
        } catch (err) { showMessage('danger', isEditing ? 'Update failed.' : 'Add failed.'); }
    };

    const handleTheatreSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await API.updateTheatre(editingId, theatreForm);
                showMessage('success', 'Theatre updated!');
            } else {
                await API.addTheatre(theatreForm);
                showMessage('success', 'Theatre added!');
            }
            resetForms();
            fetchAllData();
        } catch (err) { showMessage('danger', isEditing ? 'Update failed.' : 'Add failed.'); }
    };

    const handleShowSubmit = async (e) => {
        e.preventDefault();

        if (!showForm.screenId) {
            showMessage('danger', 'Please select a screen for the show.');
            return;
        }

        // Build startTime as a proper ISO datetime string
        const startTimeValue = showForm.startTime; // e.g. "2026-05-11T12:00"
        // Derive date from startTime
        const dateValue = startTimeValue ? startTimeValue.substring(0, 10) : null;
        const payload = {
            movieId: parseInt(showForm.movieId),
            screen: { screenId: parseInt(showForm.screenId) },
            startTime: startTimeValue ? startTimeValue : null,
            date: dateValue,
            showType: showForm.showType
        };
        try {
            if (isEditing) {
                await API.updateShow(editingId, payload);
                showMessage('success', 'Show updated!');
            } else {
                await API.addShow(payload);
                showMessage('success', 'Show scheduled! Seats auto-generated from screen layout.');
            }
            resetForms();
            fetchAllData();
        } catch (err) {
            console.error('Show submit error:', err);
            showMessage('danger', 'Operation failed: ' + (err?.response?.data || err.message));
        }
    };

    const handleFoodSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await API.updateFoodItem({ ...foodForm, foodItemId: editingId });
                showMessage('success', 'Food item updated!');
            } else {
                await API.addFoodItem(foodForm);
                showMessage('success', 'Food item added!');
            }
            resetForms();
            fetchAllData();
        } catch (err) { showMessage('danger', 'Operation failed.'); }
    };

    const [screens, setScreens] = useState([]);
    const [screenForm, setScreenForm] = useState({ 
        screenNumber: '', 
        rowCount: 10, 
        colCount: 10,
        rowPricings: [] // Array of { rowName: 'A', price: 200 }
    });

    useEffect(() => {
        const rows = [];
        for (let i = 0; i < screenForm.rowCount; i++) {
            const rowName = String.fromCharCode(65 + i);
            rows.push({ rowName, price: 200 });
        }
        setScreenForm(prev => ({ ...prev, rowPricings: rows }));
    }, [screenForm.rowCount]);

    useEffect(() => {
        if (selectedTheatre) fetchScreens(selectedTheatre.theatreId);
    }, [selectedTheatre]);

    const fetchScreens = async (theatreId) => {
        try {
            const res = await API.getScreensByTheatre(theatreId);
            setScreens(res.data || []);
        } catch (err) { console.error("Failed to fetch screens"); }
    };

    const handleScreenSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                screenNumber: screenForm.screenNumber,
                seatCapacity: screenForm.rowCount * screenForm.colCount,
                rowCount: parseInt(screenForm.rowCount),
                colCount: parseInt(screenForm.colCount),
                // Convert array [{rowName: 'A', price: 200}, ...] to Map { 'A': 200, ... }
                rowPricings: (screenForm.rowPricings || []).reduce((acc, curr) => {
                    acc[curr.rowName] = parseFloat(curr.price);
                    return acc;
                }, {})
            };
            
            if (isEditing) {
                await API.updateScreen(editingId, payload);
                showMessage('success', 'Screen layout updated!');
            } else {
                await API.addScreen(selectedTheatre.theatreId, payload);
                showMessage('success', 'Screen added with layout!');
            }
            
            setIsEditing(false);
            setEditingId(null);
            setScreenForm({ screenNumber: '', rowCount: 10, colCount: 10, rowPricings: [] });
            fetchScreens(selectedTheatre.theatreId);
        } catch (err) { 
            console.error("Screen submit error:", err);
            showMessage('danger', isEditing ? 'Failed to update screen.' : 'Failed to add screen.'); 
        }
    };

    const handleDeleteScreen = async (id) => {
        if (!window.confirm('Delete this screen?')) return;
        try {
            await API.deleteScreen(id);
            showMessage('success', 'Screen deleted.');
            fetchScreens(selectedTheatre.theatreId);
        } catch (err) { showMessage('danger', 'Delete failed.'); }
    };

    const handleSyncSeats = async (showId) => {
        try {
            await API.syncShowSeats(showId);
            showMessage('success', 'Seats synchronized with current screen layout!');
            fetchAllData();
        } catch (err) {
            console.error("Sync error:", err);
            showMessage('danger', 'Sync failed: ' + (err?.response?.data || err.message));
        }
    };
    const handleVerifyUser = async (id) => {
        if (!window.confirm('Manually verify this user?')) return;
        try {
            await API.verifyUserAdmin(id);
            showMessage('success', 'User manually verified.');
            fetchAllData();
        } catch (err) {
            showMessage('danger', 'Verification failed: ' + (err?.response?.data || err.message));
        }
    };

    const handleDelete = async (type, id) => {
        if (!window.confirm(`Delete this ${type}?`)) return;
        try {
            if (type === 'movie') await API.deleteMovie(id);
            else if (type === 'theatre') await API.deleteTheatre(id);
            else if (type === 'show') await API.deleteShow(id);
            else if (type === 'user') await API.deleteUser(id);
            else if (type === 'food') await API.deleteFoodItem(id);
            else if (type === 'complaint') await API.deleteComplaint(id);
            showMessage('success', `${type} deleted.`);
            fetchAllData();
        } catch (err) { showMessage('danger', 'Delete failed.'); }
    };

    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const activeTab = queryParams.get('tab') || 'analytics';

    return (
        <div className="admin-page-container dashboard-content-wrapper">
            <div className="d-flex justify-content-between align-items-center mb-5">
                <div>
                    <h1 className="fw-bold mb-1" style={{ color: 'var(--text-primary)', letterSpacing: '-1.5px', fontSize: '2.5rem' }}>
                        Admin <span style={{ color: 'var(--bms-red)' }}>Dashboard</span>
                    </h1>
                    <p className="text-muted mb-0 d-flex align-items-center gap-2">
                        <Activity size={16} className="text-success admin-active-glow rounded-circle" /> 
                        System operational • {activeTab.toUpperCase()} View
                    </p>
                </div>
            </div>


            {status.message && (
                <Alert variant={status.type} className="border-0 shadow rounded-4 mb-4 admin-glass">
                    <div className="d-flex align-items-center gap-2">
                        {status.type === 'success' ? <TrendingUp size={20}/> : <Activity size={20}/>}
                        {status.message}
                    </div>
                </Alert>
            )}

            <Tab.Container id="admin-tabs" activeKey={activeTab}>
                <Tab.Content>
                    <Tab.Pane eventKey="analytics" mountOnEnter unmountOnExit>
                        {/* Stat Cards with Glow */}
                        <Row className="g-4 mb-5">
                            {[
                                { label: 'Total Revenue', value: `₹${stats.totalRevenue?.toLocaleString()}`, icon: <DollarSign size={24}/>, color: '#10b981', trend: '+12.5%' },
                                { label: 'Movie Sales', value: `₹${stats.movieRevenue?.toLocaleString()}`, icon: <Film size={24}/>, color: '#ef4444', trend: 'Tickets' },
                                { label: 'Food Sales', value: `₹${stats.foodRevenue?.toLocaleString()}`, icon: <Utensils size={24}/>, color: '#f59e0b', trend: 'Cravings' },
                                { label: 'Total Users', value: stats.totalUsers, icon: <Users size={24}/>, color: '#3b82f6', trend: 'Growing' }
                            ].map((stat, i) => (
                                <Col key={i} md={6} lg={3}>
                                    <div className="admin-card admin-card-glow shadow-sm">
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div className="admin-icon-box" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                                                {stat.icon}
                                            </div>
                                            <Badge bg="light" className="text-success border rounded-pill small">{stat.trend}</Badge>
                                        </div>
                                        <div>
                                            <div className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: '1px' }}>{stat.label}</div>
                                            <div className="fs-2 fw-bold mt-1" style={{ color: 'var(--text-primary)' }}>{stat.value}</div>
                                        </div>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                        <Row className="g-4">
                            <Col lg={8}>
                                <div className="admin-card p-4 shadow-sm">
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h5 className="fw-bold m-0 d-flex align-items-center gap-2">
                                            <TrendingUp size={20} className="text-success" /> Revenue Performance
                                        </h5>
                                        <div className="btn-group btn-group-sm admin-toggle-group">
                                            <Button variant={revenuePeriod === 'daily' ? 'success' : 'outline-secondary'} className="px-3" onClick={() => setRevenuePeriod('daily')}>Daily</Button>
                                            <Button variant={revenuePeriod === 'weekly' ? 'success' : 'outline-secondary'} className="px-3" onClick={() => setRevenuePeriod('weekly')}>Weekly</Button>
                                        </div>
                                    </div>
                                    <div style={{ height: '400px', minHeight: '300px' }}>
                                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                            <LineChart data={revenuePeriod === 'daily' ? revenueData : weeklyRevenueData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                                <XAxis dataKey={revenuePeriod === 'daily' ? "date" : "period"} stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} dx={-10} />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                                    itemStyle={{ color: 'var(--bms-red)', fontWeight: 'bold' }}
                                                />
                                                <Line type="monotone" dataKey="revenue" stroke="var(--bms-red)" strokeWidth={4} dot={{ r: 6, fill: 'var(--bms-red)', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </Col>
                            <Col lg={4}>
                                <div className="admin-card p-4 shadow-sm h-100">
                                    <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                                        <Activity size={20} className="text-danger" /> Most Watched Movies
                                    </h5>
                                    {pieData.length > 0 ? (
                                        <>
                                            <div style={{ height: '300px', minHeight: '250px' }}>
                                                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                                    <PieChart>
                                                        <Pie
                                                            data={hasAnySales ? pieData : pieData.map(p => ({ ...p, value: 1 }))}
                                                            innerRadius={60}
                                                            outerRadius={80}
                                                            paddingAngle={5}
                                                            dataKey="value"
                                                        >
                                                            {pieData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip 
                                                            contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', borderRadius: '12px' }}
                                                            formatter={(value, name, props) => [hasAnySales ? value : 0, 'Tickets Sold']}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="mt-4">
                                                {pieData.map((item, index) => (
                                                    <div key={index} className="d-flex align-items-center justify-content-between mb-2">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }}></div>
                                                            <span className="small fw-bold text-truncate" style={{ maxWidth: '150px' }}>{item.name}</span>
                                                        </div>
                                                        <div className="text-end">
                                                            <div className="small fw-bold text-success">{item.value} sold</div>
                                                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>₹{item.revenue?.toLocaleString()} earned</div>
                                                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>{item.showCount} shows</div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {!hasAnySales && <p className="text-muted small mt-3 text-center">No sales yet. Showing your registered movies.</p>}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="d-flex flex-column align-items-center justify-content-center h-100 py-5 text-center">
                                            <div className="text-muted opacity-50 mb-3"><Film size={48} /></div>
                                            <p className="text-muted small">No movies registered yet.<br/>Go to the Movies tab to add some!</p>
                                        </div>
                                    )}
                                </div>
                            </Col>
                        </Row>
                        <Row className="g-4 mt-1">
                            <Col lg={8}>
                                <div className="admin-card p-4 shadow-sm h-100">
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h5 className="fw-bold m-0 d-flex align-items-center gap-2">
                                            <Utensils size={20} className="text-warning" /> Food Sales Trend
                                        </h5>
                                        <div className="btn-group btn-group-sm admin-toggle-group">
                                            <Button variant={foodPeriod === 'daily' ? 'warning' : 'outline-secondary'} className="px-3" onClick={() => setFoodPeriod('daily')}>Daily</Button>
                                            <Button variant={foodPeriod === 'weekly' ? 'warning' : 'outline-secondary'} className="px-3" onClick={() => setFoodPeriod('weekly')}>Weekly</Button>
                                        </div>
                                    </div>
                                    <div style={{ height: '300px', minHeight: '250px' }}>
                                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                            <BarChart data={foodPeriod === 'daily' ? foodData : weeklyFoodData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                                <XAxis dataKey={foodPeriod === 'daily' ? "date" : "period"} stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} dx={-10} />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', borderRadius: '16px' }}
                                                    cursor={{ fill: 'rgba(245, 158, 11, 0.1)' }}
                                                />
                                                <Bar dataKey="sales" fill="#f59e0b" radius={[8, 8, 0, 0]} barSize={40} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </Col>
                            <Col lg={4}>
                                <div className="admin-card p-4 shadow-sm h-100">
                                    <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                                        <Activity size={20} className="text-warning" /> Most Sales of the Food
                                    </h5>
                                    {foodBreakdown.length > 0 ? (
                                        <>
                                            <div style={{ height: '240px', minHeight: '200px' }}>
                                                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                                    <PieChart>
                                                        <Pie
                                                            data={foodBreakdown}
                                                            innerRadius={60}
                                                            outerRadius={80}
                                                            paddingAngle={5}
                                                            dataKey="quantity"
                                                            nameKey="name"
                                                        >
                                                            {foodBreakdown.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip 
                                                            contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', borderRadius: '12px' }}
                                                            formatter={(value, name) => [`${value} units`, name]}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="mt-3 overflow-auto" style={{ maxHeight: '180px' }}>
                                                {foodBreakdown.map((item, index) => (
                                                    <div key={index} className="d-flex align-items-center justify-content-between mb-2">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORS[(index + 4) % COLORS.length] }}></div>
                                                            <span className="small fw-bold text-truncate" style={{ maxWidth: '120px' }}>{item.name}</span>
                                                        </div>
                                                        <div className="text-end">
                                                            <div className="small fw-bold text-warning">{item.quantity} sold</div>
                                                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>₹{item.revenue?.toLocaleString()}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="d-flex flex-column align-items-center justify-content-center h-100 py-5 text-center">
                                            <div className="text-muted opacity-50 mb-3"><Utensils size={48} /></div>
                                            <p className="text-muted small">No food items sold yet.</p>
                                        </div>
                                    )}
                                </div>
                            </Col>
                        </Row>
                    </Tab.Pane>

                    <Tab.Pane eventKey="movies">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="fw-bold m-0">Movie Library</h4>
                            <Button variant="danger" className="rounded-pill btn-primary-bms" onClick={() => { resetForms(); setShowModal('movie'); }}><Plus size={18} className="me-2"/>Add Movie</Button>
                        </div>
                        <div className="admin-table-container shadow-sm border-0">
                            <Table hover responsive className="admin-table mb-0 align-middle">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="ps-4">Movie</th>
                                        <th>Genre</th>
                                        <th>Release</th>
                                        <th className="text-end pe-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {movies.map(m => (
                                        <tr key={m.movieId}>
                                            <td className="ps-4">
                                                <div className="d-flex align-items-center gap-3">
                                                    <img src={m.posterUrl} width="40" height="60" className="rounded shadow-sm" alt="" />
                                                    <span className="fw-bold">{m.title}</span>
                                                </div>
                                            </td>
                                            <td><Badge bg="light" className="text-danger border border-danger-subtle px-3 py-2 rounded-pill">{m.genre}</Badge></td>
                                            <td>{new Date(m.releaseDate).toLocaleDateString()}</td>
                                            <td className="text-end pe-4">
                                                <Button variant="link" className="text-primary p-2" onClick={() => handleEditClick('movie', m)}><Edit size={18}/></Button>
                                                <Button variant="link" className="text-danger p-2" onClick={() => handleDelete('movie', m.movieId)}><Trash2 size={18}/></Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </Tab.Pane>

                    <Tab.Pane eventKey="theatres">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="fw-bold m-0">Theatres & Screens</h4>
                            <Button variant="danger" className="rounded-pill btn-primary-bms" onClick={() => { resetForms(); setShowModal('theatre'); }}><Plus size={18} className="me-2"/>Register Theatre</Button>
                        </div>
                        <Row className="g-4">
                            {theatres.map(t => (
                                <Col key={t.theatreId} md={6} lg={4}>
                                    <div className="admin-card admin-card-glow shadow-sm border-0">
                                        <div className="d-flex justify-content-between align-items-center mb-4">
                                            <div className="p-3 rounded-4 bg-primary-subtle text-primary"><MapPin size={24}/></div>
                                            <div className="d-flex gap-1">
                                                <Button variant="link" className="text-primary p-1" onClick={() => handleEditClick('theatre', t)}><Edit size={18}/></Button>
                                                <Button variant="link" className="text-danger p-1" onClick={() => handleDelete('theatre', t.theatreId)}><Trash2 size={18}/></Button>
                                            </div>
                                        </div>
                                        <h5 className="fw-bold mb-1">{t.name}</h5>
                                        <p className="text-muted small mb-4">{t.city}</p>
                                        <div className="d-grid gap-2">
                                            <Button variant="danger" size="sm" className="rounded-pill py-2 fw-bold shadow-sm btn-primary-bms" onClick={() => setSelectedTheatre(t)}>
                                                Manage Screens
                                            </Button>
                                        </div>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    </Tab.Pane>

                    <Tab.Pane eventKey="users">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="fw-bold m-0">User Directory</h4>
                            <Button variant="danger" className="rounded-pill btn-primary-bms" onClick={() => { resetForms(); setShowModal('user'); }}>
                                <Plus size={18} className="me-2"/>Add User
                            </Button>
                        </div>
                        <div className="admin-table-container shadow-sm border-0">
                            <Table hover responsive className="admin-table mb-0 align-middle">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="ps-4">Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th className="text-end pe-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.userId}>
                                            <td className="ps-4 fw-bold">{u.name}</td>
                                            <td>{u.email}</td>
                                            <td className="small text-muted">{u.phone || 'N/A'}</td>
                                            <td><Badge bg={u.isAdmin || u.role === 'ADMIN' ? 'danger' : 'info'} className="rounded-pill px-3">{u.isAdmin || u.role === 'ADMIN' ? 'Admin' : 'User'}</Badge></td>
                                            <td>
                                                {u.verified ? (
                                                    <Badge bg="success" className="rounded-pill px-3">Verified</Badge>
                                                ) : (
                                                    <Badge bg="warning" text="dark" className="rounded-pill px-3">Not Verified</Badge>
                                                )}
                                            </td>
                                            <td className="text-end pe-4">
                                                {!u.verified && (
                                                    <Button variant="link" className="text-success p-2" onClick={() => handleVerifyUser(u.userId)} title="Verify Manually">
                                                        <CheckCircle size={18}/>
                                                    </Button>
                                                )}
                                                <Button variant="link" className="text-primary p-2" onClick={() => handleEditClick('user', u)} title="Edit User">
                                                    <Edit size={18}/>
                                                </Button>
                                                <Button 
                                                    variant="link" 
                                                    className="text-success p-2" 
                                                    title="Change User Password"
                                                    onClick={() => {
                                                        setAdminPasswordForm({ userId: u.userId, userName: u.name, newPassword: '' });
                                                        setShowModal('admin-change-password');
                                                    }}
                                                >
                                                    <Key size={18}/>
                                                </Button>
                                                <Button variant="link" className="text-danger p-2" onClick={() => handleDelete('user', u.userId)}><Trash2 size={18}/></Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </Tab.Pane>

                    <Tab.Pane eventKey="food">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="fw-bold m-0">Food & Beverages</h4>
                            <Button variant="danger" className="rounded-pill btn-primary-bms" onClick={() => { resetForms(); setShowModal('food'); }}>
                                <Plus size={18} className="me-2"/>Add Food Item
                            </Button>
                        </div>
                        <div className="admin-table-container shadow-sm border-0">
                            <Table hover responsive className="admin-table mb-0 align-middle">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="ps-4">Item Name</th>
                                        <th>Price</th>
                                        <th>Availability</th>
                                        <th className="text-end pe-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {foodItems.map(f => (
                                        <tr key={f.foodItemId}>
                                            <td className="ps-4">
                                                <div className="fw-bold">{f.name}</div>
                                                <div className="text-muted small">{f.description}</div>
                                            </td>
                                            <td className="fw-bold text-success">₹{f.price}</td>
                                            <td>
                                                <Badge bg={f.isAvailable ? 'success' : 'secondary'} className="rounded-pill">
                                                    {f.isAvailable ? 'Available' : 'Out of Stock'}
                                                </Badge>
                                            </td>
                                            <td className="text-end pe-4">
                                                <Button variant="link" className="text-primary p-2" onClick={() => handleEditClick('food', f)}><Edit size={18}/></Button>
                                                <Button variant="link" className="text-danger p-2" onClick={() => handleDelete('food', f.foodItemId)}><Trash2 size={18}/></Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </Tab.Pane>

                    <Tab.Pane eventKey="bookings">
                        <h4 className="fw-bold mb-4">Recent Transactions</h4>
                        <div className="admin-table-container shadow-sm border-0">
                            <Table hover responsive className="admin-table mb-0 align-middle">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="ps-4">Booking ID</th>
                                        <th>Movie</th>
                                        <th>Theatre</th>
                                        <th>Amount</th>
                                        <th>Seats</th>
                                        <th>Date</th>
                                        <th className="text-center">Status</th>
                                        <th className="text-end pe-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map(b => {
                                        const show = shows.find(s => String(s.showId) === String(b.showId));
                                        const movie = show ? movies.find(m => String(m.movieId) === String(show.movieId)) : null;
                                        const theatre = show ? theatres.find(t => String(t.theatreId) === String(show.theatreId)) : null;
                                        return (
                                            <tr key={b.bookingId}>
                                                <td className="ps-4 text-muted fw-bold">#{b.bookingId}</td>
                                                <td className="fw-semibold text-truncate" style={{maxWidth: '150px'}}>{movie?.title || 'Unknown Movie'}</td>
                                                <td className="small text-muted">{theatre?.name || 'Unknown Theatre'}</td>
                                                <td className="text-success fw-bold">₹{(b.totalAmount !== null && b.totalAmount !== undefined) ? b.totalAmount : b.finalAmountPaid}</td>
                                                <td>{b.seatNumbers?.join(', ') || 'N/A'}</td>
                                                <td className="small text-muted">{new Date(b.bookingTime).toLocaleString()}</td>
                                                <td className="text-center"><Badge bg="success">Paid</Badge></td>
                                                <td className="text-end pe-4">
                                                    <Button variant="link" className="text-primary p-2" onClick={() => handleViewBooking(b)}>
                                                        <Eye size={18} />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </div>
                    </Tab.Pane>

                    <Tab.Pane eventKey="shows">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="fw-bold m-0">Active Showtimes</h4>
                            <Button variant="danger" className="rounded-pill btn-primary-bms" onClick={() => { resetForms(); setShowModal('show'); }}><Plus size={18} className="me-2"/>Schedule Show</Button>
                        </div>
                        <div className="admin-table-container shadow-sm border-0">
                            <Table hover responsive className="admin-table mb-0 align-middle">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="ps-4">Movie</th>
                                        <th>Location</th>
                                        <th>Time</th>
                                        <th>Type</th>
                                        <th className="text-end pe-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shows.map(s => (
                                        <tr key={s.showId}>
                                            <td className="ps-4 fw-bold">{s.movieTitle}</td>
                                            <td>{s.theatreName} - Screen {s.screenNumber} <small className="text-muted opacity-50">(ID: {s.screenId})</small></td>
                                            <td>{new Date(s.startTime).toLocaleString()}</td>
                                            <td><Badge bg="secondary" className="px-3 rounded-pill">{s.showType || '2D'}</Badge></td>
                                             <td className="text-end pe-4">
                                                <Button 
                                                    variant="link" 
                                                    className="text-success p-2" 
                                                    title="Sync Seats with Screen Layout"
                                                    onClick={() => handleSyncSeats(s.showId)}
                                                >
                                                    <Activity size={18}/>
                                                </Button>
                                                <Button variant="link" className="text-primary p-2" onClick={() => handleEditClick('show', s)}><Edit size={18}/></Button>
                                                <Button variant="link" className="text-danger p-2" onClick={() => handleDelete('show', s.showId)}><Trash2 size={18}/></Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </Tab.Pane>

                    <Tab.Pane eventKey="complaints">
                        <h4 className="fw-bold mb-4">User Complaints</h4>
                        <div className="admin-table-container shadow-sm border-0">
                            <Table hover responsive className="admin-table mb-0 align-middle">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="ps-4">ID</th>
                                        <th>User ID</th>
                                        <th>Category</th>
                                        <th>Description</th>
                                        <th>Status</th>
                                        <th className="text-end pe-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {complaints.map(c => (
                                        <tr key={c.complaintId}>
                                            <td className="ps-4 text-muted small">#{c.complaintId}</td>
                                            <td>{c.userId}</td>
                                            <td className="fw-bold">{c.category}</td>
                                            <td style={{ maxWidth: '250px' }} className="text-truncate">{c.description}</td>
                                            <td>
                                                <Badge bg={c.status === 'OPEN' ? 'warning' : c.status === 'RESOLVED' ? 'success' : 'info'} className="rounded-pill px-3">
                                                    {c.status}
                                                </Badge>
                                            </td>
                                            <td className="text-end pe-4">
                                                <Button 
                                                    variant="link" 
                                                    className="text-primary p-2" 
                                                    onClick={() => {
                                                        setComplaintResponse({ id: c.complaintId, resolution: c.resolution || '', status: 'RESOLVED' });
                                                        setShowModal('complaint-response');
                                                    }}
                                                >
                                                    <MessageSquare size={18}/>
                                                </Button>
                                                <Button variant="link" className="text-danger p-2" onClick={() => handleDelete('complaint', c.complaintId)}><Trash2 size={18}/></Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </Tab.Pane>
                </Tab.Content>
            </Tab.Container>

            {/* Modals */}
            <Modal show={showModal === 'movie'} onHide={resetForms} size="lg" centered className="admin-modal">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">{isEditing ? 'Edit Movie' : 'Register New Movie'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-3">
                    <Form onSubmit={handleMovieSubmit}>
                        <Row className="g-3">
                            <Col md={12}><Form.Group><Form.Label>Title</Form.Label><Form.Control required type="text" value={movieForm.title} onChange={e => setMovieForm({...movieForm, title: e.target.value})} /></Form.Group></Col>
                            <Col md={6}><Form.Group><Form.Label>Genre</Form.Label><Form.Control required type="text" value={movieForm.genre} onChange={e => setMovieForm({...movieForm, genre: e.target.value})} /></Form.Group></Col>
                            <Col md={6}><Form.Group><Form.Label>Language</Form.Label><Form.Control required type="text" value={movieForm.language} onChange={e => setMovieForm({...movieForm, language: e.target.value})} /></Form.Group></Col>
                            <Col md={6}><Form.Group><Form.Label>Duration (min)</Form.Label><Form.Control required type="number" value={movieForm.duration} onChange={e => setMovieForm({...movieForm, duration: e.target.value})} /></Form.Group></Col>
                            <Col md={6}><Form.Group><Form.Label>Release Date</Form.Label><Form.Control required type="date" value={movieForm.releaseDate} onChange={e => setMovieForm({...movieForm, releaseDate: e.target.value})} /></Form.Group></Col>
                            <Col md={12}><Form.Group><Form.Label>Poster URL</Form.Label><Form.Control required type="text" value={movieForm.posterUrl} onChange={e => setMovieForm({...movieForm, posterUrl: e.target.value})} /></Form.Group></Col>
                            <Col md={12}><Form.Group><Form.Label>Banner/Cover URL</Form.Label><Form.Control type="text" placeholder="Hero background image link" value={movieForm.bannerUrl} onChange={e => setMovieForm({...movieForm, bannerUrl: e.target.value})} /></Form.Group></Col>
                            <Col md={12}><Form.Group><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={3} value={movieForm.description} onChange={e => setMovieForm({...movieForm, description: e.target.value})} /></Form.Group></Col>
                        </Row>
                        <Button variant="danger" type="submit" className="w-100 mt-4 py-2 rounded-pill btn-primary-bms fw-bold shadow-sm">{isEditing ? 'Update Movie' : 'Save Movie'}</Button>
                    </Form>
                </Modal.Body>
            </Modal>

            <Modal show={showModal === 'theatre'} onHide={resetForms} centered className="admin-modal">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">{isEditing ? 'Edit Theatre' : 'Register Theatre'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-3">
                    <Form onSubmit={handleTheatreSubmit}>
                        <div className="d-grid gap-3">
                            <Form.Group><Form.Label>Theatre Name</Form.Label><Form.Control required type="text" value={theatreForm.name} onChange={e => setTheatreForm({...theatreForm, name: e.target.value})} /></Form.Group>
                            <Form.Group><Form.Label>City</Form.Label><Form.Control required type="text" value={theatreForm.city} onChange={e => setTheatreForm({...theatreForm, city: e.target.value})} /></Form.Group>
                            <Form.Group><Form.Label>Address</Form.Label><Form.Control required as="textarea" rows={2} value={theatreForm.address} onChange={e => setTheatreForm({...theatreForm, address: e.target.value})} /></Form.Group>
                            <Form.Group><Form.Label>Contact Info</Form.Label><Form.Control required type="text" value={theatreForm.contactInfo} onChange={e => setTheatreForm({...theatreForm, contactInfo: e.target.value})} /></Form.Group>
                        </div>
                        <Button variant="danger" type="submit" className="w-100 mt-4 py-2 rounded-pill btn-primary-bms fw-bold shadow-sm">{isEditing ? 'Update Theatre' : 'Register'}</Button>
                    </Form>
                </Modal.Body>
            </Modal>

            <Modal show={showModal === 'show'} onHide={resetForms} centered size="lg" className="admin-modal">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold d-flex align-items-center gap-2">
                        <Calendar size={20} className="text-danger" />
                        {isEditing ? 'Modify Show' : 'Schedule New Show'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-3">
                    <Form onSubmit={handleShowSubmit}>
                        <div className="d-grid gap-3">

                            {/* ── Step 1: Pick Movie & Theatre ── */}
                            <Row className="g-3">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold small">Select Movie</Form.Label>
                                        <Form.Select required value={showForm.movieId} onChange={e => setShowForm({...showForm, movieId: e.target.value})}>
                                            <option value="">Choose Movie...</option>
                                            {movies.map(m => <option key={m.movieId} value={m.movieId}>{m.title}</option>)}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold small">Select Theatre</Form.Label>
                                        <Form.Select required value={showForm.theatreId} onChange={e => setShowForm({...showForm, theatreId: e.target.value, screenId: '', selectedDate: ''})}>
                                            <option value="">Choose Theatre...</option>
                                            {theatres.map(t => <option key={t.theatreId} value={t.theatreId}>{t.name} ({t.city})</option>)}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>

                            {/* ── Step 2: 7-Day Date Selector ── */}
                            <div>
                                <Form.Label className="fw-semibold small d-block mb-2">
                                    Select Date <span className="text-muted fw-normal">(Advance Booking — 7 days)</span>
                                </Form.Label>
                                <div className="d-flex gap-2 overflow-auto pb-1">
                                    {bookingDateOptions.map((date, idx) => {
                                        const dateStr = toDateStr(date);
                                        const isSelected = showForm.selectedDate === dateStr;
                                        const monthName = date.toLocaleString('default', { month: 'short' }).toUpperCase();
                                        const dayNum = date.getDate();
                                        const dayName = date.toLocaleString('default', { weekday: 'short' }).toUpperCase();
                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setShowForm(prev => ({
                                                    ...prev,
                                                    selectedDate: dateStr,
                                                    startTime: prev.startTime
                                                        ? `${dateStr}T${prev.startTime.includes('T') ? prev.startTime.split('T')[1] : '12:00'}`
                                                        : `${dateStr}T12:00`
                                                }))}
                                                style={{
                                                    minWidth: '64px',
                                                    cursor: 'pointer',
                                                    backgroundColor: isSelected ? 'var(--bms-red, #e63946)' : 'var(--card-bg, #f8f9fa)',
                                                    color: isSelected ? 'white' : 'var(--text-primary, #222)',
                                                    border: isSelected ? '2px solid var(--bms-red, #e63946)' : '2px solid #e9ecef',
                                                    borderRadius: '12px',
                                                    padding: '8px 6px',
                                                    textAlign: 'center',
                                                    transition: 'all 0.18s ease',
                                                    boxShadow: isSelected ? '0 4px 14px rgba(230,57,70,0.3)' : '0 1px 3px rgba(0,0,0,0.06)',
                                                    fontFamily: 'inherit',
                                                    outline: 'none',
                                                    flexShrink: 0
                                                }}
                                            >
                                                <div style={{ fontSize: '0.6rem', fontWeight: '700', letterSpacing: '0.5px', opacity: isSelected ? 1 : 0.55 }}>{monthName}</div>
                                                <div style={{ fontWeight: '800', fontSize: '1.25rem', lineHeight: '1.15' }}>{dayNum}</div>
                                                <div style={{ fontSize: '0.6rem', fontWeight: '700', opacity: isSelected ? 0.9 : 0.5 }}>{idx === 0 ? 'TODAY' : dayName}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ── Step 3: Screen + Availability ── */}
                            <div>
                                <Form.Label className="fw-semibold small d-block mb-2">
                                    Select Screen
                                    {showForm.selectedDate && availableScreens.length > 0 && (
                                        <span className="text-muted fw-normal ms-2">
                                            — availability for {new Date(showForm.selectedDate + 'T00:00').toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </span>
                                    )}
                                </Form.Label>

                                {!showForm.theatreId ? (
                                    <p className="text-muted small fst-italic mb-0">Select a theatre first to see screens.</p>
                                ) : availableScreens.length === 0 ? (
                                    <p className="text-danger small mb-0">No screens found for this theatre. Go to Manage Theatres → Add Screen.</p>
                                ) : (
                                    <div className="d-flex flex-column gap-2">
                                        {availableScreens.map(screen => {
                                            const showsOnDate = screenAvailability[screen.screenId] || [];
                                            const isSelected = String(showForm.screenId) === String(screen.screenId);
                                            const hasShows = showsOnDate.length > 0;
                                            const dateChosen = !!showForm.selectedDate;

                                            return (
                                                <div
                                                    key={screen.screenId}
                                                    onClick={() => setShowForm({...showForm, screenId: screen.screenId})}
                                                    style={{
                                                        border: isSelected ? '2px solid var(--bms-red, #e63946)' : '2px solid #e9ecef',
                                                        borderRadius: '12px',
                                                        padding: '12px 16px',
                                                        cursor: 'pointer',
                                                        backgroundColor: isSelected ? 'rgba(230,57,70,0.05)' : 'var(--card-bg, #fff)',
                                                        transition: 'all 0.15s ease',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <div>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div className="fw-bold" style={{ color: isSelected ? 'var(--bms-red, #e63946)' : 'var(--text-primary)' }}>
                                                                Screen {screen.screenNumber} <small className="text-muted opacity-50" style={{fontSize: '0.65rem'}}>(ID: {screen.screenId})</small>
                                                            </div>
                                                            <Button 
                                                                variant="link" 
                                                                size="sm" 
                                                                className="p-0 text-muted opacity-50"
                                                                onClick={(e) => { 
                                                                    e.stopPropagation(); 
                                                                    setEditingId(screen.screenId); 
                                                                    setIsEditing(true); 
                                                                    // Convert backend Map to frontend Array
                                                                    const backendPricings = screen.rowPricings || {};
                                                                    const rowPricingsArray = Object.entries(backendPricings).map(([rowName, price]) => ({
                                                                        rowName,
                                                                        price
                                                                    })).sort((a, b) => a.rowName.localeCompare(b.rowName));

                                                                    setScreenForm({ 
                                                                        screenNumber: screen.screenNumber, 
                                                                        seatCapacity: screen.seatCapacity, 
                                                                        rowCount: screen.rowCount || Math.ceil(screen.seatCapacity / (screen.colCount || 10)), 
                                                                        colCount: screen.colCount || 10,
                                                                        rowPricings: rowPricingsArray.length > 0 ? rowPricingsArray : []
                                                                    }); 
                                                                    // We want to open the screen management section for this theatre
                                                                    const theatre = theatres.find(t => t.theatreId === showForm.theatreId);
                                                                    if (theatre) setSelectedTheatre(theatre);
                                                                }}
                                                            >
                                                                <Edit size={12}/>
                                                            </Button>
                                                        </div>
                                                        <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                                                            {screen.seatCapacity} seats
                                                            {screen.rowCount > 0 ? ` · ${screen.rowCount} rows × ${screen.colCount} cols` : ''}
                                                        </div>
                                                    </div>
                                                    <div className="text-end">
                                                        {!dateChosen ? (
                                                            <span className="badge rounded-pill" style={{ backgroundColor: '#e9ecef', color: '#6c757d', fontSize: '0.7rem' }}>Pick a date</span>
                                                        ) : checkingAvailability ? (
                                                            <span className="badge rounded-pill bg-secondary" style={{ fontSize: '0.7rem' }}>Checking...</span>
                                                        ) : hasShows ? (
                                                            <div className="text-end">
                                                                <span className="badge rounded-pill" style={{ backgroundColor: '#fff3cd', color: '#856404', border: '1px solid #ffc107', fontSize: '0.7rem' }}>
                                                                    {showsOnDate.length} show{showsOnDate.length > 1 ? 's' : ''} booked
                                                                </span>
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: '4px', marginTop: '6px' }}>
                                                                    {showsOnDate.map(s => (
                                                                        <Button 
                                                                            key={s.showId}
                                                                            variant="outline-warning" 
                                                                            size="sm" 
                                                                            style={{ fontSize: '0.62rem', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold' }}
                                                                            onClick={(e) => { e.stopPropagation(); handleEditClick('show', s); }}
                                                                        >
                                                                            {new Date(s.startTime).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} 
                                                                            <span className="ms-1 opacity-75">{s.showType || '2D'}</span>
                                                                            <Edit size={10} className="ms-2" />
                                                                        </Button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="badge rounded-pill" style={{ backgroundColor: '#d1f5e0', color: '#198754', border: '1px solid #a3cfbb', fontSize: '0.7rem' }}>✓ Available</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* ── Step 4: Start Time (time only, date pre-filled) ── */}
                            <Form.Group>
                                <Form.Label className="fw-semibold small">Show Start Time</Form.Label>
                                <Form.Control
                                    required
                                    type="datetime-local"
                                    value={showForm.startTime}
                                    min={showForm.selectedDate ? `${showForm.selectedDate}T00:00` : undefined}
                                    onChange={e => setShowForm({...showForm, startTime: e.target.value, selectedDate: e.target.value.substring(0,10)})}
                                />
                                {showForm.selectedDate && (
                                    <Form.Text className="text-muted">
                                        Showing on: <strong>{new Date(showForm.selectedDate + 'T00:00').toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                                    </Form.Text>
                                )}
                            </Form.Group>

                            <Form.Group>
                                <Form.Label className="fw-semibold small">Show Type</Form.Label>
                                <Form.Select 
                                    required 
                                    value={showForm.showType} 
                                    onChange={e => setShowForm({...showForm, showType: e.target.value})}
                                >
                                    <option value="2D">2D</option>
                                    <option value="3D">3D</option>
                                    <option value="4DX">4DX</option>
                                    <option value="IMAX">IMAX</option>
                                    <option value="ICE">ICE</option>
                                </Form.Select>
                            </Form.Group>

                        </div>
                        
                        {!showForm.screenId && (
                            <div className="text-danger small fw-bold text-center mt-3 d-flex align-items-center justify-content-center gap-1">
                                <Activity size={14} /> Please select a screen from the list above.
                            </div>
                        )}
                        <Button 
                            variant="danger" 
                            type="submit" 
                            className="w-100 mt-3 py-2 rounded-pill btn-primary-bms fw-bold shadow-sm"
                            disabled={!showForm.screenId}
                        >
                            {isEditing ? 'Update Show' : 'Schedule Show'}
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>

            <Modal show={showModal === 'food'} onHide={resetForms} centered className="admin-modal">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">{isEditing ? 'Edit Food Item' : 'Add New Food Item'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-3">
                    <Form onSubmit={handleFoodSubmit}>
                        <div className="d-grid gap-3">
                            <Form.Group>
                                <Form.Label>Item Name</Form.Label>
                                <Form.Control required type="text" value={foodForm.name} onChange={e => setFoodForm({...foodForm, name: e.target.value})} />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Description</Form.Label>
                                <Form.Control required as="textarea" rows={2} value={foodForm.description} onChange={e => setFoodForm({...foodForm, description: e.target.value})} />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Price (₹)</Form.Label>
                                <Form.Control required type="number" value={foodForm.price} onChange={e => setFoodForm({...foodForm, price: e.target.value})} />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Image URL</Form.Label>
                                <Form.Control type="text" value={foodForm.imageUrl} onChange={e => setFoodForm({...foodForm, imageUrl: e.target.value})} />
                            </Form.Group>
                            <Form.Check 
                                type="switch"
                                label="Is Available"
                                checked={foodForm.isAvailable}
                                onChange={e => setFoodForm({...foodForm, isAvailable: e.target.checked})}
                            />
                        </div>
                        <Button variant="danger" type="submit" className="w-100 mt-4 py-2 rounded-pill btn-primary-bms fw-bold shadow-sm">
                            {isEditing ? 'Update Item' : 'Save Item'}
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
            <Modal show={!!selectedTheatre} onHide={() => setSelectedTheatre(null)} size="lg" centered className="admin-modal">
                <Modal.Header closeButton className="border-0">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <Modal.Title className="fw-bold">Manage Screens - {selectedTheatre?.name}</Modal.Title>
                        <Button variant="outline-primary" size="sm" onClick={() => fetchScreens(selectedTheatre.theatreId)} className="rounded-pill">
                            <Activity size={14} className="me-1"/> Refresh Screens
                        </Button>
                    </div>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <Form onSubmit={handleScreenSubmit} className="mb-4 p-4 bg-light rounded-4 shadow-sm border">
                        <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                            <Plus size={20} className={isEditing ? "text-primary" : "text-danger"}/> {isEditing ? 'Edit Screen Layout' : 'Add New Screen Layout'}
                        </h5>
                        <Row className="g-3 mb-4">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold">Screen Number</Form.Label>
                                    <Form.Control required type="text" placeholder="e.g. 1" value={screenForm.screenNumber} onChange={e => setScreenForm({...screenForm, screenNumber: e.target.value})} className="admin-input" />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold">Number of Rows</Form.Label>
                                    <Form.Control required type="number" min="1" max="26" value={screenForm.rowCount} onChange={e => setScreenForm({...screenForm, rowCount: e.target.value})} className="admin-input" />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold">Seats per Row</Form.Label>
                                    <Form.Control required type="number" min="1" max="30" value={screenForm.colCount} onChange={e => setScreenForm({...screenForm, colCount: e.target.value})} className="admin-input" />
                                </Form.Group>
                            </Col>
                        </Row>

                        <div className="mb-4">
                            <label className="small fw-bold mb-3 d-block">Set Pricing per Row</label>
                            <div style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '10px' }}>
                                <Row className="g-2">
                                    {(screenForm.rowPricings || []).map((rp, idx) => (
                                        <Col key={idx} xs={6} md={3}>
                                            <div className="p-2 border rounded-3 bg-white d-flex align-items-center gap-2 shadow-sm">
                                                <span className="fw-bold text-danger" style={{ width: '20px' }}>{rp.rowName}</span>
                                                <Form.Control 
                                                    size="sm" 
                                                    type="number" 
                                                    value={rp.price} 
                                                    onChange={(e) => {
                                                        const newPrices = [...screenForm.rowPricings];
                                                        newPrices[idx].price = e.target.value;
                                                        setScreenForm({...screenForm, rowPricings: newPrices});
                                                    }}
                                                    className="border-0 bg-light fw-bold"
                                                    placeholder="Price"
                                                />
                                            </div>
                                        </Col>
                                    ))}
                                </Row>
                            </div>
                            <div className="text-muted mt-2" style={{ fontSize: '0.75rem' }}>
                                Total Capacity: <span className="fw-bold text-dark">{screenForm.rowCount * screenForm.colCount} Seats</span>
                            </div>
                        </div>

                        <Button variant={isEditing ? "primary" : "danger"} type="submit" className="w-100 rounded-pill py-2 fw-bold btn-primary-bms shadow-sm">
                            {isEditing ? 'Update Screen Layout' : 'Generate Screen & Seats'}
                        </Button>
                    </Form>

                    <Table hover responsive className="admin-table align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th>Screen #</th>
                                <th>Capacity</th>
                                <th className="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {screens.length > 0 ? screens.map(s => (
                                <tr key={s.screenId}>
                                    <td className="fw-bold">Screen {s.screenNumber}</td>
                                     <td>
                                         <div className="fw-bold">{s.seatCapacity || 0} Seats</div>
                                         <div className="small text-muted">
                                             {(s.rowCount > 0 ? s.rowCount : '?')} Rows × {(s.colCount > 0 ? s.colCount : '?')} Cols
                                         </div>
                                     </td>
                                    <td className="text-end">
                                        <Button variant="link" className="text-danger p-0" onClick={() => handleDeleteScreen(s.screenId)}><Trash2 size={18}/></Button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="3" className="text-center py-4 text-muted">No screens registered for this theatre yet.</td></tr>
                            )}
                        </tbody>
                    </Table>
                </Modal.Body>
            </Modal>
            
            <Modal show={showModal === 'complaint-response'} onHide={resetForms} centered className="admin-modal">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">Respond to Complaint</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-3">
                    <Form onSubmit={handleComplaintResponse}>
                        <div className="d-grid gap-3">
                            <Form.Group>
                                <Form.Label>Resolution / Response</Form.Label>
                                <Form.Control 
                                    required 
                                    as="textarea" 
                                    rows={4} 
                                    value={complaintResponse.resolution} 
                                    onChange={e => setComplaintResponse({...complaintResponse, resolution: e.target.value})} 
                                    placeholder="Enter resolution details..."
                                />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Status</Form.Label>
                                <Form.Select 
                                    value={complaintResponse.status} 
                                    onChange={e => setComplaintResponse({...complaintResponse, status: e.target.value})}
                                >
                                    <option value="OPEN">Open</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="RESOLVED">Resolved</option>
                                </Form.Select>
                            </Form.Group>
                        </div>
                        <Button variant="danger" type="submit" className="w-100 mt-4 py-2 rounded-pill btn-primary-bms fw-bold shadow-sm">
                            Send Response
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
            <Modal show={showModal === 'view-booking'} onHide={resetForms} centered className="admin-modal" size="lg">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">Booking Details</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-3">
                    {selectedBooking ? (
                        <div>
                            <Row className="mb-4">
                                <Col md={6}>
                                    <div className="border p-3 rounded bg-light h-100">
                                        <p className="text-muted small mb-1 text-uppercase fw-bold">Ticket Details</p>
                                        <p className="mb-1"><strong>Booking ID:</strong> #{selectedBooking.bookingId}</p>
                                        <p className="mb-1"><strong>Status:</strong> <Badge bg={selectedBooking.status === 'CONFIRMED' ? 'success' : 'warning'}>{selectedBooking.status === 'CONFIRMED' ? 'PAID' : selectedBooking.status}</Badge></p>
                                        
                                        {(() => {
                                            const show = shows.find(s => s.showId === selectedBooking.showId);
                                            const movie = show ? movies.find(m => m.movieId === show.movieId) : null;
                                            const theatre = show ? theatres.find(t => t.theatreId === show.theatreId) : null;
                                            return (
                                                <>
                                                    <p className="mb-1 text-truncate"><strong>Movie:</strong> {movie?.title || 'Unknown Movie'}</p>
                                                    <p className="mb-1"><strong>Theatre:</strong> {theatre?.name || 'Unknown Theatre'}</p>
                                                </>
                                            );
                                        })()}
                                        
                                        <p className="mb-1"><strong>Date:</strong> {new Date(selectedBooking.bookingTime).toLocaleString()}</p>
                                        <p className="mb-1"><strong>Seats:</strong> {selectedBooking.seatNumbers?.join(', ') || 'N/A'}</p>
                                        
                                        {(() => {
                                            const foodTotal = (selectedBooking.concessionOrders || []).reduce((sum, item) => sum + (item.totalPrice || 0), 0);
                                            const baseTicketPrice = (selectedBooking.totalAmount || selectedBooking.finalAmountPaid || 0) - foodTotal;
                                            return (
                                                <div className="mt-3 pt-2 border-top">
                                                    <div className="d-flex justify-content-between fw-bold text-dark mb-1">
                                                        <span>Ticket Price</span>
                                                        <span>₹{baseTicketPrice}</span>
                                                    </div>
                                                    
                                                    {selectedBooking.concessionOrders && selectedBooking.concessionOrders.length > 0 && (
                                                        <>
                                                            <p className="text-muted small mb-1 text-uppercase fw-bold mt-2">Food & Beverages</p>
                                                            {selectedBooking.concessionOrders.map((item, idx) => {
                                                                const food = foodItems.find(f => f.foodItemId === item.foodItemId);
                                                                return (
                                                                    <div key={idx} className="d-flex justify-content-between small text-muted">
                                                                        <span>{item.quantity}x {food?.name || `Item #${item.foodItemId}`}</span>
                                                                        <span>₹{item.totalPrice}</span>
                                                                    </div>
                                                                );
                                                                })}
                                                        </>
                                                    )}
                                                    
                                                    <div className="d-flex justify-content-between fw-bold text-success mt-3 pt-2 border-top" style={{fontSize: '1.1rem'}}>
                                                        <span>Grand Total</span>
                                                        <span>₹{selectedBooking.totalAmount || selectedBooking.finalAmountPaid}</span>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="border p-3 rounded bg-light h-100">
                                        <p className="text-muted small mb-1 text-uppercase fw-bold">User Information</p>
                                        {(() => {
                                            const user = users.find(u => u.userId === selectedBooking.userId);
                                            return user ? (
                                                <>
                                                    <div className="d-flex align-items-center mb-3">
                                                        <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white me-3" style={{width: '50px', height: '50px', fontSize: '1.2rem'}}>
                                                            {user.name?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="mb-0 fw-bold">{user.name}</p>
                                                            <p className="mb-0 small text-muted">{user.email}</p>
                                                        </div>
                                                    </div>
                                                    <p className="mb-1"><strong>User ID:</strong> {user.userId}</p>
                                                    <p className="mb-1"><strong>Phone:</strong> {user.phone || 'N/A'}</p>
                                                    <p className="mb-0"><strong>Role:</strong> <Badge bg="info">{user.role || 'USER'}</Badge></p>
                                                </>
                                            ) : (
                                                <p className="mb-0 text-muted">User ID: {selectedBooking.userId}</p>
                                            );
                                        })()}
                                    </div>
                                </Col>
                            </Row>
                            <Row className="mb-4">
                                <Col md={12}>
                                    <div className="border p-3 rounded bg-white shadow-sm">
                                        <p className="text-muted small mb-1 text-uppercase fw-bold">Payment Information</p>
                                        {bookingDetailsLoading ? (
                                            <p className="mb-0 text-muted d-flex align-items-center gap-2">
                                                <div className="spinner-border spinner-border-sm text-danger" role="status"></div>
                                                Fetching payment record...
                                            </p>
                                        ) : selectedPayment ? (
                                            <Row className="align-items-center">
                                                <Col md={6}>
                                                    <p className="mb-1"><strong>Transaction ID:</strong> <span className="font-monospace text-primary">{selectedPayment.transactionId || selectedPayment.idempotencyKey || `TXN-${selectedBooking.bookingId}`}</span></p>
                                                    <p className="mb-0"><strong>Method:</strong> <Badge bg="secondary" className="px-3 rounded-pill">{selectedPayment.method?.replace('_', ' ') || 'UNKNOWN'}</Badge></p>
                                                </Col>
                                                <Col md={6} className="text-end">
                                                    <p className="mb-1"><strong>Payment Status:</strong> <Badge bg={(selectedPayment.status === 'SUCCESS' || selectedBooking.status === 'CONFIRMED') ? 'success' : 'warning'}>{(selectedPayment.status === 'SUCCESS' || selectedBooking.status === 'CONFIRMED') ? 'SUCCESS' : selectedPayment.status}</Badge></p>
                                                    <p className="mb-0 text-muted small">Processed via secure gateway</p>
                                                </Col>
                                            </Row>
                                        ) : (
                                            <Alert variant="warning" className="mb-0 py-2">
                                                No detailed payment record found for this booking. <br/>
                                                <small className="text-muted">(This may happen for bookings created before the payment tracking system was updated.)</small>
                                            </Alert>
                                        )}
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    ) : null}
                </Modal.Body>
            </Modal>

            <Modal show={showModal === 'user'} onHide={resetForms} centered className="admin-modal">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">{isEditing ? 'Edit User Profile' : 'Register New User'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <Form onSubmit={handleUserSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold">Full Name</Form.Label>
                            <Form.Control required type="text" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} className="admin-input" placeholder="e.g. Rahul Potdar" />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold">Email Address</Form.Label>
                            <Form.Control required type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="admin-input" placeholder="name@example.com" />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold">Phone Number</Form.Label>
                            <Form.Control required type="text" value={userForm.phone} onChange={e => setUserForm({...userForm, phone: e.target.value})} className="admin-input" placeholder="10-15 digits" />
                        </Form.Group>
                        {!isEditing && (
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold">Initial Password</Form.Label>
                                <Form.Control required type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="admin-input" placeholder="At least 6 characters" />
                            </Form.Group>
                        )}
                        <Form.Group className="mb-4">
                            <Form.Check 
                                type="switch"
                                label="Grant Administrator Privileges"
                                checked={userForm.isAdmin}
                                onChange={e => setUserForm({...userForm, isAdmin: e.target.checked})}
                                className="fw-bold text-danger"
                            />
                        </Form.Group>
                        <Button type="submit" variant="danger" className="w-100 py-2 fw-bold btn-primary-bms">
                            {isEditing ? 'Update Profile' : 'Register User'}
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>

            <Modal show={showModal === 'admin-change-password'} onHide={resetForms} centered className="admin-modal">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">Update User Password</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <p className="text-muted small mb-4">You are updating the login credentials for <strong>{adminPasswordForm.userName}</strong> (User ID: {adminPasswordForm.userId}).</p>
                    <Form onSubmit={handleAdminPasswordChange}>
                        <Form.Group className="mb-4">
                            <Form.Label className="small fw-bold">New Temporary Password</Form.Label>
                            <Form.Control 
                                type="text" 
                                value={adminPasswordForm.newPassword} 
                                onChange={(e) => setAdminPasswordForm({...adminPasswordForm, newPassword: e.target.value})}
                                className="admin-input"
                                placeholder="Enter new password"
                                required
                            />
                        </Form.Group>
                        <Button type="submit" variant="danger" className="w-100 py-2 fw-bold btn-primary-bms">
                            Change Password
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default AdminDashboard;
