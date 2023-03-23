import FungibleToken from "../contracts/flow_core/FungibleToken.cdc"
import FlowToken from "../contracts/flow_core/FlowToken.cdc"

transaction(code: String) {
    prepare(signer: AuthAccount) {
        signer.contracts.add(
            name: "SwapPair", 
            code: code.decodeHex(), 
            <-FlowToken.createEmptyVault(), 
            <-FlowToken.createEmptyVault())
    }
}

