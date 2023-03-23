import path from "path";
import { emulator, init } from "@onflow/flow-js-testing";

// Increase timeout if your tests failing due to timeout
jest.setTimeout(10000);

describe("test-suite-862031160", ()=>{
  beforeEach(async () => {
    const basePath = path.resolve(__dirname, "../cadence");
    const logging = false;
    
    await init(basePath);
    return emulator.start({ logging });
  });
  
 // Stop emulator, so it could be restarted
  afterEach(async () => {
    return emulator.stop();
  });
  
  test("basic assertion", async () => {
    // WRITE YOUR ASSERTS HERE
  })
})
