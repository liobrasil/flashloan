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
  getFlashLoanProvider,
  getTokensDeployer,
  getFlashLoanUser,
  getAlice,
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
  deployArbitrage,
  setupBasicToken1,
  setupBasicToken2,
  createPair,
  addLiquidity,
  getFlashLoan,
  removeLiquidity,
  transferToken1,
  transferToken2,
} from "./main";

describe.skip("Deployment", () => {
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
    // we can deploy same contract on different address
    //even if the name is the same
    const DEX1 = await getFirstDex();
    const DEX2 = await getSecondDex();
    await mintFlow(DEX1, "10.0");
    await mintFlow(DEX2, "10.0");
    await shallPass(deployBasicToken1());
    await shallPass(deployBasicToken2());
    await shallPass(deploySwapConfig());
    await shallPass(deploySwapError());
    await shallPass(deploySwapInterfaces());
    await shallPass(deploySwapFactory(DEX1));
    await shallPass(deploySwapFactory(DEX2));
    await shallPass(deploySwapRouter(DEX1));
    await shallPass(deploySwapPair(DEX1));
    await shallPass(deployArbitrage());
  });
});

describe.skip("DEX functions", () => {
  beforeEach(async () => {
    const basePath = path.resolve(__dirname, "../");
    const emulatorOptions = {
      logging: true,
    };

    await init(basePath);
    await emulator.start(emulatorOptions);

    const DEX1 = await getFirstDex();
    console.log("dex 1: ", DEX1);
    await mintFlow(DEX1, "10.0");
    await deployBasicToken1();
    await deployBasicToken2();
    await deploySwapConfig();
    await deploySwapError();
    await deploySwapInterfaces();
    await deploySwapFactory(DEX1);
    await deploySwapRouter(DEX1);
    await deploySwapPair(DEX1);
    await deployArbitrage();
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
    const DEX1 = await getFirstDex();
    const Alice = await getAccountAddress("Alice");
    await mintFlow(Alice, "10.0");
    let [txResult] = await createPair(Alice);

    let data = txResult.events[10].data;
    console.log("-----data", data);

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

    [txResult] = await shallPass(
      addLiquidity(
        DEX1,
        data.token0Key,
        data.token1Key,
        amountToken0,
        amountToken0Min,
        amountToken1,
        amountToken1Min,
        Alice
      )
    );
    console.log("-----Added liquidity", txResult.events);
  });

  it.only("user can get flash loan", async () => {
    const DEX1 = await getFirstDex();
    const Alice = await getAccountAddress("Alice");
    const FlashLoanUser = await getAccountAddress("FlashLoanUser");

    await mintFlow(Alice, "10.0");
    let [txResult, error] = await createPair(Alice);
    console.log("error: ", error);
    let data = txResult.events[10].data;
    console.log("-----data", data);

    //Setup BasicTokens collection
    await shallPass(setupBasicToken1(Alice));
    await shallPass(setupBasicToken2(Alice));

    //Transfer 100000 tokens from minter to Alice
    await shallPass(transferToken1(100000, Alice));
    await shallPass(transferToken2(100000, Alice));

    const amountToken0 = 10000;
    const amountToken0Min = 9999;
    const amountToken1 = 10000;
    const amountToken1Min = 9999;

    await addLiquidity(
      DEX1,
      data.token0Key,
      data.token1Key,
      amountToken0,
      amountToken0Min,
      amountToken1,
      amountToken1Min,
      Alice
    );
    // console.log("-----Added liquidity", txResult.events);

    [txResult, error] = await shallPass(
      getFlashLoan(
        data.token0Key,
        data.token1Key,
        data.token0Key,
        FlashLoanUser,
        1000
      )
    );
    console.log(error);
    console.log("-----getFlashLoan", txResult.events);
  });

  it("user can remove liquidity", async () => {
    const DEX1 = await getFirstDex();
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

    const amountToken0 = 100;
    const amountToken0Min = 99;
    const amountToken1 = 100;
    const amountToken1Min = 99;
    const lpTokenAmount = 99.99999999;

    await addLiquidity(
      DEX1,
      data.token0Key,
      data.token1Key,
      amountToken0,
      amountToken0Min,
      amountToken1,
      amountToken1Min,
      Alice
    );
    [txResult] = await shallPass(
      removeLiquidity(data.token0Key, data.token1Key, lpTokenAmount, Alice)
    );
    console.log("-----Removed liquidity", txResult.events);
  });
});

describe("Arbitrage", () => {
  beforeEach(async () => {
    const basePath = path.resolve(__dirname, "../");
    const emulatorOptions = {
      logging: true,
    };

    await init(basePath);
    await emulator.start(emulatorOptions);

    const DEX1 = await getFirstDex();
    const DEX2 = await getSecondDex();
    const flashLoanProvider = await getFlashLoanProvider();
    const Alice = await getAlice();
    const FlashLoanUser = await getFlashLoanUser();

    await mintFlow(DEX1, "10.0");
    await mintFlow(DEX2, "10.0");
    await mintFlow(flashLoanProvider, "10.0");
    await mintFlow(Alice, "10.0");
    await mintFlow(FlashLoanUser, "10.0");
    await deployBasicToken1();
    await deployBasicToken2();
    await deploySwapConfig();
    await deploySwapError();
    await deploySwapInterfaces();
    await deploySwapFactory(DEX1);
    await deploySwapFactory(DEX2);
    await deploySwapFactory(flashLoanProvider);
    await deploySwapRouter(DEX1);
    await deploySwapRouter(DEX2);
    await deploySwapRouter(flashLoanProvider);
    await deploySwapPair(DEX1);
    await deploySwapPair(DEX2);
    await deploySwapPair(flashLoanProvider);

    // setting up liquidity for DEXes
    const amountToken0 = 1000000;
    const amountToken0Min = 999999;
    const amountToken1 = 1000000;
    const amountToken1Min = 999999;
    let [txResult, error] = await createPair(Alice);
    console.log(error);
    let data = txResult.events[10].data;
    await setupBasicToken1(Alice);
    await setupBasicToken2(Alice);
    await transferToken1(4 * amountToken0, Alice);
    await transferToken2(4.5 * amountToken1, Alice);
    await addLiquidity(
      DEX1,
      data.token0Key,
      data.token1Key,
      amountToken0,
      amountToken0Min,
      amountToken1,
      amountToken1Min,
      Alice
    );
    await addLiquidity(
      DEX2,
      data.token0Key,
      data.token1Key,
      amountToken0,
      amountToken0Min,
      amountToken1,
      1.5 * amountToken1Min,
      Alice
    );
    await addLiquidity(
      flashLoanProvider,
      data.token0Key,
      data.token1Key,
      2 * amountToken0,
      2 * amountToken0Min,
      2 * amountToken1,
      2 * amountToken1Min,
      Alice
    );

    // setting up flashLoanUser
    await setupBasicToken1(FlashLoanUser);
    await setupBasicToken2(FlashLoanUser);
    await deployArbitrage();
  });

  afterEach(async () => {
    await emulator.stop();
  });

  it("user can perform a profitable arbitrage", async () => {
    const flashLoanUser = await getFlashLoanUser();
    await shallPass(startArbitrage());
  });
});
