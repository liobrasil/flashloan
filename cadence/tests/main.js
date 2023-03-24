import { deployContractByName, sendTransaction } from "@onflow/flow-js-testing";
import {
  getFirstDex,
  getFlashLoanUser,
  getTokensDeployer,
  toUFix64,
  readCadence,
} from "./src/common";

export const deploySwapConfig = async () => {
  const DEX1 = await getFirstDex();
  return deployContractByName({ to: DEX1, name: "SwapConfig" });
};

export const deploySwapError = async () => {
  const DEX1 = await getFirstDex();
  return deployContractByName({ to: DEX1, name: "SwapError" });
};

export const deploySwapInterfaces = async () => {
  const DEX1 = await getFirstDex();
  return deployContractByName({ to: DEX1, name: "SwapInterfaces" });
};

export const deploySwapFactory = async (account) => {
  return deployContractByName({ to: account, name: "SwapFactory" });
};
export const deploySwapRouter = async (account) => {
  return deployContractByName({ to: account, name: "SwapRouter" });
};

export const deploySwapPair = async (account) => {
  const contractCode = await readCadence("../../contracts/SwapPair.cdc");
  const contractCodeEncoded = Buffer.from(contractCode, "utf8").toString("hex");
  const code = (
    await readCadence("../../transactions/others/deploySwapPair.cdc")
  ).replace("smartContractCode", contractCodeEncoded);

  const signers = [account];
  return sendTransaction({ code, signers });
};

export const deployBasicToken1 = async () => {
  const tokensDeployer = await getTokensDeployer();
  return deployContractByName({ to: tokensDeployer, name: "BasicToken1" });
};

export const deployBasicToken2 = async () => {
  const tokensDeployer = await getTokensDeployer();
  return deployContractByName({ to: tokensDeployer, name: "BasicToken2" });
};

export const deployArbitrage = async (account) => {
  let flashLoanUser = account;
  if (!account) {
    flashLoanUser = await getFlashLoanUser();
  }
  return deployContractByName({ to: flashLoanUser, name: "Arbitrage" });
};

export const setupBasicToken1 = async (account) => {
  const name = "tokens/setupToken1";
  const signers = [account];
  return sendTransaction({ name, signers });
};

export const setupBasicToken2 = async (account) => {
  const name = "tokens/setupToken2";
  const signers = [account];
  return sendTransaction({ name, signers });
};

export const createPair = async (account) => {
  const name = "factory/createPair";
  const signers = [account];
  return sendTransaction({ name, signers });
};

export const transferToken1 = async (value, account) => {
  const tokensDeployer = await getTokensDeployer();
  const name = "tokens/sendTokens1";
  const signers = [tokensDeployer];
  const amount = toUFix64(value);
  const args = [amount, account];
  return sendTransaction({ name, args, signers });
};

export const transferToken2 = async (value, account) => {
  const tokensDeployer = await getTokensDeployer();
  const name = "tokens/sendTokens2";
  const signers = [tokensDeployer];
  const amount = toUFix64(value);
  const args = [amount, account];
  return sendTransaction({ name, args, signers });
};

export const addLiquidity = async (
  dex,
  token0Key,
  token1Key,
  token0InDesired,
  token0InMin,
  token1InDesired,
  token1InMin,
  account
) => {
  const code = await await readCadence(
    "../../transactions/pair/addLiquidity.cdc",
    dex
  );
  const signers = [account];
  const token0VaultPath = "/storage/BasicToken1Vault";
  const token1VaultPath = "/storage/BasicToken2Vault";

  const args = [
    token0Key,
    token1Key,
    token0InDesired,
    token1InDesired,
    token0InMin,
    token1InMin,
    token0VaultPath,
    token1VaultPath,
  ];
  return sendTransaction({ code, args, signers });
};

export const getFlashLoan = async (
  token0Key,
  token1Key,
  flashLoanTokenKey,
  account,
  amount
) => {
  const name = "flashLoan/getFlashLoan";
  const signers = [account];

  console.log(account?.address, account);
  const args = [token0Key, token1Key, flashLoanTokenKey, account, amount];
  return sendTransaction({ name, args, signers });
};

// NEED TO UPDATE THIS FUNCTION to include DEX as parameter
export const removeLiquidity = async (
  token0Key,
  token1Key,
  lpTokenAmount,
  account
) => {
  const name = "pair/removeLiquidity";
  const signers = [account];
  const token0VaultPath = "/storage/BasicToken1Vault";
  const token1VaultPath = "/storage/BasicToken2Vault";

  const args = [
    lpTokenAmount,
    token0Key,
    token1Key,
    token0VaultPath,
    token1VaultPath,
  ];
  return sendTransaction({ name, args, signers });
};
