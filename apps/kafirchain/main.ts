import { Web3 } from "npm:web3";
import { Time, Timer } from "../../common/timer.ts";
const MINING_TIME = 10 * Time.MINUTE;
const API_KEY = "5zBt3GLJ.rxkSsDdkIJvdvuK06sHFusCgNypZIARx";
const walletAddress = "0xA6097E61738B3f5a851ac051309BeA24235820Ba";
const privateKey = "7ce55874ec36e1dafae9dcacbd4bd84aa0ac1ad2945cb3ad6c8fb021a0291da3";
const tokenContractAddress = "0x9A1ddb85C171AEEaD88E7DdEFa976e2007A3895b";
const rpcUrl = "https://3d.dymension.evm.cumulo.org.es";

// const web3 = new Web3(new Web3.providers.http(rpcUrl));
const web3 = new Web3(rpcUrl);
const tokenContract = new web3.eth.Contract(getTokenAbi(), tokenContractAddress);

const sendTokens = async (recipient: string, point: number) => {
    const amountInWei = web3.utils.toWei(point.toString(), 'ether');
    try {
        const balance = await tokenContract.methods.balanceOf(walletAddress).call();
        console.log(`Faucet wallet's balance: ${balance} `)
        const balanceInTokens = parseFloat(web3.utils.fromWei(balance as any, 'ether'));

        if (balanceInTokens < point) {
            throw new Error(`Faucet insufficient balance`);
        }

        const gasPrice = await web3.eth.getGasPrice();
        const estimatedGas = await tokenContract.methods.transfer(recipient, amountInWei).estimateGas({ from: walletAddress });

        const tx = {
            from: walletAddress,
            to: tokenContractAddress,
            gas: estimatedGas,
            gasPrice,
            data: tokenContract.methods.transfer(recipient, amountInWei).encodeABI(),
        };

        const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        
        const transactionHashUrl = `https://blockscan-evm.kafirchain.site/tx/${receipt.transactionHash}`;
        return transactionHashUrl;
    } catch (error: any) {
        if (error.code === -32000) {
            throw new Error(`${recipient}: Insufficient funds for gas * price + value`);
        } else {
            throw new Error(`${recipient}: Failed to send tokens. Please try again later.`);
        }
    }
};

const getGitcoinScore = async (address: string) => {
    try {
      const response = await fetch('https://api.scorer.gitcoin.co/registry/submit-passport', {
        headers: {
          accept: 'application/json',
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            address,
            community: 'Deprecated',
            scorer_id: "7911",
            signature: '',
            nonce: '',
        })
      });

      const json = await response.json();
      return json.data.score ?? 0;
    } catch (error) {
      console.error('Error submitting passport:', error);
      return 0;
    }
}
const walletAddresses = [
    // hemi
    "0x7a6E3bE8FDa47039473D2aA39bFC89AA54dDCcfa", // OKX (ETH)
    "0x8bec3ce1dc85a0759a4e40ebe859d48f30a93ca9", // account 1 (ETH)
    "0xea87e804debaf4e5016b02068ca3f6e3abe4a080", // account 2 (ETH)
    "0xf293b321f6b33bb0a7f9cde5f093588b10bbe33d", // account 3 (ETH)
    "0xdadf939489fb5204d1f3c4b9fc11b42e3db02c5c", // account 4 (ETH)
    "0xd77247904bded68940a463c28317ee59ef826dbd", // account 5 (ETH)
    "0x07ff33a581e68f57961edd39c420e4fcd4c526bf", // account 6 (ETH)
    "0x08767368d6f388c0c0bc7f2020cc8132875ab611", // account 7 (ETH)
    "0xb7b3c7ecc63897ed9d05227eb2c6924ffd18c38c", // account 8 (ETH)
    "0x2ed7c0bb40ee646dd3fdf75b39217c432161df62", // account 9 (ETH)
    "0xc1233b18c03686f5dc9a772bce0eda5b6677c6fe", // account 10 (ETH)
    "0xd7743f140d3cb617b5e207248bdd7924c969330e", // account 11 (ETH)
    "0xa402c15e824da8f28249295feafc10d4530f59c3", // account 12 (ETH)
    "0xb17c476aec85ccecbb522b47549e4ffa53b038eb", // account 13 (ETH)
    "0xe88955cb472f4ba743343e051ee502bc891edf33", // account 14 (ETH)
    "0x5f7fd517588df57b05e4b74e59ddcb90842829a1", // account 15 (ETH)

    // rasperry pi
    "0x4a5334040df90b203d78edeaae0320d4f1329197", // account 16 (ETH)
    "0xe57b67d85a3fc9622dad3ee86966545bc5e2907c", // account 17 (ETH)
    "0x60261383f9a69146bdf2443be35d4911191ced05", // account 18 (ETH)
    "0x31d91c8c57b410299c712f79452bff79eaaf6232", // account 19 (ETH)
    "0xce87cf2d6e4538de51799f4066e70bb0b21362b0", // account 20 (ETH)
    "0x5f14f5c101dc9ff516c0049b33d38ef682d91054", // account 21 (ETH)
    "0x9b44ae1eeeffd64f17d366ba258ff79f34851461", // account 22 (ETH)
    "0xea0a90da2802ffa1572e801a6684827e1868b55f", // account 23 (ETH)
    "0xf120a9dcff42454b05527192b8f89ba22991374b", // account 24 (ETH)
    "0x280eb55775e47ffe31179cf9cfe51c2ae5be7ddc", // account 25 (ETH)
    // "0xc4802ac037e92c97732e18b9202ff1ad576b381c", // account 26 (ETH)
    // "0xcd89a708ba551a506ab91acca878dca058ae4263", // account 27 (ETH)
    // "0xa308186fef23826061eb0cf03996782b338599a1", // account 28 (ETH)
    // "0x9d79069d14f29aff5aed037c32daf6a9984650ee", // account 29 (ETH)
    // "0x12e84207ed531087fdcf092bb4a9bef536cabedc", // account 30 (ETH)

];
const pointWithWeights = [{
                value: 5,
                weight: 1,
            }, {
                value: 6,
                weight: 1,
            }, {
                value: 7,
                weight: 3,
            }, {
                value: 8,
                weight: 2,
            }, {
                value: 9,
                weight: 2,
            }, {
                value: 10,
                weight: 4,
            }, {
                value: 11,
                weight: 3,
            }, {
                value: 12,
                weight: 2,
            }, {
                value: 13,
                weight: 1,
            }, {
                value: 14,
                weight: 4,
            }, {
                value: 15,
                weight: 4,
}]
async function start() {
    const promises = [];
    for(let i = 0; i < walletAddresses.length; i++) {
        promises.push((async () => {
            const walletAddress = walletAddresses[i];
            const { promise, timeMs } = Timer.sleepRandom(0, 1 * Time.MINUTE);
            console.log(`${walletAddress}: Start first sleeping for ${timeMs / Time.SECOND} seconds`);
            await promise;

            const MAX_REST_PERIOD = 3 * Time.HOUR;
            let currentRestTime = Date.now();
            let countError = 0;
            while(true) {
                const nowUnix = Date.now();
                const shouldRest = currentRestTime + 20 * Time.HOUR <= nowUnix && Math.random() > 0.5;
                if (shouldRest) {
                    console.log(`${walletAddress}: Start long resting period`);
                    const { promise, timeMs } = Timer.sleepRandom(0, MAX_REST_PERIOD);
                    console.log(`${walletAddress}: Sleeping for ${timeMs / Time.MINUTE} minutes`);
                    await promise;
                    currentRestTime = Date.now();
                }
                // const gitcoinScore = await getGitcoinScore(walletAddress);            
                // if (gitcoinScore > 0) {
                    // console.log(`${walletAddress}: ${gitcoinScore} Gitcoin score`);
                    const { promise, timeMs } = Timer.sleepRandom(2 * Time.MINUTE + MINING_TIME, 5 * Time.MINUTE + MINING_TIME);
                    console.log(`${walletAddress}: Sleeping for ${timeMs / Time.MINUTE} minutes`);
                    await promise;
                // } else {
                //     break;
                // }

                try {
                    const points = weightedRandomPoints(pointWithWeights);
                    console.log(`${walletAddress}: Sending ${points} points`);
                    const txUrl = await sendTokens(walletAddress, points);
                    if (txUrl) {
                        console.log(`${walletAddress}: Check transaction at ${txUrl}`);
                    }
                } catch(e) {
                    console.log(`${walletAddress}: Failed to send points`, e);
                    if (countError >= 10) {
                        console.log(`${walletAddress}: Too many errors. Stop sending points`);
                        break;
                    } else {
                        countError++;
                    }
                }
            }
            return Promise.resolve();
        })());
    }
    await Promise.all(promises);
}
start();
function weightedRandomPoints(data: {value: number, weight: number}[]) {
    const totalWeight = data.reduce((weight, item) => item.weight + weight, 0);
    const randomValue = Math.random() * totalWeight;
    
    // Iterate over the weights and select the value based on the random number
    let cumulativeWeight = 0;
    for (let i = 0; i < data.length; i++) {
        cumulativeWeight += data[i].weight;
        if (randomValue < cumulativeWeight) {
            return data[i].value;
        }
    }
    return data[Math.round(Math.random() * data.length)].value;
}
function getTokenAbi() {
    const tokenAbi = [
        {
            "inputs": [],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "recipient",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "value",
                    "type": "uint256"
                }
            ],
            "name": "CurrencyTransferLibFailedNativeTransfer",
            "type": "error"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "owner",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "spender",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "value",
                    "type": "uint256"
                }
            ],
            "name": "Approval",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "delegator",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "fromDelegate",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "toDelegate",
                    "type": "address"
                }
            ],
            "name": "DelegateChanged",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "delegate",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "previousBalance",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "newBalance",
                    "type": "uint256"
                }
            ],
            "name": "DelegateVotesChanged",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [],
            "name": "EIP712DomainChanged",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": false,
                    "internalType": "address",
                    "name": "platformFeeRecipient",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "flatFee",
                    "type": "uint256"
                }
            ],
            "name": "FlatPlatformFeeUpdated",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": false,
                    "internalType": "uint8",
                    "name": "version",
                    "type": "uint8"
                }
            ],
            "name": "Initialized",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "platformFeeRecipient",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "platformFeeBps",
                    "type": "uint256"
                }
            ],
            "name": "PlatformFeeInfoUpdated",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": false,
                    "internalType": "enum IPlatformFee.PlatformFeeType",
                    "name": "feeType",
                    "type": "uint8"
                }
            ],
            "name": "PlatformFeeTypeUpdated",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "recipient",
                    "type": "address"
                }
            ],
            "name": "PrimarySaleRecipientUpdated",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "bytes32",
                    "name": "role",
                    "type": "bytes32"
                },
                {
                    "indexed": true,
                    "internalType": "bytes32",
                    "name": "previousAdminRole",
                    "type": "bytes32"
                },
                {
                    "indexed": true,
                    "internalType": "bytes32",
                    "name": "newAdminRole",
                    "type": "bytes32"
                }
            ],
            "name": "RoleAdminChanged",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "bytes32",
                    "name": "role",
                    "type": "bytes32"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "sender",
                    "type": "address"
                }
            ],
            "name": "RoleGranted",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "bytes32",
                    "name": "role",
                    "type": "bytes32"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "sender",
                    "type": "address"
                }
            ],
            "name": "RoleRevoked",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "mintedTo",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "quantityMinted",
                    "type": "uint256"
                }
            ],
            "name": "TokensMinted",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "signer",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "mintedTo",
                    "type": "address"
                },
                {
                    "components": [
                        {
                            "internalType": "address",
                            "name": "to",
                            "type": "address"
                        },
                        {
                            "internalType": "address",
                            "name": "primarySaleRecipient",
                            "type": "address"
                        },
                        {
                            "internalType": "uint256",
                            "name": "quantity",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "price",
                            "type": "uint256"
                        },
                        {
                            "internalType": "address",
                            "name": "currency",
                            "type": "address"
                        },
                        {
                            "internalType": "uint128",
                            "name": "validityStartTimestamp",
                            "type": "uint128"
                        },
                        {
                            "internalType": "uint128",
                            "name": "validityEndTimestamp",
                            "type": "uint128"
                        },
                        {
                            "internalType": "bytes32",
                            "name": "uid",
                            "type": "bytes32"
                        }
                    ],
                    "indexed": false,
                    "internalType": "struct ITokenERC20.MintRequest",
                    "name": "mintRequest",
                    "type": "tuple"
                }
            ],
            "name": "TokensMintedWithSignature",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "from",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "to",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "value",
                    "type": "uint256"
                }
            ],
            "name": "Transfer",
            "type": "event"
        },
        {
            "inputs": [],
            "name": "CLOCK_MODE",
            "outputs": [
                {
                    "internalType": "string",
                    "name": "",
                    "type": "string"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "DEFAULT_ADMIN_ROLE",
            "outputs": [
                {
                    "internalType": "bytes32",
                    "name": "",
                    "type": "bytes32"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "DOMAIN_SEPARATOR",
            "outputs": [
                {
                    "internalType": "bytes32",
                    "name": "",
                    "type": "bytes32"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "owner",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "spender",
                    "type": "address"
                }
            ],
            "name": "allowance",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "spender",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "amount",
                    "type": "uint256"
                }
            ],
            "name": "approve",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                }
            ],
            "name": "balanceOf",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "amount",
                    "type": "uint256"
                }
            ],
            "name": "burn",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "amount",
                    "type": "uint256"
                }
            ],
            "name": "burnFrom",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                },
                {
                    "internalType": "uint32",
                    "name": "pos",
                    "type": "uint32"
                }
            ],
            "name": "checkpoints",
            "outputs": [
                {
                    "components": [
                        {
                            "internalType": "uint32",
                            "name": "fromBlock",
                            "type": "uint32"
                        },
                        {
                            "internalType": "uint224",
                            "name": "votes",
                            "type": "uint224"
                        }
                    ],
                    "internalType": "struct ERC20VotesUpgradeable.Checkpoint",
                    "name": "",
                    "type": "tuple"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "clock",
            "outputs": [
                {
                    "internalType": "uint48",
                    "name": "",
                    "type": "uint48"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "contractType",
            "outputs": [
                {
                    "internalType": "bytes32",
                    "name": "",
                    "type": "bytes32"
                }
            ],
            "stateMutability": "pure",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "contractURI",
            "outputs": [
                {
                    "internalType": "string",
                    "name": "",
                    "type": "string"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "contractVersion",
            "outputs": [
                {
                    "internalType": "uint8",
                    "name": "",
                    "type": "uint8"
                }
            ],
            "stateMutability": "pure",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "decimals",
            "outputs": [
                {
                    "internalType": "uint8",
                    "name": "",
                    "type": "uint8"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "spender",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "subtractedValue",
                    "type": "uint256"
                }
            ],
            "name": "decreaseAllowance",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "delegatee",
                    "type": "address"
                }
            ],
            "name": "delegate",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "delegatee",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "nonce",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "expiry",
                    "type": "uint256"
                },
                {
                    "internalType": "uint8",
                    "name": "v",
                    "type": "uint8"
                },
                {
                    "internalType": "bytes32",
                    "name": "r",
                    "type": "bytes32"
                },
                {
                    "internalType": "bytes32",
                    "name": "s",
                    "type": "bytes32"
                }
            ],
            "name": "delegateBySig",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                }
            ],
            "name": "delegates",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "eip712Domain",
            "outputs": [
                {
                    "internalType": "bytes1",
                    "name": "fields",
                    "type": "bytes1"
                },
                {
                    "internalType": "string",
                    "name": "name",
                    "type": "string"
                },
                {
                    "internalType": "string",
                    "name": "version",
                    "type": "string"
                },
                {
                    "internalType": "uint256",
                    "name": "chainId",
                    "type": "uint256"
                },
                {
                    "internalType": "address",
                    "name": "verifyingContract",
                    "type": "address"
                },
                {
                    "internalType": "bytes32",
                    "name": "salt",
                    "type": "bytes32"
                },
                {
                    "internalType": "uint256[]",
                    "name": "extensions",
                    "type": "uint256[]"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "timepoint",
                    "type": "uint256"
                }
            ],
            "name": "getPastTotalSupply",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "timepoint",
                    "type": "uint256"
                }
            ],
            "name": "getPastVotes",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "getPlatformFeeInfo",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                },
                {
                    "internalType": "uint16",
                    "name": "",
                    "type": "uint16"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "bytes32",
                    "name": "role",
                    "type": "bytes32"
                }
            ],
            "name": "getRoleAdmin",
            "outputs": [
                {
                    "internalType": "bytes32",
                    "name": "",
                    "type": "bytes32"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "bytes32",
                    "name": "role",
                    "type": "bytes32"
                },
                {
                    "internalType": "uint256",
                    "name": "index",
                    "type": "uint256"
                }
            ],
            "name": "getRoleMember",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "bytes32",
                    "name": "role",
                    "type": "bytes32"
                }
            ],
            "name": "getRoleMemberCount",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                }
            ],
            "name": "getVotes",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "bytes32",
                    "name": "role",
                    "type": "bytes32"
                },
                {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                }
            ],
            "name": "grantRole",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "bytes32",
                    "name": "role",
                    "type": "bytes32"
                },
                {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                }
            ],
            "name": "hasRole",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "spender",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "addedValue",
                    "type": "uint256"
                }
            ],
            "name": "increaseAllowance",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_defaultAdmin",
                    "type": "address"
                },
                {
                    "internalType": "string",
                    "name": "_name",
                    "type": "string"
                },
                {
                    "internalType": "string",
                    "name": "_symbol",
                    "type": "string"
                },
                {
                    "internalType": "string",
                    "name": "_contractURI",
                    "type": "string"
                },
                {
                    "internalType": "address[]",
                    "name": "_trustedForwarders",
                    "type": "address[]"
                },
                {
                    "internalType": "address",
                    "name": "_primarySaleRecipient",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "_platformFeeRecipient",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "_platformFeeBps",
                    "type": "uint256"
                }
            ],
            "name": "initialize",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "forwarder",
                    "type": "address"
                }
            ],
            "name": "isTrustedForwarder",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "to",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "amount",
                    "type": "uint256"
                }
            ],
            "name": "mintTo",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "components": [
                        {
                            "internalType": "address",
                            "name": "to",
                            "type": "address"
                        },
                        {
                            "internalType": "address",
                            "name": "primarySaleRecipient",
                            "type": "address"
                        },
                        {
                            "internalType": "uint256",
                            "name": "quantity",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "price",
                            "type": "uint256"
                        },
                        {
                            "internalType": "address",
                            "name": "currency",
                            "type": "address"
                        },
                        {
                            "internalType": "uint128",
                            "name": "validityStartTimestamp",
                            "type": "uint128"
                        },
                        {
                            "internalType": "uint128",
                            "name": "validityEndTimestamp",
                            "type": "uint128"
                        },
                        {
                            "internalType": "bytes32",
                            "name": "uid",
                            "type": "bytes32"
                        }
                    ],
                    "internalType": "struct ITokenERC20.MintRequest",
                    "name": "_req",
                    "type": "tuple"
                },
                {
                    "internalType": "bytes",
                    "name": "_signature",
                    "type": "bytes"
                }
            ],
            "name": "mintWithSignature",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "bytes[]",
                    "name": "data",
                    "type": "bytes[]"
                }
            ],
            "name": "multicall",
            "outputs": [
                {
                    "internalType": "bytes[]",
                    "name": "results",
                    "type": "bytes[]"
                }
            ],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "name",
            "outputs": [
                {
                    "internalType": "string",
                    "name": "",
                    "type": "string"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "owner",
                    "type": "address"
                }
            ],
            "name": "nonces",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                }
            ],
            "name": "numCheckpoints",
            "outputs": [
                {
                    "internalType": "uint32",
                    "name": "",
                    "type": "uint32"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "owner",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "spender",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "value",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "deadline",
                    "type": "uint256"
                },
                {
                    "internalType": "uint8",
                    "name": "v",
                    "type": "uint8"
                },
                {
                    "internalType": "bytes32",
                    "name": "r",
                    "type": "bytes32"
                },
                {
                    "internalType": "bytes32",
                    "name": "s",
                    "type": "bytes32"
                }
            ],
            "name": "permit",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "primarySaleRecipient",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "bytes32",
                    "name": "role",
                    "type": "bytes32"
                },
                {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                }
            ],
            "name": "renounceRole",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "bytes32",
                    "name": "role",
                    "type": "bytes32"
                },
                {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                }
            ],
            "name": "revokeRole",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "string",
                    "name": "_uri",
                    "type": "string"
                }
            ],
            "name": "setContractURI",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_platformFeeRecipient",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "_platformFeeBps",
                    "type": "uint256"
                }
            ],
            "name": "setPlatformFeeInfo",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_saleRecipient",
                    "type": "address"
                }
            ],
            "name": "setPrimarySaleRecipient",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "bytes4",
                    "name": "interfaceId",
                    "type": "bytes4"
                }
            ],
            "name": "supportsInterface",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "symbol",
            "outputs": [
                {
                    "internalType": "string",
                    "name": "",
                    "type": "string"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "totalSupply",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "to",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "amount",
                    "type": "uint256"
                }
            ],
            "name": "transfer",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "from",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "to",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "amount",
                    "type": "uint256"
                }
            ],
            "name": "transferFrom",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "components": [
                        {
                            "internalType": "address",
                            "name": "to",
                            "type": "address"
                        },
                        {
                            "internalType": "address",
                            "name": "primarySaleRecipient",
                            "type": "address"
                        },
                        {
                            "internalType": "uint256",
                            "name": "quantity",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "price",
                            "type": "uint256"
                        },
                        {
                            "internalType": "address",
                            "name": "currency",
                            "type": "address"
                        },
                        {
                            "internalType": "uint128",
                            "name": "validityStartTimestamp",
                            "type": "uint128"
                        },
                        {
                            "internalType": "uint128",
                            "name": "validityEndTimestamp",
                            "type": "uint128"
                        },
                        {
                            "internalType": "bytes32",
                            "name": "uid",
                            "type": "bytes32"
                        }
                    ],
                    "internalType": "struct ITokenERC20.MintRequest",
                    "name": "_req",
                    "type": "tuple"
                },
                {
                    "internalType": "bytes",
                    "name": "_signature",
                    "type": "bytes"
                }
            ],
            "name": "verify",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                },
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ]
    return tokenAbi;
}