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
        setProfileLoading(true);

        if (isUserLoading || !firestore) {
            return;
        }

        if (!user) {
            setProfile(null);
            setProfileLoading(false);
            return;
        }
        
        const profileDocRef = doc(firestore, 'users', user.uid);
        const unsubscribe = onSnapshot(profileDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setProfile(docSnap.data() as UserProfile);
            } else {
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
