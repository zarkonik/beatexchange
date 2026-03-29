import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  deleteDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";

// ── Types ──────────────────────────────────
export type ServiceCategory =
  | "Mixing & Mastering"
  | "Beat Making"
  | "Sound Design"
  | "Vocal Recording"
  | "DJ Sets & Remixes";

export type PricingType = "fixed" | "hourly" | "both";

export interface Service {
  id?: string;
  walletAddress: string;
  title: string;
  category: ServiceCategory;
  description: string;
  pricingType: PricingType;
  fixedPrice?: number;
  hourlyRate?: number;
  deliveryDays?: number;
  portfolioUrl?: string;
  createdAt?: any;
}

export interface UserProfile {
  walletAddress: string;
  username: string;
  avatarUrl: string;
  hasAvatar?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

// ── Collection names ───────────────────────
const COLLECTION = "services";
const BANS_COLLECTION = "bannedWallets";
const USERS_COLLECTION = "users";

// ─────────────────────────────────────────
// SERVICES
// ─────────────────────────────────────────

export const postService = async (
  service: Omit<Service, "id" | "createdAt">,
): Promise<string> => {
  const cleanedService = Object.fromEntries(
    Object.entries(service).filter(([_, value]) => value !== undefined),
  );
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...cleanedService,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getAllServices = async (): Promise<Service[]> => {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as Service,
  );
};

export const getServicesByCategory = async (
  category: ServiceCategory,
): Promise<Service[]> => {
  const q = query(
    collection(db, COLLECTION),
    where("category", "==", category),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as Service,
  );
};

export const getServicesByWallet = async (
  walletAddress: string,
): Promise<Service[]> => {
  const q = query(
    collection(db, COLLECTION),
    where("walletAddress", "==", walletAddress.toLowerCase()),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as Service,
  );
};

export const getServiceById = async (id: string): Promise<Service | null> => {
  const docRef = doc(db, COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Service;
};

export const deleteService = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION, id));
};

export const getAllServicesAdmin = async (): Promise<Service[]> => {
  const snapshot = await getDocs(collection(db, COLLECTION));
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as Service,
  );
};

// ─────────────────────────────────────────
// USERS
// ─────────────────────────────────────────

export const saveUserProfile = async (
  walletAddress: string,
  username: string,
): Promise<void> => {
  const userRef = doc(db, USERS_COLLECTION, walletAddress.toLowerCase());
  const docSnap = await getDoc(userRef);

  if (docSnap.exists()) {
    await updateDoc(userRef, {
      username,
      updatedAt: serverTimestamp(),
    });
  } else {
    await setDoc(userRef, {
      walletAddress: walletAddress.toLowerCase(),
      username,
      avatarUrl: "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
};

export const getUserProfile = async (
  walletAddress: string,
): Promise<UserProfile | null> => {
  const userRef = doc(db, USERS_COLLECTION, walletAddress.toLowerCase());
  const docSnap = await getDoc(userRef);
  if (!docSnap.exists()) return null;
  return docSnap.data() as UserProfile;
};

export const getAllUserProfiles = async (): Promise<UserProfile[]> => {
  const snapshot = await getDocs(collection(db, USERS_COLLECTION));
  return snapshot.docs.map((doc) => doc.data() as UserProfile);
};

export const isUsernameTaken = async (username: string): Promise<boolean> => {
  const q = query(
    collection(db, USERS_COLLECTION),
    where("username", "==", username.toLowerCase()),
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

// ─────────────────────────────────────────
// BANS
// ─────────────────────────────────────────

export const banWallet = async (
  walletAddress: string,
  reason: string,
): Promise<void> => {
  await addDoc(collection(db, BANS_COLLECTION), {
    walletAddress: walletAddress.toLowerCase(),
    reason,
    bannedAt: serverTimestamp(),
  });
};

export const unbanWallet = async (banId: string): Promise<void> => {
  await deleteDoc(doc(db, BANS_COLLECTION, banId));
};

export const isWalletBanned = async (
  walletAddress: string,
): Promise<boolean> => {
  const q = query(
    collection(db, BANS_COLLECTION),
    where("walletAddress", "==", walletAddress.toLowerCase()),
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

export const getAllBannedWallets = async (): Promise<any[]> => {
  const snapshot = await getDocs(collection(db, BANS_COLLECTION));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// ── Avatar collection ──────────────────────
const AVATARS_COLLECTION = "avatars";

// ── Save avatar in separate collection ─────
export const saveAvatar = async (
  walletAddress: string,
  base64: string,
): Promise<void> => {
  const avatarRef = doc(db, AVATARS_COLLECTION, walletAddress.toLowerCase());
  await setDoc(avatarRef, {
    walletAddress: walletAddress.toLowerCase(),
    base64,
    updatedAt: serverTimestamp(),
  });

  // save reference in user profile
  const userRef = doc(db, USERS_COLLECTION, walletAddress.toLowerCase());
  await updateDoc(userRef, {
    hasAvatar: true,
    updatedAt: serverTimestamp(),
  });
};

// ── Get avatar ─────────────────────────────
export const getAvatar = async (
  walletAddress: string,
): Promise<string | null> => {
  const avatarRef = doc(db, AVATARS_COLLECTION, walletAddress.toLowerCase());
  const docSnap = await getDoc(avatarRef);
  if (!docSnap.exists()) return null;
  return docSnap.data().base64;
};
