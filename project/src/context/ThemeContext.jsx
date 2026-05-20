import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [primaryColor, setPrimaryColor] = useState(localStorage.getItem('primaryColor') || '#F84464');
    const [customBg, setCustomBg] = useState(localStorage.getItem('customBg') || '#0F172A');
    const [customText, setCustomText] = useState(localStorage.getItem('customText') || '#F8FAFC');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        document.documentElement.style.setProperty('--bms-red', primaryColor);
        localStorage.setItem('primaryColor', primaryColor);
    }, [primaryColor]);

    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'custom') {
            root.style.setProperty('--bg-color', customBg);
            root.style.setProperty('--text-primary', customText);
            
            // Derive colors with better logic
            const isDarkBg = isDark(customBg);
            const isDarkText = isDark(customText);
            
            root.style.setProperty('--text-secondary', adjust(customText, isDarkText ? 30 : -30));
            root.style.setProperty('--card-bg', adjust(customBg, isDarkBg ? 7 : -7));
            root.style.setProperty('--navbar-bg', adjust(customBg, isDarkBg ? -5 : 5));
            root.style.setProperty('--navbar-text', isDark(adjust(customBg, isDarkBg ? -5 : 5)) ? '#FFFFFF' : '#1A1A1A');
            root.style.setProperty('--input-bg', adjust(customBg, isDarkBg ? 10 : -10));
            root.style.setProperty('--border-color', adjust(customBg, isDarkBg ? 15 : -15));
        } else {
            // Remove custom properties to let CSS take over
            ['--bg-color', '--text-primary', '--text-secondary', '--card-bg', '--navbar-bg', '--navbar-text', '--input-bg', '--border-color']
                .forEach(prop => root.style.removeProperty(prop));
        }
        localStorage.setItem('customBg', customBg);
        localStorage.setItem('customText', customText);
    }, [theme, customBg, customText]);

    function isDark(color) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return brightness < 128;
    }

    const toggleTheme = () => {
        setTheme(prev => (prev === 'light' ? 'dark' : prev === 'dark' ? 'custom' : 'light'));
    };

    function lighten(color, percent) {
        return adjust(color, percent);
    }
    
    function darken(color, percent) {
        return adjust(color, -percent);
    }

    function adjust(color, percent) {
        let num = parseInt(color.replace("#",""),16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) + amt,
        G = (num >> 8 & 0x00FF) + amt,
        B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
    }

    return (
        <ThemeContext.Provider value={{ 
            theme, setTheme, toggleTheme, 
            primaryColor, setPrimaryColor,
            customBg, setCustomBg,
            customText, setCustomText
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
