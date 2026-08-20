import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import API from '../services/api';

const BackendStatusContext = createContext();

let globalTriggerStart = null;
let globalTriggerSuccess = null;
let globalTriggerError = null;

// Synchronously attach Axios interceptors at module level to catch initial API calls
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
        globalTriggerSuccess('Backend is live & connected!');
      }
    } else {
      // True network error or timeout (Render backend sleeping)
      if (globalTriggerError) {
        globalTriggerError('Connection delayed. Render free backend is spinning up, please allow ~1 min...');
      }
    }
    return Promise.reject(error);
  }
);

export const BackendStatusProvider = ({ children }) => {
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState('idle'); // 'idle' | 'loading' | 'live' | 'error'
  const [statusMessage, setStatusMessage] = useState('');
  const [isBannerVisible, setIsBannerVisible] = useState(false);

  const hideTimerRef = useRef(null);
  // Ref to track if backend has already been verified live during this session
  const hasVerifiedLiveRef = useRef(false);

  const triggerApiStart = useCallback(
    (msg = 'Backend is hosted on Render (takes ~1 minute initial wake-up time). Backend is live, please wait...') => {
      // If backend is already verified live, DO NOT pop up the disclaimer again on subsequent API calls (e.g. login)
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
    // Mark backend as verified live so login/search/navigation calls won't show disclaimer again
    hasVerifiedLiveRef.current = true;

    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setIsApiLoading(false);
    setApiStatus('live');
    setStatusMessage(msg);
    setIsBannerVisible(true);

    // Auto-hide banner 2 seconds after backend is live & connected
    hideTimerRef.current = setTimeout(() => {
      setIsBannerVisible(false);
    }, 2000);
  }, []);

  const triggerApiError = useCallback(
    (msg = 'Backend server is spinning up on Render (~1 min wake-up time). Please wait...') => {
      // Reset live status on connection error so user is notified if server drops
      hasVerifiedLiveRef.current = false;

      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      setIsApiLoading(false);
      setApiStatus('error');
      setStatusMessage(msg);
      setIsBannerVisible(true);

      // Auto-hide error banner after 6 seconds so it never stays stuck
      hideTimerRef.current = setTimeout(() => {
        setIsBannerVisible(false);
      }, 6000);
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

    // Trigger initial loading disclaimer and check backend status on mount
    triggerApiStart('Backend is hosted on Render (takes ~1 minute initial wake-up time). Backend is live, please wait...');

    API.get('/movies/fetch/all')
      .then(() => {
        triggerApiSuccess('Backend is live & connected!');
      })
      .catch((err) => {
        // If response received (even 4xx/5xx), server is active
        if (err.response) {
          triggerApiSuccess('Backend is live & connected!');
        }
      });

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
