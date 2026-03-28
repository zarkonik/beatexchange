export const CONTRACT_ADDRESS = "0xE713b0ffFbb0f8a062Ab2dB397Bf6e8e9397dD37";

export const CONTRACT_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    name: "uploadStem",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "title", type: "string" },
      { name: "personalPrice", type: "uint256" },
      { name: "commercialPrice", type: "uint256" },
      { name: "royaltyRate", type: "uint8" },
    ],
    outputs: [],
  },
  {
    name: "buyStem",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "id", type: "uint256" },
      { name: "licenseType", type: "uint8" },
    ],
    outputs: [],
  },
  {
    name: "getStem",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "producer", type: "address" },
          { name: "title", type: "string" },
          { name: "personalPrice", type: "uint256" },
          { name: "commercialPrice", type: "uint256" },
          { name: "royaltyRate", type: "uint8" },
        ],
      },
    ],
  },
  {
    name: "stemCount",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "hasLicense",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "", type: "uint256" },
      { name: "", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "registerSong",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "title", type: "string" },
      { name: "stemIds", type: "uint256[]" },
    ],
    outputs: [],
  },
  {
    name: "StemUploaded",
    type: "event",
    inputs: [
      { name: "id", type: "uint256", indexed: true },
      { name: "producer", type: "address", indexed: true },
      { name: "title", type: "string", indexed: false },
    ],
  },
  {
    name: "LicensePurchased",
    type: "event",
    inputs: [
      { name: "licenseId", type: "uint256", indexed: true },
      { name: "stemId", type: "uint256", indexed: true },
      { name: "buyer", type: "address", indexed: true },
      { name: "licenseType", type: "uint8", indexed: false },
      { name: "pricePaid", type: "uint256", indexed: false },
    ],
  },
] as const;
