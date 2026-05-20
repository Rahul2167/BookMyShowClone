import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Table, Badge, Modal } from 'react-bootstrap';
import { MessageSquare, Send, Clock, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import * as API from '../services/api';
import { useAuth } from '../context/AuthContext';

const UserComplaints = () => {
    const { user } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        bookingId: '',
        category: 'Service',
        description: ''
    });

    useEffect(() => {
        if (user?.userId) {
            fetchComplaints();
            fetchUserBookings();
        }
    }, [user]);

    const fetchComplaints = async () => {
        setLoading(true);
        try {
            const res = await API.getUserComplaints(user.userId);
            setComplaints(res.data || []);
        } catch (error) {
            console.error("Failed to fetch complaints", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserBookings = async () => {
        try {
            // Assuming there's a way to get user bookings. 
            // If not, we'll just allow free-form entry or skip bookingId requirement.
            const res = await API.getBookings(); // Ideally getBookingsByUser(user.userId)
            const userBookings = (res.data || []).filter(b => b.userId === user.userId);
            setBookings(userBookings);
        } catch (error) {
            console.error("Failed to fetch bookings", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                userId: user.userId,
                status: 'OPEN',
                createdAt: new Date().toISOString()
            };
            await API.submitComplaint(payload);
            if (window.notify) window.notify('Complaint Submitted', 'We have received your issue and will get back to you soon.', 'success');
            setStatus({ type: 'success', message: 'Complaint submitted successfully!' });
            setShowModal(false);
            setFormData({ bookingId: '', category: 'Service', description: '' });
            fetchComplaints();
        } catch (error) {
            setStatus({ type: 'danger', message: 'Failed to submit complaint.' });
        }
    };

    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState(null);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'OPEN': return <Badge bg="warning" className="rounded-pill px-3">Open</Badge>;
            case 'IN_PROGRESS': return <Badge bg="info" className="rounded-pill px-3">In Progress</Badge>;
            case 'RESOLVED': return <Badge bg="success" className="rounded-pill px-3">Resolved</Badge>;
            default: return <Badge bg="secondary" className="rounded-pill px-3">{status}</Badge>;
        }
    };

    const handleViewDetails = (complaint) => {
        setSelectedComplaint(complaint);
        setShowDetailModal(true);
    };

    return (
        <Container className="py-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-1">Help & Support</h2>
                    <p className="text-muted">Track your complaints and get assistance</p>
                </div>
                <Button className="btn-primary-bms rounded-pill px-4" onClick={() => setShowModal(true)}>
                    <Plus size={18} className="me-2" /> New Complaint
                </Button>
            </div>

            {status.message && (
                <Alert variant={status.type} dismissible onClose={() => setStatus({ type: '', message: '' })}>
                    {status.message}
                </Alert>
            )}

            <Row>
                <Col lg={12}>
                    <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                        <Table hover responsive className="mb-0 align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th className="ps-4">Complaint ID</th>
                                    <th>Category</th>
                                    <th>Description</th>
                                    <th>Status</th>
                                    <th className="text-end pe-4">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {complaints.length > 0 ? complaints.map(c => (
                                    <tr key={c.complaintId}>
                                        <td className="ps-4 text-muted small">#{c.complaintId}</td>
                                        <td className="fw-bold">{c.category}</td>
                                        <td style={{ maxWidth: '300px' }} className="text-truncate">{c.description}</td>
                                        <td>{getStatusBadge(c.status)}</td>
                                        <td className="text-end pe-4">
                                            <Button 
                                                variant="outline-danger" 
                                                size="sm" 
                                                className="rounded-pill px-3"
                                                onClick={() => handleViewDetails(c)}
                                            >
                                                View Details
                                            </Button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-5 text-muted">
                                            <div className="mb-3 opacity-25"><MessageSquare size={48} /></div>
                                            <p>No complaints found. If you have an issue, feel free to reach out!</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </Card>
                </Col>
            </Row>

            {/* Complaint Detail Modal */}
            <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered className="admin-modal">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">Complaint Details</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    {selectedComplaint && (
                        <div>
                            <div className="d-flex justify-content-between mb-4 align-items-center">
                                <Badge bg="light" className="text-muted border rounded-pill px-3">ID: #{selectedComplaint.complaintId}</Badge>
                                {getStatusBadge(selectedComplaint.status)}
                            </div>
                            
                            <div className="mb-4">
                                <label className="small fw-bold text-muted d-block mb-1">CATEGORY</label>
                                <div className="fw-bold">{selectedComplaint.category}</div>
                            </div>

                            <div className="mb-4 p-3 rounded-3 bg-light border">
                                <label className="small fw-bold text-danger d-block mb-2">YOUR COMPLAINT</label>
                                <p className="mb-0 text-dark" style={{ whiteSpace: 'pre-wrap' }}>{selectedComplaint.description}</p>
                                <div className="text-muted small mt-2">{new Date(selectedComplaint.createdAt).toLocaleString()}</div>
                            </div>

                            {selectedComplaint.resolution ? (
                                <div className="mb-0 p-3 rounded-3 border-start border-4 border-success shadow-sm" style={{ backgroundColor: '#f0fff4' }}>
                                    <label className="small fw-bold text-success d-block mb-2">ADMIN RESPONSE</label>
                                    <p className="mb-0 fw-medium text-dark">{selectedComplaint.resolution}</p>
                                </div>
                            ) : (
                                <div className="p-3 rounded-3 bg-light border border-dashed text-center">
                                    <Clock size={20} className="text-muted mb-2" />
                                    <p className="text-muted small mb-0 italic">Our team is reviewing your complaint. Please check back later for a response.</p>
                                </div>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="secondary" className="rounded-pill px-4" onClick={() => setShowDetailModal(false)}>Close</Button>
                </Modal.Footer>
            </Modal>

            {/* Submit Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered className="admin-modal">
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="fw-bold">Submit a Complaint</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold">Related Booking (Optional)</Form.Label>
                            <Form.Select 
                                value={formData.bookingId} 
                                onChange={e => setFormData({...formData, bookingId: e.target.value})}
                            >
                                <option value="">None / Not related to a booking</option>
                                {bookings.map(b => (
                                    <option key={b.bookingId} value={b.bookingId}>Booking #{b.bookingId} - {new Date(b.bookingTime).toLocaleDateString()}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold">Category</Form.Label>
                            <Form.Select 
                                value={formData.category} 
                                onChange={e => setFormData({...formData, category: e.target.value})}
                            >
                                <option value="Service">Service Issue</option>
                                <option value="Payment">Payment / Refund</option>
                                <option value="Ticket">Ticket Issue</option>
                                <option value="Theatre">Theatre Experience</option>
                                <option value="Other">Other</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label className="small fw-bold">Describe your issue</Form.Label>
                            <Form.Control 
                                as="textarea" 
                                rows={4} 
                                required
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                placeholder="Tell us what went wrong..."
                            />
                        </Form.Group>

                        <Button type="submit" className="w-100 btn-primary-bms py-3 rounded-3 fw-bold shadow-sm">
                            Submit Complaint
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default UserComplaints;
