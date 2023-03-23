import FungibleToken from "../../contracts/flow_core/FungibleToken.cdc"
import BasicToken1 from "../../contracts/BasicToken1.cdc"

transaction(amount: UFix64, to: Address) {

    let sentVault: @FungibleToken.Vault

    prepare(signer: AuthAccount) {
        let vaultRef = signer.borrow<&BasicToken1.Vault>(from: BasicToken1.TokenStoragePath)
			?? panic("Could not borrow reference to the owner's Vault!")
        self.sentVault <- vaultRef.withdraw(amount: amount)
    }

    execute {

        let recipient = getAccount(to)
        let receiverRef = recipient.getCapability(BasicToken1.TokenPublicReceiverPath).borrow<&{FungibleToken.Receiver}>()
			?? panic("Could not borrow receiver reference to the recipient's Vault")
        receiverRef.deposit(from: <-self.sentVault)
    }
}
