export const ADMIN_WALLETS = ["0x0070abeb1aa628f145232db8e2a801d3643ee3bc"];

export const isAdminWallet = (address: string): boolean => {
  return ADMIN_WALLETS.includes(address.toLowerCase());
};
