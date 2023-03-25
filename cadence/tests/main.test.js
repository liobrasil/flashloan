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
  getBob,
  getCharlie,
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
  getPairAddress,
  createPair,
  addLiquidity,
  getFlashLoan,
  removeLiquidity,
  transferToken1,
  transferToken2,
  getContracts,
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
        data.token0Key,
        data.token1Key,
        amountToken0,
        amountToken0Min,
        amountToken1,
        amountToken1Min,
        Alice,
        DEX1
      )
    );
    console.log("-----Added liquidity", txResult.events);
  });

  it("user can get flash loan", async () => {
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
      data.token0Key,
      data.token1Key,
      amountToken0,
      amountToken0Min,
      amountToken1,
      amountToken1Min,
      Alice,
      DEX1
    );

    await shallPass(
      getFlashLoan(
        data.token0Key,
        data.token1Key,
        data.token0Key,
        FlashLoanUser,
        1000
      )
    );

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
      data.token0Key,
      data.token1Key,
      amountToken0,
      amountToken0Min,
      amountToken1,
      amountToken1Min,
      Alice,
      DEX1
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
    // const Bob = await getBob();
    // const Charlie = await getCharlie();
    const FlashLoanUser = await getFlashLoanUser();

    console.log("DEX1: ", DEX1);
    console.log("DEX2: ", DEX2);
    console.log("flashLoanProvider: ", flashLoanProvider);

    await mintFlow(DEX1, "10.0");
    await mintFlow(DEX2, "10.0");
    await mintFlow(flashLoanProvider, "10.0");
    await mintFlow(Alice, "10.0");
    // await mintFlow(Bob, "10.0");
    // await mintFlow(Charlie, "10.0");
    await mintFlow(FlashLoanUser, "10.0");
    await deployBasicToken1();
    await deployBasicToken2();

    await deploySwapConfig(DEX1);
    await deploySwapConfig(DEX2);
    await deploySwapConfig(flashLoanProvider);

    await deploySwapError(DEX1);
    await deploySwapError(DEX2);
    await deploySwapError(flashLoanProvider);

    await deploySwapInterfaces(DEX1);
    await deploySwapInterfaces(DEX2);
    await deploySwapInterfaces(flashLoanProvider);

    await deploySwapFactory(DEX1);
    await deploySwapFactory(DEX2);
    await deploySwapFactory(flashLoanProvider);

    // await deploySwapRouter(DEX1);
    // await deploySwapRouter(DEX2);
    // await deploySwapRouter(flashLoanProvider);

    await deploySwapPair(DEX1);
    await deploySwapPair(DEX2);
    await deploySwapPair(flashLoanProvider);

    // setup basic tokens for Alice et flashLoanUser
    await setupBasicToken1(Alice);
    await setupBasicToken2(Alice);
    // await setupBasicToken1(Bob);
    // await setupBasicToken2(Bob);
    // await setupBasicToken1(Charlie);
    // await setupBasicToken2(Charlie);
    await setupBasicToken1(FlashLoanUser);
    await setupBasicToken2(FlashLoanUser);

    console.log(await getContracts(DEX1))
    console.log(await getContracts(DEX2))
    // setting up liquidity for DEXes
    const amountToken0 = 1000_000;
    const amountToken0Min = 999_999;
    const amountToken1 = 1000_000;
    const amountToken1Min = 999_999;
    await transferToken1(amountToken0*10, Alice);
    await transferToken2(amountToken1*10, Alice);
    // await transferToken1(amountToken0, Bob);
    // await transferToken2(1.5 * amountToken1, Bob);
    // await transferToken1(10 * amountToken0, Charlie);
    // await transferToken2(10 * amountToken1, Charlie);

    console.log("dex1 pair: ", await getPairAddress(DEX1));
    console.log("dex2 pair: ", await getPairAddress(DEX2));
    // Alice provides 1M/1M on DEX1
    let [txResult1] = await createPair(Alice, DEX1);
    let data1 = txResult1.events[10].data;
    await addLiquidity(
      data1.token0Key,
      data1.token1Key,
      amountToken0,
      amountToken0Min,
      amountToken1,
      amountToken1Min,
      Alice,
      DEX1
    );
    console.log("-----Added liquidity on DEX1 : ", data1);

    console.log(await getPairAddress(DEX1));
    console.log(await getPairAddress(DEX2));

    // Bob provides 1M/1.5M on DEX2
    let [txResult2, error] = await createPair(Alice, DEX2);
    console.log("---Adding liquidity on DEX2 by Bob", txResult2, error);
    let data2 = txResult2.events[10].data;
    await addLiquidity(
      data2.token0Key,
      data2.token1Key,
      amountToken0,
      amountToken0Min,
      1.5 * amountToken1,
      1.5 * amountToken1Min,
      Alice,
      DEX2
    );

    // Charlie provider 10M/10M on FlashLoanProvider
    let [txResult3] = await createPair(Charlie, flashLoanProvider);
    let data3 = txResult3.events[10].data;
    await addLiquidity(
      data3.token0Key,
      data3.token1Key,
      10 * amountToken0,
      10 * amountToken0Min,
      10 * amountToken1,
      10 * amountToken1Min,
      Charlie,
      flashLoanProvider
    );

    // setup basic tokens for flashLoanUser
    await deployArbitrage();
  });

  afterEach(async () => {
    await emulator.stop();
  });

  it("user can borrow a flashloan and perform an arbitrage", async () => {
    const flashLoanUser = await getFlashLoanUser();
    const flashLoanProvider = await getFlashLoanProvider();
    await shallPass(
      getFlashLoan(
        data.token0Key,
        data.token1Key,
        data.token0Key,
        FlashLoanUser,
        500000,
        flashLoanProvider
      )
    );
    await shallPass(startArbitrage());
  });
});
