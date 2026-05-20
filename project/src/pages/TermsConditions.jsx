import React from 'react';
import { Container } from 'react-bootstrap';

const TermsConditions = () => {
  return (
    <div className="terms-page py-5">
      <Container>
        <div className="p-5 rounded-4 shadow-sm" style={{ backgroundColor: 'var(--card-bg)' }}>
          <h1 className="fw-bold mb-4" style={{ color: 'var(--text-primary)' }}>Terms & Conditions</h1>
          <p className="text-muted small mb-5">Last updated: May 15, 2026</p>

          <section className="mb-4">
            <h4 className="fw-bold">1. Acceptance of Terms</h4>
            <p className="text-muted">
              By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section className="mb-4">
            <h4 className="fw-bold">2. Booking Policy</h4>
            <p className="text-muted">
              All bookings are subject to availability. Once a ticket is confirmed, it cannot be cancelled or refunded unless specified by the cinema partner.
            </p>
          </section>

          <section className="mb-4">
            <h4 className="fw-bold">3. User Conduct</h4>
            <p className="text-muted">
              Users are responsible for maintaining the confidentiality of their account information and for all activities that occur under their account.
            </p>
          </section>

          <section className="mb-4">
            <h4 className="fw-bold">4. Limitation of Liability</h4>
            <p className="text-muted">
              BookMyShow will not be liable for any damages of any kind arising from the use of this site or from any information, content, materials, or products included on this site.
            </p>
          </section>

          <section className="mb-4">
            <h4 className="fw-bold">5. Modifications</h4>
            <p className="text-muted">
              We reserve the right to modify these terms at any time without prior notice. Your continued use of the site signifies your acceptance of any changes.
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
};

export default TermsConditions;
