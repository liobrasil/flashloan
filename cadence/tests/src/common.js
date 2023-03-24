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
export const getTokensDeployer = () => getAccountAddress("TokensDeployer");

// ========================== Utils ===========================================
export const readCadence = async (filePath) => {
  let fileObject = fs
    .readFileSync(path.join(__dirname, filePath), "utf8")
    .replace(
      '"FungibleToken"',
      "0x" + emulatorConfig.contracts.FungibleToken.aliases.emulator
    )
    .replace(
      '"FlowToken"',
      "0x" + emulatorConfig.contracts.FlowToken.aliases.emulator
    )
    .replace('"SwapInterfaces"', await getFirstDex())
    .replace('"SwapConfig"', await getFirstDex())
    .replace('"SwapError"', await getFirstDex())
    .replace('"SwapFactory"', await getFirstDex())
    .replace('"SwapRouter"', await getFirstDex())
    .replace('"SwapPair"', await getFirstDex())
    .replace('"SwapPairContract"', '"SwapPair"') //work around to deploy contract only
    .replace('"BasicToken1"', await getTokensDeployer())
    .replace('"BasicToken2"', await getTokensDeployer());

  return fileObject;
};