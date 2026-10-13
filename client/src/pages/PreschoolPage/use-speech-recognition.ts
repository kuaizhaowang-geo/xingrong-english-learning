import { useState, useEffect, useRef, useCallback } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  supported: boolean;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: Array<Array<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  if (w.SpeechRecognition) return w.SpeechRecognition;
  if (w.webkitSpeechRecognition) return w.webkitSpeechRecognition;
  return null;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const Ctor = getSpeechRecognitionCtor();
  const supported = Ctor !== null;

  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTranscriptRef = useRef<string>('');

  useEffect(() => {
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (e: { results: Array<Array<{ transcript: string }> & { isFinal: boolean }> }) => {
      let interim = '';
      let finalText = '';
      for (let i = 0; i < e.results.length; i++) {
        const result = e.results[i];
        const transcriptText = result[0]?.transcript ?? '';
        if (e.results[i].isFinal) {
          finalText += transcriptText;
        } else {
          interim += transcriptText;
        }
      }
      if (finalText) {
        finalTranscriptRef.current += finalText;
      }
      setTranscript(finalTranscriptRef.current + interim);
    };

    recognition.onerror = (e: { error: string }) => {
      logger.error('Speech recognition error: ' + e.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, [Ctor]);

  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    finalTranscriptRef.current = '';
    setTranscript('');
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      logger.error('Failed to start speech recognition: ' + String(e));
    }
  }, []);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (e) {
      logger.error('Failed to stop speech recognition: ' + String(e));
    }
    setIsListening(false);
  }, []);

  return { isListening, transcript, supported, start, stop };
}
