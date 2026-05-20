import React from 'react';
import { Button } from 'react-bootstrap';
import { Sun, Moon, Palette } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ className }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <Button 
            variant="link" 
            onClick={toggleTheme} 
            className={`theme-toggle-btn p-2 d-flex align-items-center justify-content-center ${className}`}
            style={{ 
                color: '#ccc', 
                textDecoration: 'none',
                borderRadius: '50%',
                transition: 'all 0.3s ease'
            }}
            title={`Switch to ${theme === 'light' ? 'Dark' : theme === 'dark' ? 'Custom' : 'Light'} Mode`}
        >
            {theme === 'light' && <Sun size={20} />}
            {theme === 'dark' && <Moon size={20} />}
            {theme === 'custom' && <Palette size={20} />}
        </Button>
    );
};

export default ThemeToggle;
