import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useWallet } from "./WalletContext";
import {
  getUserProfile,
  saveUserProfile,
  isUsernameTaken,
} from "../services/firebaseServices";
import type { UserProfile } from "../services/firebaseServices";

// ── Context shape ──────────────────────────
interface UserContextType {
  profile: UserProfile | null;
  showUsernameModal: boolean;
  isLoadingProfile: boolean;
  saveUsername: (username: string) => Promise<string | null>;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  profile: null,
  showUsernameModal: false,
  isLoadingProfile: true,
  saveUsername: async () => null,
  refreshProfile: async () => {},
});

// ── Provider ───────────────────────────────
export function UserProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useWallet();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // load profile when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      loadProfile();
    } else {
      setProfile(null);
      setShowUsernameModal(false);
    }
  }, [isConnected, address]);

  const loadProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const userProfile = await getUserProfile(address);

      if (userProfile) {
        setProfile(userProfile);
        setShowUsernameModal(false);
      } else {
        // first time connecting — show username modal
        setProfile(null);
        setShowUsernameModal(true);
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const saveUsername = async (username: string): Promise<string | null> => {
    // validate format — letters and numbers only, max 20 chars
    const isValid = /^[a-zA-Z0-9]{1,20}$/.test(username);
    if (!isValid)
      return "Username must be letters and numbers only, max 20 characters";

    // check if taken
    const taken = await isUsernameTaken(username);
    if (taken) return "Username is already taken";

    // save to Firebase
    await saveUserProfile(address, username);
    await loadProfile();
    setShowUsernameModal(false);
    return null; // null means no error
  };

  const refreshProfile = async () => {
    if (isConnected && address) await loadProfile();
  };

  return (
    <UserContext.Provider
      value={{
        profile,
        showUsernameModal,
        isLoadingProfile,
        saveUsername,
        refreshProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

// ── Custom hook ────────────────────────────
export function useUser() {
  return useContext(UserContext);
}
