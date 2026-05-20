import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Form, Button, Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import AuthModal from './AuthModal';
import ThemeToggle from './ThemeToggle';

const NavigationBar = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/');
  };

  return (
    <>
      <Navbar expand="lg" className="bms-navbar py-3" variant="dark" sticky="top">
        <Container>
          <Navbar.Brand as={Link} to="/">
            <span style={{ color: 'var(--bms-red)', fontWeight: 'bold', fontSize: '1.5rem' }}>book</span>
            <span style={{ color: 'var(--navbar-text)', fontWeight: 'bold', fontSize: '1.5rem' }}>myshow</span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Form className="d-flex mx-auto w-50">
              <Form.Control
                type="search"
                placeholder="Search for Movies, Events, Plays, Sports and Activities"
                className="search-input w-100"
                aria-label="Search"
                style={{ backgroundColor: '#FFFFFF', color: '#1A1A1A' }}
              />
            </Form>
            <Nav className="ms-auto align-items-center">
              <Dropdown className="me-3">
                <Dropdown.Toggle variant="link" id="dropdown-basic" style={{ color: 'var(--navbar-text)', textDecoration: 'none', fontWeight: '600' }}>
                  Select City
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item href="#/mumbai">Mumbai</Dropdown.Item>
                  <Dropdown.Item href="#/delhi">Delhi-NCR</Dropdown.Item>
                  <Dropdown.Item href="#/bengaluru">Bengaluru</Dropdown.Item>
                  <Dropdown.Item href="#/pune">Pune</Dropdown.Item>
                  <Dropdown.Item href="#/hyderabad">Hyderabad</Dropdown.Item>
                  <Dropdown.Item href="#/ahmedabad">Ahmedabad</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              
              {isAuthenticated && user?.isAdmin && (
                <Link to="/admin" className="me-3 text-decoration-none fw-bold" style={{ color: 'var(--navbar-text)' }}>Admin Dashboard</Link>
              )}

              <ThemeToggle className="me-2" />
              
              {isAuthenticated ? (
                <Dropdown>
                  <Dropdown.Toggle variant="outline-light" id="user-dropdown" className="btn-sm rounded-pill px-3 fw-bold" style={{ borderColor: 'var(--navbar-text)', color: 'var(--navbar-text)' }}>
                    Hi, {user?.name?.split(' ')[0] || 'User'}
                  </Dropdown.Toggle>
                  <Dropdown.Menu align="end">

                    <Dropdown.Item as={Link} to="/dashboard">My Dashboard</Dropdown.Item>
                    <Dropdown.Item as={Link} to="/admin" className={user?.isAdmin ? '' : 'd-none'}>Admin Panel</Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout} className="text-danger fw-bold">Logout</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              ) : (
                <Button className="btn-primary-bms px-4 btn-sm fw-bold" onClick={() => setShowAuthModal(true)}>Sign in</Button>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <AuthModal 
        show={showAuthModal} 
        handleClose={() => setShowAuthModal(false)} 
        setIsAuthenticated={setIsAuthenticated}
      />
    </>
  );
};

export default NavigationBar;
