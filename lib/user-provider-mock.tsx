"use client"

import React, { createContext, useContext } from 'react'

type UserContextType = {
  session: {
    user?: { id: string };
    access_token?: string;
  } | null;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType>({
  session: null,
  isLoading: true,
})

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <UserContext.Provider value={{ session: null, isLoading: false }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
} 