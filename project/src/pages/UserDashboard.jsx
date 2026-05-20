import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Spinner, Alert, Button, Form, Modal } from 'react-bootstrap';
import { getBookings, getWalletByUserId, addWalletMoney, updateUser, getMovies, getTheatres, changePassword, getBookingById, getPaymentByBookingId, getShowById, getFoodItems, createRazorpayOrder, verifyRazorpayPayment } from '../services/api';
import { User, Wallet, History, Settings, Plus, Save, Download, Ticket as TicketIcon, Key } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const UserDashboard = () => {
    const [bookings, setBookings] = useState([]);
    const [wallet, setWallet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState({ type: '', message: '' });
    
    // User Edit State
    const [editMode, setEditMode] = useState(false);
    const [userData, setUserData] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
    
    // Wallet Modal State
    const [showWalletModal, setShowWalletModal] = useState(false);
    const [amountToAdd, setAmountToAdd] = useState('');
    const [walletLoading, setWalletLoading] = useState(false);
    const [walletVerificationStatus, setWalletVerificationStatus] = useState('');
    const [walletError, setWalletError] = useState(null);
    
    // PDF Generation State
    const [downloading, setDownloading] = useState(null); // bookingId
    const ticketRef = React.useRef(null);
    const [activeTicket, setActiveTicket] = useState(null);
    const [foodMap, setFoodMap] = useState({});
    
    // Password State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwords, setPasswords] = useState({ new: '', confirm: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [bookingsRes, walletRes, moviesRes, theatresRes, foodRes] = await Promise.all([
                getBookings(),
                getWalletByUserId(userData.userId),
                getMovies().catch(() => ({ data: [] })),
                getTheatres().catch(() => ({ data: [] })),
                getFoodItems().catch(() => ({ data: [] }))
            ]);
            
            const movies = moviesRes.data || [];
            const theatres = theatresRes.data || [];
            
            // Populate food item name map
            const map = {};
            if (foodRes.data) {
                foodRes.data.forEach(item => {
                    map[item.foodItemId] = item.name;
                });
            }
            setFoodMap(map);
            
            const myBookings = (bookingsRes.data || []).filter(b => b.userId === userData.userId)
                .map(b => {
                    const movie = movies.find(m => String(m.movieId) === String(b.showId ? b.showId : '')); // Simplified, usually need to go through shows
                    // If we can't find by showId directly (since it's a mapping), we'll try to handle it
                    return {
                        ...b,
                        movieTitle: movie?.title || "Movie Ticket",
                        theatreName: "Cinema Hall" // Placeholder if not available
                    };
                });
            
            setBookings(myBookings.sort((a, b) => new Date(b.bookingTime) - new Date(a.bookingTime)));
            setWallet(walletRes.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            setError("Failed to load dashboard data.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadTicket = async (booking) => {
        try {
            setDownloading(booking.bookingId);
            
            // Fetch complete rich details dynamically on download click
            const [bookingDetailRes, paymentRes] = await Promise.all([
                getBookingById(booking.bookingId).catch(() => ({ data: booking })),
                getPaymentByBookingId(booking.bookingId).catch(() => ({ data: null }))
            ]);
            
            const richBooking = bookingDetailRes.data;
            const richPayment = paymentRes.data;
            
            let richShow = null;
            if (richBooking && richBooking.showId) {
                try {
                    const showRes = await getShowById(richBooking.showId);
                    richShow = showRes.data;
                } catch (showErr) {
                    console.warn("Could not fetch show details for ticket", showErr);
                }
            }
            
            // Combine everything into activeTicket
            setActiveTicket({
                booking: richBooking,
                payment: richPayment,
                showDetails: richShow || {
                    movieTitle: booking.movieTitle || "Movie Ticket",
                    theatreName: booking.theatreName || "Cinema Hall",
                    screenNumber: "Screen 1",
                    showType: "2D",
                    startTime: richBooking.bookingTime
                }
            });
            
            // Allow state update to render the hidden ticket
            setTimeout(async () => {
                if (!ticketRef.current) {
                    setDownloading(null);
                    return;
                }
                
                const canvas = await html2canvas(ticketRef.current, {
                    scale: 2,
                    backgroundColor: '#ffffff',
                    useCORS: true
                });
                
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                
                const imgWidth = 160; // 160mm wide
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                const x = (pdfWidth - imgWidth) / 2;
                const y = 20; // 20mm margin from top
                
                pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
                
                pdf.save(`Ticket_BMS${booking.bookingId}.pdf`);
                setDownloading(null);
                setActiveTicket(null);
            }, 600);
        } catch (err) {
            console.error("PDF generation failed:", err);
            setDownloading(null);
            setActiveTicket(null);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await updateUser(userData.userId, userData);
            const updatedUser = { ...userData, ...res.data };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUserData(updatedUser);
            setEditMode(false);
            showMessage('success', 'Profile updated successfully!');
        } catch (err) {
            showMessage('danger', 'Failed to update profile.');
        }
    };

    const handleAddMoney = async (e) => {
        e.preventDefault();
        setWalletError(null);
        setWalletVerificationStatus('');
        setWalletLoading(true);
        
        const topupAmount = parseFloat(amountToAdd);
        if (isNaN(topupAmount) || topupAmount <= 0) {
            setWalletError("Please enter a valid amount.");
            setWalletLoading(false);
            return;
        }

        try {
            setWalletVerificationStatus('Initializing secure top-up...');
            
            // 1. Create Razorpay order (bookingId = 0 is a custom placeholder for wallet top-ups)
            const orderRes = await createRazorpayOrder(0, topupAmount);
            const orderData = orderRes.data;

            if (orderData.mock) {
                // MOCK FALLBACK (If Razorpay client not initialized on backend)
                setWalletVerificationStatus('Processing Mock Top-up transaction...');
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                await verifyRazorpayPayment({ mock: 'true' });
                await addWalletMoney(userData.userId, topupAmount, "Wallet Top-up via Razorpay (Mock)");
                
                setAmountToAdd('');
                setShowWalletModal(false);
                showMessage('success', `₹${topupAmount} successfully added to your wallet!`);
                fetchData();
                setWalletLoading(false);
            } else {
                // REAL RAZORPAY STANDARD FLOW
                const options = {
                    key: "rzp_test_SqodXyFq6vo5LH",
                    amount: orderData.amount,
                    currency: orderData.currency,
                    name: "BookMyShow Clone",
                    description: `Wallet Top-up - User #${userData.userId}`,
                    order_id: orderData.orderId,
                    handler: async function (response) {
                        try {
                            setWalletLoading(true);
                            setWalletVerificationStatus('Verifying secure signature...');
                            
                            const verificationRes = await verifyRazorpayPayment({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            });
                            
                            if (verificationRes.data.status === 'success') {
                                setWalletVerificationStatus('Payment Verified! Adding balance to your wallet...');
                                await addWalletMoney(userData.userId, topupAmount, `Wallet Top-up via Razorpay (${response.razorpay_payment_id})`);
                                
                                setAmountToAdd('');
                                setShowWalletModal(false);
                                showMessage('success', `₹${topupAmount} successfully added to your wallet!`);
                                fetchData();
                            } else {
                                setWalletError("Payment verification failed.");
                            }
                        } catch (verifyErr) {
                            console.error("Verification failed", verifyErr);
                            setWalletError("Payment verification failed. Please check with your bank.");
                        } finally {
                            setWalletLoading(false);
                            setWalletVerificationStatus('');
                        }
                    },
                    prefill: {
                        name: userData.name || "Customer",
                        email: userData.email || "customer@example.com",
                    },
                    theme: {
                        color: "#F84464"
                    },
                    modal: {
                        ondismiss: function() {
                            setWalletLoading(false);
                            setWalletVerificationStatus('');
                            setWalletError("Payment was cancelled by the user.");
                        }
                    }
                };

                if (!window.Razorpay) {
                    setWalletError("Razorpay SDK failed to load. Please check your internet connection.");
                    setWalletLoading(false);
                    setWalletVerificationStatus('');
                    return;
                }

                const rzp = new window.Razorpay(options);
                rzp.on('payment.failed', function (response) {
                    console.error("Payment failed", response.error);
                    setWalletError("Payment failed: " + response.error.description);
                    setWalletLoading(false);
                    setWalletVerificationStatus('');
                });
                rzp.open();
            }
        } catch (err) {
            console.error("Wallet top-up failed:", err);
            setWalletError(err.response?.data?.message || err.response?.data || "Transaction failed. Please try again.");
            setWalletLoading(false);
            setWalletVerificationStatus('');
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            showMessage('danger', 'Passwords do not match!');
            return;
        }
        try {
            await changePassword(userData.userId, passwords.new);
            setShowPasswordModal(false);
            setPasswords({ new: '', confirm: '' });
            showMessage('success', 'Password changed successfully!');
        } catch (err) {
            showMessage('danger', 'Failed to change password.');
        }
    };

    const showMessage = (type, message) => {
        setStatus({ type, message });
        setTimeout(() => setStatus({ type: '', message: '' }), 4000);
    };

    if (loading && !wallet) {
        return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
            <Spinner animation="border" variant="danger" />
        </div>;
    }

    return (
        <Container className="py-5" style={{ minHeight: '80vh' }}>
            {status.message && <Alert variant={status.type} className="mb-4">{status.message}</Alert>}
            
            <Row className="mb-5 align-items-center">
                <Col>
                    <h2 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>My Profile</h2>
                    <p className="text-muted">Manage your account, bookings and wallet balance.</p>
                </Col>
                <Col xs="auto">
                    <Button variant={editMode ? "outline-secondary" : "primary-bms"} onClick={() => setEditMode(!editMode)}>
                        {editMode ? "Cancel" : <><Settings size={18} className="me-2"/>Edit Profile</>}
                    </Button>
                </Col>
            </Row>

            <Row className="g-4">
                {/* Profile Card */}
                <Col lg={4}>
                    <Card className="border-0 shadow-sm mb-4" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}>
                        <Card.Body className="p-4">
                            <div className="text-center mb-4">
                                <div className="rounded-circle bg-danger d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px', color: 'white' }}>
                                    <User size={40} />
                                </div>
                                <h4 className="fw-bold mb-0">{userData.name}</h4>
                                <p className="text-muted small">{userData.role || 'Movie Enthusiast'}</p>
                            </div>
                            
                            {editMode ? (
                                <Form onSubmit={handleProfileUpdate}>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="small fw-bold">Full Name</Form.Label>
                                        <Form.Control 
                                            value={userData.name} 
                                            onChange={(e) => setUserData({...userData, name: e.target.value})}
                                            className="admin-input"
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="small fw-bold">Email</Form.Label>
                                        <Form.Control 
                                            value={userData.email} 
                                            onChange={(e) => setUserData({...userData, email: e.target.value})}
                                            className="admin-input"
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="small fw-bold">Phone Number</Form.Label>
                                        <Form.Control 
                                            value={userData.phone} 
                                            onChange={(e) => setUserData({...userData, phone: e.target.value})}
                                            className="admin-input"
                                        />
                                    </Form.Group>
                                    <Button type="submit" variant="primary-bms" className="w-100">
                                        <Save size={18} className="me-2"/> Save Changes
                                    </Button>
                                </Form>
                            ) : (
                                <div className="mt-4">
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="text-muted small">Email</span>
                                        <span className="fw-semibold text-truncate ms-2">{userData.email}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="text-muted small">Phone</span>
                                        <span className="fw-semibold">{userData.phone}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="text-muted small">Member Since</span>
                                        <span className="fw-semibold">May 2026</span>
                                    </div>
                                    <div className="mt-4 pt-3 border-top">
                                        <Button 
                                            variant="outline-secondary" 
                                            size="sm" 
                                            className="w-100 d-flex align-items-center justify-content-center"
                                            onClick={() => setShowPasswordModal(true)}
                                        >
                                            <Key size={14} className="me-2"/> Change Password
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Wallet Card */}
                    <Card className="border-0 shadow-sm" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}>
                        <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5 className="fw-bold mb-0"><Wallet className="me-2" size={20}/> My Wallet</h5>
                                <Button variant="link" className="p-0 text-danger" onClick={() => { setAmountToAdd(''); setWalletError(null); setWalletVerificationStatus(''); setWalletLoading(false); setShowWalletModal(true); }}>
                                    <Plus size={20}/>
                                </Button>
                            </div>
                            <div className="p-3 rounded mb-3" style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
                                <div className="text-muted small mb-1">Available Balance</div>
                                <h2 className="fw-bold mb-0">₹{wallet?.balance || '0.00'}</h2>
                            </div>
                            <Button variant="outline-danger" className="w-100 fw-bold" onClick={() => { setAmountToAdd(''); setWalletError(null); setWalletVerificationStatus(''); setWalletLoading(false); setShowWalletModal(true); }}>
                                Add Money
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Bookings Section */}
                <Col lg={8}>
                    <Card className="border-0 shadow-sm h-100" style={{ backgroundColor: 'var(--card-bg)' }}>
                        <Card.Header className="bg-transparent border-0 p-4 pb-0">
                            <h5 className="fw-bold mb-0"><History className="me-2" size={20}/> Booking History</h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            {error ? (
                                <Alert variant="danger" className="m-4">{error}</Alert>
                            ) : bookings.length === 0 ? (
                                <div className="p-5 text-center text-muted">You haven't made any bookings yet.</div>
                            ) : (
                                <div className="table-responsive">
                                    <Table hover className="mb-0 admin-table">
                                        <thead>
                                            <tr>
                                                <th>Booking Details</th>
                                                <th>Amount</th>
                                                <th>Status</th>
                                                <th>Date</th>
                                                <th className="text-end pe-4">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bookings.map(b => (
                                                <tr key={b.bookingId}>
                                                    <td>
                                                        <div className="fw-bold text-primary" style={{ color: 'var(--bms-red)' }}>#{b.bookingId}</div>
                                                        <div className="fw-semibold text-truncate" style={{ maxWidth: '200px' }}>{b.movieTitle || "Movie Show"}</div>
                                                        <div className="small text-muted">{b.theatreName} {b.seatNumbers && `| Seats: ${b.seatNumbers.join(', ')}`}</div>
                                                    </td>
                                                    <td className="fw-bold">₹{b.totalAmount || b.finalAmountPaid}</td>
                                                    <td>
                                                        <Badge bg={b.status === 'CONFIRMED' ? 'success' : 'warning'}>
                                                            {b.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="small text-muted">
                                                        {new Date(b.bookingTime).toLocaleDateString()}
                                                    </td>
                                                    <td className="text-end pe-4">
                                                        <Button 
                                                            variant="link" 
                                                            className="text-danger p-0" 
                                                            onClick={() => handleDownloadTicket(b)}
                                                            disabled={downloading === b.bookingId}
                                                            title="Download Ticket"
                                                        >
                                                            {downloading === b.bookingId ? (
                                                                <Spinner size="sm" />
                                                            ) : (
                                                                <Download size={20} />
                                                            )}
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Change Password Modal */}
            <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered className="admin-modal">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">Change Password</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <Form onSubmit={handlePasswordChange}>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold">New Password</Form.Label>
                            <Form.Control 
                                type="password" 
                                value={passwords.new} 
                                onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                                className="admin-input"
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-4">
                            <Form.Label className="small fw-bold">Confirm New Password</Form.Label>
                            <Form.Control 
                                type="password" 
                                value={passwords.confirm} 
                                onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                                className="admin-input"
                                required
                            />
                        </Form.Group>
                        <Button type="submit" variant="primary-bms" className="w-100 py-2 fw-bold">
                            Update Password
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Add Money Modal */}
            <Modal show={showWalletModal} onHide={() => !walletLoading && setShowWalletModal(false)} centered className="admin-modal">
                <Modal.Header closeButton={!walletLoading} className="border-0 pb-0">
                    <Modal.Title className="fw-bold">Add Money to Wallet</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    {walletError && (
                        <Alert variant="danger" className="border-0 rounded-3 shadow-sm py-2 px-3 small mb-3">
                            {walletError}
                        </Alert>
                    )}
                    {walletVerificationStatus && (
                        <Alert variant="info" className="border-0 rounded-3 shadow-sm py-2 px-3 small mb-3 d-flex align-items-center gap-2">
                            <Spinner animation="border" size="sm" />
                            <span>{walletVerificationStatus}</span>
                        </Alert>
                    )}
                    <Form onSubmit={handleAddMoney}>
                        <Form.Group className="mb-4">
                            <Form.Label className="text-muted small fw-bold">Enter Amount (₹)</Form.Label>
                            <Form.Control 
                                type="number" 
                                placeholder="e.g. 500" 
                                value={amountToAdd} 
                                onChange={(e) => setAmountToAdd(e.target.value)}
                                className="admin-input form-control-lg fw-bold"
                                required
                                disabled={walletLoading}
                            />
                        </Form.Group>
                        <div className="d-flex gap-2 mb-4">
                            {[100, 500, 1000, 2000].map(amt => (
                                <Button 
                                    key={amt} 
                                    variant="outline-secondary" 
                                    size="sm" 
                                    disabled={walletLoading}
                                    onClick={() => setAmountToAdd(amt.toString())}
                                >
                                    +₹{amt}
                                </Button>
                            ))}
                        </div>
                        <Button 
                            type="submit" 
                            variant="primary-bms" 
                            className="w-100 py-2 fw-bold"
                            disabled={walletLoading}
                        >
                            {walletLoading ? (
                                <div className="d-flex align-items-center justify-content-center gap-2">
                                    <Spinner animation="border" size="sm" />
                                    <span>Processing Payment...</span>
                                </div>
                            ) : "Proceed to Top-up"}
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Hidden Ticket Template for PDF Generation */}
            {activeTicket && activeTicket.booking && (
                <div style={{ position: 'absolute', left: '-9999px', top: '0' }}>
                    <div ref={ticketRef} style={{ width: '550px', backgroundColor: '#fdfdfd', padding: '30px', fontFamily: "'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
                        <div style={{ borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 25px rgba(0, 0, 0, 0.08)', border: '1px solid #e0e0e0', backgroundColor: '#ffffff' }}>
                            {/* Header */}
                            <div style={{ backgroundColor: '#D63946', color: '#fff', textAlign: 'center', padding: '24px 20px' }}>
                                <h3 style={{ margin: '0', fontSize: '26px', fontWeight: '700', letterSpacing: '0.5px' }}>E-Ticket</h3>
                                <div style={{ fontSize: '14px', opacity: '0.8', marginTop: '4px' }}>Booking ID: BMS{activeTicket.booking.bookingId}</div>
                            </div>

                            {/* Body */}
                            <div style={{ padding: '30px 35px' }}>
                                {/* Movie Title */}
                                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                                    <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 6px 0', lineHeight: '1.2' }}>
                                        {activeTicket.showDetails ? activeTicket.showDetails.movieTitle : "Movie Ticket"}
                                    </h2>
                                    <div style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>
                                        {activeTicket.showDetails ? `${activeTicket.showDetails.theatreName} - ${activeTicket.showDetails.screenNumber}` : "Cinema Hall"}
                                    </div>
                                    {activeTicket.showDetails && (
                                        <div style={{ marginTop: '10px' }}>
                                            <span style={{ backgroundColor: '#6c757d', color: '#fff', padding: '3px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', display: 'inline-block', textTransform: 'uppercase' }}>
                                                {activeTicket.showDetails.showType || '2D'}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Status & Amount Paid Row */}
                                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                                    <div style={{ flex: 1, backgroundColor: '#fdfdfd', border: '1px solid #e9ecef', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                                        <div style={{ color: '#888', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>STATUS</div>
                                        <div style={{ fontWeight: '700', fontSize: '18px', color: '#198754' }}>{activeTicket.booking.status}</div>
                                    </div>
                                    <div style={{ flex: 1, backgroundColor: '#fdfdfd', border: '1px solid #e9ecef', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                                        <div style={{ color: '#888', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>AMOUNT PAID</div>
                                        <div style={{ fontWeight: '700', fontSize: '18px', color: '#212529' }}>Rs. {activeTicket.booking.totalAmount || activeTicket.booking.finalAmountPaid}</div>
                                    </div>
                                </div>

                                {/* Transaction ID & Payment Method Row */}
                                {activeTicket.payment && (
                                    <div style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                        <div>
                                            <div style={{ color: '#888', fontSize: '11px', fontWeight: '500', marginBottom: '2px' }}>Transaction ID</div>
                                            <div style={{ fontWeight: '700', fontSize: '13px', color: '#212529' }}>
                                                {activeTicket.payment.transactionId || activeTicket.payment.idempotencyKey || `TXN-${activeTicket.booking.bookingId}`}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ color: '#888', fontSize: '11px', fontWeight: '500', marginBottom: '2px' }}>Payment Method</div>
                                            <div style={{ fontWeight: '700', fontSize: '13px', color: '#212529', textTransform: 'uppercase' }}>
                                                {activeTicket.payment.method ? activeTicket.payment.method.replace('_', ' ') : 'Card / UPI'}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <hr style={{ borderTop: '1px solid #dee2e6', borderBottom: 'none', borderLeft: 'none', borderRight: 'none', margin: '20px 0' }} />

                                {/* Show Timing & Seats */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                    <div>
                                        <div style={{ color: '#888', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>Show Timing</div>
                                        <div style={{ fontWeight: '700', fontSize: '15px', color: '#212529' }}>
                                            {activeTicket.showDetails ? new Date(activeTicket.showDetails.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : new Date(activeTicket.booking.bookingTime).toLocaleString()}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ color: '#888', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>Seats ({activeTicket.booking.seatNumbers?.length || 0})</div>
                                        <div style={{ fontWeight: '700', fontSize: '15px', color: '#212529' }}>{activeTicket.booking.seatNumbers?.join(', ')}</div>
                                    </div>
                                </div>

                                <hr style={{ borderTop: '1px solid #dee2e6', borderBottom: 'none', borderLeft: 'none', borderRight: 'none', margin: '20px 0' }} />

                                {/* Order Summary */}
                                <div style={{ marginBottom: '10px' }}>
                                    <div style={{ color: '#666', fontSize: '12px', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Order Summary</div>
                                    <div style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '8px', padding: '15px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#495057' }}>Tickets ({activeTicket.booking.seatNumbers?.length || 0})</span>
                                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#212529' }}>
                                                Rs. {activeTicket.booking.totalAmount - (activeTicket.booking.concessionOrders ? activeTicket.booking.concessionOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0) : 0)}
                                            </span>
                                        </div>

                                        {activeTicket.booking.concessionOrders && activeTicket.booking.concessionOrders.map((order, idx) => (
                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#6c757d' }}>
                                                <span style={{ fontSize: '13px' }}>+ {order.quantity}x {foodMap[order.foodItemId] || `Food Item`}</span>
                                                <span style={{ fontSize: '13px', fontWeight: '600' }}>Rs. {order.totalPrice}</span>
                                            </div>
                                        ))}

                                        <hr style={{ borderTop: '1px solid #dee2e6', borderBottom: 'none', margin: '10px 0' }} />

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                                            <span style={{ fontSize: '14px', fontWeight: '700', color: '#212529' }}>Grand Total</span>
                                            <span style={{ fontSize: '16px', fontWeight: '700', color: '#198754' }}>Rs. {activeTicket.booking.totalAmount}</span>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                        <div style={{ textAlign: 'center', fontSize: '11px', color: '#aaa', marginTop: '20px' }}>
                            Downloaded on: {new Date().toLocaleString()}
                        </div>
                    </div>
                </div>
            )}
        </Container>
    );
};

export default UserDashboard;
