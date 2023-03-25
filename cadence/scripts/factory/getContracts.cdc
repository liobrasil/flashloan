
pub fun main(dexAddress:Address):[String] {
        let contracts:[String] = getAccount(dexAddress).contracts.names;
        return contracts;

}