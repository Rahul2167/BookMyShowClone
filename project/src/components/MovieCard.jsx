import React from 'react';
import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const MovieCard = ({ movie }) => {
  // Using a placeholder image if posterUrl is missing or just for aesthetics
  const placeholderPoster = `https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80`;
  const imageSrc = movie.posterUrl && movie.posterUrl.trim() !== '' ? movie.posterUrl : placeholderPoster;

  return (
    <Card as={Link} to={`/movie/${movie.movieId}`} className="movie-card text-decoration-none">
      <div className="movie-poster-container">
        <Card.Img 
          variant="top" 
          src={imageSrc} 
          className="movie-poster"
          alt={movie.title}
        />
      </div>
      <Card.Body className="d-flex flex-column">
        <Card.Title className="text-truncate mb-1" style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
          {movie.title}
        </Card.Title>
        <Card.Text className="mb-1" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {movie.genre}
        </Card.Text>
        <Card.Text style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          {movie.language}
        </Card.Text>
      </Card.Body>
    </Card>
  );
};

export default MovieCard;
