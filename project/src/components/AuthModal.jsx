import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { login, register, googleLogin } from '../services/api';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import './AuthModal.css';

const AuthModal = ({ show, handleClose }) => {
    const { login: loginContext } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
    });
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            let res;
            if (isLogin) {
                res = await login({ email: formData.email, password: formData.password });
                loginContext(res.data.token, res.data);
                handleClose();
            } else {
                // Register
                res = await register({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password,
                    role: "USER"
                });
                setSuccessMessage("Registration successful! Please sign in to verify your account.");
                setIsLogin(true);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            setLoading(true);
            setError(null);
            const res = await googleLogin({ token: credentialResponse.credential });
            loginContext(res.data.token, res.data);
            handleClose();
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data || "Google Login failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError("Google authentication failed.");
    };

    return (
        <Modal show={show} onHide={handleClose} centered className="auth-modal">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="w-100 text-center fw-bold fs-3">
                    {isLogin ? "Welcome Back" : "Create Account"}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4 px-md-5 pb-5 pt-3">
                {error && <Alert variant="danger" className="py-2">{error}</Alert>}
                {successMessage && <Alert variant="success" className="py-2">{successMessage}</Alert>}
                <Form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <Form.Group className="mb-3">
                            <Form.Label>Full Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter your name"
                                className="auth-input"
                            />
                        </Form.Group>
                    )}
                    <Form.Group className="mb-3">
                        <Form.Label>Email Address</Form.Label>
                        <Form.Control
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            className="auth-input"
                        />
                    </Form.Group>
                    {!isLogin && (
                        <Form.Group className="mb-3">
                            <Form.Label>Phone Number</Form.Label>
                            <Form.Control
                                type="text"
                                name="phone"
                                required
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Enter your phone number"
                                className="auth-input"
                            />
                        </Form.Group>
                    )}
                    <Form.Group className="mb-4">
                        <Form.Label>Password</Form.Label>
                        <Form.Control
                            type="password"
                            name="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            className="auth-input"
                        />
                    </Form.Group>
                    <Button variant="danger" type="submit" className="w-100 fw-bold auth-btn py-2" disabled={loading}>
                        {loading ? "Please wait..." : (isLogin ? "Sign In" : "Sign Up")}
                    </Button>
                </Form>

                <div className="d-flex align-items-center my-3">
                    <hr className="flex-grow-1" />
                    <span className="mx-3 text-muted small">OR</span>
                    <hr className="flex-grow-1" />
                </div>

                <div className="d-flex flex-column align-items-center mb-3 gap-2">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        theme="outline"
                        size="large"
                        width="100%"
                        text="continue_with"
                    />
                    
                </div>

                <div className="text-center mt-4 auth-switch">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <span 
                        className="text-danger fw-bold" 
                        style={{cursor: 'pointer'}} 
                        onClick={() => { setIsLogin(!isLogin); setError(null); setSuccessMessage(null); }}
                    >
                        {isLogin ? "Sign Up" : "Sign In"}
                    </span>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default AuthModal;
