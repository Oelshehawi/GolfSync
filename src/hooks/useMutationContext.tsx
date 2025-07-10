"use client";

import React, { createContext, useContext } from "react";

interface MutationContextType {
  removeMember?: (
    timeBlockId: number,
    memberId: number,
    options?: any,
  ) => Promise<any>;
  removeGuest?: (
    timeBlockId: number,
    guestId: number,
    options?: any,
  ) => Promise<any>;
  checkInMember?: (
    timeBlockId: number,
    memberId: number,
    isCheckedIn: boolean,
    options?: any,
  ) => Promise<any>;
  checkInGuest?: (
    timeBlockId: number,
    guestId: number,
    isCheckedIn: boolean,
    options?: any,
  ) => Promise<any>;
  checkInAll?: (timeBlockId: number, options?: any) => Promise<any>;
  checkInAllParticipants?: (
    timeBlockId: number,
    isCheckedIn: boolean,
    options?: any,
  ) => Promise<any>;
  updateNotes?: (
    timeBlockId: number,
    notes: string,
    options?: any,
  ) => Promise<any>;
  removeFill?: (
    timeBlockId: number,
    fillId: number,
    options?: any,
  ) => Promise<any>;
  refresh?: () => void;
  // Add more mutation functions as needed
  addMember?: (
    timeBlockId: number,
    memberId: number,
    options?: any,
  ) => Promise<any>;
  addGuest?: (
    timeBlockId: number,
    guestId: number,
    invitingMemberId: number,
    options?: any,
  ) => Promise<any>;
  addFill?: (
    timeBlockId: number,
    fillType: string,
    customName?: string,
    options?: any,
  ) => Promise<any>;
}

const MutationContext = createContext<MutationContextType>({});

export function useMutationContext() {
  return useContext(MutationContext);
}

interface MutationProviderProps {
  children: React.ReactNode;
  mutations: MutationContextType;
}

export function MutationProvider({
  children,
  mutations,
}: MutationProviderProps) {
  return (
    <MutationContext.Provider value={mutations}>
      {children}
    </MutationContext.Provider>
  );
}
