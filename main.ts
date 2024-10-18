import FetchHeaders from "./services/headers/headers.ts";
import { TelegramApplication } from "./application.ts";
import { logger } from "./common/logger.ts";
import { AppProxyChecker } from "./services/proxy/proxy-checker.ts";
import { InitDataExtractor } from "./common/initData.ts";
import { Time, Timer } from "./common/timer.ts";
import { Helpers } from "./common/helpers.ts";

class GameFetchHeaders extends FetchHeaders {
    constructor() {
        super();
        this.setKey("Origin","https://d2kpeuq6fthlg5.cloudfront.net");
        this.setKey("Referer","https://d2kpeuq6fthlg5.cloudfront.net/");
    }
}

export interface LoginResponse {
  status_code: number
  message: string
  errors: any
  data: LoginResponseData
}
export interface LoginResponseData {
  access_token: string
  type_token: string
  user: GumartTelegramUser
  is_first: number
  claim_timestamp: number
}
export interface GumartTelegramUser {
  telegram_id: number
  username: string
  tlg_age: number
  tlg_age_point: number
  tlg_rare_name: number
  tlg_rare_name_point: number
  tlg_premium: number
  tlg_premium_percent: number
  tlg_activity: number
  tlg_activity_point: number
  total_gum: number
  invite_url: string
  avatar: string
  is_first: number
}


class GameTelegramApplication extends TelegramApplication {
    headers: FetchHeaders;

    constructor(initData: string, proxy?: string) {
        super(initData, proxy);
        this.appName = "gumart";
        this.headers = new GameFetchHeaders();
        this.setExecutionInterval(2 * Time.HOUR, 2 * Time.HOUR + 10 * Time.MINUTE);
        this.setMaxRetry(10);
    }

    async login(): Promise<LoginResponse> {
        const body = JSON.stringify({
            telegram_data: this.initData,
            ref_id: null,
            mode: null,
            g_recaptcha_response: null 
        })
        const response = await fetch("https://api.gumart.click/api/login", {
            method: "POST",
            "headers": this.headers.get(),
            body,
            client: this.client,
        })
        return response.json();
    }
    async home() {
        const res = await fetch("https://api.gumart.click/api/home", {
            "headers": this.headers.get(),
            "referrer": "https://d2kpeuq6fthlg5.cloudfront.net/",
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": null,
            "method": "GET",
            "mode": "cors",
            "credentials": "include"
        });
        const json = await res.json()
        return {
            success: res.ok,
            status: res.status,
            data: json, // { data: { boost, boost_end_timestamp, boost_next_timestamp, mint_speed }, errors, message, status_code }
        };
    }
    async boost() {
        const res = await fetch("https://api.gumart.click/api/boost", {
            "headers": this.headers.get(),
            "referrer": "https://d2kpeuq6fthlg5.cloudfront.net/",
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": null,
            "method": "POST",
            "mode": "cors",
            "credentials": "include"
        });
        const json = await res.json();

        return {
            success: res.ok,
            status: res.status,
            data: json, // 
        }
    }
    async claim() {
        const res = await fetch("https://api.gumart.click/api/claim", {
            "headers": this.headers.get(),
            "referrer": "https://d2kpeuq6fthlg5.cloudfront.net/",
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": null,
            "method": "POST",
            "mode": "cors",
            "credentials": "include"
        });
        const json = await res.json();

        return {
            success: res.ok,
            status: res.status,
            data: json, // { data: { balance, claim_value }, errors, message, status_code }
        }
    }

    override async onRunExecution(): Promise<void> {
        let sleepTime = -1;
        const loginResponse = await this.login();
        if (loginResponse.status_code !== 200 || loginResponse.data.type_token !== "Bearer") {
          return;
        }
        this.headers.setKey("Authorization", `Bearer ${loginResponse.data.access_token}`);

        const homeResponse = await this.home();
        if (homeResponse.status !== 200) {
            throw new Error("Failed to get home");
        }

        const claimResponse = await this.claim();
        if (claimResponse.status !== 200) {
            throw new Error("Failed to claim");
        }
        if (claimResponse.data.errors) {
            throw new Error("Failed to claim: " + claimResponse.data.errors);
        }
        logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, "Claimed:", claimResponse.data.data);

        const { boost_next_timestamp } = homeResponse.data.data;
        const now = Date.now() / 1000;
        if (boost_next_timestamp > now) {
            logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, "Not ready to claim yet");
            sleepTime = boost_next_timestamp - now + Helpers.generateRandomNumberInRange(5, 30);
            if (sleepTime !== -1 && sleepTime < 600) {
                logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, "[boosting]", "Wait for", Math.ceil(sleepTime / Time.MINUTE), "mins");
                await Timer.sleep(sleepTime * 1000);
                const boostResponse = await this.boost();
                if (boostResponse.status !== 200) {
                  logger.error(`[${this.appName} ${this.extractedInitData?.user.username}]`, "[boosting]", "Failed to boost");
                } else {
                  logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, "[boosting]", "Boosted:", boostResponse.data);
                }
                sleepTime = -1;
            } 
        } else {
            const boostResponse = await this.boost();
            if (boostResponse.status !== 200) {
                console.error("Failed to boost");
            } else {
                console.log("Boosted:", boostResponse.data);
            }
        }

        this.setExecutionInterval(60 * Time.MINUTE, 1 * Time.HOUR + 50 * Time.MINUTE);
    }
}

interface UserData {
    proxy?: string | undefined;
    initData: string;
}
class Main {
    static async start(users: UserData[]) {
        const appProxyChecker = new AppProxyChecker();
        await Promise.all(users.map(async (user) => {
            const proxyIP = await appProxyChecker.check(user.proxy);
            logger.info(InitDataExtractor.extract(user.initData).user.username, proxyIP); 
            if (proxyIP) {
                const application = new GameTelegramApplication(user.initData, user.proxy);
                return application.execute();
            }
        }));
    }
}

const users = [
  {
    proxy: "proxymart49580:osknCMky@103.241.199.82:49580",
    initData: "user=%7B%22id%22%3A8149102788%2C%22first_name%22%3A%22Anderson%20Amanda%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22andersonamandaw2938%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-2171138668366454794&start_param=5993795698&auth_date=1729265706&hash=0d03e1d6057f5474709597e5ab11da68bd5c1ec56945184c673dffe336c53b3f"
  },
  {
    proxy: "proxymart29181:tOgaGRME@157.66.12.181:29181",
    initData: "user=%7B%22id%22%3A6091532790%2C%22first_name%22%3A%22may%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%20%F0%9F%8C%B1SEED%20%F0%9F%90%B8%F0%9F%92%8ECR%22%2C%22username%22%3A%22xzvtglhp%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-3404785618990470863&start_param=5993795698&auth_date=1729265712&hash=d702a8c8c38cd787baa211739766340600bd5ee523a9a02539802a7d2e941606"
  },
  {
    proxy: "proxymart29519:BKKTgDcE@103.65.136.46:29519",
    initData: "user=%7B%22id%22%3A6083367699%2C%22first_name%22%3A%22may%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%20%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22tixhsqau%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-1346559142483713923&start_param=5993795698&auth_date=1729265712&hash=5cd263e9990ed6ec75f4541229cfcef6dc5b8c6e4b174169ec6068ddf5b51cb1"
  },
  {
    proxy: "proxymart29519:BKKTgDcE@103.65.136.46:29519",
    initData: "user=%7B%22id%22%3A7172846926%2C%22first_name%22%3A%22may%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%20%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22myntafxs%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=6429454845711678994&start_param=5993795698&auth_date=1729265713&hash=5b77e73f0e88445945fe1e9c6a76ff366caf97cb9c81cb6bf2794e77ae7d0a1f"
  },
  {
    proxy: "proxymart29181:tOgaGRME@157.66.12.181:29181",
    initData: "user=%7B%22id%22%3A7274192019%2C%22first_name%22%3A%22Diane%22%2C%22last_name%22%3A%22Bradley%22%2C%22username%22%3A%22DianeBradley2010%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=4925329964673632414&start_param=5993795698&auth_date=1729265718&hash=08971514fe2a428c0ec628f67c9825f06818aab5f3cb4c81f5dfed86dc8e20d9"
  },
  {
    proxy: "proxymart29209:yjVfRpvG@103.236.175.111:29209",
    initData: "user=%7B%22id%22%3A7162231983%2C%22first_name%22%3A%22C%E1%BA%A9m%20hi%E1%BB%81n%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22Ph%E1%BA%A1m%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22cri70281vzj%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-7368950157918251304&start_param=5993795698&auth_date=1729265803&hash=e3b999aad44000dbe03beaa0fd24811cf3bc2fb4499662cbadfda6be2b370abd"
  },
  {
    proxy: "proxymart29209:yjVfRpvG@103.236.175.111:29209",
    initData: "user=%7B%22id%22%3A7206351041%2C%22first_name%22%3A%22Summerslaverna%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22Dorriccug%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22krzfO39454%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=1486145791654986892&start_param=5993795698&auth_date=1729265802&hash=60f9f06e649b18e8a66aa2b4452abb466a3ff08effb085b90aa94b8437bbc69a"
  },
  {
    proxy: "proxymart29011:PWWnuvJU@36.50.133.11:29011",
    initData: "user=%7B%22id%22%3A7350116575%2C%22first_name%22%3A%22Reath%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22sDcDt94764%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-1514863516280952326&start_param=5993795698&auth_date=1729265807&hash=892d9b2252fcaf5e722e0c072c00b52e786f0fc9ce1b55662c38a605936024f8" 
  },
  {
    proxy: undefined,
    initData: "user=%7B%22id%22%3A7038003725%2C%22first_name%22%3A%22Jarvis%20Hanel%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22javis1l%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=2266696486192387960&start_param=5993795698&auth_date=1729265804&hash=fc2417046492d2f4577f7844d46e44e799b18f7794d9a995bf0843ca4a233f07"
  },
  {
    proxy: "proxymart29011:PWWnuvJU@36.50.133.11:29011",
    initData: "user=%7B%22id%22%3A7396996476%2C%22first_name%22%3A%22mohamadreza.akbari%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%90%B0%F0%9F%A6%86%22%2C%22last_name%22%3A%22Ooo%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22cabibara1l%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-8089640310229241413&start_param=5993795698&auth_date=1729265705&hash=717989b7d5f4c8b7867bcb9e59554e489c85651e711ca3b062de7dc154128d31" 
  },
  {
    proxy: undefined,
    initData: "user=%7B%22id%22%3A5993795698%2C%22first_name%22%3A%22Thai%F0%9F%8C%B1SEED%22%2C%22last_name%22%3A%22Le%20%F0%9F%92%8ECR%20%F0%9F%9B%92%22%2C%22username%22%3A%22thailephan%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=1179702508836320833&start_param=5993795698&auth_date=1729265806&hash=0d1808da3d47bafb09a77859f79f899f6636c429190845bea636c88b09c8bb46"
  },
  {
    proxy: "proxymart29102:WzUiihpd@36.50.236.102:29102",
    initData: "user=%7B%22id%22%3A7614128738%2C%22first_name%22%3A%22Marguerite%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22Tyrome%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22margueritetyrome%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-5997017450704012831&start_param=5993795698&auth_date=1729265810&hash=e40325d0d591f5069c3ab62286ce87cff9a03ec3adfdf248b65434c48c368925"
  },
  {
    proxy: "proxymart29380:UpFsrDHL@36.50.133.72:29380",
    initData: "user=%7B%22id%22%3A7055633313%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22mxznvqta%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=1287174829965320301&start_param=5993795698&auth_date=1729265885&hash=eb63c452ad2099216a494c75fe26c368e2d49f47f31f5dc14404816ee62693a1"
  },
  {
    proxy: "proxymart29048:IpcoDRzM@199.48.244.48:29048",
    initData: "user=%7B%22id%22%3A7295672761%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22bojlumdf%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-4140651204720600646&start_param=5993795698&auth_date=1729265888&hash=12014136810ea39e23bec10e857df8d3071fbac9d00df74eac4d203f7d2fd145"
  },
  {
    proxy: "proxymart29048:IpcoDRzM@199.48.244.48:29048",
    initData: "user=%7B%22id%22%3A7052605861%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22jpnbmszd%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=2469098259305413951&start_param=5993795698&auth_date=1729265895&hash=c3a774a5e54ad5fb8781b4eed87f00c1bb804bb9802abe40becbf85390dd8fb7"
  },
  {
    proxy: "proxymart29262:PbvFBKuR@36.50.133.136:29262",
    initData: "user=%7B%22id%22%3A7138410111%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%220997%F0%9F%92%8ECR%22%2C%22username%22%3A%22qrtlkpja%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-4774232435406133379&start_param=5993795698&auth_date=1729267370&hash=af71a3758446e88a2c4b96496df76ebd6e1ed078c796c6fb451f9352b21f5619"
  },
  {
    proxy: "proxymart29102:WzUiihpd@36.50.236.102:29102",
    initData: "user=%7B%22id%22%3A7094522456%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%20%F0%9F%8C%B1SEED%F0%9F%92%8ECR%22%2C%22username%22%3A%22acsbpnxw%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=3289525953265492444&start_param=5993795698&auth_date=1729265895&hash=21b19f99d202119843dd3f845ce0fdca284c151d458be8bd38a7687a03cd0e3c"
  }
] as UserData[];    
Main.start(users).then().catch(console.error);