import { UserInterface, UserDataInterface } from '../utils/Interfaces';
import { Session } from '@supabase/supabase-js';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://hopvgsttpmoofwlxhkbx.supabase.co";
const SUPABASE_KEY = "sb_publishable_1TvVZv76Cmle6-R_J8b08g_55S7cK5C";

const Supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface AuthContextInterface {
    user: UserInterface | null;
    session: Session | null | undefined;
    loading: boolean;
    logout: () => Promise<void>;
    setUser: (user: UserInterface | null) => void;
    setSession: (session: Session | null | undefined) => void;
    setLoading: () => void;
    stopLoading: () => void;
    reload: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextInterface>({
    user: null,
    session: null,
    loading: true,
    logout: async () => {},
    setUser: (user) => { },
    setSession: (session) => { },
    setLoading: () => { },
    stopLoading: () => { },
    reload: async () => { }
});

export const useAuth = () => {
    return useContext(AuthContext);
};

export default useAuth;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserInterface | null>(null);
    const [session, setSession] = useState<Session | null | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(true);

    const logout = async () => {
        setLoading(true);
        const { error } = await Supabase.auth.signOut();
        if (error) {
            console.error("Logout failed:", error);
            alert("Logout failed. Please try again");
        }
        setUser(null);
        setSession(null);
        setLoading(false);
    }

    
    const getUserData = async (session: Session): Promise<UserInterface | null> => {
        const { data, error } = await Supabase.rpc("get_user_data", { uid: session.user.id }) as { data: UserDataInterface | null, error: any };
        
        if (data) {
            var loc: { latitude: number, longitude: number } | null;
            if (data.latitude) {
                loc = {
                    latitude: data!.latitude,
                    longitude: data!.longitude!
                };
            }
            else {
                loc = null;
            }
            const user: UserInterface = {
                id: data!.user_id,
                name: data!.name,
                email: session!.user.email!,
                location: loc,
                role: data!.role
            };
            return user;
        }
        else {
            console.error("error retreiving user data");
            console.error(error);
            return null;
        }
    }
    
    useEffect(() => {
        const { data: authListener } = Supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                console.log("session changed", event, newSession);
                setSession(newSession);
            }
        );
        
        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);
    
    useEffect(() => {
        const loadUserData = async () => {
            if (session === undefined) return;
            if (!session) {
                setUser(null);
                setLoading(false);
                return;
            }
            if (user && session.user.id === user.id) {
                setLoading(false);
                return;
            }
            
            const userData = await getUserData(session);
            console.log(userData);
            setUser(userData);
            setLoading(false);
        }
        loadUserData();
    }, [session]);
    
    const reload = async () => {
        if (session === undefined || !session) return;
        setLoading(true);
        const userData = await getUserData(session);
        setUser(userData);
        setLoading(false);
    }

    return (
        <AuthContext.Provider value={{ user, session, loading, logout, setUser, setSession, setLoading: () => { setLoading(true); }, stopLoading: () => { setLoading(false); }, reload}}>
            {children}
        </AuthContext.Provider>
    );
}