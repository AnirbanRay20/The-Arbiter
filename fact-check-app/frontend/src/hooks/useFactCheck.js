import { useState, useRef } from 'react';

export const useFactCheck = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineState, setPipelineState] = useState(null);
  const [claims, setClaims] = useState([]);
  const [processedClaims, setProcessedClaims] = useState([]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  
  const eventSourceRef = useRef(null);

  const startFactCheck = async (inputType, content, onComplete) => {
    setIsProcessing(true);
    setPipelineState({ step: 'INIT', progress: 'Connecting...' });
    setClaims([]);
    setProcessedClaims([]);
    setReport(null);
    setError(null);

    try {
      // We use fetch instead of EventSource direct because we need to send a POST body.
      // Standard EventSource only supports GET. So we use the fetch readable stream.
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/factcheck`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({ inputType, content })
      });

      if (!response.ok) throw new Error("Failed to connect to fact-checking server.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let isDone = false;
      while (!isDone) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const dataStr = line.replace('data: ', '').trim();
              if (!dataStr) continue;
              
              const parsed = JSON.parse(dataStr);
              handleStreamEvent(parsed, onComplete);
            } catch (e) {
              console.error("Error parsing stream event:", e, line);
            }
          }
        }
      }
    } catch (err) {
      setError(err.message);
      setIsProcessing(false);
    }
  };

  const handleStreamEvent = (eventData, onComplete) => {
    const { step, status, progress, data } = eventData;
    
    setPipelineState({ step, status, progress });

    if (status === 'error') {
      setError(progress);
      setIsProcessing(false);
      return;
    }

    if (step === 'EXTRACTING' && status === 'complete') {
      if (data.claims) setClaims(data.claims);
    }

    if (step === 'VERIFYING' && status === 'claim_complete') {
      if (data.claimResult) {
        setProcessedClaims(prev => [...prev, data.claimResult]);
      }
    }

    if (step === 'REPORTING' && status === 'complete') {
      if (data.report) {
        setReport(data.report);
        setIsProcessing(false);
        if (onComplete) onComplete(data.report);
      }
    }
  };

  const reset = () => {
    setPipelineState(null);
    setClaims([]);
    setProcessedClaims([]);
    setReport(null);
    setError(null);
  };

  return {
    isProcessing,
    pipelineState,
    claims,
    processedClaims,
    report,
    error,
    startFactCheck,
    reset
  };
};
