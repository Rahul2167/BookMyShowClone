import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bms-footer mt-auto">
      <Container>
        <Row className="gy-4">
          <Col md={4}>
            <h5>BookMyShow</h5>
              <div className="footer-description">
                  <ul>
                      <li>Book movies, events, and more.</li>
                      <li>Your entertainment booking partner.</li>
                      <li>Movies, events, sports — all in one place.</li>
                      <li>Book tickets anytime, anywhere.</li>
                      <li>Entertainment starts here.</li>
                  </ul>
              </div>
          </Col>
          <Col md={4}>
            <h5>Help</h5>
            <ul className="list-unstyled text-muted" style={{ fontSize: '0.9rem' }}>
              <li className="mb-2"><Link to="/about" className="text-decoration-none text-muted hover-red"> <b>About Us</b></Link></li>
              <li className="mb-2"><Link to="/contact" className="text-decoration-none text-muted hover-red"> <b>Contact Us</b></Link></li>
              <li className="mb-2"><Link to="/terms" className="text-decoration-none text-muted hover-red"> <b>Terms & Conditions</b></Link></li>
              <li className="mb-2"><Link to="/privacy" className="text-decoration-none text-muted hover-red"> <b>Privacy Policy</b></Link></li>
            </ul>
          </Col>
          <Col md={4}>
            <h5>Connect with Us</h5>
            <div className="d-flex gap-3 mt-2 text-muted">
              <span><a href='https://www.facebook.com/share/1J6FF5pZvS/' target='_blank' rel='noopener noreferrer' style={{ cursor: 'pointer' }}>Facebook</a></span>
              <span><a href='https://x.com/rahul21674646' target='_blank' rel='noopener noreferrer' style={{ cursor: 'pointer' }}>Twitter</a></span>
              <span><a href='https://www.instagram.com/rahulrp46/' target='_blank' rel='noopener noreferrer' style={{ cursor: 'pointer' }}>Instagram</a></span>
            </div>
          </Col>
        </Row>
        <hr style={{ borderColor: 'var(--border-color)' }} />
        <div className="text-center text-muted" style={{ fontSize: '0.85rem' }}>
          &copy; {new Date().getFullYear()} BookMyShow Clone. All rights reserved.
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
