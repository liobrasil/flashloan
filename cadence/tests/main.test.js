import path from "path";

import {
  emulator,
  init,
  getAccountAddress,
  shallPass,
  shallResolve,
  shallRevert,
  mintFlow,
} from "@onflow/flow-js-testing";

import {
  toUFix64,
  getFirstDex,
  getSecondDex,
  getTokensDeployer,
} from "./src/common";

import {
  deployBasicToken1,
  deployBasicToken2,
  deploySwapConfig,
  deploySwapError,
  deploySwapInterfaces,
  deploySwapFactory,
  deploySwapRouter,
  deploySwapPair,
  setupBasicToken1,
  setupBasicToken2,
  createPair,
  addLiquidity,
  removeLiquidity,
  transferToken1,
  transferToken2,
} from "./main";

describe("Deployment", () => {
  beforeEach(async () => {
    const basePath = path.resolve(__dirname, "../");
    const emulatorOptions = {
      logging: true,
    };

    await init(basePath);
    await emulator.start(emulatorOptions);
  });

  afterEach(async () => {
    await emulator.stop();
  });

  it("shall deploy all contracts", async () => {
    const DEX1 = await getFirstDex();
    await mintFlow(DEX1, "10.0");
    await shallPass(deployBasicToken1());
    await shallPass(deployBasicToken2());
    await shallPass(deploySwapConfig());
    await shallPass(deploySwapError());
    await shallPass(deploySwapInterfaces());
    await shallPass(deploySwapFactory());
    await shallPass(deploySwapRouter());
    await shallPass(deploySwapPair());
  });
});

describe("DEX functions", () => {
  beforeEach(async () => {
    const basePath = path.resolve(__dirname, "../");
    const emulatorOptions = {
      logging: true,
    };

    await init(basePath);
    await emulator.start(emulatorOptions);

    const DEX1 = await getFirstDex();
    await mintFlow(DEX1, "10.0");
    await deployBasicToken1();
    await deployBasicToken2();
    await deploySwapConfig();
    await deploySwapError();
    await deploySwapInterfaces();
    await deploySwapFactory();
    await deploySwapRouter();
    await deploySwapPair();
  });

  afterEach(async () => {
    await emulator.stop();
  });

  it("user can create a pair", async () => {
    const Alice = await getAccountAddress("Alice");
    await mintFlow(Alice, "10.0");
    await shallPass(createPair(Alice));
  });

  it("user can add liquidity", async () => {
    const Alice = await getAccountAddress("Alice");
    await mintFlow(Alice, "10.0");
    let [txResult] = await createPair(Alice);
    let data = txResult.events[10].data;
    console.log("-----data", data);
    console.log("-----Pair Address: ", data.pairAddress);

    //Setup BasicTokens collection
    await shallPass(setupBasicToken1(Alice));
    await shallPass(setupBasicToken2(Alice));

    //Transfer tokens from minter to Alice
    await shallPass(transferToken1(1000, Alice));
    await shallPass(transferToken2(1000, Alice));

    const amountToken0 = 100;
    const amountToken0Min = 99;
    const amountToken1 = 100;
    const amountToken1Min = 99;

    await shallPass(
      addLiquidity(
        data.token0Key,
        data.token1Key,
        amountToken0,
        amountToken0Min,
        amountToken1,
        amountToken1Min,
        Alice
      )
    );
  });

  it("user can remove liquidity", async () => {
    const Alice = await getAccountAddress("Alice");
    await mintFlow(Alice, "10.0");
    let [txResult] = await createPair(Alice);
    let data = txResult.events[10].data;
    //Setup BasicTokens collection
    setupBasicToken1(Alice);
    setupBasicToken2(Alice);

    //Transfer tokens from minter to Alice
    transferToken1(1000, Alice);
    transferToken2(1000, Alice);

    addLiquidity(data.token0Key, data.token1Key, 100, 99, 100, 99, Alice);
    await shallPass(removeLiquidity(data.token0Key, data.token1Key, 2, Alice));
  });
});
