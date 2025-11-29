import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase/firebase";
import { firebaseSignIn, firebaseSignOut, firebaseSignUp } from "../../firebase/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser) {
        localStorage.setItem("user", JSON.stringify(firebaseUser));
      } else {
        localStorage.removeItem("user");
      }
    });
    return () => unsub();
  }, []);

  const login = async (email, password) => {
    setError(null);
    const res = await firebaseSignIn(email, password);
    setUser(res.user);
    localStorage.setItem("user", JSON.stringify(res.user));
    return res.user;
  };

  const signup = async (email, password) => {
    setError(null);
    const res = await firebaseSignUp(email, password);
    setUser(res.user);
    localStorage.setItem("user", JSON.stringify(res.user));
    return res.user;
  };

  const logout = async () => {
    await firebaseSignOut();
    setUser(null);
    localStorage.removeItem("user");
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
