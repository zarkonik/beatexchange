import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const StemNFTModule = buildModule("StemNFTModule", (m) => {
  const stemNFT = m.contract("StemNFT");
  return { stemNFT };
});

export default StemNFTModule;
