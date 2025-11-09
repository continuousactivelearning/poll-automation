import React, { useEffect, useState, useRef } from 'react';

type Status = 'connected' | 'disconnected' | 'degraded' | 'reconnecting';

export interface ConnectionStatusProps {
  /** URL path to use for backend health checks (relative ok) */
  healthPath?: string;
  /** Ping interval in ms to periodically validate backend reachability */
  pingIntervalMs?: number;
  /** Timeout for each health check request in ms */
  requestTimeoutMs?: number;
  /** Whether to show debug info (last check/time/status) */
  showDebug?: boolean;
}

/**
 * ConnectionStatus component (modular)
 * Behavior:
 * - Uses navigator.onLine for immediate offline detection
 * - Periodically pings backend to ensure service is reachable
 * - Distinguishes network offline vs backend degraded/unreachable
 * - Provides configurable intervals and timeouts via props
 */
const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  healthPath,
  pingIntervalMs = 10000,
  requestTimeoutMs = 3000,
  showDebug,
}) => {
  // prefer explicit healthPath, then VITE_API_BASE + path, then default
  const envBase = typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_API_BASE : undefined;
  const defaultPath = '/api/transcripts/health-check';
  const resolvedHealthPath = healthPath ?? (envBase ? `${envBase.replace(/\/$/, '')}${defaultPath}` : defaultPath);
  const debug = typeof showDebug === 'boolean' ? showDebug : (typeof import.meta !== 'undefined' ? !!(import.meta as any).env?.MODE && (import.meta as any).env?.MODE === 'development' : false);
  const [status, setStatus] = useState<Status>(() => (typeof navigator !== 'undefined' && navigator.onLine ? 'reconnecting' : 'disconnected'));
  const [lastStatusCode, setLastStatusCode] = useState<number | null>(null);
  const [lastPingAt, setLastPingAt] = useState<number | null>(null);

  const pingTimer = useRef<number | null>(null);
  const retryTimer = useRef<number | null>(null);
  const abortControllers = useRef<AbortController[]>([]);

  useEffect(() => {
    function handleOnline() {
      // when browser regains connectivity, revalidate backend immediately
      setStatus('reconnecting');
      doHealthCheck();
    }

    function handleOffline() {
      // browser offline -> clearly disconnected
      setStatus('disconnected');
      clearPending();
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

  // initial check & periodic checks
  doHealthCheck();
  pingTimer.current = window.setInterval(doHealthCheck, pingIntervalMs);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (pingTimer.current) clearInterval(pingTimer.current);
      if (retryTimer.current) clearTimeout(retryTimer.current);
      clearPending();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [healthPath, pingIntervalMs, requestTimeoutMs]);

  function clearPending() {
    abortControllers.current.forEach(c => {
      try { c.abort(); } catch (e) { /* ignore */ }
    });
    abortControllers.current = [];
  }

  async function doHealthCheck() {
    // If browser says offline, reflect that immediately
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setStatus('disconnected');
      return;
    }

    // perform a single health check with timeout
    setLastPingAt(Date.now());
    const controller = new AbortController();
    abortControllers.current.push(controller);

    const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs);

    try {
      const res = await fetch(resolvedHealthPath, { signal: controller.signal, cache: 'no-store' });
      clearTimeout(timeout);
      setLastStatusCode(res.status);

      if (res.ok) {
        setStatus('connected');
        // clear any scheduled retry attempts
        if (retryTimer.current) { clearTimeout(retryTimer.current); retryTimer.current = null; }
      } else if (res.status >= 500) {
        // server error -> degraded, not purely network
        setStatus('degraded');
        scheduleRetryWithBackoff();
      } else if (res.status === 401 || res.status === 403) {
        // auth errors still mean backend reachable; mark connected but warn (keep as connected)
        setStatus('connected');
      } else {
        // other non-OK statuses treat as degraded
        setStatus('degraded');
        scheduleRetryWithBackoff();
      }
    } catch (err) {
      // fetch failed (network error or timeout). If navigator.onLine is true, it's likely backend unreachable
      setLastStatusCode(null);
      // If browser is online, mark reconnecting (transient) and retry
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        setStatus('reconnecting');
        scheduleRetryWithBackoff();
      } else {
        setStatus('disconnected');
      }
    } finally {
      // remove finished controller
      abortControllers.current = abortControllers.current.filter(c => c !== controller);
    }
  }

  function scheduleRetryWithBackoff() {
    if (retryTimer.current) return; // already scheduled
    // basic backoff: try again after 2s
    retryTimer.current = window.setTimeout(() => {
      retryTimer.current = null;
      doHealthCheck();
    }, 2000);
  }

  const getLabel = () => {
    switch (status) {
      case 'connected': return 'System Active';
      case 'disconnected': return 'Offline';
      case 'degraded': return 'Service Degraded';
      case 'reconnecting': return 'Reconnecting';
      default: return 'Unknown';
    }
  };

  const getClass = () => {
    switch (status) {
      case 'connected': return 'bg-green-500/20 text-green-400';
      case 'disconnected': return 'bg-red-600/20 text-red-400';
      case 'degraded': return 'bg-orange-500/20 text-orange-300';
      case 'reconnecting': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-600/20 text-gray-300';
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`${getClass()} px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium w-full sm:w-auto text-center`} title={`Connection status: ${status}`}>
        {getLabel()}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => doHealthCheck()}
          className="px-3 py-1 text-xs rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-gray-200"
          aria-label="Check connection now"
        >
          Check now
        </button>
        {debug && (
          <div className="text-xs text-gray-400 text-right">
            <div>code: {lastStatusCode ?? '-'}</div>
            <div>{lastPingAt ? new Date(lastPingAt).toLocaleTimeString() : '-'}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;