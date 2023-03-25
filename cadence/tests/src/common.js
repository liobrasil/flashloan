import fs from "fs";
import path from "path";
import { getAccountAddress } from "@onflow/flow-js-testing";
import * as emulatorConfig from "../../../flow.json";

const UFIX64_PRECISION = 8;

// UFix64 values shall be always passed as strings
export const toUFix64 = (value) => value.toFixed(UFIX64_PRECISION).toString();

export const toOptionalUFix64 = (value) => {
  if (value == null) {
    return value;
  }

  return toUFix64(value);
};

// ========================== Accounts ===========================================

export const getFirstDex = () => getAccountAddress("DEX1");
export const getSecondDex = () => getAccountAddress("DEX2");
export const getFlashLoanProvider = () =>
  getAccountAddress("flashLoanProvider");
export const getTokensDeployer = () => getAccountAddress("TokensDeployer");
export const getFlashLoanUser = () => getAccountAddress("FlashLoanUser");
export const getAlice = () => getAccountAddress("Alice");
export const getBob = () => getAccountAddress("Bob");
export const getCharlie = () => getAccountAddress("Charlie");

// ========================== Utils ===========================================
export const readCadence = async (filePath, account, skip = false) => {
  let DEX = account;
  if (!account) {
    DEX = await getFirstDex();
  }
  let DEX1 = await getFirstDex();
  let DEX2 = await getSecondDex();
  let FlashLoanProvider = await getFlashLoanProvider();
  let flashLoanUser = await getFlashLoanUser();

  let fileObject = fs
    .readFileSync(path.join(__dirname, filePath), "utf8")
    .replace(
      '"FungibleToken"',
      "0x" + emulatorConfig.contracts.FungibleToken.aliases.emulator
    )
    .replace(
      '"FlowToken"',
      "0x" + emulatorConfig.contracts.FlowToken.aliases.emulator
    );

    if (account==DEX1 && !skip) {
      // console.log("dex1");
      fileObject = fileObject
      .replaceAll("SwapFactory", "SwapFactory1").
      replaceAll("SwapPair", "SwapPair1")
      .replaceAll("SwapRouter", "SwapRouter1");
    } 
    if (account==DEX2 && !skip){
      // console.log("2");
      fileObject = fileObject
      .replaceAll("SwapFactory", "SwapFactory2")
      .replaceAll("SwapPair", "SwapPair2")
      .replaceAll("SwapRouter", "SwapRouter2");
    } 

    if (account==FlashLoanProvider && !skip){
      // console.log("3");
      fileObject = fileObject
      .replaceAll("SwapFactory", "SwapFactory3")
      .replaceAll("SwapPair", "SwapPair3")
      .replaceAll("SwapRouter", "SwapRouter3");
    } 

    fileObject = fileObject
    .replace('"SwapInterfaces"', DEX)
    .replace('"SwapConfig"', DEX)
    .replace('"SwapError"', DEX)
    .replace('"SwapFactory"', DEX)
    .replace('"SwapFactory1"', DEX1)
    .replace('"SwapFactory2"', DEX2)
    .replace('"SwapFactory3"', FlashLoanProvider)
    .replace('"SwapPair1"', DEX1)
    .replace('"SwapPair2"', DEX2)
    .replace('"SwapPair3"', FlashLoanProvider)
    .replace('"SwapRouter1"', DEX1)
    .replace('"SwapRouter2"', DEX2)
    .replace('"SwapRouter3"', FlashLoanProvider)
    .replace('"ArbitrageAddress"', flashLoanUser)
    .replace('"SwapPair"', DEX)
    .replace('"BasicToken1"', await getTokensDeployer())
    .replace('"BasicToken2"', await getTokensDeployer());

  return fileObject;
};
