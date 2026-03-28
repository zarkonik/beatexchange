export const CONTRACT_ADDRESS = "0x2059983feDe1C24676D79640F78c238EA91EB0e6";

export const CONTRACT_ABI = [
  {
    name: "uploadStem",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "title", type: "string" },
      { name: "ipfsHash", type: "string" },
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
          { name: "ipfsHash", type: "string" },
          { name: "personalPrice", type: "uint256" },
          { name: "commercialPrice", type: "uint256" },
          { name: "royaltyRate", type: "uint8" },
        ],
      },
    ],
  },
  {
    name: "stems",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "producer", type: "address" },
      { name: "title", type: "string" },
      { name: "ipfsHash", type: "string" },
      { name: "personalPrice", type: "uint256" },
      { name: "commercialPrice", type: "uint256" },
      { name: "royaltyRate", type: "uint8" },
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
    name: "getLicense",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "stemId", type: "uint256" },
      { name: "buyer", type: "address" },
    ],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "stemId", type: "uint256" },
          { name: "buyer", type: "address" },
          { name: "licenseType", type: "uint8" },
          { name: "purchasedAt", type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "StemUploaded",
    type: "event",
    anonymous: false,
    inputs: [
      { name: "id", type: "uint256", indexed: true },
      { name: "producer", type: "address", indexed: true },
      { name: "title", type: "string", indexed: false },
    ],
  },
  {
    name: "LicensePurchased",
    type: "event",
    anonymous: false,
    inputs: [
      { name: "licenseId", type: "uint256", indexed: true },
      { name: "stemId", type: "uint256", indexed: true },
      { name: "buyer", type: "address", indexed: true },
      { name: "licenseType", type: "uint8", indexed: false },
      { name: "pricePaid", type: "uint256", indexed: false },
    ],
  },
  {
    name: "SongRegistered",
    type: "event",
    anonymous: false,
    inputs: [
      { name: "songId", type: "uint256", indexed: true },
      { name: "artist", type: "address", indexed: true },
      { name: "title", type: "string", indexed: false },
    ],
  },
] as const;
