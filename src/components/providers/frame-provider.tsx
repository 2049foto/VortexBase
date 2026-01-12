'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import sdk from '@farcaster/frame-sdk';

interface FrameContextValue {
  isFrameLoaded: boolean;
  isInFrame: boolean;
  context: Awaited<ReturnType<typeof sdk.context>> | null;
  user: {
    fid?: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  } | null;
  ready: () => void;
  close: () => void;
  openUrl: (url: string) => void;
}

const FrameContext = createContext<FrameContextValue>({
  isFrameLoaded: false,
  isInFrame: false,
  context: null,
  user: null,
  ready: () => {},
  close: () => {},
  openUrl: () => {},
});

export function useFrame() {
  const context = useContext(FrameContext);
  if (!context) {
    throw new Error('useFrame must be used within a FrameProvider');
  }
  return context;
}

interface FrameProviderProps {
  children: ReactNode;
}

export function FrameProvider({ children }: FrameProviderProps) {
  const [isFrameLoaded, setIsFrameLoaded] = useState(false);
  const [isInFrame, setIsInFrame] = useState(false);
  const [context, setContext] = useState<Awaited<ReturnType<typeof sdk.context>> | null>(null);
  const [user, setUser] = useState<FrameContextValue['user']>(null);

  useEffect(() => {
    const initFrame = async () => {
      try {
        // Check if we're in a Farcaster Frame
        const frameContext = await sdk.context;
        
        if (frameContext) {
          setIsInFrame(true);
          setContext(frameContext);
          
          // Extract user info
          if (frameContext.user) {
            setUser({
              fid: frameContext.user.fid,
              username: frameContext.user.username,
              displayName: frameContext.user.displayName,
              pfpUrl: frameContext.user.pfpUrl,
            });
          }
        }
        
        setIsFrameLoaded(true);
      } catch (error) {
        // Not in a frame, that's okay
        setIsFrameLoaded(true);
        setIsInFrame(false);
      }
    };

    initFrame();
  }, []);

  const ready = () => {
    if (isInFrame) {
      sdk.actions.ready();
    }
  };

  const close = () => {
    if (isInFrame) {
      sdk.actions.close();
    }
  };

  const openUrl = (url: string) => {
    if (isInFrame) {
      sdk.actions.openUrl(url);
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <FrameContext.Provider
      value={{
        isFrameLoaded,
        isInFrame,
        context,
        user,
        ready,
        close,
        openUrl,
      }}
    >
      {children}
    </FrameContext.Provider>
  );
}
