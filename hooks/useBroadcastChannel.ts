import { useEffect, useState, useCallback, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface BroadcastMessage {
  type: string;
  payload: unknown;
}

interface UseBroadcastChannelOptions {
  sessionCode: string;
  onMessage: (message: BroadcastMessage) => void;
}

/**
 * Custom hook for managing Supabase Realtime broadcast channel
 * Handles connection, subscription, and message broadcasting
 */
export function useBroadcastChannel({
  sessionCode,
  onMessage,
}: UseBroadcastChannelOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Use ref to avoid re-subscribing when onMessage changes
  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!sessionCode) {
      setIsConnected(false);
      return;
    }

    const channel = supabase.channel(`session:${sessionCode}`, {
      config: {
        broadcast: {
          self: false, // Don't receive own broadcasts
          ack: false,  // Don't wait for acknowledgment (faster)
        },
      },
    });

    console.log('Subscribing to channel:', `session:${sessionCode}`);

    channel
      .on('broadcast', { event: 'message' }, ({ payload }) => {
        onMessageRef.current(payload as BroadcastMessage);
      })
      .subscribe((status) => {
        console.log('Channel status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      console.log('Unsubscribing from channel:', sessionCode);
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [sessionCode]);

  /**
   * Broadcast a message to all participants in the session
   */
  const broadcast = useCallback(
    (message: BroadcastMessage) => {
      if (!channelRef.current || !isConnected) {
        console.warn('Cannot broadcast: channel not connected');
        return;
      }

      channelRef.current.send({
        type: 'broadcast',
        event: 'message',
        payload: message,
      });
    },
    [isConnected]
  );

  return {
    broadcast,
    isConnected,
  };
}
