import FungibleToken from "FungibleToken"
import FlowToken from "FlowToken"

transaction() {
    prepare(signer: AuthAccount) {
        let code: String = "smartContractCode"
        signer.contracts.add(
            name: "PairName", 
            code: code.decodeHex(), 
            <-FlowToken.createEmptyVault(), 
            <-FlowToken.createEmptyVault())
    }
}

