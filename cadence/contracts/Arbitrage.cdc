import FungibleToken from "FungibleToken"
import SwapInterfaces from "SwapInterfaces"
import SwapRouter1 from "SwapRouter1"
import SwapRouter2 from "SwapRouter2"
import SwapConfig from "SwapConfig"
pub contract Arbitrage {

    pub event ReceivedFlashLoan(tokenKey:String, amount:UFix64);
    
    pub resource FlashLoanReceiverResource:SwapInterfaces.FlashLoanReceiver {
        pub fun onFlashLoan(flashLoanVault:@FungibleToken.Vault, tokenKey:String, fees:UFix64):@FungibleToken.Vault {

            emit ReceivedFlashLoan(tokenKey:tokenKey, amount:flashLoanVault.balance);
            // Add arbitrage, liquidation, collateral swap logic here

            let vaultOut1 <- SwapRouter1.swapExactTokensForTokens(
                exactVaultIn: <-flashLoanVault,
                amountOutMin: 0.0,
                tokenKeyPath: ["A.0x120e725050340cab.BasicToken2","A.0x120e725050340cab.BasicToken1"],
                deadline: 100000000.0
            )

            let vaultOut2 <- SwapRouter2.swapExactTokensForTokens(
                exactVaultIn: <-vaultOut1,
                amountOutMin: 0.0,
                tokenKeyPath: ["A.0x120e725050340cab.BasicToken1", "A.0x120e725050340cab.BasicToken2"],
                deadline: 100000000.0
            )

            log(vaultOut2.balance)
            // End of user's logic
            return <-vaultOut2
            // return <-flashLoanVault;
        }
    }

    init() {
        destroy <-self.account.load<@AnyResource>(from: SwapConfig.FlashLoanReceiverStoragePath);
        self.account.save(<-create FlashLoanReceiverResource(), to: SwapConfig.FlashLoanReceiverStoragePath);
        self.account.link<&Arbitrage.FlashLoanReceiverResource{SwapInterfaces.FlashLoanReceiver}>(SwapConfig.FlashLoanReceiverPublicPath, target: SwapConfig.FlashLoanReceiverStoragePath);              
    }
} 