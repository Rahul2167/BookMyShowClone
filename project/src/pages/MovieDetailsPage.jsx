import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { getMovieById } from '../services/api';

const BackBtn = ({ onClick }) => (
  <button onClick={onClick} style={{
    display:'inline-flex', alignItems:'center', gap:'6px',
    background:'rgba(255,255,255,0.15)', backdropFilter:'blur(8px)',
    border:'1px solid rgba(255,255,255,0.3)', borderRadius:'30px',
    color:'#fff', padding:'6px 16px', cursor:'pointer',
    fontSize:'0.85rem', fontWeight:'600', transition:'all 0.2s',
    marginBottom:'8px'
  }}>
    &#8592; Back
  </button>
);

const MovieDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMovie();
  }, [id]);

  const fetchMovie = async () => {
    try {
      setLoading(true);
      const response = await getMovieById(id);
      setMovie(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching movie details:", err);
      setError("Failed to load movie details.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="danger" />
      </Container>
    );
  }

  if (error || !movie) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error || "Movie not found"}</Alert>
      </Container>
    );
  }

  // Dynamic sky blue gradient with dark and light tones for a fresh, vibrant look
  // Clean overlay: subtle dark gradient to ensure text readability without the blue tint
  const heroBg = `linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.6)), url(${movie.bannerUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'})`;
  const posterUrl = movie.posterUrl || `https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80`;

  return (
    <div className="movie-details-page">
      {/* Hero Section */}
      <div 
        className="movie-hero" 
        style={{ 
          backgroundImage: heroBg,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '2.5rem 0',
          color: '#FFFFFF',
          position: 'relative'
        }}
      >
        <Container>
          <BackBtn onClick={() => navigate(-1)} />
          <Row className="align-items-center g-5">
            <Col md={4} lg={3} className="text-center">
              <div className="poster-container shadow-lg rounded-4 overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.2)' }}>
                <img 
                  src={posterUrl} 
                  alt={movie.title} 
                  className="img-fluid"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>
            </Col>
            <Col md={8} lg={9}>
              <h1 className="display-4 fw-bold mb-3" style={{ color: '#FFFFFF', textShadow: '0 4px 15px rgba(0,0,0,0.3)', letterSpacing: '-1px' }}>
                {movie.title}
              </h1>
              
              <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
                <div className="d-flex align-items-center gap-2 p-2 px-3 rounded-3" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <span className="text-warning">★</span>
                  <span className="fw-bold" style={{ color: '#FFFFFF' }}>8.5/10</span>
                  <span className="small" style={{ color: 'rgba(255,255,255,0.8)' }}>(100K Votes)</span>
                </div>
                <Button variant="outline-light" size="sm" className="rounded-pill px-3 border-2">Rate now</Button>
              </div>

              <div className="d-flex gap-2 mb-4">
                <Badge bg="info" className="px-3 border-0 text-white" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>{movie.language}</Badge>
                <Badge bg="info" className="px-3 border-0 text-white" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>{movie.genre}</Badge>
                <Badge bg="info" className="px-3 border-0 text-white" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>2D, 3D</Badge>
              </div>

              <div className="mb-4 fw-medium" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem' }}>
                {movie.duration} • {movie.releaseDate}
              </div>

              <Button 
                as={Link} 
                to={`/buytickets/${movie.movieId}`}
                className="btn-primary-bms px-5 py-3 rounded-4 shadow-lg border-0" 
                size="lg"
                style={{ backgroundColor: 'var(--bms-red)', color: '#FFFFFF', fontSize: '1.2rem', fontWeight: '700' }}
              >
                Book Tickets
              </Button>
            </Col>
          </Row>
        </Container>
      </div>

      <Container className="my-5">
        <h3 style={{ fontWeight: '600' }} className="mb-4">About the movie</h3>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
          {movie.description || `${movie.title} is a ${movie.language} language movie. It is an entertaining ${movie.genre} film. Don't miss out on the action!`}
        </p>
      </Container>
    </div>
  );
};

export default MovieDetailsPage;
