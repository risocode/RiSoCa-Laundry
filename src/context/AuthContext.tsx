
'use client';

import React,
{
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode
} from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

// Define a unified user profile shape
interface UserProfile {
    id: string;
    first_name: string;
    last_name: string;
    role: 'admin' | 'customer';
}

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    session: Session | null;
    signOut: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchUserProfile = async (currentUser: User) => {
            
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('first_name, last_name')
                .eq('id', currentUser.id)
                .single();

            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('role')
                .eq('id', currentUser.id)
                .single();
            
            // If either query returns an error (e.g., profile not found), log it and return null.
            if (profileError || userError) {
                // Don't log if the error is just that the row doesn't exist, which is a valid case.
                if (profileError && profileError.code !== 'PGRST116') {
                    console.error("Error fetching user profile:", profileError);
                }
                if (userError && userError.code !== 'PGRST116') {
                    console.error("Error fetching user role:", userError);
                }
                return null;
            }

            // If we have both profile and user data, construct the full profile.
            if (profileData && userData) {
                return {
                    id: currentUser.id,
                    first_name: profileData.first_name,
                    last_name: profileData.last_name,
                    role: userData.role,
                };
            }

            return null;
        };

        const getInitialSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            
            if (currentUser) {
                const fullProfile = await fetchUserProfile(currentUser);
                setProfile(fullProfile);
            }
            setLoading(false);
        };

        getInitialSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                setSession(session);
                const currentUser = session?.user ?? null;
                setUser(currentUser);

                if (currentUser) {
                    const fullProfile = await fetchUserProfile(currentUser);
                    setProfile(fullProfile);
                } else {
                    setProfile(null);
                }
                 setLoading(false);
            }
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const value = {
        user,
        profile,
        session,
        signOut,
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
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
