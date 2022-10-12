import Cache from "./classes/cache.js";
import Message from "./classes/msg.js";
import Network from "./classes/network.js";

const msg = new Message();
const cache = new Cache();
const network = new Network();

// main
(async () => {
  let startingTick = Math.floor(new Date().getTime() / 1000);
  msg.primary('[debug::main] Testing has been started.');
  if(network.balance == 0) {
    msg.error(`[error::init] You don't have any AVAX in your account. (used for gas fee)`);
      process.exit();
  }

  await cache.load('orderIds.json');
  cache.createList();
  await network.load(cache);

  // await network.buyGenesis(2, 2400)
  // await network.sellNFTs(1795, 2467)
  // await network.convertMultipleBoxes(4927, 4931)
  // await network.buyNFT(22100730053072)
  // await network.createBatchSchedule('accounts')
  // await network.multiTransfer('accounts')
  // await network.stakeWithPermit('0xFcE7183d7D1Eb611f38dFeCC3C4E93D48827A790', 'Governance', 'accounts1') // staking
  // await network.stakeWithPermit('0xf81eF9273E1529d6A41b752cf11d04FEE5Da9803', 'Joe LP Token', 'accounts1') // farming
  await network.registerStores(3360)
  // save cache just to be sure
  await cache.save();

  msg.success(
    `Finished in ${
      Math.floor(new Date().getTime() / 1000) - startingTick
    } seconds.`
  );

  process.exit();
})();
