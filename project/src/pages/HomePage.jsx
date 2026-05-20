import React from 'react';
import { Container, Carousel, Row, Col, Card } from 'react-bootstrap';
import { Film, Ticket, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getMovies } from '../services/api';

const HomePage = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = React.useState([]);

  React.useEffect(() => {
    getMovies().then(res => {
      // Filter movies that have a bannerUrl or are suitable for carousel
      setMovies(res.data.slice(0, 5)); // Show top 5 movies
    }).catch(err => console.error("Failed to fetch movies for carousel", err));
  }, []);

  const defaultBanner = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80";

  return (
    <div className="home-page pb-3">
      {/* Hero Carousel - Dynamic with Movie Cover Images */}
      <Carousel className="hero-carousel mb-4 shadow-sm" interval={3000} pause="hover" fade>
        {movies.length > 0 ? (
          movies.map((movie) => (
            <Carousel.Item key={movie.movieId} onClick={() => navigate(`/movie/${movie.movieId}`)} style={{ cursor: 'pointer' }}>
              <img
                className="d-block w-100"
                src={movie.bannerUrl || defaultBanner}
                alt={movie.title}
                style={{ objectFit: 'cover' }}
              />
              <Carousel.Caption style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '10px', padding: '10px' }}>
                <h3 className="fw-bold m-0">{movie.title}</h3>
              </Carousel.Caption>
            </Carousel.Item>
          ))
        ) : (
          <Carousel.Item>
            <img
              className="d-block w-100"
              src={defaultBanner}
              alt="Welcome"
              style={{ objectFit: 'cover' }}
            />
          </Carousel.Item>
        )}
      </Carousel>

      <Container>
        <Row className="g-4 mb-5">
            <Col md={4}>
                <Card className="border-0 shadow-sm h-100 p-3 text-center" style={{ backgroundColor: 'var(--card-bg)' }}>
                    <div className="mb-3"><Film size={40} color="var(--bms-red)" /></div>
                    <h5 className="fw-bold">Latest Movies</h5>
                    <p className="small text-muted">Catch the biggest blockbusters in crystal clear quality.</p>
                </Card>
            </Col>
            <Col md={4}>
                <Card className="border-0 shadow-sm h-100 p-3 text-center" style={{ backgroundColor: 'var(--card-bg)' }}>
                    <div className="mb-3"><Ticket size={40} color="var(--bms-red)" /></div>
                    <h5 className="fw-bold">Easy Booking</h5>
                    <p className="small text-muted">Book your tickets in just a few clicks with zero hassle.</p>
                </Card>
            </Col>
            <Col md={4}>
                <Card className="border-0 shadow-sm h-100 p-3 text-center" style={{ backgroundColor: 'var(--card-bg)' }}>
                    <div className="mb-3"><Zap size={40} color="var(--bms-red)" /></div>
                    <h5 className="fw-bold">Fast Rewards</h5>
                    <p className="small text-muted">Earn points on every booking and unlock exclusive offers.</p>
                </Card>
            </Col>
        </Row>

        <div className="p-5 rounded-4 text-center shadow" style={{ backgroundColor: 'var(--navbar-bg)', color: 'white' }}>
            <h2 className="fw-bold mb-3">Ready for the Cinema?</h2>
            <p className="mb-4 text-white-50">Discover thousands of movies and theatres across your city.</p>
            <button 
                className="btn btn-primary-bms rounded-pill px-5 py-3 fw-bold shadow"
                onClick={() => navigate('/movies')}
            >
                Explore Now
            </button>
        </div>
      </Container>
    </div>
  );
};

export default HomePage;
