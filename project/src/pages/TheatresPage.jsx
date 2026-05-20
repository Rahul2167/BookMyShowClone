import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Spinner, Alert, Form } from 'react-bootstrap';
import { getTheatres } from '../services/api';
import { MapPin, Phone, Info } from 'lucide-react';

const TheatresPage = () => {
    const [theatres, setTheatres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchCity, setSearchCity] = useState('');

    useEffect(() => {
        fetchTheatres();
    }, []);

    const fetchTheatres = async () => {
        try {
            setLoading(true);
            const response = await getTheatres();
            setTheatres(response.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching theatres:", err);
            setError("Failed to load theatres.");
        } finally {
            setLoading(false);
        }
    };

    const filteredTheatres = theatres.filter(t => 
        (t.city?.toLowerCase() || '').includes(searchCity.toLowerCase()) ||
        (t.name?.toLowerCase() || '').includes(searchCity.toLowerCase())
    );

    return (
        <Container className="py-5">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 gap-3">
                <div>
                    <h2 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>Theatres</h2>
                    <p className="text-muted mb-0">Browse cinemas near you</p>
                </div>
                <div style={{ width: '300px' }}>
                    <Form.Control 
                        type="text"
                        placeholder="Search by city or theatre..."
                        value={searchCity}
                        onChange={(e) => setSearchCity(e.target.value)}
                        className="admin-input py-2"
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center p-5"><Spinner animation="border" variant="danger" /></div>
            ) : error ? (
                <Alert variant="danger">{error}</Alert>
            ) : filteredTheatres.length === 0 ? (
                <div className="text-center p-5 text-muted">No theatres found for "{searchCity}".</div>
            ) : (
                <Row className="g-4">
                    {filteredTheatres.map(theatre => (
                        <Col key={theatre.theatreId} md={6} lg={4}>
                            <Card className="border-0 shadow-sm h-100 transition-all" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}>
                                <Card.Body className="p-4">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <h5 className="fw-bold mb-0">{theatre.name}</h5>
                                        <Badge bg="danger" className="rounded-pill px-2 py-1 small">{theatre.city}</Badge>
                                    </div>
                                    <div className="d-flex align-items-center gap-2 text-muted small mb-2">
                                        <MapPin size={16} />
                                        <span>{theatre.address}</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2 text-muted small mb-4">
                                        <Phone size={16} />
                                        <span>{theatre.contactInfo}</span>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <Badge bg="outline-secondary" className="border text-muted">M-Ticket</Badge>
                                        <Badge bg="outline-secondary" className="border text-muted">Food & Bev</Badge>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </Container>
    );
};

export default TheatresPage;
