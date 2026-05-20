import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Info, Target, Users } from 'lucide-react';

const AboutUs = () => {
  return (
    <div className="about-us-page py-5">
      <Container>
        <div className="text-center mb-5">
          <h1 className="fw-bold mb-3" style={{ color: 'var(--text-primary)' }}>About Us</h1>
          <p className="lead text-muted mx-auto" style={{ maxWidth: '700px' }}>
            BookMyShow is India's premier entertainment destination, providing a seamless platform for users to discover and book movie tickets, events, and more.
          </p>
        </div>

        <Row className="gy-5">
          <Col md={4}>
            <div className="p-4 rounded-4 h-100 text-center shadow-sm" style={{ backgroundColor: 'var(--card-bg)' }}>
              <div className="mb-3 d-inline-block p-3 rounded-circle" style={{ backgroundColor: 'rgba(235, 62, 83, 0.1)' }}>
                <Info size={32} color="var(--bms-red)" />
              </div>
              <h4 className="fw-bold mb-3">Our Mission</h4>
              <p className="text-muted">
                To simplify the way people access entertainment by providing a technology-driven, user-friendly booking experience.
              </p>
            </div>
          </Col>
          <Col md={4}>
            <div className="p-4 rounded-4 h-100 text-center shadow-sm" style={{ backgroundColor: 'var(--card-bg)' }}>
              <div className="mb-3 d-inline-block p-3 rounded-circle" style={{ backgroundColor: 'rgba(235, 62, 83, 0.1)' }}>
                <Target size={32} color="var(--bms-red)" />
              </div>
              <h4 className="fw-bold mb-3">Our Vision</h4>
              <p className="text-muted">
                To be the most trusted and preferred entertainment partner for millions of users worldwide.
              </p>
            </div>
          </Col>
          <Col md={4}>
            <div className="p-4 rounded-4 h-100 text-center shadow-sm" style={{ backgroundColor: 'var(--card-bg)' }}>
              <div className="mb-3 d-inline-block p-3 rounded-circle" style={{ backgroundColor: 'rgba(235, 62, 83, 0.1)' }}>
                <Users size={32} color="var(--bms-red)" />
              </div>
              <h4 className="fw-bold mb-3">Our Values</h4>
              <p className="text-muted">
                Customer obsession, innovation, and integrity are at the heart of everything we do.
              </p>
            </div>
          </Col>
        </Row>

        <div className="mt-5 p-5 rounded-4 shadow-sm" style={{ backgroundColor: 'var(--card-bg)' }}>
          <h3 className="fw-bold mb-4">Our Story</h3>
          <p className="text-muted">
            Founded with a passion for cinema and technology, we started as a small team dedicated to solving the problems of ticket queues and limited availability. Today, we have grown into a platform that supports hundreds of theatres and millions of active users.
          </p>
          <p className="text-muted">
            Our commitment to quality and service has made us a household name in the entertainment industry. We continue to innovate and expand our services to bring the best of entertainment right to your fingertips.
          </p>
        </div>
      </Container>
    </div>
  );
};

export default AboutUs;
