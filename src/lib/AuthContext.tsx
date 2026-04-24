import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          // Fetch or create profile
          const profileRef = doc(db, 'profiles', user.uid);
          
          // Use a timeout for the profile fetch to avoid hanging the auth state
          const profilePromise = getDoc(profileRef);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
          );
          
          const profileSnap = await Promise.race([profilePromise, timeoutPromise]) as any;
          
          if (profileSnap && profileSnap.exists()) {
            const data = profileSnap.data();
            setProfile(data);
            setIsAdmin(data?.role === 'admin');
          } else {
            // Create basic profile if it doesn't exist
            const newProfile = {
              firstName: user.displayName?.split(' ')[0] || '',
              lastName: user.displayName?.split(' ')[1] || '',
              email: user.email,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            try {
              await setDoc(profileRef, newProfile);
              setProfile(newProfile);
            } catch (e) {
              console.error('Failed to create profile:', e);
              // Fallback profile
              setProfile(newProfile);
            }
          }

          // Listen for profile changes
          if (unsubscribeProfile) unsubscribeProfile();
          unsubscribeProfile = onSnapshot(profileRef, (doc) => {
            if (doc.exists()) {
              const data = doc.data();
              setProfile(data);
              setIsAdmin(data?.role === 'admin');
            }
          }, (err) => {
            console.error('Profile snapshot error:', err);
          });

        } catch (error) {
          console.error('Error in auth state change:', error);
          // Don't block the app if profile fetch fails
          setProfile(null);
          setIsAdmin(false);
        }
      } else {
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
        setProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    }, (error) => {
      console.error('Auth state change error:', error);
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
