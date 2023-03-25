
import SwapInterfaces from "SwapInterfaces"
import SwapConfig from "SwapConfig"
/// Deploy a trading pair for BasicToken1 <-> BasicToken2 if it doesn't exist; otherwise do nothing.
pub fun main(receiver:Address):Bool{

        let publicAccount = getAccount(receiver);
        if publicAccount.getCapability(SwapConfig.FlashLoanReceiverPublicPath).borrow<&{SwapInterfaces.FlashLoanReceiver}>()== nil {
            return false;
        };
        return true;
}