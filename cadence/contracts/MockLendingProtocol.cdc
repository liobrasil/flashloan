import FungibleToken from "./FungibleToken.cdc"


pub contract MockLendingProtocol {

    pub let bountyFees: UFix64

    pub event PositionLiquidate(amount: UFix64, bounty: UFix64)

    pub fun liquidatePosition(id: UInt, flashLoanVault:@FungibleToken.Vault, receiverCap: Capability): @FungibleToken.Vault{
        if (id == 1){
            let positionSizeAtLiquidation = 1100000.00
            let vaultRef = self.account.borrow<&FungibleToken.Vault>(from:  /storage/BasicToken1Vault)
			                ?? panic("Could not borrow reference to the owner's Vault!")
            let sentVault <- vaultRef.withdraw(amount: positionSizeAtLiquidation)
            receiverCap.borrow()!.deposit(from: <- flashLoanVault)
        }
    }

    init() {
        self.bountyFees = 0.1
    }
}
