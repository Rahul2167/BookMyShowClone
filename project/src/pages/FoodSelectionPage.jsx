import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { getFoodItems } from '../services/api';

const FoodSelectionPage = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { selectedSeatObjects, seatTotal } = location.state || { selectedSeatObjects: [], seatTotal: 0 };

  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // order is a map of foodItemId -> quantity
  const [order, setOrder] = useState({});

  useEffect(() => {
    if (!selectedSeatObjects || selectedSeatObjects.length === 0) {
      alert("Please select seats first.");
      navigate('/');
      return;
    }
    fetchFoodItems();
  }, []);

  const fetchFoodItems = async () => {
    try {
      setLoading(true);
      const res = await getFoodItems();
      // Filter for available food items, backend might already do this
      setFoodItems(res.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching food items:", err);
      // We don't want to block the user if food fails, they can still book
      setError("Failed to load food options. You can skip this step.");
    } finally {
      setLoading(false);
    }
  };

  const handleIncrement = (item) => {
    setOrder(prev => ({
      ...prev,
      [item.foodItemId]: (prev[item.foodItemId] || 0) + 1
    }));
  };

  const handleDecrement = (item) => {
    setOrder(prev => {
      const current = prev[item.foodItemId] || 0;
      if (current <= 1) {
        const newOrder = { ...prev };
        delete newOrder[item.foodItemId];
        return newOrder;
      }
      return {
        ...prev,
        [item.foodItemId]: current - 1
      };
    });
  };

  const handleSkipOrProceed = () => {
    // Construct concessionOrders array
    const concessionOrders = [];
    let foodTotal = 0;
    
    Object.keys(order).forEach(foodItemId => {
      const qty = order[foodItemId];
      const item = foodItems.find(f => f.foodItemId.toString() === foodItemId);
      if (item && qty > 0) {
        foodTotal += (item.price * qty);
        concessionOrders.push({
          foodItemId: item.foodItemId,
          quantity: qty,
          unitPrice: item.price,
          totalPrice: item.price * qty
        });
      }
    });

    // Navigate to payment page
    navigate(`/payment/${showId}`, {
      state: {
        selectedSeatObjects,
        seatTotal,
        concessionOrders,
        foodTotal,
        grandTotal: seatTotal + foodTotal
      }
    });
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="danger" />
      </Container>
    );
  }

  const currentFoodTotal = Object.keys(order).reduce((sum, id) => {
    const item = foodItems.find(f => f.foodItemId.toString() === id);
    return sum + (item ? item.price * order[id] : 0);
  }, 0);

  return (
    <div className="food-selection-page bg-light" style={{ minHeight: '80vh', paddingBottom: '100px' }}>
      <Container className="py-5">
        {/* Back button */}
        <button onClick={() => navigate(-1)} style={{
          display:'inline-flex', alignItems:'center', gap:'6px',
          background:'transparent', border:'1.5px solid #ddd', borderRadius:'30px',
          color:'var(--text-secondary,#666)', padding:'6px 16px', cursor:'pointer',
          fontSize:'0.82rem', fontWeight:'600', marginBottom:'20px'
        }}>&#8592; Back to Seats</button>
        <h3 className="mb-4 text-center">Grab a Bite!</h3>
        <p className="text-muted text-center mb-5">Pre-book your food and beverages to skip the queue.</p>
        
        {error && <Alert variant="warning">{error}</Alert>}

        {foodItems.length === 0 && !error ? (
          <Alert variant="info">No food items available for this show. You can proceed to payment.</Alert>
        ) : (
          <Row>
            {foodItems.map(item => (
              <Col xs={6} md={4} lg={3} className="mb-3 mb-md-4" key={item.foodItemId}>
                <Card className="h-100 shadow-sm border-0">
                  <div style={{ height: '120px', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '2.5rem' }}>{item.category?.categoryName === 'Beverages' ? '🥤' : '🍿'}</span>
                  </div>
                  <Card.Body className="d-flex flex-column p-2 p-md-3">
                    <Card.Title style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>{item.name}</Card.Title>
                    <Card.Text className="text-muted x-small mb-2 flex-grow-1" style={{ fontSize: '0.75rem' }}>
                      {item.description}
                    </Card.Text>
                    <div className="d-flex flex-column gap-2 mt-auto">
                      <span className="fw-bold text-center">Rs. {item.price}</span>
                      
                      {order[item.foodItemId] ? (
                        <div className="d-flex align-items-center justify-content-center border rounded">
                          <Button variant="light" size="sm" onClick={() => handleDecrement(item)} className="px-2 border-0">-</Button>
                          <span className="px-2 fw-bold">{order[item.foodItemId]}</span>
                          <Button variant="light" size="sm" onClick={() => handleIncrement(item)} className="px-2 border-0">+</Button>
                        </div>
                      ) : (
                        <Button variant="outline-danger" size="sm" className="w-100 rounded-pill" onClick={() => handleIncrement(item)}>
                          Add
                        </Button>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>

      {/* Bottom Action Bar */}
      <div className="fixed-bottom bg-white shadow-lg p-3 d-flex justify-content-between align-items-center" style={{ zIndex: 1000, borderTop: '1px solid #eee' }}>
        <Container className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
          <div className="text-center text-md-start">
            <span className="fw-bold fs-5 d-block">Total: Rs. {seatTotal + currentFoodTotal}</span>
            <span className="text-muted d-none d-md-block" style={{ fontSize: '0.85rem' }}>
              Seats: Rs. {seatTotal} | Food: Rs. {currentFoodTotal}
            </span>
          </div>
          <Button 
            className="btn-primary-bms px-5 py-2 fw-bold w-100 w-md-auto"
            onClick={handleSkipOrProceed}
          >
            {currentFoodTotal > 0 ? "Proceed to Payment" : "Skip & Proceed"}
          </Button>
        </Container>
      </div>
    </div>
  );
};

export default FoodSelectionPage;
