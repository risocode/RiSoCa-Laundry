
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
            // 1. Get the initial session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
                console.error("Error fetching session:", sessionError);
                setLoading(false);
                return;
            }

            setSession(session);
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            // 2. If a user exists, fetch their profile and role
            if (currentUser) {
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

                if (profileError || userError) {
                    if ((profileError && profileError.code !== 'PGRST116') || (userError && userError.code !== 'PGRST116')) {
                         console.error("Error fetching user profile or role:", profileError || userError);
                    }
                    // Even with an error, the user is technically logged in.
                    // We just don't have their profile details.
                    setProfile(null);
                } else if (profileData && userData) {
                    setProfile({
                        id: currentUser.id,
                        first_name: profileData.first_name,
                        last_name: profileData.last_name,
                        role: userData.role,
                    });
                }
            }
            
            // 3. Set loading to false only after all async operations are done
            setLoading(false);
        };
        
        fetchSessionAndProfile();

        // 4. Set up a listener for auth state changes
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (_event, newSession) => {
                setSession(newSession);
                const currentUser = newSession?.user ?? null;
                setUser(currentUser);

                // If user logs out, clear profile
                if (!currentUser) {
                    setProfile(null);
                    setLoading(false);
                    return;
                }
                
                // If user logs in, fetch their profile
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

                if (profileData && userData) {
                     setProfile({
                        id: currentUser.id,
                        first_name: profileData.first_name,
                        last_name: profileData.last_name,
                        role: userData.role,
                    });
                } else {
                     setProfile(null);
                }
                setLoading(false);
            }
        );

        return () => {
            authListener?.subscription.unsubscribe();
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

    // Render a loading state or children
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
