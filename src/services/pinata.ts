const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
const PINATA_GATEWAY = import.meta.env.VITE_PINATA_GATEWAY;

export const uploadToPinata = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("pinataMetadata", JSON.stringify({ name: file.name }));
  formData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

  const response = await fetch(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    },
  );

  if (!response.ok) {
    throw new Error("Failed to upload to IPFS");
  }

  const data = await response.json();
  return data.IpfsHash;
};

export const ipfsToUrl = (cid: string): string => {
  return `${PINATA_GATEWAY}/ipfs/${cid}`;
};
// ── Unpin file from Pinata ─────────────────
export const unpinFromPinata = async (ipfsHash: string): Promise<void> => {
  const response = await fetch(
    `https://api.pinata.cloud/pinning/unpin/${ipfsHash}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_PINATA_JWT}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to unpin from Pinata");
  }
};
