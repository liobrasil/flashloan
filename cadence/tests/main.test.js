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
  getFlashLoanUser,
  getAlice,
  getMockLendingProtocol,
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
  deployMockLendingProtocol,
  deployLiquidation,
  deployArbitrage,
  setupBasicToken1,
  setupBasicToken2,
  createPair,
  addLiquidity,
  getFlashLoan,
  liquidatePosition,
  removeLiquidity,
  transferToken1,
  transferToken2,
} from "./main";

// jest.setTimeout(50000);

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
    await shallPass(deploySwapConfig(DEX1));
    await shallPass(deploySwapError(DEX1));
    await shallPass(deploySwapInterfaces(DEX1));
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
    await mintFlow(DEX1, "10.0");
    await deployBasicToken1();
    await deployBasicToken2();
    await deploySwapConfig(DEX1);
    await deploySwapError(DEX1);
    await deploySwapInterfaces(DEX1);
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

    const amountToken0 = 1000;
    const amountToken0Min = 999;
    const amountToken1 = 1000;
    const amountToken1Min = 999;

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
});

const amountToken0 = 1000000;
const amountToken0Min = 999999;
const amountToken1 = 1000000;
const amountToken1Min = 999999;

describe("Liquidation", () => {
  beforeEach(async () => {
    const basePath = path.resolve(__dirname, "../");
    const emulatorOptions = {
      logging: true,
    };

    await init(basePath);
    await emulator.start(emulatorOptions);

    const DEX1 = await getFirstDex();
    const Alice = await getAlice();
    const MockLendingProtocol = await getMockLendingProtocol();
    const FlashLoanUser = await getFlashLoanUser();

    await mintFlow(DEX1, "10.0");
    await mintFlow(Alice, "10.0");
    await mintFlow(MockLendingProtocol, "10.0");
    await mintFlow(FlashLoanUser, "10.0");
    await deployBasicToken1();
    await deployBasicToken2();

    await deploySwapConfig(DEX1);
    await deploySwapError(DEX1);
    await deploySwapInterfaces(DEX1);
    await deploySwapFactory(DEX1);
    await deploySwapRouter(DEX1);
    await deploySwapPair(DEX1);
    await deployMockLendingProtocol();
    await deployLiquidation(FlashLoanUser);

    // setup basic tokens
    await setupBasicToken1(Alice);
    await setupBasicToken2(Alice);
    await setupBasicToken1(FlashLoanUser);
    await setupBasicToken2(FlashLoanUser);
    await setupBasicToken1(MockLendingProtocol);
    await setupBasicToken2(MockLendingProtocol);

    // setting up liquidity for DEXes
    await transferToken1(4 * amountToken0, Alice);
    await transferToken2(4 * amountToken1, Alice);

    // Simulating a position to be liquidated at 110% of collateral debt
    await transferToken1(1.1 * amountToken0, MockLendingProtocol);
  });

  afterEach(async () => {
    await emulator.stop();
  });

  it("user can liquidate low collateralized position and get the bounty of 10%", async () => {
    // Alice provides 1M/1M liquidity on DEX1
    let [txResult] = await createPair(Alice, DEX1);
    let data = txResult.events[10].data;
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
    console.log("-----Added liquidity on DEX1 : ", data1);

    // Liquidator can liquidate a mock position
    const flashLoanUser = await getFlashLoanUser();
    const DEX1 = await getFirstDex();

    await shallPass(
      liquidatePosition(
        data.token0Key,
        data.token1Key,
        data.token0Key,
        flashLoanUser,
        amountToken0,
        DEX1
      )
    );
  });
});

// describe.skip("Arbitrage", () => {
//   beforeEach(async () => {
//     const basePath = path.resolve(__dirname, "../");
//     const emulatorOptions = {
//       logging: true,
//     };

//     await init(basePath);
//     await emulator.start(emulatorOptions);

//     const DEX1 = await getFirstDex();
//     const DEX2 = await getSecondDex();
//     const flashLoanProvider = await getFlashLoanProvider();
//     const Alice = await getAlice();
//     const Bob = await getBob();
//     const Charlie = await getCharlie();
//     const FlashLoanUser = await getFlashLoanUser();

//     await mintFlow(DEX1, "10.0");
//     await mintFlow(DEX2, "10.0");
//     await mintFlow(flashLoanProvider, "10.0");
//     await mintFlow(Alice, "10.0");
//     await mintFlow(Bob, "10.0");
//     await mintFlow(Charlie, "10.0");
//     await mintFlow(FlashLoanUser, "10.0");
//     await deployBasicToken1();
//     await deployBasicToken2();

//     console.log("-----stage 1");
//     await deploySwapConfig(DEX1);
//     await deploySwapConfig(DEX2);
//     await deploySwapConfig(flashLoanProvider);

//     await deploySwapError(DEX1);
//     await deploySwapError(DEX2);
//     await deploySwapError(flashLoanProvider);

//     await deploySwapInterfaces(DEX1);
//     await deploySwapInterfaces(DEX2);
//     await deploySwapInterfaces(flashLoanProvider);

//     await deploySwapFactory(DEX1);
//     await deploySwapFactory(DEX2);
//     await deploySwapFactory(flashLoanProvider);

//     await deploySwapRouter(DEX1);
//     await deploySwapRouter(DEX2);
//     await deploySwapRouter(flashLoanProvider);

//     await deploySwapPair(DEX1);
//     await deploySwapPair(DEX2);
//     await deploySwapPair(flashLoanProvider);

//     console.log("-----stage 2");
//     // setup basic tokens
//     await setupBasicToken1(Alice);
//     await setupBasicToken2(Alice);
//     await setupBasicToken1(Bob);
//     await setupBasicToken2(Bob);
//     await setupBasicToken1(Charlie);
//     await setupBasicToken2(Charlie);
//     await setupBasicToken1(FlashLoanUser);
//     await setupBasicToken2(FlashLoanUser);

//     // setting up liquidity for DEXes
//     const amountToken0 = 1000000;
//     const amountToken0Min = 999999;
//     const amountToken1 = 1000000;
//     const amountToken1Min = 999999;
//     await transferToken1(amountToken0, Alice);
//     await transferToken2(amountToken1, Alice);
//     await transferToken1(amountToken0, Bob);
//     await transferToken2(1.5 * amountToken1, Bob);
//     await transferToken1(10 * amountToken0, Charlie);
//     await transferToken2(10 * amountToken1, Charlie);

//     console.log("-----stage 3");
//     // Alice provides 1M/1M on DEX1
//     let [txResult1] = await createPair(Alice, DEX1);
//     let data1 = txResult1.events[10].data;
//     await addLiquidity(
//       data1.token0Key,
//       data1.token1Key,
//       amountToken0,
//       amountToken0Min,
//       amountToken1,
//       amountToken1Min,
//       Alice,
//       DEX1
//     );
//     console.log("-----Added liquidity on DEX1 : ", data1);

//     // Bob provides 1M/1.5M on DEX2
//     let [txResult2, error] = await createPair(Bob, DEX2);
//     console.log(txResult2);
//     let data2 = txResult2.events[10].data;
//     await addLiquidity(
//       data2.token0Key,
//       data2.token1Key,
//       amountToken0,
//       amountToken0Min,
//       1.5 * amountToken1,
//       1.5 * amountToken1Min,
//       Bob,
//       DEX2
//     );
//     console.log("-----Added liquidity on DEX2 : ", data2);

//     // Charlie provider 10M/10M on FlashLoanProvider
//     let [txResult3] = await createPair(Charlie, flashLoanProvider);
//     let data3 = txResult3.events[10].data;
//     await addLiquidity(
//       data3.token0Key,
//       data3.token1Key,
//       10 * amountToken0,
//       10 * amountToken0Min,
//       10 * amountToken1,
//       10 * amountToken1Min,
//       Charlie,
//       flashLoanProvider
//     );

//     console.log("-----Added liquidity on FlashloanProvider : ", data3);

//     // setup basic tokens for flashLoanUser
//     await deployArbitrage();
//   });

//   afterEach(async () => {
//     await emulator.stop();
//   });

//   it("user can borrow a flashloan and perform an arbitrage", async () => {
//     const flashLoanUser = await getFlashLoanUser();
//     const flashLoanProvider = await getFlashLoanProvider();
//     await shallPass(
//       getFlashLoan(
//         data.token0Key,
//         data.token1Key,
//         data.token0Key,
//         FlashLoanUser,
//         500000,
//         flashLoanProvider
//       )
//     );
//     await shallPass(startArbitrage());
//   });
// });
