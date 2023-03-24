import BasicToken1 from "BasicToken1"
import BasicToken2 from "BasicToken2"

/// Pair creator needs to pay the deployment fee of 0.001 Flow.
import FlowToken from "FlowToken"
import SwapFactory from "SwapFactory"

/// Deploy a trading pair for BasicToken1 <-> BasicToken2 if it doesn't exist; otherwise do nothing.
transaction() {
    prepare(deployer: AuthAccount) {
        let token0Vault <- BasicToken1.createEmptyVault()
        let token1Vault <- BasicToken2.createEmptyVault()

        /// 'A.0xADDRESS.TokenName.Vault'
        var token0Key = token0Vault.getType().identifier
        /// Get token0 identifier
        token0Key = token0Key.slice(from: 0, upTo: token0Key.length - 6)
        var token1Key = token1Vault.getType().identifier
        token1Key = token1Key.slice(from: 0, upTo: token1Key.length - 6)
        /// Check whether pair has already existed or not.
        let pairAddress = SwapFactory.getPairAddress(token0Key: token0Key, token1Key: token1Key)
    
        if (pairAddress == nil) {
            let flowVaultRef = deployer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)!
            assert(flowVaultRef.balance >= 0.002, message: "Insufficient balance to create pair, minimum balance requirement: 0.002 flow")
            let fee <- flowVaultRef.withdraw(amount: 0.001)
            SwapFactory.createPair(token0Vault: <-token0Vault, token1Vault: <-token1Vault, accountCreationFee: <-fee)
        } else {
            /// Pair already exists
            destroy token0Vault
            destroy token1Vault
        }
    }
}