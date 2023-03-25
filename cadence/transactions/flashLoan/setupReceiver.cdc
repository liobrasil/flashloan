import FungibleToken from "FungibleToken"
// import SwapFactory from "SwapFactory"
import SwapInterfaces from "SwapInterfaces"
import SwapConfig from "SwapConfig"
import Arbitrage from "ArbitrageAddress"

transaction {
    prepare(signer: AuthAccount) {

        let receiverResource <- Arbitrage.createReceiver();

        if signer.borrow<&Arbitrage.FlashLoanReceiverResource>(from: SwapConfig.FlashLoanReceiverStoragePath) == nil {

        destroy <-signer.load<@AnyResource>(from: SwapConfig.FlashLoanReceiverStoragePath);
        signer.save(<-receiverResource, to: SwapConfig.FlashLoanReceiverStoragePath);

        signer.link<&Arbitrage.FlashLoanReceiverResource{SwapInterfaces.FlashLoanReceiver}>(
            SwapConfig.FlashLoanReceiverPublicPath, 
            target: SwapConfig.FlashLoanReceiverStoragePath
        );

        } else {
            destroy receiverResource;
        }
    }
}