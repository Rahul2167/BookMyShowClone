import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Alert, Form } from 'react-bootstrap';
import MovieCard from '../components/MovieCard';
import { getMovies } from '../services/api';

const MoviesPage = () => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        fetchMovies();
    }, []);

    const fetchMovies = async () => {
        try {
            setLoading(true);
            const response = await getMovies();
            setMovies(response.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching movies:", err);
            setError("Failed to load movies.");
        } finally {
            setLoading(false);
        }
    };

    const genres = ['All', ...new Set(movies.map(m => m.genre))];
    const filteredMovies = filter === 'All' ? movies : movies.filter(m => m.genre === filter);

    return (
        <Container className="py-5">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 gap-3">
                <div>
                    <h2 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>Movies</h2>
                    <p className="text-muted mb-0">Explore the latest releases</p>
                </div>
                <div style={{ width: '200px' }}>
                    <Form.Select 
                        className="admin-input" 
                        value={filter} 
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        {genres.map(g => <option key={g} value={g}>{g}</option>)}
                    </Form.Select>
                </div>
            </div>

            {loading ? (
                <div className="text-center p-5"><Spinner animation="border" variant="danger" /></div>
            ) : error ? (
                <Alert variant="danger">{error}</Alert>
            ) : filteredMovies.length === 0 ? (
                <div className="text-center p-5 text-muted">No movies found in this category.</div>
            ) : (
                <Row className="g-4">
                    {filteredMovies.map(movie => (
                        <Col key={movie.movieId} xs={6} md={4} lg={3}>
                            <MovieCard movie={movie} />
                        </Col>
                    ))}
                </Row>
            )}
        </Container>
    );
};

export default MoviesPage;
