import React, { useState } from 'react';
import { Nav, Button, Offcanvas, Modal, Form, ListGroup } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Film, MapPin, User, LayoutDashboard, Search, Menu, X, LogOut, Moon, Sun, Palette, Tv, Ticket, Utensils, MessageSquare } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { getMovies } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';


const Sidebar = () => {
    const [show, setShow] = useState(false);
    const [showThemeModal, setShowThemeModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const { isAuthenticated, logout, user } = useAuth();
    const { theme, toggleTheme, primaryColor, setPrimaryColor, customBg, setCustomBg, customText, setCustomText, setTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const toggleSidebar = () => setShow(!show);

    const isAdminRoute = location.pathname.startsWith('/admin');

    const navItems = isAdminRoute ? [
        { path: '/admin?tab=analytics', icon: <LayoutDashboard size={20}/>, label: 'Analytics' },
        { path: '/admin?tab=movies', icon: <Film size={20}/>, label: 'Manage Movies' },
        { path: '/admin?tab=theatres', icon: <MapPin size={20}/>, label: 'Manage Theatres' },
        { path: '/admin?tab=shows', icon: <Tv size={20}/>, label: 'Schedule Shows' },
        { path: '/admin?tab=food', icon: <Utensils size={20}/>, label: 'Manage Food' },
        { path: '/admin?tab=users', icon: <User size={20}/>, label: 'User Directory' },
        { path: '/admin?tab=bookings', icon: <Ticket size={20}/>, label: 'Booking Records' },
        { path: '/admin?tab=complaints', icon: <MessageSquare size={20}/>, label: 'Complaints' },
    ] : [
        { path: '/', icon: <Home size={20}/>, label: 'Home' },
        { path: '/movies', icon: <Film size={20}/>, label: 'Movies' },
        { path: '/theatres', icon: <MapPin size={20}/>, label: 'Theatres' },
    ];

    if (isAuthenticated && !isAdminRoute) {
        navItems.push({ path: '/dashboard', icon: <User size={20}/>, label: 'My Profile' });
        navItems.push({ path: '/complaints', icon: <MessageSquare size={20}/>, label: 'Support' });
        if (user.isAdmin) {
            navItems.push({ path: '/admin', icon: <LayoutDashboard size={20}/>, label: 'Admin Panel' });
        }
    }

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const SidebarContent = () => (
        <div className="d-flex flex-column h-100 p-3" style={{ 
            backgroundColor: theme === 'dark' ? 'var(--sidebar-bg, #0A1628)' : 'var(--card-bg)', 
            borderRight: '1px solid var(--border-color)' 
        }}>
            <div className="mb-4 d-flex align-items-center justify-content-between">
                <Link to="/" className="text-decoration-none">
                    <span style={{ color: theme === 'dark' ? '#4A9EDB' : 'var(--bms-red)', fontWeight: 'bold', fontSize: '1.5rem' }}>book</span>
                    <span style={{ color: theme === 'dark' ? '#FFFFFF' : 'var(--text-primary)', fontWeight: 'bold', fontSize: '1.5rem' }}>myshow</span>
                </Link>
                <Button variant="link" className="d-lg-none p-0" style={{ color: theme === 'dark' ? '#A8C4D8' : undefined }} onClick={toggleSidebar}>
                    <X size={24} />
                </Button>
            </div>

            <Nav className="flex-column gap-1 mb-auto">
                {isAdminRoute && (
                    <Nav.Link as={Link} to="/" className="small mb-3 sidebar-link d-flex align-items-center gap-2" style={{ color: theme === 'dark' ? '#A8C4D8' : undefined }}>
                        <Home size={14}/> Back to Customer Site
                    </Nav.Link>
                )}
                {navItems.map((item) => {
                    const isActive = (location.pathname + location.search) === item.path || (isAdminRoute && item.path.includes(new URLSearchParams(location.search).get('tab')));
                    return (
                        <Nav.Link 
                            key={item.path}
                            as={Link} 
                            to={item.path}
                            onClick={() => setShow(false)}
                            className={`d-flex align-items-center gap-3 px-3 py-2 rounded-3 transition-all ${!isActive ? 'sidebar-link' : ''}`}
                            style={{ 
                                fontWeight: '600',
                                backgroundColor: isActive
                                    ? (theme === 'dark' ? '#1A3A5C' : '#16A34A')
                                    : 'transparent',
                                color: isActive ? '#FFFFFF' : (theme === 'dark' ? '#A8C4D8' : undefined),
                                borderLeft: isActive && theme === 'dark' 
                                    ? '3px solid #4A9EDB' 
                                    : isActive 
                                        ? '3px solid rgba(255,255,255,0.4)' 
                                        : '3px solid transparent',
                                boxShadow: isActive && theme === 'dark' 
                                    ? '0 2px 12px rgba(74,158,219,0.25)' 
                                    : isActive 
                                        ? '0 2px 10px rgba(22,163,74,0.35)'
                                        : undefined,
                            }}
                        >
                            <span style={{ color: isActive ? '#FFFFFF' : (theme === 'dark' ? '#4A9EDB' : '#16A34A') }}>
                                {item.icon}
                            </span>
                            <span style={{ color: isActive ? '#FFFFFF' : (theme === 'dark' ? '#E0F0FF' : undefined) }}>{item.label}</span>
                        </Nav.Link>
                    );
                })}
            </Nav>

            <div className="mt-auto pt-4" style={{ borderTop: `1px solid ${theme === 'dark' ? '#1E3A52' : 'var(--border-color)'}` }}>
                <Button 
                    variant="link" 
                    onClick={toggleTheme}
                    className="w-100 d-flex align-items-center gap-3 px-3 py-2 text-decoration-none sidebar-link rounded-3 mb-2"
                    style={{ color: theme === 'dark' ? '#A8C4D8' : undefined }}
                >
                    {theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>}
                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </Button>

                <Button 
                    variant="link" 
                    onClick={() => setShowThemeModal(true)}
                    className="w-100 d-flex align-items-center gap-3 px-3 py-2 text-decoration-none sidebar-link rounded-3 mb-2"
                    style={{ color: theme === 'dark' ? '#A8C4D8' : undefined }}
                >
                    <Palette size={20}/>
                    <span>Customize Theme</span>
                </Button>

                {isAuthenticated && (
                    <Button 
                        variant="link" 
                        onClick={handleLogout}
                        className="w-100 d-flex align-items-center gap-3 px-3 py-2 text-danger text-decoration-none sidebar-link rounded-3"
                    >
                        <LogOut size={20}/>
                        <span>Sign Out</span>
                    </Button>
                )}
            </div>

            {/* Auth Modal */}
            <AuthModal 
                show={showAuthModal} 
                handleClose={() => setShowAuthModal(false)} 
            />

            {/* Theme Customizer Modal */}
            <Modal show={showThemeModal} onHide={() => setShowThemeModal(false)} centered className="admin-modal">
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="fw-bold">Theme Customizer</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <div className="mb-4">
                        <label className="small fw-bold mb-2 d-block">Primary Brand Color</label>
                        <div className="d-flex gap-3 align-items-center">
                            <Form.Control 
                                type="color" 
                                value={primaryColor} 
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="p-1 border-0"
                                style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                            />
                            <span className="text-muted fw-mono">{primaryColor}</span>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="small fw-bold mb-2 d-block">Custom Theme Mode</label>
                        <div className="d-flex gap-2 mb-3">
                            {['light', 'dark', 'custom'].map(t => (
                                <Button 
                                    key={t}
                                    variant={theme === t ? 'danger' : 'outline-secondary'}
                                    size="sm"
                                    onClick={() => setTheme(t)}
                                    className="text-capitalize"
                                >
                                    {t}
                                </Button>
                            ))}
                        </div>
                        
                        {theme === 'custom' && (
                            <div className="p-3 rounded border" style={{ backgroundColor: 'var(--bg-color)' }}>
                                <div className="mb-3">
                                    <label className="small text-muted d-block mb-1">Background</label>
                                    <Form.Control type="color" value={customBg} onChange={(e) => setCustomBg(e.target.value)} />
                                </div>
                                <div>
                                    <label className="small text-muted d-block mb-1">Text Color</label>
                                    <Form.Control type="color" value={customText} onChange={(e) => setCustomText(e.target.value)} />
                                </div>
                            </div>
                        )}
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="primary-bms" className="w-100" onClick={() => setShowThemeModal(false)}>
                        Apply Changes
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar (Permanent) */}
            <div className="d-none d-lg-block position-fixed h-100 sidebar-container" style={{ width: '260px', zIndex: 1000, overflowY: 'auto' }}>
                <SidebarContent />
            </div>

            {/* Mobile Toggle Button */}
            <div className="d-lg-none position-fixed top-0 start-0 p-3" style={{ zIndex: 1001 }}>
                <Button variant="danger" className="rounded-circle shadow" onClick={toggleSidebar}>
                    <Menu size={24} />
                </Button>
            </div>

            {/* Mobile Sidebar (Offcanvas) */}
            <Offcanvas show={show} onHide={toggleSidebar} className="d-lg-none" style={{ width: '280px' }}>
                <SidebarContent />
            </Offcanvas>

        </>
    );
};

export default Sidebar;
