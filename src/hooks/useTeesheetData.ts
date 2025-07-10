"use client";

import useSWR, { mutate as globalMutate } from "swr";
import { getTeesheetDataAction } from "~/server/teesheet/actions";
import {
  removeTimeBlockMember,
  removeTimeBlockGuest,
  checkInMember,
  checkInGuest,
  checkInAllTimeBlockParticipants,
  updateTimeBlockNotes,
  removeFillFromTimeBlock,
  addFillToTimeBlock,
} from "~/server/teesheet/actions";
import { addMemberToTimeBlock } from "~/server/members/actions";
import { addGuestToTimeBlock } from "~/server/guests/actions";
import { formatDate, getBCNow } from "~/lib/dates";
import { addDays, subDays } from "date-fns";
import { useCallback } from "react";

type TeesheetData = {
  teesheet: any;
  config: any;
  timeBlocks: any[];
  availableConfigs: any[];
  paceOfPlayData: any[];
  date: string;
};

type MutationOptions = {
  optimisticUpdate?: boolean;
  revalidate?: boolean;
};

/**
 * Enhanced SWR hook with mutation functions for immediate UI updates
 */
export function useTeesheetData(date: Date) {
  const dateString = formatDate(date, "yyyy-MM-dd");

  // Create the fetcher function that calls our server action
  const fetcher = async (key: string): Promise<TeesheetData> => {
    const result = await getTeesheetDataAction(key);

    if (!result.success || !result.data) {
      throw new Error(result.error || "Failed to load teesheet data");
    }

    return result.data;
  };

  const { data, error, isLoading, mutate } = useSWR(dateString, fetcher, {
    // Performance optimizations - reduce unnecessary requests
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    refreshInterval: 0, // Disable auto-refresh to prevent background requests
    dedupingInterval: 10000, // Increased dedup interval to prevent rapid requests
    errorRetryCount: 2,
    errorRetryInterval: 1000,
    // Keep data fresh but don't be too aggressive
    focusThrottleInterval: 15000,
    // Remove onSuccess to avoid automatic prefetching
  });

  // Helper function to create optimistic updates
  const optimisticUpdate = (updater: (data: TeesheetData) => TeesheetData) => {
    if (!data) return;

    mutate(updater(data), false); // false = don't revalidate immediately
  };

  // Smart revalidation - only revalidate current date and optionally adjacent dates
  const revalidateSmartly = useCallback(
    (includeAdjacentDates = false) => {
      // Always revalidate current date
      mutate();

      // Only revalidate adjacent dates if explicitly requested (e.g., for significant changes)
      if (includeAdjacentDates) {
        const prevDate = formatDate(subDays(date, 1), "yyyy-MM-dd");
        const nextDate = formatDate(addDays(date, 1), "yyyy-MM-dd");
        globalMutate(prevDate);
        globalMutate(nextDate);
      }
    },
    [mutate, date],
  );

  // Legacy function for backward compatibility - now uses smart revalidation
  const revalidateAdjacentDates = useCallback(() => {
    revalidateSmartly(false); // Default to current date only for better performance
  }, [revalidateSmartly]);

  // Mutation functions with optimistic updates
  const mutations = {
    async removeMember(
      timeBlockId: number,
      memberId: number,
      options: MutationOptions = {},
    ) {
      // For optimistic updates, update UI immediately and skip revalidation to avoid extra requests
      if (options.optimisticUpdate && data) {
        optimisticUpdate((current) => ({
          ...current,
          timeBlocks: current.timeBlocks.map((block) =>
            block.id === timeBlockId
              ? {
                  ...block,
                  members:
                    block.members?.filter((m: any) => m.id !== memberId) || [],
                }
              : block,
          ),
        }));
      }

      const result = await removeTimeBlockMember(timeBlockId, memberId);

      // Only revalidate if optimistic update wasn't used or if explicitly requested
      if (
        result.success &&
        options.revalidate !== false &&
        !options.optimisticUpdate
      ) {
        revalidateAdjacentDates();
      }

      return result;
    },

    async removeGuest(
      timeBlockId: number,
      guestId: number,
      options: MutationOptions = {},
    ) {
      // For optimistic updates, update UI immediately and skip revalidation to avoid extra requests
      if (options.optimisticUpdate && data) {
        optimisticUpdate((current) => ({
          ...current,
          timeBlocks: current.timeBlocks.map((block) =>
            block.id === timeBlockId
              ? {
                  ...block,
                  guests:
                    block.guests?.filter((g: any) => g.id !== guestId) || [],
                }
              : block,
          ),
        }));
      }

      const result = await removeTimeBlockGuest(timeBlockId, guestId);

      // Only revalidate if optimistic update wasn't used or if explicitly requested
      if (
        result.success &&
        options.revalidate !== false &&
        !options.optimisticUpdate
      ) {
        revalidateAdjacentDates();
      }

      return result;
    },

    async checkInMember(
      timeBlockId: number,
      memberId: number,
      isCheckedIn: boolean,
      options: MutationOptions = {},
    ) {
      if (options.optimisticUpdate && data) {
        optimisticUpdate((current) => ({
          ...current,
          timeBlocks: current.timeBlocks.map((block) =>
            block.id === timeBlockId
              ? {
                  ...block,
                  members:
                    block.members?.map((m: any) =>
                      m.id === memberId ? { ...m, checkedIn: isCheckedIn } : m,
                    ) || [],
                }
              : block,
          ),
        }));
      }

      const result = await checkInMember(timeBlockId, memberId, isCheckedIn);

      // Only revalidate if optimistic update wasn't used
      if (
        result.success &&
        options.revalidate !== false &&
        !options.optimisticUpdate
      ) {
        revalidateAdjacentDates();
      }

      return result;
    },

    async checkInGuest(
      timeBlockId: number,
      guestId: number,
      isCheckedIn: boolean,
      options: MutationOptions = {},
    ) {
      if (options.optimisticUpdate && data) {
        optimisticUpdate((current) => ({
          ...current,
          timeBlocks: current.timeBlocks.map((block) =>
            block.id === timeBlockId
              ? {
                  ...block,
                  guests:
                    block.guests?.map((g: any) =>
                      g.id === guestId ? { ...g, checkedIn: isCheckedIn } : g,
                    ) || [],
                }
              : block,
          ),
        }));
      }

      const result = await checkInGuest(timeBlockId, guestId, isCheckedIn);

      // Only revalidate if optimistic update wasn't used
      if (
        result.success &&
        options.revalidate !== false &&
        !options.optimisticUpdate
      ) {
        revalidateAdjacentDates();
      }

      return result;
    },

    async checkInAll(timeBlockId: number, options: MutationOptions = {}) {
      // The calling code needs to determine whether to check in or out
      // and pass the isCheckedIn parameter
      console.warn(
        "checkInAll mutation called without isCheckedIn parameter. Use checkInAllParticipants instead.",
      );

      // Default to checking in for backward compatibility
      return this.checkInAllParticipants(timeBlockId, true, options);
    },

    async checkInAllParticipants(
      timeBlockId: number,
      isCheckedIn: boolean,
      options: MutationOptions = {},
    ) {
      if (options.optimisticUpdate && data) {
        optimisticUpdate((current) => ({
          ...current,
          timeBlocks: current.timeBlocks.map((block) =>
            block.id === timeBlockId
              ? {
                  ...block,
                  members:
                    block.members?.map((m: any) => ({
                      ...m,
                      checkedIn: isCheckedIn,
                      checkedInAt: isCheckedIn
                        ? getBCNow().toISOString()
                        : null,
                    })) || [],
                  guests:
                    block.guests?.map((g: any) => ({
                      ...g,
                      checkedIn: isCheckedIn,
                      checkedInAt: isCheckedIn
                        ? getBCNow().toISOString()
                        : null,
                    })) || [],
                }
              : block,
          ),
        }));
      }

      const result = await checkInAllTimeBlockParticipants(
        timeBlockId,
        isCheckedIn,
      );

      // Only revalidate if optimistic update wasn't used
      if (
        result.success &&
        options.revalidate !== false &&
        !options.optimisticUpdate
      ) {
        revalidateAdjacentDates();
      }

      return result;
    },

    async updateNotes(
      timeBlockId: number,
      notes: string,
      options: MutationOptions = {},
    ) {
      if (options.optimisticUpdate && data) {
        optimisticUpdate((current) => ({
          ...current,
          timeBlocks: current.timeBlocks.map((block) =>
            block.id === timeBlockId ? { ...block, notes } : block,
          ),
        }));
      }

      const result = await updateTimeBlockNotes(timeBlockId, notes);

      // Only revalidate if optimistic update wasn't used
      if (
        result.success &&
        options.revalidate !== false &&
        !options.optimisticUpdate
      ) {
        revalidateAdjacentDates();
      }

      return result;
    },

    async removeFill(
      timeBlockId: number,
      fillId: number,
      options: MutationOptions = {},
    ) {
      if (options.optimisticUpdate && data) {
        optimisticUpdate((current) => ({
          ...current,
          timeBlocks: current.timeBlocks.map((block) =>
            block.id === timeBlockId
              ? {
                  ...block,
                  fills: block.fills?.filter((f: any) => f.id !== fillId) || [],
                }
              : block,
          ),
        }));
      }

      const result = await removeFillFromTimeBlock(timeBlockId, fillId);

      // Only revalidate if optimistic update wasn't used
      if (
        result.success &&
        options.revalidate !== false &&
        !options.optimisticUpdate
      ) {
        revalidateAdjacentDates();
      }

      return result;
    },

    async addMember(
      timeBlockId: number,
      memberId: number,
      options: MutationOptions = {},
    ) {
      const result = await addMemberToTimeBlock(timeBlockId, memberId);

      if (result.success) {
        // For add operations, we need fresh data from server since we don't have full member details
        // for optimistic updates, so always revalidate but only current date
        if (options.revalidate !== false) {
          revalidateAdjacentDates();
        }
      }

      return result;
    },

    async addGuest(
      timeBlockId: number,
      guestId: number,
      invitingMemberId: number,
      options: MutationOptions = {},
    ) {
      const result = await addGuestToTimeBlock(
        timeBlockId,
        guestId,
        invitingMemberId,
      );

      if (result.success) {
        // For add operations, we need fresh data from server since we don't have full guest details
        // for optimistic updates, so always revalidate but only current date
        if (options.revalidate !== false) {
          revalidateAdjacentDates();
        }
      }

      return result;
    },

    async addFill(
      timeBlockId: number,
      fillType: string,
      customName?: string,
      options: MutationOptions = {},
    ) {
      if (options.optimisticUpdate && data) {
        // Create a temporary fill for optimistic update
        const tempFill = {
          id: Date.now(), // Temporary ID
          fillType,
          customName,
        };

        optimisticUpdate((current) => ({
          ...current,
          timeBlocks: current.timeBlocks.map((block) =>
            block.id === timeBlockId
              ? {
                  ...block,
                  fills: [...(block.fills || []), tempFill],
                }
              : block,
          ),
        }));
      }

      const result = await addFillToTimeBlock(
        timeBlockId,
        fillType as any,
        1,
        customName,
      );

      // Always revalidate for add fill to get the real ID and data from server
      if (result.success && options.revalidate !== false) {
        revalidateAdjacentDates();
      }

      return result;
    },

    // Force refresh function
    refresh: () => revalidateAdjacentDates(),

    // Revalidate function for external components
    revalidate: async () => {
      await mutate();
    },
  };

  return {
    data,
    error,
    isLoading,
    mutate,
    mutations,
    refresh: () => mutate(),
  };
}
