
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
        const fetchSessionAndProfile = async () => {
            setLoading(true);

            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                const { data: profileData, error } = await supabase
                    .from('profiles')
                    .select('id, first_name, last_name, role')
                    .eq('id', session.user.id)
                    .single();

                if (error) {
                    console.error("Error fetching user profile:", error);
                    await supabase.auth.signOut();
                } else {
                    setSession(session);
                    setUser(session.user);
                    setProfile(profileData as UserProfile);
                }
            }
            setLoading(false);
        };
        
        fetchSessionAndProfile();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (_event, newSession) => {

                if (newSession) {
                     const { data: profileData } = await supabase
                        .from('profiles')
                        .select('id, first_name, last_name, role')
                        .eq('id', newSession.user.id)
                        .single();
                    
                    setProfile(profileData as UserProfile);
                } else {
                    setProfile(null);
                }
                setSession(newSession);
                setUser(newSession?.user ?? null);
                setLoading(false);
            }
        );

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setUser(null);
        setSession(null);
        // Determine where to redirect after sign out
        if (profile?.role === 'admin') {
             router.push('/admin/login');
        } else {
            router.push('/login');
        }
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
