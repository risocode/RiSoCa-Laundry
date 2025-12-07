
'use client';

import React,
{
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode
} from 'react';
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

    useEffect(() => {
        const fetchUserProfile = async (currentUser: User) => {
            // Fetch basic profile info (name, etc.)
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('first_name, last_name')
                .eq('id', currentUser.id)
                .single();

            // Fetch role from the 'users' table
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('role')
                .eq('id', currentUser.id)
                .single();

            if (profileError || userError) {
                console.error("Error fetching user profile or role:", profileError || userError);
                return null;
            }

            return {
                id: currentUser.id,
                first_name: profileData.first_name,
                last_name: profileData.last_name,
                role: userData.role,
            };
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
        // The onAuthStateChange listener will handle setting user and profile to null
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
