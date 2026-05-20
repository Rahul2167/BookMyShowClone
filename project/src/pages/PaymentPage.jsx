import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Spinner, Alert } from 'react-bootstrap';
import { CheckCircle, ShieldCheck, CreditCard, Wallet, Smartphone, ShieldAlert } from 'lucide-react';
import { addBooking, createRazorpayOrder, verifyRazorpayPayment, confirmBooking, getWalletByUserId, initiatePayment, confirmPayment } from '../services/api';

const PaymentPage = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { 
    selectedSeatObjects = [], 
    seatTotal = 0, 
    concessionOrders = [], 
    foodTotal = 0, 
    grandTotal = 0 
  } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [useWallet, setUseWallet] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      getWalletByUserId(user.userId).then(res => {
        setWallet(res.data);
      }).catch(err => console.error("Wallet fetch error", err));
    }
  }, []);

  if (!selectedSeatObjects.length) {
    return (
      <Container className="mt-5 text-center">
        <Alert variant="warning">Invalid checkout state. Please go back and select seats.</Alert>
        <Button variant="outline-danger" onClick={() => navigate('/')}>Go to Home</Button>
      </Container>
    );
  }

  // Calculate dynamic amounts based on wallet selection
  const walletBalance = wallet ? wallet.balance : 0;
  const walletDeduction = useWallet ? Math.min(walletBalance, grandTotal) : 0;
  const finalPayableAmount = grandTotal - walletDeduction;

  const handlePayment = async (e) => {
    e.preventDefault();
    setError(null);
    setVerificationStatus('');
    setLoading(true);

    const userStr = localStorage.getItem('user');
    if (!userStr) {
      setError("Please login first.");
      setLoading(false);
      return;
    }
    
    const user = JSON.parse(userStr);

    try {
      setVerificationStatus('Securing booking details...');

      // 1. Create Booking
      const bookingPayload = {
        userId: user.userId,
        showId: parseInt(showId),
        showSeatIds: selectedSeatObjects.map(s => s.showSeatId),
        useWallet: useWallet,
        concessionOrders: concessionOrders
      };

      const bookingRes = await addBooking(bookingPayload);
      const bookingId = bookingRes.data.bookingId;
      const finalAmount = bookingRes.data.finalAmountPaid; // Amount left to pay after wallet

      // 2. Initiate Payment (Razorpay or Wallet Fallback)
      if (finalAmount > 0) {
        setVerificationStatus('Initializing Razorpay Secure Checkout...');
        const orderRes = await createRazorpayOrder(bookingId, finalAmount);
        const orderData = orderRes.data;

        if (orderData.mock) {
          // MOCK FALLBACK (If Razorpay client not initialized)
          setVerificationStatus('Processing Mock Transaction...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          setVerificationStatus('Payment Successful! Confirming booking...');
          await verifyRazorpayPayment({ mock: 'true' });
          await initiatePayment(bookingId, finalAmount, 'CREDIT_CARD'); // Save to DB
          await confirmBooking(bookingId);
          await confirmPayment(bookingId); // Update payment record to SUCCESS
          navigate(`/confirmation/${bookingId}`, { replace: true });
        } else {
          // REAL RAZORPAY STANDARD FLOW
          const options = {
            key: "rzp_test_SqodXyFq6vo5LH",
            amount: orderData.amount,
            currency: orderData.currency,
            name: "BookMyShow Clone",
            description: `Movie Tickets booking - ID #${bookingId}`,
            order_id: orderData.orderId,
            handler: async function (response) {
              try {
                setLoading(true);
                setVerificationStatus('Verifying secure signature...');
                const verificationRes = await verifyRazorpayPayment({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                });
                
                if (verificationRes.data.status === 'success') {
                  setVerificationStatus('Payment Verified! Confirming your booking...');
                  await initiatePayment(bookingId, finalAmount, 'CREDIT_CARD'); // Save to DB using a safe existing enum value
                  await confirmBooking(bookingId);
                  await confirmPayment(bookingId, response.razorpay_payment_id); // Update payment record to SUCCESS and save transaction ID
                  navigate(`/confirmation/${bookingId}`, { replace: true });
                }
              } catch (verifyErr) {
                console.error("Verification failed", verifyErr);
                setError("Payment verification failed. Please contact support.");
                setLoading(false);
                setVerificationStatus('');
              }
            },
            prefill: {
              name: user.name || "Customer",
              email: user.email || "customer@example.com",
            },
            theme: {
              color: "#F84464"
            },
            modal: {
              ondismiss: function() {
                setLoading(false);
                setVerificationStatus('');
                setError("Payment was cancelled by the user.");
              }
            }
          };
          
          if (!window.Razorpay) {
            setError("Razorpay SDK failed to load. Please check your internet connection.");
            setLoading(false);
            setVerificationStatus('');
            return;
          }
          
          const rzp = new window.Razorpay(options);
          rzp.on('payment.failed', function (response){
            console.error("Payment failed", response.error);
            setError("Payment failed: " + response.error.description);
            setLoading(false);
            setVerificationStatus('');
          });
          rzp.open();
        }
      } else {
        // Full wallet payment
        setVerificationStatus('Processing Wallet payment...');
        await new Promise(resolve => setTimeout(resolve, 800));
        setVerificationStatus('Payment Successful! Securing booking...');
        await initiatePayment(bookingId, grandTotal, 'WALLET'); // Save to DB
        await confirmBooking(bookingId);
        navigate(`/confirmation/${bookingId}`, { replace: true });
      }

    } catch (err) {
      console.error("Payment flow error:", err);
      setError(err.response?.data?.message || err.response?.data || "Payment failed. Please try again.");
      setLoading(false);
      setVerificationStatus('');
    }
  };

  return (
    <div className="payment-page py-5" style={{ backgroundColor: 'var(--bg-color)', minHeight: '85vh' }}>
      <Container>
        {/* Back button */}
        <button 
          onClick={() => navigate(-1)} 
          className="btn btn-sm btn-outline-secondary rounded-pill px-3 mb-4 d-inline-flex align-items-center gap-1"
          style={{ fontWeight: '600' }}
        >
          &larr; Back to Food
        </button>

        <h2 className="fw-bold mb-4" style={{ letterSpacing: '-1px' }}>Secure Checkout</h2>

        <Row className="g-4">
          <Col lg={8}>
            {/* Wallet Selection Card */}
            {wallet && (
              <Card className="border-0 shadow-sm rounded-4 p-3 mb-4" style={{ backgroundColor: 'var(--card-bg)' }}>
                <Card.Body>
                  <div className="d-flex align-items-start gap-3">
                    <div className="p-3 rounded-3" style={{ backgroundColor: 'rgba(248, 68, 100, 0.1)', color: 'var(--bms-red)' }}>
                      <Wallet size={24} />
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <h5 className="fw-bold m-0">BMS Wallet Balance</h5>
                        <span className="fw-bold text-success fs-5">₹{wallet.balance}</span>
                      </div>
                      <p className="text-muted small mb-3">Use your preloaded wallet balance for a lightning-fast checkout experience.</p>
                      
                      <Form.Check 
                        type="switch"
                        id="wallet-toggle"
                        label={
                          <span className="fw-semibold small">
                            {wallet.balance >= grandTotal 
                              ? "Pay full amount using BMS Wallet" 
                              : `Use wallet balance (Deduct ₹${Math.min(wallet.balance, grandTotal)})`}
                          </span>
                        }
                        checked={useWallet}
                        disabled={wallet.balance === 0}
                        onChange={(e) => setUseWallet(e.target.checked)}
                        className="custom-switch"
                      />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Payment Method Selection Card */}
            <Card className="border-0 shadow-sm rounded-4 p-4 mb-4" style={{ backgroundColor: 'var(--card-bg)' }}>
              <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                <CreditCard size={20} className="text-primary" /> 
                Payment Options
              </h5>

              {error && (
                <Alert variant="danger" className="border-0 rounded-3 shadow-sm d-flex align-items-center gap-2">
                  <ShieldAlert size={18} /> {error}
                </Alert>
              )}

              {verificationStatus && (
                <Alert variant="info" className="border-0 rounded-3 shadow-sm d-flex align-items-center gap-2">
                  <Spinner animation="border" size="sm" />
                  <span>{verificationStatus}</span>
                </Alert>
              )}

              {finalPayableAmount > 0 ? (
                <div>
                  <div className="p-4 rounded-4 mb-4 border d-flex flex-column align-items-center text-center bg-light" style={{ borderStyle: 'dashed' }}>
                    <div className="mb-3" style={{ fontSize: '2.5rem' }}>💳</div>
                    <h6 className="fw-bold mb-2">Secure Online Payment Powered by Razorpay</h6>
                    <p className="text-muted small max-width-400 mb-3">
                      Complete your booking seamlessly. You can pay via Credit/Debit Cards, UPI, Net Banking, or popular Mobile Wallets inside the secure Razorpay checkout screen.
                    </p>
                    
                    {/* Visual indicators for payment methods */}
                    <div className="d-flex flex-wrap justify-content-center gap-3 mt-2 opacity-75">
                      <span className="badge bg-white text-dark border p-2 px-3 small rounded-pill d-flex align-items-center gap-1">
                        <Smartphone size={14} /> UPI (GPay/PhonePe)
                      </span>
                      <span className="badge bg-white text-dark border p-2 px-3 small rounded-pill d-flex align-items-center gap-1">
                        <CreditCard size={14} /> Cards (Visa/Mastercard)
                      </span>
                      <span className="badge bg-white text-dark border p-2 px-3 small rounded-pill">🏛 Net Banking</span>
                    </div>
                  </div>

                  <div className="d-flex align-items-center justify-content-center gap-2 text-muted mb-4">
                    <ShieldCheck size={18} className="text-success" />
                    <span className="small">100% Secure 256-bit SSL encrypted payments</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-4 mb-4 border d-flex flex-column align-items-center text-center bg-success-subtle border-success-subtle text-success">
                  <CheckCircle size={40} className="mb-3" />
                  <h6 className="fw-bold mb-1">Full Wallet Payment Selected</h6>
                  <p className="small mb-0 opacity-75">Your booking will be fully paid using your BMS Wallet balance. No extra payment required!</p>
                </div>
              )}

              <Form onSubmit={handlePayment}>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-100 py-3 fw-bold fs-5 rounded-pill btn-primary-bms shadow-sm"
                  style={{ 
                    background: 'linear-gradient(135deg, var(--bms-red) 0%, #d82b4a 100%)',
                    border: 'none',
                    letterSpacing: '0.5px'
                  }}
                >
                  {loading ? (
                    <div className="d-flex align-items-center justify-content-center gap-2">
                      <Spinner animation="border" size="sm" />
                      <span>Processing Payment...</span>
                    </div>
                  ) : finalPayableAmount > 0 ? (
                    `Proceed to Secure Payment (₹${finalPayableAmount})`
                  ) : (
                    `Confirm & Pay ₹${grandTotal} with Wallet`
                  )}
                </Button>
              </Form>
            </Card>
          </Col>

          {/* Right Column - Summary */}
          <Col lg={4}>
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden position-sticky" style={{ top: '30px', backgroundColor: 'var(--card-bg)' }}>
              <Card.Header className="bg-white border-0 pt-4 pb-0">
                <h5 className="fw-bold m-0" style={{ letterSpacing: '-0.5px' }}>Booking Summary</h5>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-muted small">Tickets ({selectedSeatObjects.length})</span>
                  <span className="fw-bold text-dark">₹{seatTotal}</span>
                </div>
                {selectedSeatObjects.length > 0 && (
                  <div className="p-2 bg-light rounded-3 mb-4 small text-muted font-monospace">
                    Seats: {selectedSeatObjects.map(s => `${s.row}${s.seatNumber}`).join(', ')}
                  </div>
                )}
                
                {foodTotal > 0 && (
                  <div className="d-flex justify-content-between align-items-center mb-3 border-top pt-3">
                    <span className="text-muted small">Food & Beverages</span>
                    <span className="fw-semibold text-dark">₹{foodTotal}</span>
                  </div>
                )}
                
                <div className="d-flex justify-content-between align-items-center mb-3 border-top pt-3">
                  <span className="text-muted small">Convenience Fee</span>
                  <span className="text-success small fw-bold">FREE</span>
                </div>
                
                {/* Dynamically show wallet deduction in booking summary */}
                {useWallet && walletDeduction > 0 && (
                  <div className="d-flex justify-content-between align-items-center mb-3 border-top pt-3 text-success">
                    <span className="small fw-semibold">BMS Wallet Applied</span>
                    <span className="fw-bold">- ₹{walletDeduction}</span>
                  </div>
                )}
                
                <div className="d-flex justify-content-between align-items-center border-top pt-3 mt-4">
                  <span className="fw-bold text-dark fs-5">Amount Due</span>
                  <span className="fw-bold fs-4 text-danger">₹{finalPayableAmount}</span>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default PaymentPage;
