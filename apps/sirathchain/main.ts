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
        const { promise, timeMs } = Timer.sleepRandom(2 * Time.MINUTE + waitTime, 30 * Time.MINUTE + waitTime);
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
    // hemi
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
    // "0x21dc8A1B765ba34C6B2E23753584D75DaDEDa26f", // account 31 (ETH)
	// "0x4F13f4fa6a8Df06D7cbA129622E3eAa8a9Acc3fd", // account 32 (ETH)
	// "0xb97C68A48eeAa07Ee766e161556d615ddcB6302F", // account 33 (ETH)
	// "0xF98d00f66081f741E116dC9B19044D7cf5999F12", // account 34 (ETH)
	// "0x047c94A021A1106Ef9fb02d0AB3aBfDb663565fB", // account 35 (ETH)
	// "0x2afE2a6242a7aC7A8854eca5aeD9A2cE34fd72F8", // account 36 (ETH)
	// "0x1d4B4bDFADd0AFAfB7B1BE299b637748870dBE04", // account 37 (ETH)
	// "0x55399390E9d8DaFdc93044F435B63B440bE73BD6", // account 38 (ETH)
	// "0x223A188bfD8Ae456C37EB7b35F8475E5Cd0fa30B", // account 39 (ETH)
	// "0xDd8012909e89e727ec7262e94def69090AB37BA4", // account 40 (ETH)
	// "0x83D51928BDa6B97a62b0C0F27e7fE868c7eADdf7", // account 41 (ETH)
	// "0xDc865283672b96033AAa6912a30C38e78E8A1CAb", // account 42 (ETH)
	// "0x5DDe129c906045DDbA748A90Fe6e8440752f14d5", // account 43 (ETH)
	// "0x7677B892Dd8A86e5Df5aAa43176c16DaB74aA883", // account 44 (ETH)
	// "0x29759ee863e74C65c532Fe41A9b80A943020ec0f", // account 45 (ETH)
	// "0x1972d312FeF4644F5eB9810709543b12A02fa89C", // account 46 (ETH)
	// "0xD05f0ae424a7c1C0A185ff0cf1AB26a27dA7126F", // account 47 (ETH)
	// "0x710f59b7d7B443Cd9C76768c2a402461e44c05A0", // account 48 (ETH)
	// "0xC77085821D034C88497ff21218582D69d7D5f4E3", // account 49 (ETH)
	// "0x61A977Af0ac707e037773452A1c33835CF8D8522", // account 50 (ETH)
	// "0x50c849e6bB92cA32c004b94528279c67000E4F6b", // account 51 (ETH)
	// "0x045C4CD3B390A05F3908c717f851e2FD40b9bDA7", // account 52 (ETH)
	// "0x87d2840ea1a0A796163ACDca4B3d249f868E895d", // account 53 (ETH)
	// "0x7db6F970B593e60eE8ce28aAe6B580D4F3F3e096", // account 54 (ETH)
	// "0x8E5ddC8C274704A7f76595Dae6831Cc65f582c5a", // account 55 (ETH)
	// "0x9fDA81fC749966512C85F718D740EAE41D240672", // account 56 (ETH)
	// "0xf34189147edA4f69f6E7FC2e428F226Dbe88861B", // account 57 (ETH)
	// "0x18dD4f358c783cda37c9ee96bE0BB6005C047B24", // account 58 (ETH)
	// "0x3167e32BB1e11BB6b11AFf14e371AFE4EaB421Ed", // account 59 (ETH)
	// "0x8774d524f8c793a84373ca56b3631dc4410eA478", // account 60 (ETH)
	// "0xbcA40b351F79B2A8dA231625Fc01412FC68a380a", // account 61 (ETH)
	// "0x303687e230F452EF24CB410E878e9Db9ecfC936e", // account 62 (ETH)
	// "0x0B5d9cD134A1f981847640a50577B0F11dC218E1", // account 63 (ETH)
	// "0xc640238c4ef0C321a751910653b97eBDb3a67E90", // account 64 (ETH)
	// "0xAb448cF47c1709673947f7bF851c1946ae4FA81F", // account 65 (ETH)
	// "0x03e680b84bbf9Af8d3b15E9468D58eaE151fFF6F", // account 66 (ETH)
	// "0xC34F6184708356DA479CCB6aF07F48849fCf6DFb", // account 67 (ETH)
	// "0x3FDCadA1e3e6055925F99deD4d106b67b097F91e", // account 68 (ETH)
	// "0x54A2F048E76215ABa95f6640dE9577749dC38947", // account 69 (ETH)
	// "0x9507B7f2b26fbB4636A1cD845f195787Ec50403a", // account 70 (ETH)
	// "0x26e04806b39C7F670F9F8D9Ac89FEaf639893e04", // account 71 (ETH)
	// "0x299148bF8ed378FE29fF53B125f5D9A9CC71560D", // account 72 (ETH)
	// "0x6d7D34ced24F6d75723956429Cc4a343f8A15F52", // account 73 (ETH)
	// "0xD8A3BE38D9f1EE282a403FB5b4295D7BaA67B507", // account 74 (ETH)
	// "0x3806E5feA2aCaBd497A9d3344f530d441c694b76", // account 75 (ETH)
	// "0x040cf71Dcd78bE3F35f188210F291670E82639fC", // account 76 (ETH)
	// "0x1D6E1976cD8FEd9F03b399236227f09BA3d1032b", // account 77 (ETH)
	// "0x645587121c53ca14c8BD4cD43047C57FEeF616fE", // account 78 (ETH)
	// "0xafE1A7B31d5C3Ec9032A93811873Dbbe13e1D43c", // account 79 (ETH)
	// "0xcF27114d0460673E6e241bADB62EE48D1187dB3d", // account 80 (ETH)

    // rasperry pi
	// "0xEea8C9655Cc474eD9bc38A1706a54906f21B064E", // account 81 (ETH)
	// "0xdD3898935970Aa2fBa378Ab7993255860d48442c", // account 82 (ETH)
	// "0x21174F9D2067C903C593eFE1997b6E8a0785cfeb", // account 83 (ETH)
	// "0xdd4354cE6420B50eF8604d7101449A83bd20C076", // account 84 (ETH)
	// "0x5A872d86c93f9248d19B48b0269C9Bb98Fb98ACd", // account 85 (ETH)
	// "0x7262A938605CE7349f0A01F14d8ebAf65C906Cbd", // account 86 (ETH)
	// "0x52DA92396830ac5cE4F6A58A065663f1Ae9333DD", // account 87 (ETH)
	// "0x72bb044aD988733c80C4ed10a65336e55351AB36", // account 88 (ETH)
	// "0xC359dFF17A0058f56C20953a96c9De539B8eb0E8", // account 89 (ETH)
	// "0xe17F73A885A974D9ae22A16769eC96Ba9282C4a3", // account 90 (ETH)
	// "0x61Fc8edf761B18b75202c82F264deFf63012035C", // account 91 (ETH)
	// "0x536BB05B2BbFaA188bd2DD46c0aCF4A27346891a", // account 92 (ETH)
	// "0x171cd4bdE014567E0A27a8D73575696f301E81C5", // account 93 (ETH)
	// "0xbBDd33b84EB6889016734D97e41B9F32AEf53a73", // account 94 (ETH)
	// "0xcDF7aCCAce75519ada68249Ea610D962753F7284", // account 95 (ETH)
	// "0x6ead2e0c39232F4328abc9D7028A62681Fe5Bf28", // account 96 (ETH)
	// "0x9349654C92fe0771a488E69F5D102300612B1Ec1", // account 97 (ETH)
	// "0xB9a5e1668262AF35c1EeCC10D4D87fDe053Fb532", // account 98 (ETH)
	// "0xaCd79563e61A0c44bCB69F0f876D0E9974801f6b", // account 99 (ETH)
	// "0x99a248Dac698CFa0c18e8aaea0D77C19AFAdb0C1", // account 100 (ETH)

    // unallocated
	// "0xBc214D794Cf4C850CCCCE9f736985882bbfeE13F", // account 101 (ETH)
	// "0xacD989AAC5CbeA9b515732EB09F56FeCdE1117a8", // account 102 (ETH)
	// "0xd4e60Bd07e47C9a7cEB278d692ff09E3296974Fc", // account 103 (ETH)
	// "0xA95b48c5c4c8B731191Bb1807b01c0280bb640D4", // account 104 (ETH)
	// "0x5f3961f997351090f90e5055e3c185679aF8ddE0", // account 105 (ETH)
	// "0xc562c7d8221e7D60717ae716651c7E2067BE9D14", // account 106 (ETH)
	// "0x5A906034D95A2472E2BdFE9f5cB04Ac608fdC9dd", // account 107 (ETH)
	// "0x01A5b2a45CF27B46791711684389070F5c922031", // account 108 (ETH)
	// "0x6Ba4f5e04B27E0d40f1CF9355AcE9980bEb1cCb6", // account 109 (ETH)
	// "0xcdFF3482BB6d5e093bfD0Bc616adf42c7a99F3E1", // account 110 (ETH)
	// "0xA5E332f13C9956949E513Ef960AcB9987d8d0167", // account 111 (ETH)
	// "0x3c7e27b926ff09bE00A9f3Fde93d39390DB28500", // account 112 (ETH)
	// "0x987074A69E6c58F9e926F672F4548a9f9FD3d2B8", // account 113 (ETH)
	// "0xA174Ad4B938d81efA572AEa04250d62FA0fd0274", // account 114 (ETH)
	// "0xF660F7a99d2AbE64925a565D12ed00b6c51865b4", // account 115 (ETH)
	// "0xFfDeb1875A30740Ba857CA473958CF04C9DBf6Ba", // account 116 (ETH)
	// "0x4106C80fDAD7F173F32Bc54307a0CC9ac6970fb3", // account 117 (ETH)
	// "0xE7ec69D9e9eCF86582B8948C0023311850B79b1a", // account 118 (ETH)
	// "0x4e1b20a3775203f38643F3AD76Dfb5056465e38a", // account 119 (ETH)
	// "0x53ff0685AbD7Debc680Fd13840CE49eFDf18257a", // account 120 (ETH)
	// "0xc25f2a603a5353A213F8DAE142Ce7FFCF3D33b60", // account 121 (ETH)
	// "0xb4A973f9192a0A3dfC59E00B622dF977A95CEB29", // account 122 (ETH)
	// "0xEe232041eef20E1FEc6Eb43A10bC82719Fa1c44a", // account 123 (ETH)
	// "0xCc105A7e10CD633AcEF27455f113817Dd83C6737", // account 124 (ETH)
	// "0x79e55Ef388E15dd8CAbE0a66Fefa5d6c759F301B", // account 125 (ETH)
	// "0xFDcED5abAfeCF764cD8a630b42Bc8B6Fc4109c3d", // account 126 (ETH)
	// "0x73f11b05016Aa448EFF59644E87CDB565c784D6E", // account 127 (ETH)
	// "0xB2807EAe2b16Ad3f92C52c14A127ace3f85A5209", // account 128 (ETH)
	// "0x0Df0D9eA169189ff60260E6B5289688EaF202783", // account 129 (ETH)
	// "0xeffF6e807756aae700bE0f37933cEDD50E7720E2", // account 130 (ETH)
	// "0x0b0Fb1e9d567341C9013bA7B10d23620a426E96c", // account 131 (ETH)
	// "0xf352289Bb35C51a2EbD2d6c309b24e04afD7528a", // account 132 (ETH)
	// "0xd2dAfD64b821292b75c35Ced2bEcE3FEF4cCFcA6", // account 133 (ETH)
	// "0x2b34D94E42cDa2CddBDBb7557733A96B8B58739e", // account 134 (ETH)
	// "0x47c9972C32EC710D11094A71eEc1608eD69A37B0", // account 135 (ETH)
	// "0x32d157d5B1244d5e718aeD40103F728eeA006A90", // account 136 (ETH)
	// "0x6Db2A6Cc2B969959a409d4B745F94cFf855F2bC4", // account 137 (ETH)
	// "0xa5cAa36B4B1619eccBc0C4916500B0939ed113BE", // account 138 (ETH)
	// "0x3381DFFc48893FC0C242b11aA46B0Da5674BDD38", // account 139 (ETH)
	// "0x3C958E5E105cE7090BDEaeb384B1B077671e7d85", // account 140 (ETH)

];
async function start() {
    const promises = [] as Promise<void>[];
    for(let i = 0; i < walletAddresses.length; i++) {
        promises.push((async () => {
            const walletAddress = walletAddresses[i];
            const { promise, timeMs } = Timer.sleepRandom(0, 30 * Time.MINUTE);
            console.log(`${walletAddress}: Start first sleeping for ${timeMs / Time.SECOND} seconds`);
            await promise;

            const MIN_REST_PERIOD = 6 * Time.HOUR;
            const MAX_REST_PERIOD = 9 * Time.HOUR;
            let currentRestTime = Date.now();
            const ERROR_THRESHHOLD = 10;
            let countError = 0;

            while(true) {
                const nowUnix = Date.now();
                const shouldRest = currentRestTime + 14 * Time.HOUR <= nowUnix && Math.random() > 0.5;

                if (shouldRest) {
                    // const sessions = await getUnclaimedRewards(walletAddress);
                    // if (sessions.data.length > 0) {
                    //     for (const session of sessions.data) {
                    //         await processMiningSession(session);
                    //     }
                    // }

                    console.log(`${walletAddress}: Start long resting period`);
                    const { promise, timeMs } = Timer.sleepRandom(MIN_REST_PERIOD, MAX_REST_PERIOD);
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
        weight: 3,
    }, {
        value: 6,
        weight: 4,
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
        weight: 3,
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
