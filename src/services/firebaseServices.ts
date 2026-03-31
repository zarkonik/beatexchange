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
  increment,
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

export type SamplePackCategory = "Sample Pack";
export type SoundbankCategory = "Soundbank";
export type PackCategory = SamplePackCategory | SoundbankCategory;

// ── Sample Pack interface ──────────────────
export interface SamplePack {
  id?: string;
  producer: string;
  title: string;
  description: string;
  category: "Sample Pack"; // ← locked to Sample Pack only
  price: string; // in ETH
  previewUrl: string; // IPFS audio preview
  fileUrl: string; // Backblaze B2 ZIP URL
  fileSize: string; // e.g. "250MB"
  fileCount: number; // number of samples in pack
  genre: string;
  bpm?: string; // e.g. "120-140"
  createdAt?: any;
}

// ── Soundbank interface ────────────────────
export interface Soundbank {
  id?: string;
  producer: string;
  title: string;
  description: string;
  category: "Soundbank"; // ← locked to Soundbank only
  price: string; // in ETH
  previewUrl: string; // IPFS audio preview
  fileUrl: string; // Backblaze B2 ZIP URL
  fileSize: string; // e.g. "500MB"
  instrument: string; // e.g. "Piano", "Synth", "Bass"
  format: string; // e.g. "VST", "Kontakt", "WAV"
  presetCount: number; // number of presets/sounds
  createdAt?: any;
}

export interface PackPurchase {
  id?: string;
  packId: string;
  buyer: string;
  producer: string;
  txHash: string;
  priceEth: string;
  purchasedAt?: any;
}

const PACKS_COLLECTION = "samplePacks";
const PURCHASES_COLLECTION = "packPurchases";

// ── Union type for both ────────────────────
export type Pack = SamplePack | Soundbank;

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

// ── Upload a sample pack listing ───────────
export const createSamplePack = async (
  pack: Omit<SamplePack, "id" | "createdAt">,
): Promise<string> => {
  const cleanedPack = Object.fromEntries(
    Object.entries(pack).filter(([_, v]) => v !== undefined),
  );
  const docRef = await addDoc(collection(db, PACKS_COLLECTION), {
    ...cleanedPack,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

// ── Get all sample packs ───────────────────
export const getAllSamplePacks = async (): Promise<SamplePack[]> => {
  const q = query(
    collection(db, PACKS_COLLECTION),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as SamplePack,
  );
};

// ── Get packs by category ──────────────────
export const getSamplePacksByCategory = async (
  category: PackCategory,
): Promise<SamplePack[]> => {
  const q = query(
    collection(db, PACKS_COLLECTION),
    where("category", "==", category),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as SamplePack,
  );
};

// ── Get packs by producer ──────────────────
export const getSamplePacksByProducer = async (
  walletAddress: string,
): Promise<SamplePack[]> => {
  const q = query(
    collection(db, PACKS_COLLECTION),
    where("producer", "==", walletAddress.toLowerCase()),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as SamplePack,
  );
};

// ── Delete a sample pack ───────────────────
export const deleteSamplePack = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, PACKS_COLLECTION, id));
};

// ── Get sample packs only ──────────────────
export const getAllSamplePacksOnly = async (): Promise<SamplePack[]> => {
  const q = query(
    collection(db, PACKS_COLLECTION),
    where("category", "==", "Sample Pack"),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as SamplePack,
  );
};

// ── Get soundbanks only ────────────────────
export const getAllSoundbanks = async (): Promise<Soundbank[]> => {
  const q = query(
    collection(db, PACKS_COLLECTION),
    where("category", "==", "Soundbank"),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as Soundbank,
  );
};

// ── Check if buyer has purchased a pack ────
export const hasPackPurchase = async (
  packId: string,
  buyer: string,
): Promise<boolean> => {
  const q = query(
    collection(db, PURCHASES_COLLECTION),
    where("packId", "==", packId),
    where("buyer", "==", buyer.toLowerCase()),
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};
// ── Record a pack purchase ─────────────────
export const recordPackPurchase = async (
  purchase: Omit<PackPurchase, "id" | "purchasedAt">,
): Promise<void> => {
  await addDoc(collection(db, PURCHASES_COLLECTION), {
    ...purchase,
    purchasedAt: serverTimestamp(),
  });
};

// ── Forum Types ────────────────────────────
export interface ForumPost {
  id?: string;
  title: string;
  content: string;
  author: string; // wallet address
  username: string;
  likes: string[]; // wallet addresses who liked
  commentCount: number;
  createdAt?: any;
}

export interface ForumComment {
  id?: string;
  postId: string;
  content: string;
  author: string; // wallet address
  username: string;
  likes: string[]; // wallet addresses who liked
  createdAt?: any;
}

// ── Collections ────────────────────────────
const POSTS_COLLECTION = "forumPosts";
const COMMENTS_COLLECTION = "forumComments";

// ── Create post ────────────────────────────
export const createForumPost = async (
  post: Omit<ForumPost, "id" | "createdAt" | "likes" | "commentCount">,
): Promise<string> => {
  const docRef = await addDoc(collection(db, POSTS_COLLECTION), {
    ...post,
    likes: [],
    commentCount: 0,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

// ── Get all posts ──────────────────────────
export const getForumPosts = async (): Promise<ForumPost[]> => {
  const q = query(
    collection(db, POSTS_COLLECTION),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as ForumPost,
  );
};

// ── Toggle like on post ────────────────────
export const togglePostLike = async (
  postId: string,
  address: string,
): Promise<void> => {
  const postRef = doc(db, POSTS_COLLECTION, postId);
  const postDoc = await getDoc(postRef);
  if (!postDoc.exists()) return;

  const likes = postDoc.data().likes as string[];
  const hasLiked = likes.includes(address.toLowerCase());

  await updateDoc(postRef, {
    likes: hasLiked
      ? likes.filter((a) => a !== address.toLowerCase())
      : [...likes, address.toLowerCase()],
  });
};

// ── Get comments for post ──────────────────
export const getPostComments = async (
  postId: string,
): Promise<ForumComment[]> => {
  const q = query(
    collection(db, COMMENTS_COLLECTION),
    where("postId", "==", postId),
    orderBy("createdAt", "asc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as ForumComment,
  );
};

// ── Create comment ─────────────────────────
export const createForumComment = async (
  comment: Omit<ForumComment, "id" | "createdAt" | "likes">,
): Promise<void> => {
  // add comment
  await addDoc(collection(db, COMMENTS_COLLECTION), {
    ...comment,
    likes: [],
    createdAt: serverTimestamp(),
  });

  // increment comment count on post
  const postRef = doc(db, POSTS_COLLECTION, comment.postId);
  await updateDoc(postRef, {
    commentCount: increment(comment.postId ? 1 : 0),
  });
};

// ── Toggle like on comment ─────────────────
export const toggleCommentLike = async (
  commentId: string,
  address: string,
): Promise<void> => {
  const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
  const commentDoc = await getDoc(commentRef);
  if (!commentDoc.exists()) return;

  const likes = commentDoc.data().likes as string[];
  const hasLiked = likes.includes(address.toLowerCase());

  await updateDoc(commentRef, {
    likes: hasLiked
      ? likes.filter((a) => a !== address.toLowerCase())
      : [...likes, address.toLowerCase()],
  });
};

// ── Delete post ────────────────────────────
export const deleteForumPost = async (postId: string): Promise<void> => {
  await deleteDoc(doc(db, POSTS_COLLECTION, postId));
};

// ── Delete comment ─────────────────────────
export const deleteForumComment = async (commentId: string): Promise<void> => {
  await deleteDoc(doc(db, COMMENTS_COLLECTION, commentId));
};

// ── Get profile by wallet ──────────────────
export const getProfileByUsername = async (
  username: string,
): Promise<UserProfile | null> => {
  const q = query(
    collection(db, USERS_COLLECTION),
    where("username", "==", username),
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return {
    id: snapshot.docs[0].id,
    ...snapshot.docs[0].data(),
  } as unknown as UserProfile;
};
