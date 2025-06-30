// src/hooks/useAuditLog.ts
"use client";
import useLocalStorageState from './useLocalStorageState';
import { AuditLogEntry, AuthState, DEFAULT_AUTH_STATE, ActionType } from '@/types';
import { useCallback } from 'react';

// This provides a centralized way to log actions throughout the app.
export const useAuditLog = () => {
    // We get the setAuditLog function to append new logs.
    const [auditLog, setAuditLog] = useLocalStorageState<AuditLogEntry[]>('auditLog', []);
    
    // We get the authState to know WHO is performing the action.
    const [authState] = useLocalStorageState<AuthState>('authData', DEFAULT_AUTH_STATE);

    /**
     * Creates and saves a new audit log entry.
     * @param action - An object containing the details of the action to log.
     */
    const logAction = useCallback((action: Omit<AuditLogEntry, 'id' | 'timestamp' | 'userId' | 'username'>) => {
        // We must have a logged-in user to attribute the action to.
        if (!authState.currentUser) {
            console.warn("Audit log action skipped: No current user is logged in.");
            return;
        }

        // Construct the full log entry with timestamp, user info, etc.
        const newEntry: AuditLogEntry = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            userId: authState.currentUser.id,
            username: authState.currentUser.name,
            ...action,
        };

        // Prepend the new entry to the log array to keep it sorted by most recent.
        setAuditLog(prevLog => [newEntry, ...prevLog]);
    
    }, [authState.currentUser, setAuditLog]);

    // Return the logAction function and the full log for display purposes.
    return { logAction, auditLog };
};
