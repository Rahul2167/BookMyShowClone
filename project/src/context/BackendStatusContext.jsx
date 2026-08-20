import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../services/api';

const BackendStatusContext = createContext();

export const BackendStatusProvider = ({ children }) => {
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState('loading'); // 'idle' | 'loading' | 'live' | 'error'
  const [statusMessage, setStatusMessage] = useState(
    'Backend is hosted on Render (takes ~1 minute initial wake-up time). Backend is live, please wait...'
  );
  const [isBannerVisible, setIsBannerVisible] = useState(true);

  const triggerApiStart = useCallback((msg = 'Connecting to Render backend. Initial response may take ~1 min if waking up...') => {
    setIsApiLoading(true);
    setApiStatus('loading');
    setStatusMessage(msg);
    setIsBannerVisible(true);
  }, []);

  const triggerApiSuccess = useCallback((msg = 'Backend is live & connected!') => {
    setIsApiLoading(false);
    setApiStatus('live');
    setStatusMessage(msg);
    setIsBannerVisible(true);

    // Auto hide after 4 seconds of live success
    const timer = setTimeout(() => {
      setIsBannerVisible(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const triggerApiError = useCallback((msg = 'Backend server is spinning up on Render. Initial response may take ~1 min...') => {
    setIsApiLoading(false);
    setApiStatus('error');
    setStatusMessage(msg);
    setIsBannerVisible(true);
  }, []);

  const hideBanner = useCallback(() => {
    setIsBannerVisible(false);
  }, []);

  // Wire up Axios interceptors to automatically track API calls to Render/Backend
  useEffect(() => {
    const reqInterceptor = API.interceptors.request.use(
      (config) => {
        triggerApiStart('Backend API hit! Render backend takes ~1 min to wake up if inactive. Please wait...');
        return config;
      },
      (error) => {
        triggerApiError('Failed to initiate request to backend.');
        return Promise.reject(error);
      }
    );

    const resInterceptor = API.interceptors.response.use(
      (response) => {
        triggerApiSuccess('Backend is live & responded successfully!');
        return response;
      },
      (error) => {
        if (error.code === 'ECONNABORTED' || !error.response) {
          triggerApiError('Connection delayed. Render free backend is spinning up, please allow ~1 min...');
        } else {
          triggerApiSuccess('Backend is live!');
        }
        return Promise.reject(error);
      }
    );

    return () => {
      API.interceptors.request.eject(reqInterceptor);
      API.interceptors.response.eject(resInterceptor);
    };
  }, [triggerApiStart, triggerApiSuccess, triggerApiError]);

  return (
    <BackendStatusContext.Provider
      value={{
        isApiLoading,
        apiStatus,
        statusMessage,
        isBannerVisible,
        triggerApiStart,
        triggerApiSuccess,
        triggerApiError,
        hideBanner,
        setIsBannerVisible,
      }}
    >
      {children}
    </BackendStatusContext.Provider>
  );
};

export const useBackendStatus = () => {
  const context = useContext(BackendStatusContext);
  if (!context) {
    throw new Error('useBackendStatus must be used within a BackendStatusProvider');
  }
  return context;
};
