import { config } from "@onflow/fcl";



// FOR EMULATOR

config()
.put("accessNode.api", "http://localhost:8888")    // Point App at Emulator
.put("app.detail.title", "Flash Loan") // Will be the title when user clicks on wallet
.put("discovery.wallet", "http://localhost:8701/fcl/authn")  // Point FCL at dev-wallet (default port)





// FOR TESTNET

// config()
//   .put("accessNode.api", "https://rest-testnet.onflow.org") // This connects us to Flow TestNet
//   .put("discovery.wallet", "https://fcl-discovery.onflow.org/testnet/authn/") // Allows us to connect to Blocto & Lilico Wallet
//   .put("app.detail.title", "Duck DApp") // Will be the title when user clicks on wallet
//   .put("app.detail.icon", ""); // Will be the icon when user clicks on wallet
