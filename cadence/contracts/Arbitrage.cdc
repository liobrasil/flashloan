import FungibleToken from "./FungibleToken.cdc"
import SwapInterfaces from "./SwapInterfaces.cdc"

pub contract Arbitrage {

    pub event ReceivedFlashLoan(tokenKey:String, amount:UFix64);
    pub resource FlashLoanReceiver:SwapInterfaces.FlashLoanReceiver {
        pub fun onFlashLoan(flashLoanVault:@FungibleToken.Vault, tokenKey:String, fees:UFix64):@FungibleToken.Vault {

            emit ReceivedFlashLoan(tokenKey:tokenKey, amount:flashLoanVault.balance);
            // Add arbitrage logic here
            
                return <-flashLoanVault
            
        }
    }

    init() {
        destroy <-self.account.load<@AnyResource>(from: /storage/flashLoanReceiver);
        self.account.save(<-create FlashLoanReceiver(), to: /storage/flashLoanReceiver);
        self.account.link<&{SwapInterfaces.FlashLoanReceiver}>(/public/flashLoanReceiver, target: /storage/flashLoanReceiver);              

    }
} 