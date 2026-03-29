import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useWallet } from "./WalletContext";
import {
  getUserProfile,
  saveUserProfile,
  saveAvatar,
  getAvatar,
  isUsernameTaken,
} from "../services/firebaseServices";
import type { UserProfile } from "../services/firebaseServices";

interface UserContextType {
  profile: UserProfile | null;
  avatar: string | null;
  showUsernameModal: boolean;
  isLoadingProfile: boolean;
  saveUsername: (username: string) => Promise<string | null>;
  updateAvatar: (base64: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  profile: null,
  avatar: null,
  showUsernameModal: false,
  isLoadingProfile: true,
  saveUsername: async () => null,
  updateAvatar: async () => {},
  refreshProfile: async () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useWallet();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      loadProfile();
    } else {
      setProfile(null);
      setAvatar(null);
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

        // load avatar separately
        if (userProfile.hasAvatar) {
          const avatarBase64 = await getAvatar(address);
          setAvatar(avatarBase64);
        }
      } else {
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
    const isValid = /^[a-zA-Z0-9]{1,20}$/.test(username);
    if (!isValid)
      return "Username must be letters and numbers only, max 20 characters";

    const taken = await isUsernameTaken(username);
    if (taken) return "Username is already taken";

    await saveUserProfile(address, username);
    await loadProfile();
    setShowUsernameModal(false);
    return null;
  };

  const updateAvatar = async (base64: string): Promise<void> => {
    await saveAvatar(address, base64);
    setAvatar(base64);
  };

  const refreshProfile = async () => {
    if (isConnected && address) await loadProfile();
  };

  return (
    <UserContext.Provider
      value={{
        profile,
        avatar,
        showUsernameModal,
        isLoadingProfile,
        saveUsername,
        updateAvatar,
        refreshProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
