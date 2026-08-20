import React from 'react';
import { RefreshCw, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useBackendStatus } from '../context/BackendStatusContext';

const ServerStatusBanner = () => {
  const { isBannerVisible, apiStatus, statusMessage, hideBanner } = useBackendStatus();

  if (!isBannerVisible) return null;

  const isLive = apiStatus === 'live';
  const isError = apiStatus === 'error';

  return (
    <div
      className={`server-status-banner px-3 py-2 text-center d-flex align-items-center justify-content-between ${
        isLive ? 'banner-live' : isError ? 'banner-error' : 'banner-loading'
      }`}
      style={{
        width: '100%',
        zIndex: 1100,
        position: 'relative',
        fontSize: '0.875rem',
        fontWeight: '500',
        transition: 'all 0.3s ease',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <div className="d-flex align-items-center justify-content-center flex-grow-1 gap-2 flex-wrap text-center">
        {!isLive && !isError && (
          <RefreshCw className="spin-icon text-warning" size={18} style={{ animation: 'spin 1.2s linear infinite' }} />
        )}
        {isLive && <CheckCircle className="text-success" size={18} />}
        {isError && <AlertCircle className="text-danger" size={18} />}

        <span className="banner-text">
          <strong className="me-1">Disclaimer:</strong>
          {statusMessage}
        </span>
      </div>

      <button
        type="button"
        className="btn-close-banner border-0 bg-transparent p-1 ms-2"
        onClick={hideBanner}
        aria-label="Close disclaimer banner"
        style={{ cursor: 'pointer', opacity: 0.8 }}
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default ServerStatusBanner;
