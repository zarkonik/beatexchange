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
  id?: string; // Firestore auto-generated ID
  walletAddress: string; // who posted it
  title: string; // e.g. "Professional Mix & Master"
  category: ServiceCategory;
  description: string; // full description
  pricingType: PricingType;
  fixedPrice?: number; // in USD
  hourlyRate?: number; // in USD
  deliveryDays?: number; // estimated delivery time
  portfolioUrl?: string; // optional link to work samples
  createdAt?: any; // Firebase timestamp
}

// ── Collection name ────────────────────────
const COLLECTION = "services";

export const postService = async (
  service: Omit<Service, "id" | "createdAt">,
): Promise<string> => {
  // ✅ remove undefined fields before sending to Firestore
  const cleanedService = Object.fromEntries(
    Object.entries(service).filter(([_, value]) => value !== undefined),
  );

  const docRef = await addDoc(collection(db, COLLECTION), {
    ...cleanedService,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

// ── 2. Get all services ────────────────────
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

// ── 3. Get services by category ───────────
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

// ── 4. Get services by wallet ──────────────
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

// ── 5. Get single service by ID ───────────
export const getServiceById = async (id: string): Promise<Service | null> => {
  const docRef = doc(db, COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Service;
};

// ── 6. Delete a service ────────────────────
export const deleteService = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION, id));
};
