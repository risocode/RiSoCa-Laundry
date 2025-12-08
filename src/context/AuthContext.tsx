'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface UserProfile {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: 'admin' | 'customer';
}

interface AuthContextType {
    profile: UserProfile | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);

    useEffect(() => {
        if (isUserLoading || !firestore) {
            // We can't do anything until we know if a user is logged in
            // and we have a firestore instance.
            setProfileLoading(true);
            return;
        }

        if (!user) {
            // User is not logged in, so there's no profile to fetch.
            setProfile(null);
            setProfileLoading(false);
            return;
        }
        
        // At this point, we have a user and firestore, so we can fetch the profile.
        setProfileLoading(true);
        const profileDocRef = doc(firestore, 'users', user.uid);
        const unsubscribe = onSnapshot(profileDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setProfile(docSnap.data() as UserProfile);
            } else {
                // This case can happen if a user is authenticated but their profile doc hasn't been created yet.
                setProfile(null);
            }
            setProfileLoading(false);
        }, (error) => {
            console.error("Error fetching user profile:", error);
            setProfile(null);
            setProfileLoading(false);
        });

        return () => unsubscribe();
    }, [user, isUserLoading, firestore]);

    // The overall loading state is true if we are still checking the auth state OR fetching the profile.
    const isLoading = isUserLoading || profileLoading;

    return (
        <AuthContext.Provider value={{ profile, loading: isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
