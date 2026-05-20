import React from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

const ContactUs = () => {
  return (
    <div className="contact-us-page py-5">
      <Container>
        <div className="text-center mb-5">
          <h1 className="fw-bold mb-3" style={{ color: 'var(--text-primary)' }}>Contact Us</h1>
          <p className="lead text-muted mx-auto" style={{ maxWidth: '700px' }}>
            Have questions or need assistance? We're here to help! Reach out to our support team.
          </p>
        </div>

        <Row className="gy-4">
          <Col lg={5}>
            <div className="p-4 rounded-4 h-100 shadow-sm" style={{ backgroundColor: 'var(--card-bg)' }}>
              <h3 className="fw-bold mb-4">Get in Touch</h3>
              
              <div className="d-flex mb-4">
                <div className="me-3 p-3 rounded-3" style={{ backgroundColor: 'rgba(235, 62, 83, 0.1)' }}>
                  <Mail size={24} color="var(--bms-red)" />
                </div>
                <div>
                  <h6 className="fw-bold mb-1">Email Us</h6>
                  <p className="text-muted mb-0">rahulpotdar2167@gmail.com</p>
                </div>
              </div>

              <div className="d-flex mb-4">
                <div className="me-3 p-3 rounded-3" style={{ backgroundColor: 'rgba(235, 62, 83, 0.1)' }}>
                  <Phone size={24} color="var(--bms-red)" />
                </div>
                <div>
                  <h6 className="fw-bold mb-1">Call Us</h6>
                  <p className="text-muted mb-0">+91 8668231422</p>
                </div>
              </div>

              <div className="d-flex mb-4">
                <div className="me-3 p-3 rounded-3" style={{ backgroundColor: 'rgba(235, 62, 83, 0.1)' }}>
                  <MapPin size={24} color="var(--bms-red)" />
                </div>
                <div>
                  <h6 className="fw-bold mb-1">Visit Us</h6>
                  <p className="text-muted mb-0">2, Near JM Road, Panchali Hotel, Pune, Maharashtra, India</p>
                </div>
              </div>
            </div>
          </Col>

          <Col lg={7}>
            <div className="p-4 rounded-4 shadow-sm" style={{ backgroundColor: 'var(--card-bg)' }}>
              <h3 className="fw-bold mb-4">Send a Message</h3>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold">Full Name</Form.Label>
                      <Form.Control type="text" placeholder="Enter your name" className="rounded-3" />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold">Email Address</Form.Label>
                      <Form.Control type="email" placeholder="Enter your email" className="rounded-3" />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Subject</Form.Label>
                  <Form.Control type="text" placeholder="How can we help?" className="rounded-3" />
                </Form.Group>
                <Form.Group className="mb-4">
                  <Form.Label className="small fw-bold">Message</Form.Label>
                  <Form.Control as="textarea" rows={4} placeholder="Type your message here..." className="rounded-3" />
                </Form.Group>
                <Button className="btn-primary-bms w-100 py-3 rounded-3 d-flex align-items-center justify-content-center gap-2">
                  <Send size={18} /> Send Message
                </Button>
              </Form>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ContactUs;
