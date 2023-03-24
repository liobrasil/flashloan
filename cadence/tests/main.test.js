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
    await deploySwapFactory();
    await deploySwapRouter();
    await deploySwapPair();
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

  // it("user can add liquidity", async () => {
  //   const Alice = await getAccountAddress("Alice");
  //   await mintFlow(Alice, "10.0");
  //   let [txResult] = await createPair(Alice);

  //   let data = txResult.events[10].data;
  //   console.log("-----data", data);

  //   //Setup BasicTokens collection
  //   await shallPass(setupBasicToken1(Alice));
  //   await shallPass(setupBasicToken2(Alice));

  //   //Transfer tokens from minter to Alice
  //   await shallPass(transferToken1(1000, Alice));
  //   await shallPass(transferToken2(1000, Alice));

  //   const amountToken0 = 100;
  //   const amountToken0Min = 99;
  //   const amountToken1 = 100;
  //   const amountToken1Min = 99;

  //   [txResult] = await shallPass(
  //     addLiquidity(
  //       data.token0Key,
  //       data.token1Key,
  //       amountToken0,
  //       amountToken0Min,
  //       amountToken1,
  //       amountToken1Min,
  //       Alice
  //     )
  //   );
  //   console.log("-----Added liquidity", txResult.events);
  // });


  it("user can get flash loan", async () => {
    const Alice = await getAccountAddress("Alice");
    const FlashLoanUser = await getAccountAddress("FlashLoanUser");

    await mintFlow(Alice, "10.0");
    let [txResult] = await createPair(Alice);

    let data = txResult.events[10].data;
    console.log("-----data", data);

    //Setup BasicTokens collection
    await shallPass(setupBasicToken1(Alice));
    await shallPass(setupBasicToken2(Alice));

    //Transfer tokens from minter to Alice
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
      Alice
    );
    // console.log("-----Added liquidity", txResult.events);

    [txResult] = await shallPass(
      getFlashLoan(data.token0Key, data.token1Key, data.token0Key, FlashLoanUser, 1000)
    );
    console.log("-----getFlashLoan", txResult.events);

  });

  // it("user can remove liquidity", async () => {
  //   const Alice = await getAccountAddress("Alice");
  //   await mintFlow(Alice, "10.0");
  //   let [txResult] = await createPair(Alice);
  //   let data = txResult.events[10].data;
  //   //Setup BasicTokens collection
  //   setupBasicToken1(Alice);
  //   setupBasicToken2(Alice);

  //   //Transfer tokens from minter to Alice
  //   transferToken1(1000, Alice);
  //   transferToken2(1000, Alice);

  //   const amountToken0 = 100;
  //   const amountToken0Min = 99;
  //   const amountToken1 = 100;
  //   const amountToken1Min = 99;
  //   const lpTokenAmount = 99.99999999;

  //   await addLiquidity(
  //     data.token0Key,
  //     data.token1Key,
  //     amountToken0,
  //     amountToken0Min,
  //     amountToken1,
  //     amountToken1Min,
  //     Alice
  //   );
  //   [txResult] = await shallPass(
  //     removeLiquidity(data.token0Key, data.token1Key, lpTokenAmount, Alice)
  //   );
  //   console.log("-----Removed liquidity", txResult.events);
  // });
});
