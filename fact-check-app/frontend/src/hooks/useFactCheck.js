import { useState, useRef, useCallback } from 'react';
import { getFactCheckStreamUrl } from '../services/api';

const initialState = {
  isProcessing:   false,
  pipelineState:  null,
  claims:         [],
  processedClaims:[],
  report:         null,
  imageAnalysis:  null,   // ← NEW: images found in scraped URL
  scrapedMeta:    null,   // ← NEW: title + domain from scraped URL
  error:          null,
  shareId:        null,
};

export function useFactCheck() {
  const [state, setState] = useState(initialState);
  const abortRef = useRef(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(initialState);
  }, []);

  const startFactCheck = useCallback((inputType, content) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ ...initialState, isProcessing: true });

    fetch(getFactCheckStreamUrl(), {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ inputType, content }),
      signal:  controller.signal,
    })
    .then(async res => {
      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          setState(prev => ({ ...prev, isProcessing: false }));
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            handleEvent(event);
          } catch {}
        }
      }
    })
    .catch(err => {
      if (err.name !== 'AbortError') {
        setState(prev => ({ ...prev, isProcessing: false, error: err.message }));
      }
    });

    function handleEvent(event) {
      switch (event.type) {

        case 'PIPELINE':
          setState(prev => ({ ...prev, pipelineState: { step: event.step, status: event.status, progress: event.progress } }));
          break;

        case 'SCRAPED':
          // Store scraped metadata (title, domain, image count)
          setState(prev => ({ ...prev, scrapedMeta: { title: event.title, domain: event.domain, length: event.length, imageCount: event.imageCount } }));
          break;

        case 'CLAIMS':
          setState(prev => ({ ...prev, claims: event.claims }));
          break;

        case 'VERIFIED_CLAIM':
          setState(prev => ({ ...prev, processedClaims: [...prev.processedClaims, event.claim] }));
          break;

        case 'IMAGE_ANALYSIS':
          // Store image analysis results from URL-embedded images
          setState(prev => ({ ...prev, imageAnalysis: event.images }));
          break;

        case 'REPORT':
          setState(prev => ({ ...prev, report: event.report, isProcessing: false }));
          break;

        case 'ERROR':
          setState(prev => ({ ...prev, error: event.message, isProcessing: false }));
          break;

        case 'SHARE_ID':
          setState(prev => ({ ...prev, shareId: event.shareId }));
          break;

        default:
          break;
      }
    }
  }, []);

  return { ...state, startFactCheck, reset };
}
