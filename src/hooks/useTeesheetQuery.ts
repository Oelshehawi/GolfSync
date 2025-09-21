"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  teesheetQueryOptions,
  teesheetMutationOptions,
  queryKeys,
  type TeesheetData,
} from "~/server/query-options";
import { formatDate } from "~/lib/dates";
import toast from "react-hot-toast";

/**
 * Enhanced TanStack Query hook for teesheet data with mutations
 * Replaces the old SWR-based useTeesheetData hook
 */
export function useTeesheetQuery(date: Date) {
  const dateString = formatDate(date, "yyyy-MM-dd");
  const queryClient = useQueryClient();

  // Main query for teesheet data
  const query = useQuery(teesheetQueryOptions.byDate(dateString));

  // Mutations with built-in optimistic updates and error handling
  const removeMemberMutation = useMutation({
    ...teesheetMutationOptions.removeMember(),
    onSuccess: () => {
      toast.success("Member removed successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.teesheets.byDate(dateString) });
    },
    onError: () => {
      toast.error("Failed to remove member");
    },
  });

  const removeGuestMutation = useMutation({
    ...teesheetMutationOptions.removeGuest(),
    onSuccess: () => {
      toast.success("Guest removed successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.teesheets.byDate(dateString) });
    },
    onError: () => {
      toast.error("Failed to remove guest");
    },
  });

  const checkInMemberMutation = useMutation({
    ...teesheetMutationOptions.checkInMember(),
    onSuccess: (_, { isCheckedIn }) => {
      const action = isCheckedIn ? "checked in" : "checked out";
      toast.success(`Member ${action} successfully`);
      queryClient.invalidateQueries({ queryKey: queryKeys.teesheets.byDate(dateString) });
    },
    onError: () => {
      toast.error("Failed to update check-in status");
    },
  });

  const checkInGuestMutation = useMutation({
    ...teesheetMutationOptions.checkInGuest(),
    onSuccess: (_, { isCheckedIn }) => {
      const action = isCheckedIn ? "checked in" : "checked out";
      toast.success(`Guest ${action} successfully`);
      queryClient.invalidateQueries({ queryKey: queryKeys.teesheets.byDate(dateString) });
    },
    onError: () => {
      toast.error("Failed to update check-in status");
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

    // Legacy functions for backward compatibility
    refresh: () => query.refetch(),
    revalidate: () => query.refetch(),
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
    data: query.data,
    error: query.error,
    isLoading: query.isLoading,
    isMutating,
    isError: query.isError,
    mutations,
    refetch: query.refetch,
    // Legacy properties for backward compatibility
    mutate: query.refetch,
    refresh: query.refetch,
  };
}