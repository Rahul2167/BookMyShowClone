import React, { useState } from 'react';
import { Container, Form, Button, Modal, ListGroup } from 'react-bootstrap';
import { Search, X, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getMovies } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

const TopBar = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const { isAuthenticated, logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.length > 1) {
            try {
                const res = await getMovies();
                const filtered = res.data.filter(m => 
                    m.title.toLowerCase().includes(query.toLowerCase()) ||
                    m.genre.toLowerCase().includes(query.toLowerCase())
                );
                setSearchResults(filtered);
                setShowResults(true);
            } catch (err) {
                console.error("Search failed", err);
            }
        } else {
            setSearchResults([]);
            setShowResults(false);
        }
    };

    return (
        <div className="top-bar fixed-top d-flex align-items-center" style={{ 
            height: '60px', 
            backgroundColor: 'var(--card-bg)', 
            borderBottom: '1px solid var(--border-color)',
            zIndex: 1050,
            marginLeft: 'var(--sidebar-width)',
            transition: 'margin-left 0.3s ease'
        }}>
            <Container fluid className="px-4 d-flex justify-content-between align-items-center">
                <div className="d-none d-lg-block" style={{ width: '200px' }}></div> {/* Spacer to balance logo in sidebar */}
                <div className="d-lg-none" style={{ width: '50px' }}></div> {/* Spacer for mobile toggle */}

                <div className="position-relative flex-grow-1" style={{ maxWidth: '600px' }}>
                    <Search className="position-absolute top-50 translate-middle-y ms-3 text-muted" size={18} />
                    <Form.Control 
                        type="text" 
                        placeholder="Search for Movies, Events, Plays, Sports and Activities" 
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="admin-input py-2 ps-5 rounded-pill shadow-sm"
                        style={{ fontSize: '0.9rem' }}
                        onBlur={() => setTimeout(() => setShowResults(false), 200)}
                        onFocus={() => searchQuery.length > 1 && setShowResults(true)}
                    />
                    
                    {showResults && (
                        <div className="position-absolute w-100 mt-2 shadow-lg rounded-3 overflow-hidden bg-white" style={{ 
                            zIndex: 1100, 
                            maxHeight: '400px', 
                            overflowY: 'auto',
                            backgroundColor: 'var(--card-bg)',
                            border: '1px solid var(--border-color)'
                        }}>
                            {searchResults.length > 0 ? (
                                <ListGroup variant="flush">
                                    {searchResults.map(movie => (
                                        <ListGroup.Item 
                                            key={movie.movieId} 
                                            action 
                                            onClick={() => {
                                                navigate(`/movie/${movie.movieId}`);
                                                setShowResults(false);
                                                setSearchQuery('');
                                            }}
                                            className="d-flex align-items-center gap-3 p-3 border-0 sidebar-link"
                                        >
                                            <img 
                                                src={movie.posterUrl} 
                                                alt={movie.title} 
                                                style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                                            />
                                            <div className="flex-grow-1">
                                                <div className="fw-bold small" style={{ color: 'var(--text-primary)' }}>{movie.title}</div>
                                                <div className="small text-muted" style={{ fontSize: '0.75rem' }}>{movie.genre} • {movie.language}</div>
                                            </div>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            ) : (
                                <div className="p-4 text-center text-muted small">No results found</div>
                            )}
                        </div>
                    )}
                </div>

                <div className="d-flex align-items-center gap-3 justify-content-end" style={{ width: '200px' }}>
                    {isAuthenticated ? (
                        <div className="d-flex align-items-center gap-3">
                            <div className="text-end d-none d-sm-block">
                                <div className="fw-bold small text-truncate" style={{ maxWidth: '100px', color: 'var(--text-primary)' }}>{user.name}</div>
                                <div className="text-muted" style={{ fontSize: '0.7rem' }}>{user.role}</div>
                            </div>
                            <Button 
                                variant="outline-danger" 
                                size="sm" 
                                className="rounded-circle p-2 shadow-sm"
                                onClick={handleLogout}
                                title="Logout"
                            >
                                <LogOut size={16} />
                            </Button>
                        </div>
                    ) : (
                        <Button 
                            variant="danger" 
                            size="sm" 
                            className="btn-primary-bms rounded-pill px-4"
                            onClick={() => setShowAuthModal(true)}
                        >
                            Sign In
                        </Button>
                    )}
                </div>
            </Container>

            <AuthModal 
                show={showAuthModal} 
                handleClose={() => setShowAuthModal(false)} 
            />
        </div>
    );
};

export default TopBar;
