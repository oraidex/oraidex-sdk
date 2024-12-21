export const supportedBridge = {
  Oraichain: {
    "oraichain-token": ["0x38", "0x01", "injective-1"],
    pepe: ["0x38", "0x01"],
    cosmos: ["cosmoshub-4"],
    neutaro: ["Neutaro-1"],
    airight: ["0x38"],
    tether: ["0x38", "0x2b6653dc", "0x01"],
    "usd-coin": ["0x01", "noble-1"],
    osmosis: ["osmosis-1"],
    "kawaii-islands": ["0x38"],
    "milky-token": ["0x38"],
    oraidex: ["0x01"],
    scorai: [],
    tron: ["0x2b6653dc"],
    scatom: [],
    "injective-protocol": ["injective-1"],
    weth: ["0x01"],
    bitcoin: ["bitcoin"],
    och: ["0x01"],
    "the-open-network": [],
    "hamster-kombat": []
  },
  celestia: {
    celestia: []
  },
  "oraibridge-subnet-2": {
    undefined: [],
    "oraichain-token": [],
    "usd-coin": [],
    airight: [],
    tether: [],
    tron: [],
    "kawaii-islands": [],
    "milky-token": [],
    weth: [],
    och: [],
    oraidex: [],
    pepe: []
  },
  "osmosis-1": {
    osmosis: ["Oraichain"],
    cosmos: [],
    "oraichain-token": [],
    celestia: [],
    "injective-protocol": []
  },
  "injective-1": {
    "injective-protocol": ["Oraichain"],
    "oraichain-token": ["Oraichain"]
  },
  "cosmoshub-4": {
    cosmos: ["Oraichain"]
  },
  "Neutaro-1": {
    neutaro: ["Oraichain"]
  },
  "noble-1": {
    "usd-coin": ["Oraichain"]
  },
  "0x01": {
    "oraichain-token": ["Oraichain"],
    "usd-coin": ["Oraichain"],
    weth: ["Oraichain"],
    ethereum: ["Oraichain"],
    tether: ["Oraichain"],
    och: ["Oraichain"],
    oraidex: ["Oraichain"],
    pepe: ["Oraichain"]
  },
  "0x2b6653dc": {
    tether: ["Oraichain"],
    tron: ["Oraichain"]
  },
  "0x38": {
    "oraichain-token": ["Oraichain"],
    airight: ["Oraichain"],
    tether: ["Oraichain"],
    "kawaii-islands": ["Oraichain"],
    "milky-token": ["Oraichain"],
    wbnb: ["Oraichain"],
    binancecoin: ["Oraichain"],
    pepe: ["Oraichain"]
  }
};
