import axios from "axios";
import keccak256 from "keccak256";
import { ethers } from "ethers";
import { MerkleTree } from "merkletreejs";


const encodeData = (types, values) => {
  const abiCoder = ethers.utils.defaultAbiCoder;
  return abiCoder.encode(types, values);
};

const getSolidityHash = (types, values) => {
  return ethers.utils.solidityKeccak256(types, values);
};


const getSignature = (messageHash, signerKey) => {
  const wallet = new ethers.Wallet(signerKey);
  const messageHashBinary = ethers.utils.arrayify(messageHash);
  return wallet.signMessage(messageHashBinary);
};

let getContractInfo = async () => {
    try {
      const contractCodeGetRequestURL = `https://api.bscscan.com/api?module=contract&action=getsourcecode&address=0x407993575c91ce7643a4d4ccacc9a98c36ee1bbe&apikey=KFICB9BQEDE44XY358CNFE784CPRHT246G`;
      const contractCodeRequest = await axios.get(contractCodeGetRequestURL);
      return contractCodeRequest["data"]["result"][0]["SourceCode"];
    } catch (error) {
      return false;
    }
  };


  // const encodedData = encodeData(
//   [
//     "tuple(address creator, uint256 typeNFT, uint256 rarity, uint256 nftLevel, uint256 basicPerformance)[]",
//   ],
//   [[
//     {
//       creator: "0x64470e5f5dd38e497194bbcaf8daa7ca578926f6",
//       typeNFT: 1,
//       rarity: 1,
//       nftLevel: 1,
//       basicPerformance: 3
//     },
//     {
//       creator: "0x64470e5f5dd38e497194bbcaf8daa7ca578926f6",
//       typeNFT: 1,
//       rarity: 1,
//       nftLevel: 1,
//       basicPerformance: 5
//     },
//     {
//       creator: "0x64470e5f5dd38e497194bbcaf8daa7ca578926f6",
//       typeNFT: 1,
//       rarity: 1,
//       nftLevel: 1,
//       basicPerformance: 5
//     },
//     {
//       creator: "0x64470e5f5dd38e497194bbcaf8daa7ca578926f6",
//       typeNFT: 2,
//       rarity: 1,
//       nftLevel: 1,
//       basicPerformance: 7
//     }
//   ]]
// );
// const timestamp = 1660272249;
// const hash = getSolidityHash(["bytes", "uint256"], [encodedData, timestamp])
// const signature = await getSignature(hash, '46ba27be55a1de5320c6989bae417d3807e6511ace42f986b9916ee82647febf')
// const s = ethers.utils.splitSignature(signature)
// console.log(JSON.stringify(s))
// const timestamp = Math.round(Date.now()/1000);

// const leaves = ['store1', 'store2', 'store3', 'store4'].map(value => encodeData(['string'], [value]))
// const merkleTree = new MerkleTree(leaves, keccak256, { hashLeaves: true, sortPairs: true })

// const root = merkleTree.getHexRoot()

// const leaf = keccak256(leaves[0])

// const proof = merkleTree.getHexProof(leaf)
// const encodedData = encodeData(['address', 'bytes32'], ['0x64470E5F5DD38e497194BbcAF8Daa7CA578926F6', '0x8fe58c86034fed175d7f318b8f71184fdb7908aa9e5e3f1432d45c8d43daf8ac']);
// console.log(proof);
// console.log(root);
// console.log(encodedData);