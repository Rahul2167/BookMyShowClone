import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import API from '../services/api';

const BackendStatusContext = createContext();

let globalTriggerStart = null;
let globalTriggerSuccess = null;
let globalTriggerError = null;

// Synchronously attach Axios interceptors at module level
API.interceptors.request.use(
  (config) => {
    if (globalTriggerStart) {
      globalTriggerStart();
    }
    return config;
  },
  (error) => {
    if (globalTriggerError) {
      globalTriggerError();
    }
    return Promise.reject(error);
  }
);

API.interceptors.response.use(
  (response) => {
    if (globalTriggerSuccess) {
      globalTriggerSuccess();
    }
    return response;
  },
  (error) => {
    // If backend responded with HTTP status (e.g. 404, 401, 500), backend is LIVE!
    if (error.response) {
      if (globalTriggerSuccess) {
        globalTriggerSuccess();
      }
    } else {
      // True network error or timeout (Render backend sleeping)
      if (globalTriggerError) {
        globalTriggerError();
      }
    }
    return Promise.reject(error);
  }
);

export const BackendStatusProvider = ({ children }) => {
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [isBannerVisible, setIsBannerVisible] = useState(false);

  const hideTimerRef = useRef(null);
  // Persist live verification status across requests and page reloads in sessionStorage
  const hasVerifiedLiveRef = useRef(sessionStorage.getItem('backend_is_live') === 'true');

  const triggerApiStart = useCallback(
    (msg = 'Backend is hosted on Render (takes ~1 minute initial wake-up time). Backend is live, please wait...') => {
      // If backend is already verified live, NEVER show the disclaimer popup again!
      if (hasVerifiedLiveRef.current) {
        return;
      }
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      setIsApiLoading(true);
      setApiStatus('loading');
      setStatusMessage(msg);
      setIsBannerVisible(true);
    },
    []
  );

  const triggerApiSuccess = useCallback((msg = 'Backend is live & connected!') => {
    const wasAlreadyLive = hasVerifiedLiveRef.current;
    hasVerifiedLiveRef.current = true;
    sessionStorage.setItem('backend_is_live', 'true');

    // If backend was ALREADY verified live previously, DO NOT pop up the disclaimer banner again!
    if (wasAlreadyLive) {
      setIsApiLoading(false);
      setApiStatus('live');
      return;
    }

    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setIsApiLoading(false);
    setApiStatus('live');
    setStatusMessage(msg);
    setIsBannerVisible(true);

    // Auto-hide banner 1.5s after initial wake-up confirmation
    hideTimerRef.current = setTimeout(() => {
      setIsBannerVisible(false);
    }, 1500);
  }, []);

  const triggerApiError = useCallback(
    (msg = 'Backend server is spinning up on Render (~1 min wake-up time). Please wait...') => {
      // Don't show wake-up popup if backend was already live
      if (hasVerifiedLiveRef.current) {
        return;
      }
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      setIsApiLoading(false);
      setApiStatus('error');
      setStatusMessage(msg);
      setIsBannerVisible(true);

      hideTimerRef.current = setTimeout(() => {
        setIsBannerVisible(false);
      }, 5000);
    },
    []
  );

  const hideBanner = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setIsBannerVisible(false);
  }, []);

  useEffect(() => {
    globalTriggerStart = triggerApiStart;
    globalTriggerSuccess = triggerApiSuccess;
    globalTriggerError = triggerApiError;

    // Only run initial wake-up check if backend has not been verified live in this session
    if (!hasVerifiedLiveRef.current) {
      triggerApiStart('Backend is hosted on Render (takes ~1 minute initial wake-up time). Backend is live, please wait...');

      API.get('/movies/fetch/all')
        .then(() => {
          triggerApiSuccess('Backend is live & connected!');
        })
        .catch((err) => {
          if (err.response) {
            triggerApiSuccess('Backend is live & connected!');
          }
        });
    }

    return () => {
      globalTriggerStart = null;
      globalTriggerSuccess = null;
      globalTriggerError = null;
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
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
