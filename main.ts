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

        this.setExecutionInterval(30 * Time.MINUTE, 1 * Time.HOUR + 10 * Time.MINUTE);
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
    initData: "user=%7B%22id%22%3A8149102788%2C%22first_name%22%3A%22Anderson%20Amanda%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22andersonamandaw2938%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-2171138668366454794&start_param=5993795698&auth_date=1728832469&hash=af81b9a1132990ed1184bc7d392a9c7a13b54c6f2b013e04ab20d7fb9395bc0a"
  },
  {
    proxy: "proxymart29181:tOgaGRME@157.66.12.181:29181",
    initData: "user=%7B%22id%22%3A6091532790%2C%22first_name%22%3A%22may%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%20%F0%9F%8C%B1SEED%20%F0%9F%90%B8%F0%9F%92%8ECR%22%2C%22username%22%3A%22xzvtglhp%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-3404785618990470863&start_param=5993795698&auth_date=1728832479&hash=74674580f91b6ebf923b5dd81066be80c8f7119a86f436752516a9f1cd29c071"
  },
  {
    proxy: "proxymart29519:BKKTgDcE@103.65.136.46:29519",
    initData: "user=%7B%22id%22%3A6083367699%2C%22first_name%22%3A%22may%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%20%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22tixhsqau%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-1346559142483713923&start_param=5993795698&auth_date=1728832471&hash=a7c546f6c63b2091a034efe47102b18a278ebe7b65524d22777f5d301a447b52"
  },
  {
    proxy: "proxymart29519:BKKTgDcE@103.65.136.46:29519",
    initData: "user=%7B%22id%22%3A7172846926%2C%22first_name%22%3A%22may%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%20%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22myntafxs%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=6429454845711678994&start_param=5993795698&auth_date=1728832801&hash=01a6fbbaedebbb2810c81ffd733280a2aab45f110fe828408e949fd21255d67c"
  },
  {
    proxy: "proxymart29365:kptWtmoD@36.50.132.123:29365",
    initData: "user=%7B%22id%22%3A7487128929%2C%22first_name%22%3A%22Liliana%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22Cacheta%F0%9F%8C%B1SEED%F0%9F%92%8ECR%22%2C%22username%22%3A%22liliana1ld%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-750200261062932036&start_param=5993795698&auth_date=1728832483&hash=3f7a8a8b3a0cdeae3c78174759eef21af32f10d5630525e1264f93e040c6aae4"
  },
  {
    proxy: "proxymart29365:kptWtmoD@36.50.132.123:29365",
    initData: "user=%7B%22id%22%3A6594749785%2C%22first_name%22%3A%22Carlena%20Dool%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22carlena2l%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-491289100348415084&start_param=5993795698&auth_date=1728832487&hash=ee5324f55d4ccac7afcae6e84b6d24ac4be0c924b0e58053f20e90e0884d122d"
  },
  {
    proxy: "proxymart29181:tOgaGRME@157.66.12.181:29181",
    initData: "user=%7B%22id%22%3A7274192019%2C%22first_name%22%3A%22Diane%22%2C%22last_name%22%3A%22Bradley%22%2C%22username%22%3A%22DianeBradley2010%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=4925329964673632414&start_param=5993795698&auth_date=1728832487&hash=c1d18b471740d91f8c733d870f11f8338d068c73a2dfde1998979527df3ee4b6"
  },
  {
    proxy: "proxymart29209:yjVfRpvG@103.236.175.111:29209",
    initData: "user=%7B%22id%22%3A7162231983%2C%22first_name%22%3A%22C%E1%BA%A9m%20hi%E1%BB%81n%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22Ph%E1%BA%A1m%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22cri70281vzj%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-7368950157918251304&start_param=5993795698&auth_date=1728832508&hash=078d7be78cd0eb4cbca363820e63c0946de2a35e3f435fec2a0f50528029c441"
  },
  {
    proxy: "proxymart29209:yjVfRpvG@103.236.175.111:29209",
    initData: "user=%7B%22id%22%3A7206351041%2C%22first_name%22%3A%22Summerslaverna%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22Dorriccug%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22krzfO39454%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=1486145791654986892&start_param=5993795698&auth_date=1728832508&hash=04cae8472cecb3d802f410be045a76e1d447790778605d15b850df578a3767fc"
  },
  {
    proxy: "proxymart29011:PWWnuvJU@36.50.133.11:29011",
    initData: "user=%7B%22id%22%3A7350116575%2C%22first_name%22%3A%22Reath%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22sDcDt94764%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-1514863516280952326&start_param=5993795698&auth_date=1728832484&hash=a9966e69300bfd8b2cb5fa0452a061c412b778039a4d801a383428fe95718699" 
  },
  {
    proxy: undefined,
    initData: "user=%7B%22id%22%3A7038003725%2C%22first_name%22%3A%22Jarvis%20Hanel%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22javis1l%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=2266696486192387960&start_param=5993795698&auth_date=1728832568&hash=36dbd1a5db481b2ca49f63e77a04ed2e3e77facba1b1d3ef86c88b17a7be229b"
  },
  {
    proxy: "proxymart29011:PWWnuvJU@36.50.133.11:29011",
    initData: "user=%7B%22id%22%3A7396996476%2C%22first_name%22%3A%22mohamadreza.akbari%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%90%B0%F0%9F%A6%86%22%2C%22last_name%22%3A%22Ooo%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22cabibara1l%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-8089640310229241413&start_param=5993795698&auth_date=1728832604&hash=f59061e57ea86359a8dc8f971795a19b71b255776b2f8e4131fbe8848133f88c" 
  },
  {
    proxy: undefined,
    initData: "user=%7B%22id%22%3A5993795698%2C%22first_name%22%3A%22Thai%F0%9F%8C%B1SEED%22%2C%22last_name%22%3A%22Le%20%F0%9F%92%8ECR%20%F0%9F%9B%92%22%2C%22username%22%3A%22thailephan%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=1179702508836320833&start_param=5993795698&auth_date=1728832605&hash=7efedc79fbd91d95db087bf397cc6e4f95918784d0819ed98b2181e8dbc44f8a"
  },
  {
    proxy: "proxymart29102:WzUiihpd@36.50.236.102:29102",
    initData: "user=%7B%22id%22%3A7614128738%2C%22first_name%22%3A%22Marguerite%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22Tyrome%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22margueritetyrome%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-5997017450704012831&start_param=5993795698&auth_date=1728832615&hash=931d21bc46527f4329395a6574040e4fcad7a50eb0d94afe8577636029772ed6"
  },
  {
    proxy: "proxymart29380:UpFsrDHL@36.50.133.72:29380",
    initData: "user=%7B%22id%22%3A7496050969%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22koscwivu%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=8934967708481290346&start_param=5993795698&auth_date=1728832611&hash=e628e82c4096c9d5592f141687db7a15976ce846118054f0f2ee13d657deab7d"
  },
  {
    proxy: "proxymart29380:UpFsrDHL@36.50.133.72:29380",
    initData: "user=%7B%22id%22%3A7055633313%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22mxznvqta%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=1287174829965320301&start_param=5993795698&auth_date=1728832617&hash=1d461ffc59b3aacd2d1238daaf0f00eba59ebf5d0742397f22c042f0a04d84d9"
  },
  {
    proxy: "proxymart29048:IpcoDRzM@199.48.244.48:29048",
    initData: "user=%7B%22id%22%3A7295672761%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22bojlumdf%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-4140651204720600646&start_param=5993795698&auth_date=1728832623&hash=9b9f6c70e65533f52b514ac467c9bb8ba28098c7eb346a2b7b34659f2e9a93c9"
  },
  {
    proxy: "proxymart29048:IpcoDRzM@199.48.244.48:29048",
    initData: "user=%7B%22id%22%3A7052605861%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22jpnbmszd%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=2469098259305413951&start_param=5993795698&auth_date=1728832633&hash=04dbca06ec467b131ca1f91c23af3ff9e974ebe3a518bfd05e9e8b9309df2a69"
  },
  {
    proxy: "proxymart29262:PbvFBKuR@36.50.133.136:29262",
    initData: "user=%7B%22id%22%3A7373766374%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22fykdirtz%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=5366988681959951810&start_param=5993795698&auth_date=1728832640&hash=bde68b8d557bd187ed5bdf6dcc1115715c9c5f54ea92f6c619153b858bfcefb6"
  },
  {
    proxy: "proxymart29262:PbvFBKuR@36.50.133.136:29262",
    initData: "user=%7B%22id%22%3A7138410111%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%220997%F0%9F%92%8ECR%22%2C%22username%22%3A%22qrtlkpja%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-4774232435406133379&start_param=5993795698&auth_date=1728832636&hash=e373bf813ac93fb81741121d9ee10b1ada3f6cddf1aaba61c682275986686319"
  },
  {
    proxy: "proxymart29102:WzUiihpd@36.50.236.102:29102",
    initData: "user=%7B%22id%22%3A7094522456%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%20%F0%9F%8C%B1SEED%F0%9F%92%8ECR%22%2C%22username%22%3A%22acsbpnxw%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=3289525953265492444&start_param=5993795698&auth_date=1728832657&hash=14712983862dd15ff4d68a0ac69a39c8d19876d230aec98bdd5b973a8941a4e1"
  }
] as UserData[];    
Main.start(users).then().catch(console.error);