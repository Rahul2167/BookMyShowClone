import React from 'react';
import { Container } from 'react-bootstrap';

const PrivacyPolicy = () => {
  return (
    <div className="privacy-page py-5">
      <Container>
        <div className="p-5 rounded-4 shadow-sm" style={{ backgroundColor: 'var(--card-bg)' }}>
          <h1 className="fw-bold mb-4" style={{ color: 'var(--text-primary)' }}>Privacy Policy</h1>
          <p className="text-muted small mb-5">Last updated: May 15, 2026</p>

          <section className="mb-4">
            <h4 className="fw-bold">1. Information We Collect</h4>
            <p className="text-muted">
              We collect information that you provide directly to us, such as when you create an account, make a purchase, or communicate with us. This includes your name, email address, phone number, and payment information.
            </p>
          </section>

          <section className="mb-4">
            <h4 className="fw-bold">2. How We Use Your Information</h4>
            <p className="text-muted">
              We use the information we collect to provide, maintain, and improve our services, to process your transactions, and to communicate with you about your bookings and promotions.
            </p>
          </section>

          <section className="mb-4">
            <h4 className="fw-bold">3. Data Security</h4>
            <p className="text-muted">
              We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction.
            </p>
          </section>

          <section className="mb-4">
            <h4 className="fw-bold">4. Sharing of Information</h4>
            <p className="text-muted">
              We do not share your personal information with third parties except as described in this policy, such as with our business partners to provide the services you request.
            </p>
          </section>

          <section className="mb-4">
            <h4 className="fw-bold">5. Your Choices</h4>
            <p className="text-muted">
              You may update or correct your account information at any time by logging into your account or contacting us directly.
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
};

export default PrivacyPolicy;
