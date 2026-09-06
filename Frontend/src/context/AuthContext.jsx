import {
  createContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  clearAuthData,
  getToken,
  getUser,
  setAuthData,
} from "../utils/storage";

import {
  getCurrentUser,
  loginUser,
} from "../services/auth.service";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getUser());
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(getToken())
  );

  /*
   * Verify existing session when application starts
   */
  useEffect(() => {
    const verifyAuthentication = async () => {
      const existingToken = getToken();

      if (!existingToken) {
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await getCurrentUser();

        console.log("AUTH ME RESPONSE:", response);

        // Support both:
        // { user: {...} }
        // { data: { user: {...} } }

        const payload = response?.data ?? response;

        const currentUser =
          payload?.user ??
          payload?.data?.user;

        if (!currentUser) {
          throw new Error(
            "User information not found in authentication response."
          );
        }

        setUser(currentUser);
        setIsAuthenticated(true);

        setAuthData(existingToken, currentUser);
      } catch (error) {
        console.error(
          "Authentication verification failed:",
          error
        );

        clearAuthData();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    verifyAuthentication();
  }, []);

  /*
   * Login
   */
  const login = async (email, password) => {
    const response = await loginUser(email, password);

    console.log("LOGIN RESPONSE:", response);

    const payload = response?.data ?? response;

    const receivedToken =
      payload?.token ??
      payload?.data?.token;

    const loggedInUser =
      payload?.user ??
      payload?.data?.user;

    if (!receivedToken || !loggedInUser) {
      throw new Error(
        "Invalid login response received from server."
      );
    }

    setAuthData(
      receivedToken,
      loggedInUser
    );

    setUser(loggedInUser);
    setIsAuthenticated(true);

    return {
      token: receivedToken,
      user: loggedInUser,
    };
  };

  /*
   * Logout
   */
  const logout = () => {
    clearAuthData();

    setUser(null);
    setIsAuthenticated(false);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated,
      login,
      logout,
    }),
    [
      user,
      loading,
      isAuthenticated,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};