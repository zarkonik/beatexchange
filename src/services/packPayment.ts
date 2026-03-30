import { parseEther } from "ethers";
import type { BrowserProvider as BrowserProviderType } from "ethers";

export const purchasePack = async (
  producerAddress: string,
  priceInEth: string,
  provider: BrowserProviderType,
): Promise<string> => {
  const signer = await provider.getSigner();

  const tx = await signer.sendTransaction({
    to: producerAddress,
    value: parseEther(priceInEth),
  });

  await tx.wait();
  return tx.hash;
};
