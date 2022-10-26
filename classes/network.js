import { getRandomQuote } from 'spanish-quotes';
import { encodeMulti, OperationType } from 'ethers-multisend'
import { utils, providers, Wallet, Contract, BigNumber } from "ethers";
import { uniqueNamesGenerator, names, animals, starWars } from 'unique-names-generator';
import randomLocation from 'random-location';
import dotenv from "dotenv";
import axios from "axios";
import Message from "./msg.js";
import ABI from './abis.js'
import Cache from "./cache.js";

dotenv.config();

const config = {
  dictionaries: [starWars],
  style: 'capital'
}

const P = {
  latitude: 10.747831,
  longitude: 106.6892126
}

const R = 500;
const zeroAddress = '0x0000000000000000000000000000000000000000'

const msg = new Message();

const data = {
  EATEREUM: process.env.EATEREUM,
  GOVERNANCE: process.env.GOVERNANCE,
  LP_TOKEN: process.env.LP_GOVERNANCE,
  MARKETPLACE: process.env.MARKETPLACE,
  STAKING_FACTORY: process.env.STAKING_FACTORY,
  STAKING_ORIGINALS: process.env.STAKING_ORIGINALS,
  STAKING_GOVERNANCE: process.env.STAKING_GOVERNANCE,
  LP_GOVERNANCE: process.env.LP_GOVERNANCE,
  LP_FARMING: process.env.LP_FARMING,
  LIQUIFIER: process.env.LIQUIFIER,
  VESTING: process.env.VESTING,
  BOX: process.env.BOX,
  MULTI_SEND: process.env.MULTI_SEND,
  MULTI_TRANSFER: process.env.MULTI_TRANSFER,
  CONVERT: process.env.CONVERT,
  gasLimit: process.env.GAS_LIMIT, //at least 10000000
  price: utils.parseUnits(`${process.env.GWEI}`, "gwei"), //in gwei
};

const accounts = new Map();

accounts.set('0xf1684DaCa9FE469189A3202ae2dE25E80dcB90a1', {
  privateKey: process.env.PRIVATE_KEY,
  authToken: process.env.JWT_TOKEN
});

accounts.set('0xa7364C972BCB10328A754fd28741cB50b663134A', {
  privateKey: process.env.PRIVATE_KEY2,
  authToken: process.env.JWT_TOKEN2
});

accounts.set('0x64470E5F5DD38e497194BbcAF8Daa7CA578926F6', {
  privateKey: process.env.PRIVATE_KEY3,
  authToken: process.env.JWT_TOKEN3
});

accounts.set('0x7F1a42FA8B1D8929F70Fb37E72A1186b0861C55B', {
  privateKey: process.env.PRIVATE_KEY4,
  authToken: process.env.JWT_TOKEN4
});

accounts.set('0xCaa4E159de1bb90F0F6972B27c1E253b96599Ff4', {
  privateKey: process.env.PRIVATE_KEY5,
  authToken: process.env.JWT_TOKEN5
});



export default class Network {
  async load(cache, address) {
    msg.primary(`[debug::network] Load network..`);
    try {
      this.cache = cache;
      this.node = new providers.JsonRpcProvider(process.env.FUJI_RPC);
      this.wallet = new Wallet(accounts.get(address).privateKey);
      this.account = this.wallet.connect(this.node);
      this.network = await this.node.getNetwork();
      this.eatereum = new Contract(data.EATEREUM, ABI.eatereum, this.account);
      this.governance = new Contract(data.GOVERNANCE, ABI.governance, this.account);
      this.marketplace = new Contract(data.MARKETPLACE, ABI.marketplace, this.account)
      this.stakingFactory = new Contract(data.STAKING_FACTORY, ABI.factory, this.account)
      this.stakingGovernance = new Contract(data.STAKING_GOVERNANCE, ABI.staking, this.account)
      this.farming = new Contract(data.LP_FARMING, ABI.staking, this.account)
      this.vesting = new Contract(data.VESTING, ABI.vesting, this.account)
      this.box = new Contract(data.BOX, ABI.genesis, this.account)
      this.multiSendContract = new Contract(data.MULTI_SEND, ABI.multiSend, this.account)
      this.multiTransferContract = new Contract(data.MULTI_TRANSFER, ABI.multiTransfer, this.account)
      this.convert = new Contract(data.CONVERT, ABI.convert, this.account)
		  this.balance = parseInt(await this.account.getBalance());
		  this.base_nonce = parseInt(await this.node.getTransactionCount(this.account.address));
		  this.nonce_offset = 0;
		  this.first_block = -1;
      axios.defaults.headers.common = {'Content-type': 'application/json', 'Authorization': `Bearer ${accounts.get(address).authToken}`}
      msg.primary('Completed!')
    } catch (e) {
      msg.error(`[error::network] ${e}`);
      process.exit();
    }
  }

  async getERC20PermitSignature(signer, token, tokenName, spender, value, deadline) {
    const [nonce, name, version, chainId] = await Promise.all([
      token.nonces(signer.address),
      tokenName,
      "1",
      signer.getChainId(),
    ])

    return utils.splitSignature(
      await signer._signTypedData(
        {
          name,
          version,
          chainId,
          verifyingContract: token.address,
        },
        {
          Permit: [
            {
              name: "owner",
              type: "address",
            },
            {
              name: "spender",
              type: "address",
            },
            {
              name: "value",
              type: "uint256",
            },
            {
              name: "nonce",
              type: "uint256",
            },
            {
              name: "deadline",
              type: "uint256",
            },
          ],
        },
        {
          owner: signer.address,
          spender,
          value,
          nonce,
          deadline,
        }
      )
    )
  }

  async getERC721PermitSignature(signer, token, spender, tokenId, deadline) {
    const [nonce, name, version, chainId] = await Promise.all([
      token.nonce(tokenId),
      "GenesisNFT",
      "1",
      signer.getChainId(),
    ])

    return utils.splitSignature(
      await signer._signTypedData(
        {
          name,
          version,
          chainId,
          verifyingContract: token.address,
        },
        {
          Permit: [
            {
              name: "spender",
              type: "address",
            },
            {
              name: "tokenId",
              type: "uint256",
            },
            {
              name: "nonce",
              type: "uint256",
            },
            {
              name: "deadline",
              type: "uint256",
            },
          ],
        },
        {
          spender,
          tokenId,
          nonce,
          deadline,
        }
      )
    )
  }

  async buyGenesis(type, buyAmount) {
    const [, price, ,] = await this.box.getTypeNFT(type)
    const ethPrice = Number(utils.formatEther(price));
    console.log(ethPrice)
    const buyPacksAmount = 100;
    for (let i = 0; i < buyAmount; ) {
        try {
          const tx = await this.box.buyNFT(type, buyPacksAmount, {
            gasPrice: data.price,
            value: utils.parseUnits(`${ethPrice * buyPacksAmount}`, 'ether').toHexString(),
            nonce: this.getNonce(),
          });

          msg.success(`[debug::transact] TX has been submitted. Waiting for response..`);
          const receipt = await tx.wait();
          msg.success(`[User:buy]: https://testnet.snowtrace.io/tx/${receipt.transactionHash}`);
          i+= buyPacksAmount;
        } catch (error) {
          console.log(error);
        }
    }
  }

  async convertWithPermit(nftId) {
    const url = `${process.env.API_DOMAIN}/nfts/convert/${this.box.address}/${nftId}`
    try {
      const { data } = await axios.get(url);
      const { v: vv, r: vr, s: vs }  = data.data.sign
      const { meta } = data.data
      const deadline = Math.round(Date.now()/1000) + 300
      const { v, r, s } = await this.getERC721PermitSignature(this.account, this.box, this.convert.address, nftId, deadline)

      const tx = await this.convert.convertWithPermit(nftId, meta, deadline, v, r, s, vv, vr, vs, {
        gasPrice: data.price,
        nonce: this.getNonce(),
      });

      msg.success(`[debug::transact] TX has been submitted. Waiting for response..`);
      const receipt = await tx.wait();
      msg.success(`[User:convert]: https://testnet.snowtrace.io/tx/${receipt.transactionHash}`);

    } catch (error) {
      console.log(error)
    }
  }

  async convertMultipleBoxes(from, to) {
    try {
      for(let i = from; i <= to; i++)
      
      await this.convertWithPermit(i)
    } catch (error) {
      console.log(error)
    }
  }

  async sellNFT(nftId) {
    const url = `${process.env.API_DOMAIN}/secondary-market`
    const price = Math.random()
    const nftIds = [nftId.toString()]
    const description = getRandomQuote()
    const payload = {
      nftIds,
      description: description.quote,
      nftAddress: this.convert.address,
      paymentTokenAddress: [zeroAddress],
      price
    }

    try {
      const { data: {orderId} } = await axios.post(url, payload);
      this.cache.data.push(orderId)
      const tx = await this.marketplace.createOrder(this.convert.address, orderId, nftIds, zeroAddress, utils.parseUnits(`${price}`, "ether"), {
      gasPrice: data.price,
      nonce: this.getNonce(),
    });

    msg.success(`[debug::transact] TX has been submitted. Waiting for response..`);
    const receipt = await tx.wait();
    msg.success(`[User:buy]: https://testnet.snowtrace.io/tx/${receipt.transactionHash}`);
    await this.cache.save();
    } catch (error) {
      console.log(error)
    }
  }

  async sellNFTs(from, to) {
    try {
      for(let i = from; i <= to; i++) {
        await this.sellNFT(i)
      }
    } catch (error) {
      console.log(error)
    }
  }

  async buyNFT(orderId) {
    const collection = this.convert.address;
    try {
      const [price, , , ] = await this.marketplace.viewOrderDetail(collection, orderId)
      await this.marketplace.buy(collection, orderId, {
        gasPrice: data.price,
        value: price,
        nonce: this.getNonce()
      })
    } catch (error) {
      console.log(error)
    }
  }

  async createBatchSchedule(name) {
    const vesting = new Cache();
    await vesting.load(`${name}.json`);
    const length = vesting.data.length;
    let sum = BigNumber.from(0);
    const beneficiaries = [];
    const amounts = [];
    for (let i = 0; i < 300; i++) {
      beneficiaries.push(vesting.data[i].address)
      amounts.push(vesting.data[i].amount)
      sum = sum.add(vesting.data[i].amount);
    }
    try {
      const tx = await this.vesting.createBatchSchedules(beneficiaries, amounts, {
        gasPrice: data.price,
        nonce: this.getNonce()
      })
      msg.success(`[debug::transact] TX has been submitted. Waiting for response..`);
      const receipt = await tx.wait();
      msg.success(`[User:convert]: https://testnet.snowtrace.io/tx/${receipt.transactionHash}`);
      await this.cache.save();
      await vesting.save()
    } catch (error) {
      console.log(error)
    }
  }

  async multiSendTransactions() {
    const multiSendTx = encodeMulti(
      [
        {
          to: '0xf1684DaCa9FE469189A3202ae2dE25E80dcB90a1',
          value: '1000000000000000000',
          data: '0x00',
          operation: OperationType.Call,
        },
        {
          to: '0x14F791eb0bd5060a4C954D6719fE4e94859Eb614',
          value: '2000000000000000000',
          data: '0x00',
          operation: OperationType.Call,
        },
      ],
      this.multiSendContract.address
    )
  console.log(JSON.stringify(multiSendTx))    
    try {
      const tx = await this.multiSendContract.multiSend(multiSendTx.data, {
        gasPrice: data.price,
        value: multiSendTx.value,
        nonce: this.getNonce()
      })
      msg.success(`[debug::transact] TX has been submitted. Waiting for response..`);
      const receipt = await tx.wait();
      msg.success(`[User:convert]: https://testnet.snowtrace.io/tx/${receipt.transactionHash}`);
    } catch (error) {
      console.log(error)
    }

    // console.log(JSON.stringify(multiSendTx))
  }

  async multiTransfer(name) {
    const [, valueAmount] = await this.multiTransferContract.viewAmount();
    const ethPrice = Number(utils.formatEther(valueAmount));
    const accounts = new Cache();
    await accounts.load(`${name}.json`);
    const length = accounts.data.length;
    const usersLength = 100;
    let recipients = [];

    for (let i = 0; i < length; i++) {
      recipients.push(accounts.data[i].address)
      if ((i+1) % usersLength === 0) {
        try {
          const tx = await this.multiTransferContract.distribute(this.governance.address, recipients, {
            gasPrice: data.price,
            value: utils.parseUnits(`${ethPrice * usersLength}`, 'ether').toHexString(),
            nonce: this.getNonce()
          })          
          recipients = [];
          msg.success(`[debug::transact] TX has been submitted. Waiting for response..`);
          const receipt = await tx.wait();
          msg.success(`[User:transfer]: https://testnet.snowtrace.io/tx/${receipt.transactionHash}`);
        } catch (error) {
          console.log(error)   
        }
      }
    }
  }

  async stakeWithPermit(spender, tokenName, name) {
    const accounts = new Cache();
    await accounts.load(`${name}.json`);
    const length = accounts.data.length;
    const stakeAmount = utils.parseUnits(`${1}`, 'ether').toHexString()
    const deadline = Math.round(Date.now()/1000) + 600
    let ps = [];
    for (let i = 0; i < 2; i++) {
      try {
        let wallet = new Wallet(accounts.data[i].privateKey);
        let account = wallet.connect(this.node);
        const { v, r, s } = await this.getERC20PermitSignature(account, this.governance, tokenName, spender, stakeAmount, deadline)
        const contract = new Contract(spender, ABI.staking, account)
        const tx = await contract.stakeWithPermit(stakeAmount, deadline, v, r, s, {
          gasPrice: data.price
        });
        ps.push(tx.wait())

        if ((i + 1) % 2 == 0) {
          await Promise.all(ps)
          ps = []
          msg.success(`[debug::transact] TX has been submitted. Waiting for response..`);
        }
      } catch (error) {
        console.log(error)
      }
    }
  }

  async registerStores(nftId) {
    for (let i = 0; i < 5; i++) {
      const url = `${process.env.API_DOMAIN}/stores`
      const randomPoint = randomLocation.randomCirclePoint(P, R)
      const randomName = uniqueNamesGenerator(config);
      const payload = {
        name: randomName,
        genre: `${randomName} shop`,
        typeId: '628f0651685bed30949cbcae',
        phone: "+705050403",
        address: "Dương Bá Trạc, Quận 8, TP.Hồ Chí Minh",
        website: 'https://www.google.com.vn/',
        openTime: "24/7",
        dayOff: "No",
        location: randomPoint,
        placeId: "ChIJgY2kawgvdTEROZcFcsupaIs",
        nftId: `${nftId}`,
        nftAddress: this.convert.address
      }
  
      try {
        const { data } = await axios.post(url, payload);
        const { message, merkleHash, proof, deadline } = data.data;
  
        const txCommit = await this.stakingFactory.commit(message)
        const receiptCommit = await txCommit.wait();
        msg.success(`[User:commit]: https://testnet.snowtrace.io/tx/${receiptCommit.transactionHash}`);
  
        const tx = await this.stakingFactory.createStore(merkleHash, deadline, proof)
        const receipt = await tx.wait();
        msg.success(`[User:reveal]: https://testnet.snowtrace.io/tx/${receipt.transactionHash}`);
  
      } catch (error) {
        console.log(error)
      } 
    }
  }

  getNonce() {
    let nonce = this.base_nonce + this.nonce_offset;
    this.nonce_offset++;
    return nonce;
  }
}
