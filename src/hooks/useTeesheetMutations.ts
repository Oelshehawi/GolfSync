"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  teesheetMutationOptions,
  queryKeys,
} from "~/server/query-options";
import { formatDate } from "~/lib/dates";
import toast from "react-hot-toast";

/**
 * Mutations-only hook for teesheet operations
 * Use this when you only need mutations without fetching data
 */
export function useTeesheetMutations(date: Date) {
  const dateString = formatDate(date, "yyyy-MM-dd");
  const queryClient = useQueryClient();

  // Mutations with optimistic updates for instant UI feedback
  const removeMemberMutation = useMutation({
    ...teesheetMutationOptions.removeMember(),
    onMutate: async ({ timeBlockId, memberId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.teesheets.byDate(dateString) });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(queryKeys.teesheets.byDate(dateString));

      // Optimistically update the cache
      queryClient.setQueryData(queryKeys.teesheets.byDate(dateString), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          timeBlocks: old.timeBlocks.map((block: any) =>
            block.id === timeBlockId
              ? {
                  ...block,
                  members: block.members?.filter((m: any) => m.id !== memberId) || [],
                }
              : block
          ),
        };
      });

      // Return a context with the previous data
      return { previousData };
    },
    onError: (err, variables, context) => {
      // Revert the optimistic update on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.teesheets.byDate(dateString), context.previousData);
      }
      toast.error("Failed to remove member");
    },
    onSuccess: () => {
      toast.success("Member removed successfully");
    },
    onSettled: () => {
      // Always refetch to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: queryKeys.teesheets.byDate(dateString) });
    },
  });

  const removeGuestMutation = useMutation({
    ...teesheetMutationOptions.removeGuest(),
    onMutate: async ({ timeBlockId, guestId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.teesheets.byDate(dateString) });

      const previousData = queryClient.getQueryData(queryKeys.teesheets.byDate(dateString));

      queryClient.setQueryData(queryKeys.teesheets.byDate(dateString), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          timeBlocks: old.timeBlocks.map((block: any) =>
            block.id === timeBlockId
              ? {
                  ...block,
                  guests: block.guests?.filter((g: any) => g.id !== guestId) || [],
                }
              : block
          ),
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.teesheets.byDate(dateString), context.previousData);
      }
      toast.error("Failed to remove guest");
    },
    onSuccess: () => {
      toast.success("Guest removed successfully");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teesheets.byDate(dateString) });
    },
  });

  const checkInMemberMutation = useMutation({
    ...teesheetMutationOptions.checkInMember(),
    onMutate: async ({ timeBlockId, memberId, isCheckedIn }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.teesheets.byDate(dateString) });

      const previousData = queryClient.getQueryData(queryKeys.teesheets.byDate(dateString));

      queryClient.setQueryData(queryKeys.teesheets.byDate(dateString), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          timeBlocks: old.timeBlocks.map((block: any) =>
            block.id === timeBlockId
              ? {
                  ...block,
                  members: block.members?.map((m: any) =>
                    m.id === memberId
                      ? {
                          ...m,
                          checkedIn: isCheckedIn,
                          checkedInAt: isCheckedIn ? new Date().toISOString() : null,
                        }
                      : m
                  ) || [],
                }
              : block
          ),
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.teesheets.byDate(dateString), context.previousData);
      }
      toast.error("Failed to update check-in status");
    },
    onSuccess: (_, { isCheckedIn }) => {
      const action = isCheckedIn ? "checked in" : "checked out";
      toast.success(`Member ${action} successfully`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teesheets.byDate(dateString) });
    },
  });

  const checkInGuestMutation = useMutation({
    ...teesheetMutationOptions.checkInGuest(),
    onMutate: async ({ timeBlockId, guestId, isCheckedIn }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.teesheets.byDate(dateString) });

      const previousData = queryClient.getQueryData(queryKeys.teesheets.byDate(dateString));

      queryClient.setQueryData(queryKeys.teesheets.byDate(dateString), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          timeBlocks: old.timeBlocks.map((block: any) =>
            block.id === timeBlockId
              ? {
                  ...block,
                  guests: block.guests?.map((g: any) =>
                    g.id === guestId
                      ? {
                          ...g,
                          checkedIn: isCheckedIn,
                          checkedInAt: isCheckedIn ? new Date().toISOString() : null,
                        }
                      : g
                  ) || [],
                }
              : block
          ),
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.teesheets.byDate(dateString), context.previousData);
      }
      toast.error("Failed to update check-in status");
    },
    onSuccess: (_, { isCheckedIn }) => {
      const action = isCheckedIn ? "checked in" : "checked out";
      toast.success(`Guest ${action} successfully`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teesheets.byDate(dateString) });
    },
  });

  const checkInAllParticipantsMutation = useMutation({
    ...teesheetMutationOptions.checkInAllParticipants(),
    onSuccess: (_, { isCheckedIn }) => {
      const action = isCheckedIn ? "checked in" : "checked out";
      toast.success(`All participants ${action} successfully`);
      queryClient.invalidateQueries({ queryKey: queryKeys.teesheets.byDate(dateString) });
    },
    onError: () => {
      toast.error("Failed to check in all participants");
    },
  });

  const updateNotesMutation = useMutation({
    ...teesheetMutationOptions.updateNotes(),
    onSuccess: () => {
      toast.success("Notes updated successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.teesheets.byDate(dateString) });
    },
    onError: () => {
      toast.error("Failed to update notes");
    },
  });

  const removeFillMutation = useMutation({
    ...teesheetMutationOptions.removeFill(),
    onSuccess: () => {
      toast.success("Fill removed successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.teesheets.byDate(dateString) });
    },
    onError: () => {
      toast.error("Failed to remove fill");
    },
  });

  const addMemberMutation = useMutation({
    ...teesheetMutationOptions.addMember(),
    onSuccess: () => {
      toast.success("Member added successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.teesheets.byDate(dateString) });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to add member");
    },
  });

  const addGuestMutation = useMutation({
    ...teesheetMutationOptions.addGuest(),
    onSuccess: () => {
      toast.success("Guest added successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.teesheets.byDate(dateString) });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to add guest");
    },
  });

  const addFillMutation = useMutation({
    ...teesheetMutationOptions.addFill(),
    onSuccess: () => {
      toast.success("Fill added successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.teesheets.byDate(dateString) });
    },
    onError: () => {
      toast.error("Failed to add fill");
    },
  });

  // Mutation wrapper functions for backward compatibility
  const mutations = {
    removeMember: (timeBlockId: number, memberId: number) =>
      removeMemberMutation.mutateAsync({ timeBlockId, memberId }),

    removeGuest: (timeBlockId: number, guestId: number) =>
      removeGuestMutation.mutateAsync({ timeBlockId, guestId }),

    checkInMember: (
      timeBlockId: number,
      memberId: number,
      isCheckedIn: boolean
    ) => checkInMemberMutation.mutateAsync({ timeBlockId, memberId, isCheckedIn }),

    checkInGuest: (
      timeBlockId: number,
      guestId: number,
      isCheckedIn: boolean
    ) => checkInGuestMutation.mutateAsync({ timeBlockId, guestId, isCheckedIn }),

    checkInAllParticipants: (timeBlockId: number, isCheckedIn: boolean) =>
      checkInAllParticipantsMutation.mutateAsync({ timeBlockId, isCheckedIn }),

    updateNotes: (timeBlockId: number, notes: string) =>
      updateNotesMutation.mutateAsync({ timeBlockId, notes }),

    removeFill: (timeBlockId: number, fillId: number) =>
      removeFillMutation.mutateAsync({ timeBlockId, fillId }),

    addMember: (timeBlockId: number, memberId: number) =>
      addMemberMutation.mutateAsync({ timeBlockId, memberId }),

    addGuest: (
      timeBlockId: number,
      guestId: number,
      invitingMemberId: number
    ) =>
      addGuestMutation.mutateAsync({
        timeBlockId,
        guestId,
        invitingMemberId,
      }),

    addFill: (
      timeBlockId: number,
      fillType: any,
      customName?: string
    ) => addFillMutation.mutateAsync({ timeBlockId, fillType, customName }),
  };

  // Check if any mutation is loading
  const isMutating =
    removeMemberMutation.isPending ||
    removeGuestMutation.isPending ||
    checkInMemberMutation.isPending ||
    checkInGuestMutation.isPending ||
    checkInAllParticipantsMutation.isPending ||
    updateNotesMutation.isPending ||
    removeFillMutation.isPending ||
    addMemberMutation.isPending ||
    addGuestMutation.isPending ||
    addFillMutation.isPending;

  return {
    mutations,
    isMutating,
  };
}