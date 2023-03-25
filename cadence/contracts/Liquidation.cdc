import FungibleToken from "FungibleToken"
import SwapInterfaces from "SwapInterfaces"
import MockLendingProtocol from "MockLendingProtocol"
import BasicToken1 from "BasicToken1"

pub contract Liquidation {

    pub event ReceivedFlashLoan(tokenKey:String, amount:UFix64);
    
    pub resource FlashLoanReceiver:SwapInterfaces.FlashLoanReceiver {

        pub fun onFlashLoan(flashLoanVault:@FungibleToken.Vault, tokenKey:String, fees:UFix64):@FungibleToken.Vault {
            emit ReceivedFlashLoan(tokenKey:tokenKey, amount:flashLoanVault.balance);

            // Add arbitrage, liquidation, collateral swap logic here
            let receiverCap = getAccount(self.account.addres).getCapability(BasicToken1.TokenPublicReceiverPath)
            let receiverRef = receiverCap.borrow<&{FungibleToken.Receiver}>()!
            let vault <- MockLendingProtocol.liquidatePosition(id: 1, flashLoanVault: <- flashLoanVault, receiverCap: receiverRef)
            // End of user's logic

            return <- vault
        }
    }
    
    init() {
        destroy <-self.account.load<@AnyResource>(from: /storage/flashLoanReceiver);
        self.account.save(<-create FlashLoanReceiver(), to: /storage/flashLoanReceiver);
        self.account.link<&{SwapInterfaces.FlashLoanReceiver}>(/public/flashLoanReceiver, target: /storage/flashLoanReceiver);              
    }
} 