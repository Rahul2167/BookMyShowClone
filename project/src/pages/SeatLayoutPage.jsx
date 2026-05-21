import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Button, Spinner, Alert } from 'react-bootstrap';
import { getShowSeats } from '../services/api';

const SeatLayoutPage = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSeatObjects, setSelectedSeatObjects] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchSeats();
  }, [showId]);

  const fetchSeats = async () => {
    try {
      setLoading(true);
      const res = await getShowSeats(showId);
      setSeats(res.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching seats:", err);
      setError("Failed to load seat layout. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSeat = (seatObj) => {
    const isSelected = selectedSeatObjects.find(s => s.showSeatId === seatObj.showSeatId);
    
    if (isSelected) {
      setSelectedSeatObjects(selectedSeatObjects.filter(s => s.showSeatId !== seatObj.showSeatId));
    } else {
      setSelectedSeatObjects([...selectedSeatObjects, seatObj]);
    }
  };

  const handleBooking = () => {
    if (selectedSeatObjects.length === 0) return;
    
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      alert("Please login first to book tickets.");
      return;
    }
    
    navigate(`/food-selection/${showId}`, { 
      state: { 
        selectedSeatObjects, 
        seatTotal: selectedSeatObjects.reduce((sum, seat) => sum + (seat.price || 0), 0)
      } 
    });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center bg-white" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" style={{ color: '#F84464' }} />
      </div>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  // ─── Grouping Logic ───
  const rowMap = {};
  seats.forEach(seat => {
    if (!rowMap[seat.row]) {
      rowMap[seat.row] = {
        seats: [],
        type: seat.seatType || 'Executive',
        price: seat.price
      };
    }
    rowMap[seat.row].seats.push(seat);
  });

  const sortedRowKeys = Object.keys(rowMap).sort(); 
  
  const categoryGroups = [];
  let currentGroup = null;

  sortedRowKeys.forEach(rowKey => {
    const rowData = rowMap[rowKey];
    const groupKey = `${rowData.type}-${rowData.price}`;

    if (!currentGroup || currentGroup.key !== groupKey) {
      currentGroup = {
        key: groupKey,
        type: rowData.type,
        price: rowData.price,
        rows: []
      };
      categoryGroups.push(currentGroup);
    }
    
    rowData.seats.sort((a, b) => parseInt(a.seatNumber) - parseInt(b.seatNumber));
    currentGroup.rows.push({
      label: rowKey,
      seats: rowData.seats
    });
  });

  const totalPrice = selectedSeatObjects.reduce((sum, seat) => sum + (seat.price || 0), 0);

  return (
    <div className="seat-layout-page" style={{ backgroundColor: '#fff', minHeight: '100vh', paddingBottom: '140px', color: '#333', overflowX: 'hidden' }}>
      
      {/* ─── Clean Header ─── */}
      <div className="sticky-top px-3 py-3 d-flex align-items-center border-bottom bg-white" style={{ zIndex: 100 }}>
        <button onClick={() => navigate(-1)} style={{ border:'none', background:'none', padding: '0 10px', fontSize:'1.5rem', cursor:'pointer', color: '#333' }}>✕</button>
        <div className="ms-2">
          <h6 className="mb-0 fw-bold">Select Seats</h6>
          <small className="text-muted">{seats[0]?.screenNumber ? `Screen ${seats[0].screenNumber}` : 'Hall Layout'}</small>
        </div>
      </div>

      <Container className="mt-2">
        {/* ─── Screen at TOP (Curved Purple Line Style) ─── */}
        <div className="text-center mb-5 pt-3">
          <div className="small text-muted mb-1" style={{ fontSize: '0.65rem', fontWeight: '600' }}>Cinema Screen Here</div>
          <div 
            style={{ 
              width: '80%', 
              height: '15px', 
              borderTop: '4px solid #6B3AC2', 
              borderRadius: '50% 50% 0 0',
              margin: '0 auto',
              filter: 'drop-shadow(0 -4px 6px rgba(107, 58, 194, 0.15))'
            }}
          />
          <div className="mt-2 fw-bold text-dark" style={{ fontSize: '0.85rem' }}>
            {seats[0]?.screenNumber ? `Screen ${seats[0].screenNumber}` : 'Hall Layout'}
          </div>
        </div>

        {categoryGroups.length === 0 ? (
          <div className="text-center py-5">
             <h5 className="text-muted">Layout unavailable.</h5>
          </div>
        ) : (
          <div className="seat-map-container">
            <div className="seat-grid-perspective" style={{ perspective: '1000px' }}>
              {categoryGroups.map((group, gIdx) => (
                <div key={gIdx} className="mb-5">
                  <div className="text-center mb-4">
                    <span className="text-uppercase fw-bold text-muted" style={{ fontSize: '0.65rem', letterSpacing: '2px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
                      {group.type} - ₹{group.price}
                    </span>
                  </div>

                  {group.rows.map((row, rIdx) => {
                    const seatCount = row.seats.length;
                    const middle = (seatCount - 1) / 2;
                    
                    return (
                      <div key={rIdx} className="d-flex justify-content-center align-items-center mb-1">
                        <div className="text-muted small me-3 fw-bold" style={{ width: '20px' }}>{row.label}</div>
                        <div className="d-flex justify-content-center" style={{ gap: '6px' }}>
                          {row.seats.map((seat, sIdx) => {
                            const isSelected = selectedSeatObjects.some(s => s.showSeatId === seat.showSeatId);
                            const isBooked = seat.status === 'BOOKED' || seat.status === 'LOCKED';
                            
                            // ─── Curve Calculation ───
                            const distanceFromCenter = sIdx - middle;
                            const verticalOffset = Math.pow(distanceFromCenter, 2) * 0.4;
                            const rotation = distanceFromCenter * 1.5;
                            
                            return (
                              <div 
                                key={seat.showSeatId}
                                onClick={() => !isBooked && toggleSeat(seat)}
                                style={{
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '3px',
                                  border: isBooked ? 'none' : isSelected ? 'none' : '1.2px solid #4ABD5D',
                                  backgroundColor: isBooked ? '#f0f0f0' : isSelected ? '#F84464' : '#fff',
                                  color: isBooked ? '#f0f0f0' : isSelected ? '#fff' : '#4ABD5D',
                                  cursor: isBooked ? 'not-allowed' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.65rem',
                                  fontWeight: '700',
                                  transform: `translateY(${verticalOffset}px) rotate(${rotation}deg)`,
                                  transition: 'all 0.15s ease',
                                  userSelect: 'none'
                                }}
                              >
                                {isBooked ? '' : seat.seatNumber}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Legend ─── */}
        <div className="mt-5 pt-5 d-flex justify-content-center gap-4 text-muted" style={{ fontSize: '0.65rem' }}>
          <div className="d-flex align-items-center gap-2">
            <div style={{ width: '12px', height: '12px', border: '1.2px solid #4ABD5D', borderRadius: '2px' }}></div>
            <span className="fw-semibold">Available</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <div style={{ width: '12px', height: '12px', backgroundColor: '#F84464', borderRadius: '2px' }}></div>
            <span className="fw-semibold">Selected</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <div style={{ width: '12px', height: '12px', backgroundColor: '#f0f0f0', borderRadius: '2px' }}></div>
            <span className="fw-semibold">Sold</span>
          </div>
        </div>
      </Container>

      {/* ─── Footer Action ─── */}
      {selectedSeatObjects.length > 0 && (
        <div className="fixed-bottom p-3 bg-white border-top shadow-lg animate__animated animate__fadeInUp" style={{ zIndex: 1000 }}>
          <Container className="d-flex justify-content-between align-items-center">
            <div>
              <div className="fw-bold fs-5 text-dark">₹{totalPrice.toFixed(2)}</div>
              <div className="small text-muted fw-semibold">{selectedSeatObjects.length} Seat(s) | {selectedSeatObjects.map(s => `${s.row}${s.seatNumber}`).join(', ')}</div>
            </div>
            <Button 
              className="px-5 py-2 border-0 shadow-sm"
              style={{ backgroundColor: '#F84464', fontWeight: 'bold', borderRadius: '8px', fontSize: '1rem' }}
              onClick={handleBooking}
            >
              Next
            </Button>
          </Container>
        </div>
      )}
    </div>
  );
};

export default SeatLayoutPage;
