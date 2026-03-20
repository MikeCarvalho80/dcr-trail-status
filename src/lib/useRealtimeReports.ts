import { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import type { ConditionReport } from './conditionReports';

/**
 * Subscribes to realtime INSERT events on condition_reports for a given park.
 * Returns new reports received via the subscription (merged with any initial reports).
 */
export function useRealtimeReports(parkId: string, isActive: boolean) {
  const [realtimeReports, setRealtimeReports] = useState<ConditionReport[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase!['channel']> | null>(null);

  useEffect(() => {
    if (!isActive || !isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel(`reports:${parkId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'condition_reports',
          filter: `park_id=eq.${parkId}`,
        },
        (payload) => {
          const newReport = payload.new as ConditionReport;
          setRealtimeReports((prev) => {
            // Deduplicate by id
            if (prev.some((r) => r.id === newReport.id)) return prev;
            return [newReport, ...prev];
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase!.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setRealtimeReports([]);
    };
  }, [parkId, isActive]);

  return realtimeReports;
}
