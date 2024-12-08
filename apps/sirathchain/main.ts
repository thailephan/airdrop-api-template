import { Web3 } from "npm:web3";
import { Time, Timer } from "../../common/timer.ts";
const MINING_TIME = 10 * Time.MINUTE;
// const API_KEY = "5zBt3GLJ.rxkSsDdkIJvdvuK06sHFusCgNypZIARx";
// const walletAddress = "0xA6097E61738B3f5a851ac051309BeA24235820Ba";

const privateKey = "7ce55874ec36e1dafae9dcacbd4bd84aa0ac1ad2945cb3ad6c8fb021a0291da3";
const tokenContractAddress = "0xf4E817e97DfD23d1dE4A234F1C6efaDc133aEa87";
const rpcUrl = "https://3d.dymension.rpc.cumulo.org.es";

const API_BASE_URL = "https://miner-server.sirath.network/api";

const web3 = new Web3(rpcUrl);
const tokenContract = new web3.eth.Contract(getTokenAbi(), tokenContractAddress);

const mintTokens = async (recipient: string, amount: number) => {
    try {
      const amountInWei = web3.utils.toWei(amount.toString(), "ether");
      const gasPrice = await web3.eth.getGasPrice();
      const zeroAddress = "0x0000000000000000000000000000000000000000";

      // Ensure private key has 0x prefix
      const formattedPrivateKey = privateKey.startsWith("0x")
        ? privateKey
        : `0x${privateKey}`;

      // Get the current nonce for the address that will sign the transaction
      const account =
        web3.eth.accounts.privateKeyToAccount(formattedPrivateKey);

      // Get the latest nonce and add a small delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const nonce = await web3.eth.getTransactionCount(
        account.address,
        "latest"
      );

      const estimatedGas = await tokenContract.methods
        .mintTo(recipient, amountInWei)
        .estimateGas({
          from: zeroAddress,
        });

      // Increase gas limit by 20% using web3.utils
      const gasLimit = web3.utils.toHex(Math.floor(Number(estimatedGas) * 1.2));
        console.log("Estimated gas:", estimatedGas, "Gas Limit", gasLimit);

      const tx = {
        from: zeroAddress,
        to: tokenContractAddress,
        gas: gasLimit,
        gasPrice: web3.utils.toHex(gasPrice),
        nonce,
        data: tokenContract.methods.mintTo(recipient, amountInWei).encodeABI(),
      };
      console.log("Transaction:", tx);

      const signedTx = await web3.eth.accounts.signTransaction(
        tx,
        formattedPrivateKey
      );
      console.log("Signed transaction:", signedTx);

      const receipt: { transactionHash?: string } = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Transaction timeout"));
        }, 30000);

        web3.eth
          .sendSignedTransaction(signedTx.rawTransaction)
          .on("receipt", (receipt: { transactionHash?: string }) => {
            clearTimeout(timeout);
            resolve(receipt);
          })
          .on("error", (error) => {
            clearTimeout(timeout);
            reject(error);
          });
      });

      return receipt.transactionHash;
    } catch (error: any) {
      console.error("Error minting tokens:", error);
      if (error.message.includes("Transaction timeout")) {
        throw new Error("Transaction timed out. Please try again.");
      }
      throw error;
    }
  };

// const getGitcoinScore = async (address: string) => {
//     try {
//       const response = await fetch('https://api.scorer.gitcoin.co/registry/submit-passport', {
//         headers: {
//           accept: 'application/json',
//           'X-API-Key': API_KEY,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//             address,
//             community: 'Deprecated',
//             scorer_id: "7911",
//             signature: '',
//             nonce: '',
//         })
//       });

//       const json = await response.json();
//       return json.data.score ?? 0;
//     } catch (error) {
//       console.error('Error submitting passport:', error);
//       return 0;
//     }
// }

interface MiningSession {
  "id": number;
  "address": string;
  "start_time": number, // ms
  "end_time": number, // ms
  "mining_progress": number
  "token_amount": number
  "claimed": number;
  "created_at": string // ISO format
}

interface ClaimMiningSessionRequest {
    sessionId: number;
}
interface ClaimMiningSessionResponse {
    success: boolean 
}
const claimMiningSession = async ({ sessionId }: ClaimMiningSessionRequest): Promise<ClaimMiningSessionResponse> => {
    const response = await fetch(`${API_BASE_URL}/mining-session/${sessionId}/claim`, {
      "headers": {
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.6",
        "sec-ch-ua": "\"Brave\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "sec-gpc": "1",
        "Referer": "https://mining.sirath.network/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      "body": null,
      "method": "PUT"
    });
    return response.json();
}

interface UnClaimedRewardsResponse {
    data: MiningSession[];
}
const getUnclaimedRewards = async (address: string): Promise<UnClaimedRewardsResponse> => {
    const response = await fetch(`${API_BASE_URL}/unclaimed-rewards/${address}`, {
    "headers": {
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.6",
        "sec-ch-ua": "\"Brave\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "sec-gpc": "1",
        "Referer": "https://mining.sirath.network/",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    },
    "body": null,
    "method": "GET"
    });
    return { data: await response.json() };
}

const getCurrentMiningSession = async (address: string): Promise<null | MiningSession> => {
    const response = await fetch(`${API_BASE_URL}/mining-session/${address}`, {
      "headers": {
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.6",
        "sec-ch-ua": "\"Brave\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "sec-gpc": "1",
        "Referer": "https://mining.sirath.network/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      "body": null,
      "method": "GET"
    });
    return response.json();
}

interface StartMiningSessionRequest {
    address: string;
    tokenAmount: number;
    miningTime: number;
}
interface StartMiningSessionResponse {
    "id": number,
    "address": string,
    "startTime": number, // ms
    "endTime": number, // ms
    "miningProgress": number
    "tokenAmount": number
}
const startMiningSession = async (request: StartMiningSessionRequest): Promise<StartMiningSessionResponse> => {
    const body = JSON.stringify(request);
    const response = await fetch("https://miner-server.sirath.network/api/mining-session", {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-US,en;q=0.6",
            "content-type": "application/json",
            "sec-ch-ua": "\"Brave\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "sec-gpc": "1",
            "Referer": "https://mining.sirath.network/",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": body,
        "method": "POST"
    });
    return response.json();
}

const processMiningSession = async (session: { id: number, address: string, end_time: number, token_amount: number }) => {
    const waitTime = session.end_time - Date.now();
    if (waitTime > 0) {
        const { promise, timeMs } = Timer.sleepRandom(2 * Time.MINUTE + waitTime, 5 * Time.MINUTE + waitTime);
        console.log(`${session.address}: Start waiting for ${timeMs / Time.MINUTE} minutes`);
        await promise;
    }

    // console.log(`${session.address}: Start minting ${session.token_amount} tokens`);
    // const txHash = await mintTokens(session.address, session.token_amount);
    // console.log(`${session.address}: Mined ${session.token_amount} tokens. Check transaction at https://evm-explorer.sirath.network/tx/${txHash}`);
    // await claimMiningSession({ sessionId: session.id });
    // console.log(`${session.address}: Claimed mining session ${session.id}`);
}
async function mining(walletAddress: string) {
    const miningSession = await getCurrentMiningSession(walletAddress);

    if (miningSession === null) {
        console.log(`${walletAddress}: Start new mining session`);
        const tokenAmount = getTokenAmount();
        const miningTimeInSecond = MINING_TIME / Time.SECOND;
        const response = await startMiningSession({
            address: walletAddress,
            tokenAmount,
            miningTime: miningTimeInSecond,
        });

        if (response) {
            await processMiningSession({
                id: response.id,
                address: response.address,
                end_time: response.endTime,
                token_amount: response.tokenAmount,
            })
        }
    } else {
        console.log(`${walletAddress}: Continue mining session`);
        await processMiningSession({
            id: miningSession.id,
            address: miningSession.address,
            end_time: miningSession.end_time,
            token_amount: miningSession.token_amount,
        });
    }
}

const walletAddresses = [
    // // hemi
    // "0x7a6e3be8fda47039473d2aa39bfc89aa54ddccfa", // OKX (ETH)
    // "0x8bec3ce1dc85a0759a4e40ebe859d48f30a93ca9", // account 1 (ETH)
    // "0xea87e804debaf4e5016b02068ca3f6e3abe4a080", // account 2 (ETH)
    // "0xf293b321f6b33bb0a7f9cde5f093588b10bbe33d", // account 3 (ETH)
    // "0xdadf939489fb5204d1f3c4b9fc11b42e3db02c5c", // account 4 (ETH)
    // "0xd77247904bded68940a463c28317ee59ef826dbd", // account 5 (ETH)
    // "0x07ff33a581e68f57961edd39c420e4fcd4c526bf", // account 6 (ETH)
    // "0x08767368d6f388c0c0bc7f2020cc8132875ab611", // account 7 (ETH)
    // "0xb7b3c7ecc63897ed9d05227eb2c6924ffd18c38c", // account 8 (ETH)
    // "0x2ed7c0bb40ee646dd3fdf75b39217c432161df62", // account 9 (ETH)
    // "0xc1233b18c03686f5dc9a772bce0eda5b6677c6fe", // account 10 (ETH)
    // "0xd7743f140d3cb617b5e207248bdd7924c969330e", // account 11 (ETH)
    // "0xa402c15e824da8f28249295feafc10d4530f59c3", // account 12 (ETH)
    // "0xb17c476aec85ccecbb522b47549e4ffa53b038eb", // account 13 (ETH)
    // "0xe88955cb472f4ba743343e051ee502bc891edf33", // account 14 (ETH)
    // "0x5f7fd517588df57b05e4b74e59ddcb90842829a1", // account 15 (ETH)

    // // rasperry pi
    // "0x4a5334040df90b203d78edeaae0320d4f1329197", // account 16 (ETH)
    // "0xe57b67d85a3fc9622dad3ee86966545bc5e2907c", // account 17 (ETH)
    // "0x60261383f9a69146bdf2443be35d4911191ced05", // account 18 (ETH)
    // "0x31d91c8c57b410299c712f79452bff79eaaf6232", // account 19 (ETH)
    // "0xce87cf2d6e4538de51799f4066e70bb0b21362b0", // account 20 (ETH)
    // "0x5f14f5c101dc9ff516c0049b33d38ef682d91054", // account 21 (ETH)
    // "0x9b44ae1eeeffd64f17d366ba258ff79f34851461", // account 22 (ETH)
    // "0xea0a90da2802ffa1572e801a6684827e1868b55f", // account 23 (ETH)
    // "0xf120a9dcff42454b05527192b8f89ba22991374b", // account 24 (ETH)
    // "0x280eb55775e47ffe31179cf9cfe51c2ae5be7ddc", // account 25 (ETH)
    // "0xc4802ac037e92c97732e18b9202ff1ad576b381c", // account 26 (ETH)
    // "0xcd89a708ba551a506ab91acca878dca058ae4263", // account 27 (ETH)
    // "0xa308186fef23826061eb0cf03996782b338599a1", // account 28 (ETH)
    // "0x9d79069d14f29aff5aed037c32daf6a9984650ee", // account 29 (ETH)
    // "0x12e84207ed531087fdcf092bb4a9bef536cabedc", // account 30 (ETH)

];
async function start() {
    const promises = [] as Promise<void>[];
    for(let i = 0; i < walletAddresses.length; i++) {
        promises.push((async () => {
            const walletAddress = walletAddresses[i];
            // const { promise, timeMs } = Timer.sleepRandom(0, 1 * Time.MINUTE);
            // console.log(`${walletAddress}: Start first sleeping for ${timeMs / Time.SECOND} seconds`);
            // await promise;

            const MAX_REST_PERIOD = 3 * Time.HOUR;
            let currentRestTime = Date.now();
            const ERROR_THRESHHOLD = 10;
            let countError = 0;

            while(true) {
                const nowUnix = Date.now();
                const shouldRest = currentRestTime + 20 * Time.HOUR <= nowUnix && Math.random() > 0.5;

                if (shouldRest) {
                    // const sessions = await getUnclaimedRewards(walletAddress);
                    // if (sessions.data.length > 0) {
                    //     for (const session of sessions.data) {
                    //         await processMiningSession(session);
                    //     }
                    // }

                    console.log(`${walletAddress}: Start long resting period`);
                    const { promise, timeMs } = Timer.sleepRandom(0, MAX_REST_PERIOD);
                    console.log(`${walletAddress}: Sleeping for ${timeMs / Time.MINUTE} minutes`);
                    await promise;
                    currentRestTime = Date.now();
                }
                try {
                    const isPassedGitCoin = isAddressPassGitcoinScore(walletAddress);
                    if (isPassedGitCoin) {
                        await mining(walletAddress);
                        countError = 0;
                    } else {
                        console.log(`${walletAddress}: Address didn't pass Gitcoin score`);
                        break;
                    }
                } catch(e) {
                    console.log(`${walletAddress}: Failed to `, e);
                    if (countError >= ERROR_THRESHHOLD) {
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


const pointWithWeights = [
    {
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
        weight: 2,
    },
]
function selectRandomPointByWeight(data: {value: number, weight: number}[]) {
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
function getTokenAmount() {
    return selectRandomPointByWeight(pointWithWeights);
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

function isAddressPassGitcoinScore(address: string) {
    const THRESHOLD = 25;
    return true;
}