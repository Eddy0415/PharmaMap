import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase/firebase";
import {
  firebaseSignIn,
  firebaseSignOut,
  firebaseSignUp,
} from "../../firebase/auth";
import { authAPI } from "../../services/api";

const AuthContext = createContext(null);

const normalizeUser = (u) => {
  if (!u) return null;
  const id = u.id || u._id || u.userId;
  return { ...u, id };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const hydrateFromBackend = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          const stored = localStorage.getItem("user");
          setUser(stored ? normalizeUser(JSON.parse(stored)) : null);
          setLoading(false);
          return;
        }
        // Refresh token from Firebase if available
        const currentUser = auth.currentUser;
        if (currentUser) {
          const fresh = await currentUser.getIdToken(true);
          localStorage.setItem("token", fresh);
        }
        const me = await authAPI.getMe();
        const backendUser = me.data.user;
        if (backendUser) {
          const normalized = normalizeUser(backendUser);
          setUser(normalized);
          localStorage.setItem("user", JSON.stringify(normalized));
          window.dispatchEvent(new Event("userUpdated"));
        }
      } catch (err) {
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };

    hydrateFromBackend();

    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      // If Firebase logs out in another tab, also clear local storage
      if (!firebaseUser && !localStorage.getItem("token")) {
        setUser(null);
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("userUpdated"));
      }
    });
    return () => unsub();
  }, []);

  const login = async (email, password) => {
    setError(null);
    const cred = await firebaseSignIn(email, password);
    const token = await cred.user.getIdToken();
    localStorage.setItem("token", token);
    const me = await authAPI.getMe();
    const backendUser = normalizeUser(me.data.user);
    setUser(backendUser);
    localStorage.setItem("user", JSON.stringify(backendUser));
    window.dispatchEvent(new Event("userUpdated"));
    return backendUser;
  };

  const signup = async (payload) => {
    setError(null);
    const { email, password, ...profile } = payload;
    const cred = await firebaseSignUp(email, password);
    const token = await cred.user.getIdToken();
    localStorage.setItem("token", token);
    await authAPI.register({
      email,
      password,
      ...profile,
    });
    const me = await authAPI.getMe();
    const backendUser = normalizeUser(me.data.user);
    setUser(backendUser);
    localStorage.setItem("user", JSON.stringify(backendUser));
    window.dispatchEvent(new Event("userUpdated"));
    return backendUser;
  };

  const logout = async () => {
    await firebaseSignOut();
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("userUpdated"));
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      login,
      signup,
      logout,
    }),
    [user, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
