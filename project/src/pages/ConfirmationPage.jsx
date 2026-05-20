import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Card, Button, Spinner, Alert, Row, Col, Badge } from 'react-bootstrap';
import { getBookingById, getPaymentByBookingId, getFoodItems, getShowById } from '../services/api';
import { Download, CheckCircle, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const ConfirmationPage = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [showDetails, setShowDetails] = useState(null);
  const [foodMap, setFoodMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const ticketRef = React.useRef(null);
  const pdfTicketRef = React.useRef(null);

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const res = await getBookingById(bookingId);
      setBooking(res.data);
      
      try {
        const payRes = await getPaymentByBookingId(bookingId);
        setPayment(payRes.data);
      } catch (payErr) {
        console.warn("Could not fetch payment details", payErr);
      }

      try {
        const showRes = await getShowById(res.data.showId);
        setShowDetails(showRes.data);
      } catch (showErr) {
        console.warn("Could not fetch show details", showErr);
      }

      try {
        const foodRes = await getFoodItems();
        const map = {};
        if (foodRes.data) {
          foodRes.data.forEach(item => {
            map[item.foodItemId] = item.name;
          });
        }
        setFoodMap(map);
      } catch (fErr) {
        console.warn("Could not fetch food items map", fErr);
      }

      setError(null);
    } catch (err) {
      console.error("Error fetching booking details:", err);
      setError("Failed to load booking confirmation details. However, your booking was successful!");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTicket = async () => {
    if (!pdfTicketRef.current) return;
    
    try {
      setDownloading(true);
      const canvas = await html2canvas(pdfTicketRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
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
      
      pdf.save(`Ticket_BMS${bookingId}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <Container className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="success" className="mb-3" />
        <p>Fetching your ticket details...</p>
      </Container>
    );
  }

  return (
    <div className="confirmation-page bg-light" style={{ minHeight: '80vh', padding: '40px 0' }}>
      <Container>
        <div className="text-center mb-5">
          <div className="d-inline-flex justify-content-center align-items-center rounded-circle bg-success text-white mb-3" style={{ width: '80px', height: '80px', fontSize: '2.5rem' }}>
            ✓
          </div>
          <h2 className="fw-bold">Booking Confirmed!</h2>
          <p className="text-muted">Your tickets have been sent to your registered email.</p>
        </div>

        {error ? (
          <Alert variant="warning" className="text-center mx-auto" style={{ maxWidth: '600px' }}>
            {error}
            <br />
            Booking ID: {bookingId}
          </Alert>
        ) : booking && (
          <Card ref={ticketRef} className="mx-auto shadow border-0" style={{ maxWidth: '600px', borderRadius: '15px', overflow: 'hidden' }}>
            <div className="bg-danger text-white text-center py-4" style={{ backgroundColor: 'var(--bms-red)' }}>
              <h4 className="mb-0 fw-bold">E-Ticket</h4>
              <p className="mb-0 small opacity-75">Booking ID: BMS{booking.bookingId}</p>
            </div>
            
            <Card.Body className="p-4 p-md-5 bg-white position-relative">
              {/* Ticket cutouts */}
              <div className="position-absolute bg-light rounded-circle" style={{ width: '40px', height: '40px', left: '-20px', top: '50%', transform: 'translateY(-50%)' }}></div>
              <div className="position-absolute bg-light rounded-circle" style={{ width: '40px', height: '40px', right: '-20px', top: '50%', transform: 'translateY(-50%)' }}></div>
              
              {showDetails && (
                <div className="text-center mb-4 pb-3 border-bottom border-dashed border-light">
                  <h3 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>{showDetails.movieTitle}</h3>
                  <p className="text-muted mb-2">{showDetails.theatreName} - {showDetails.screenNumber}</p>
                  <Badge bg="secondary" className="px-3 py-1 rounded-pill">{showDetails.showType || '2D'}</Badge>
                </div>
              )}

              <Row className="mb-4 text-center">
                <Col>
                  <div className="border border-dashed p-3 rounded bg-light">
                    <p className="text-muted small mb-1 text-uppercase">Status</p>
                    <h5 className="fw-bold text-success mb-0">{booking.status}</h5>
                  </div>
                </Col>
                <Col>
                  <div className="border border-dashed p-3 rounded bg-light">
                    <p className="text-muted small mb-1 text-uppercase">Amount Paid</p>
                    <h5 className="fw-bold mb-0">Rs. {booking.totalAmount || booking.finalAmountPaid}</h5>
                  </div>
                </Col>
              </Row>

              {payment && (
                <Row className="mb-4 bg-light rounded p-3 mx-0">
                  <Col xs={6}>
                    <p className="text-muted small mb-1">Transaction ID</p>
                    <p className="fw-bold mb-0" style={{ fontSize: '0.9rem', wordBreak: 'break-all' }}>
                      {payment.transactionId || payment.idempotencyKey || `TXN-${booking.bookingId}`}
                    </p>
                  </Col>
                  <Col xs={6} className="text-end">
                    <p className="text-muted small mb-1">Payment Method</p>
                    <p className="fw-bold mb-0">
                      {payment.method ? payment.method.replace('_', ' ') : 'Card / UPI'}
                    </p>
                  </Col>
                </Row>
              )}

              <hr className="border-dashed my-4 text-muted opacity-25" />

              <Row className="mb-3">
                <Col xs={6}>
                  <p className="text-muted small mb-1">Show Timing</p>
                  <p className="fw-medium">
                    {showDetails ? new Date(showDetails.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : new Date(booking.bookingTime).toLocaleString()}
                  </p>
                </Col>
                <Col xs={6} className="text-end">
                  <p className="text-muted small mb-1">Seats ({booking.seatNumbers?.length || 0})</p>
                  <p className="fw-medium">{booking.seatNumbers?.join(', ')}</p>
                </Col>
              </Row>

              <hr className="border-dashed my-4 text-muted opacity-25" />
              <Row className="mb-3">
                <Col xs={12}>
                  <p className="text-muted small mb-2">Order Summary</p>
                  <div className="bg-light rounded p-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-medium">Tickets ({booking.seatNumbers?.length || 0})</span>
                      <span className="fw-bold">
                        Rs. {booking.totalAmount - (booking.concessionOrders ? booking.concessionOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0) : 0)}
                      </span>
                    </div>

                    {booking.concessionOrders && booking.concessionOrders.length > 0 && booking.concessionOrders.map((order, idx) => (
                      <div key={idx} className="d-flex justify-content-between align-items-center mb-2 text-muted">
                        <span className="fw-medium" style={{ fontSize: '0.9rem' }}>
                          + {order.quantity}x {foodMap[order.foodItemId] || `Food Item`}
                        </span>
                        <span className="fw-bold" style={{ fontSize: '0.9rem' }}>Rs. {order.totalPrice}</span>
                      </div>
                    ))}
                    
                    <hr className="my-2 border-secondary opacity-25" />
                    <div className="d-flex justify-content-between align-items-center pt-1">
                      <span className="fw-bold text-dark">Grand Total</span>
                      <span className="fw-bold text-success fs-5">Rs. {booking.totalAmount}</span>
                    </div>
                  </div>
                </Col>
              </Row>

            </Card.Body>
          </Card>
        )}

        <div className="text-center mt-5 d-flex flex-column flex-sm-row justify-content-center gap-3">
          <Button 
            variant="danger" 
            className="px-5 py-2 fw-medium rounded-pill btn-primary-bms"
            onClick={handleDownloadTicket}
            disabled={downloading}
          >
            {downloading ? (
              <><Spinner size="sm" className="me-2" /> Generating PDF...</>
            ) : (
              <><Download size={18} className="me-2" /> Download Ticket</>
            )}
          </Button>
          <Button as={Link} to="/" variant="outline-dark" className="px-5 py-2 fw-medium rounded-pill">
            Back to Home
          </Button>
        </div>

        {/* Hidden Ticket Template for PDF Generation */}
        {booking && (
          <div style={{ position: 'absolute', left: '-9999px', top: '0' }}>
            <div ref={pdfTicketRef} style={{ width: '550px', backgroundColor: '#fdfdfd', padding: '30px', fontFamily: "'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
              <div style={{ borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 25px rgba(0, 0, 0, 0.08)', border: '1px solid #e0e0e0', backgroundColor: '#ffffff' }}>
                {/* Header */}
                <div style={{ backgroundColor: '#D63946', color: '#fff', textAlign: 'center', padding: '24px 20px' }}>
                  <h3 style={{ margin: '0', fontSize: '26px', fontWeight: '700', letterSpacing: '0.5px' }}>E-Ticket</h3>
                  <div style={{ fontSize: '14px', opacity: '0.8', marginTop: '4px' }}>Booking ID: BMS{booking.bookingId}</div>
                </div>

                {/* Body */}
                <div style={{ padding: '30px 35px' }}>
                  {/* Movie Title */}
                  <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 6px 0', lineHeight: '1.2' }}>
                      {showDetails ? showDetails.movieTitle : "Movie Ticket"}
                    </h2>
                    <div style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>
                      {showDetails ? `${showDetails.theatreName} - ${showDetails.screenNumber}` : "Cinema Hall"}
                    </div>
                    {showDetails && (
                      <div style={{ marginTop: '10px' }}>
                        <span style={{ backgroundColor: '#6c757d', color: '#fff', padding: '3px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', display: 'inline-block', textTransform: 'uppercase' }}>
                          {showDetails.showType || '2D'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status & Amount Paid Row */}
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                    <div style={{ flex: 1, backgroundColor: '#fdfdfd', border: '1px solid #e9ecef', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ color: '#888', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>STATUS</div>
                      <div style={{ fontWeight: '700', fontSize: '18px', color: '#198754' }}>{booking.status}</div>
                    </div>
                    <div style={{ flex: 1, backgroundColor: '#fdfdfd', border: '1px solid #e9ecef', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ color: '#888', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>AMOUNT PAID</div>
                      <div style={{ fontWeight: '700', fontSize: '18px', color: '#212529' }}>Rs. {booking.totalAmount || booking.finalAmountPaid}</div>
                    </div>
                  </div>

                  {/* Transaction ID & Payment Method Row */}
                  {payment && (
                    <div style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                      <div>
                        <div style={{ color: '#888', fontSize: '11px', fontWeight: '500', marginBottom: '2px' }}>Transaction ID</div>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#212529' }}>
                          {payment.transactionId || payment.idempotencyKey || `TXN-${booking.bookingId}`}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#888', fontSize: '11px', fontWeight: '500', marginBottom: '2px' }}>Payment Method</div>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#212529', textTransform: 'uppercase' }}>
                          {payment.method ? payment.method.replace('_', ' ') : 'Card / UPI'}
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
                        {showDetails ? new Date(showDetails.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : new Date(booking.bookingTime).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#888', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>Seats ({booking.seatNumbers?.length || 0})</div>
                      <div style={{ fontWeight: '700', fontSize: '15px', color: '#212529' }}>{booking.seatNumbers?.join(', ')}</div>
                    </div>
                  </div>

                  <hr style={{ borderTop: '1px solid #dee2e6', borderBottom: 'none', borderLeft: 'none', borderRight: 'none', margin: '20px 0' }} />

                  {/* Order Summary */}
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ color: '#666', fontSize: '12px', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Order Summary</div>
                    <div style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '8px', padding: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#495057' }}>Tickets ({booking.seatNumbers?.length || 0})</span>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#212529' }}>
                          Rs. {booking.totalAmount - (booking.concessionOrders ? booking.concessionOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0) : 0)}
                        </span>
                      </div>

                      {booking.concessionOrders && booking.concessionOrders.map((order, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#6c757d' }}>
                          <span style={{ fontSize: '13px' }}>+ {order.quantity}x {foodMap[order.foodItemId] || `Food Item`}</span>
                          <span style={{ fontSize: '13px', fontWeight: '600' }}>Rs. {order.totalPrice}</span>
                        </div>
                      ))}

                      <hr style={{ borderTop: '1px solid #dee2e6', borderBottom: 'none', margin: '10px 0' }} />

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#212529' }}>Grand Total</span>
                        <span style={{ fontSize: '16px', fontWeight: '700', color: '#198754' }}>Rs. {booking.totalAmount}</span>
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
    </div>
  );
};

export default ConfirmationPage;
