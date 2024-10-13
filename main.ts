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
        console.log("Claimed:", claimResponse.data.data);

        const { boost_next_timestamp } = homeResponse.data.data;
        const now = Date.now() / 1000;
        if (boost_next_timestamp > now) {
            logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, "Not ready to claim yet");
            sleepTime = boost_next_timestamp - now + Helpers.generateRandomNumberInRange(5, 30);
            if (sleepTime !== -1 && sleepTime < 600) {
                await Timer.sleep(sleepTime * 1000);
                logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, "[boosting]", "Wait for", sleepTime, "s");
                const boostResponse = await this.boost();
                if (boostResponse.status !== 200) {
                    console.error("Failed to boost");
                } else {
                    console.log("Boosted:", boostResponse.data);
                }
            } 
        } else {
            const boostResponse = await this.boost();
            if (boostResponse.status !== 200) {
                console.error("Failed to boost");
            } else {
                console.log("Boosted:", boostResponse.data);
            }
        }

        // await from 1h to 2h
        if (sleepTime === -1) {
            sleepTime = Helpers.generateRandomNumberInRange(Time.HOUR, 2 * Time.HOUR);
        }

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
    proxy: "proxymart29181:tOgaGRME@157.66.12.181:29181",
    initData: "user=%7B%22id%22%3A6091532790%2C%22first_name%22%3A%22may%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%20%F0%9F%8C%B1SEED%20%F0%9F%90%B8%F0%9F%92%8ECR%22%2C%22username%22%3A%22xzvtglhp%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-3404785618990470863&start_param=5993795698&auth_date=1728704692&hash=d574241c52064529b0d495cd0923156e0d0f665fc457b67d7acb9bb1a619290c"
  },
  {
    proxy: "proxymart29519:BKKTgDcE@103.65.136.46:29519",
    initData: "user=%7B%22id%22%3A6083367699%2C%22first_name%22%3A%22may%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%20%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22tixhsqau%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-1346559142483713923&start_param=5993795698&auth_date=1728704694&hash=22994e3cc8a7b781866039a340c390ed978b8372e162004bb195cce92aa72fb7"
  },
  {
    proxy: "proxymart29519:BKKTgDcE@103.65.136.46:29519",
    initData: "user=%7B%22id%22%3A7172846926%2C%22first_name%22%3A%22may%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%20%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22myntafxs%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=6429454845711678994&start_param=5993795698&auth_date=1728704695&hash=16a55e87d3c8858e0cdfd55069892b20144892d0ccd48891fd00c0468d3c2911"
  },
  {
    proxy: "proxymart29365:kptWtmoD@36.50.132.123:29365",
    initData: "user=%7B%22id%22%3A7487128929%2C%22first_name%22%3A%22Liliana%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22Cacheta%F0%9F%8C%B1SEED%F0%9F%92%8ECR%22%2C%22username%22%3A%22liliana1ld%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-750200261062932036&start_param=5993795698&auth_date=1728704699&hash=aaac3be2f6ceaf31f5292027ba873a23963daa87d7fcc6aaa6eab6964782b48b"
  },
  {
    proxy: "proxymart29365:kptWtmoD@36.50.132.123:29365",
    initData: "user=%7B%22id%22%3A6594749785%2C%22first_name%22%3A%22Carlena%20Dool%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22carlena2l%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-491289100348415084&start_param=5993795698&auth_date=1728704701&hash=118189d9e181ec9a125484a62c3c76022ebbb99e8019e5cecb86964d670cd766"
  },
  {
    proxy: "proxymart29181:tOgaGRME@157.66.12.181:29181",
    initData: "user=%7B%22id%22%3A7274192019%2C%22first_name%22%3A%22Diane%22%2C%22last_name%22%3A%22Bradley%22%2C%22username%22%3A%22DianeBradley2010%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=4925329964673632414&start_param=5993795698&auth_date=1728704808&hash=19c7e31ceac423e80329ba7edd4a8c001f549385a421f57ca389737b9b13c92e"
  },
  {
    proxy: "proxymart29209:yjVfRpvG@103.236.175.111:29209",
    initData: "user=%7B%22id%22%3A7162231983%2C%22first_name%22%3A%22C%E1%BA%A9m%20hi%E1%BB%81n%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22Ph%E1%BA%A1m%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22cri70281vzj%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-7368950157918251304&start_param=5993795698&auth_date=1728704809&hash=98f842a8766eac8edef402fdf10f5081acd217ada31e90e2d722a50453398601"
  },
  {
    proxy: "proxymart29209:yjVfRpvG@103.236.175.111:29209",
    initData: "user=%7B%22id%22%3A7206351041%2C%22first_name%22%3A%22Summerslaverna%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22Dorriccug%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22krzfO39454%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=1486145791654986892&start_param=5993795698&auth_date=1728704691&hash=9f657a7d862ce505616f9d3b5c03b8603e17d9e852edd64d45bb6073c2c6a123"
  },
  {
    proxy: "proxymart29011:PWWnuvJU@36.50.133.11:29011",
    initData: "user=%7B%22id%22%3A7350116575%2C%22first_name%22%3A%22Reath%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22sDcDt94764%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-1514863516280952326&start_param=5993795698&auth_date=1728704806&hash=79d10df97016f0b335d818bd31bc92433368fe620d0ea2a7270e488a9f35f547" 
  },
  {
    proxy: undefined,
    initData: "user=%7B%22id%22%3A7038003725%2C%22first_name%22%3A%22Jarvis%20Hanel%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22javis1l%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=2266696486192387960&start_param=5993795698&auth_date=1728704810&hash=2a6a2ce065a7d9f0e953979fd52cadc7f0034d13e9249c47766604d6f602549e"
  },
  {
    proxy: "proxymart29011:PWWnuvJU@36.50.133.11:29011",
    initData: "user=%7B%22id%22%3A7396996476%2C%22first_name%22%3A%22mohamadreza.akbari%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%90%B0%F0%9F%A6%86%22%2C%22last_name%22%3A%22Ooo%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22cabibara1l%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-8089640310229241413&start_param=5993795698&auth_date=1728704811&hash=c2ae451f94f95c103cb672a62afc00c3a7ba4f518eeae20a177f7147871fe111" 
  },
  {
    proxy: undefined,
    initData: "user=%7B%22id%22%3A5993795698%2C%22first_name%22%3A%22Thai%F0%9F%8C%B1SEED%22%2C%22last_name%22%3A%22Le%20%F0%9F%92%8ECR%20%F0%9F%9B%92%22%2C%22username%22%3A%22thailephan%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=1179702508836320833&start_param=5993795698&auth_date=1728704812&hash=305cbaba427f94c1fdb63c495d72d220f87b8519c7667edb024dd8034dae3ade"
  },
  {
    proxy: "proxymart29102:WzUiihpd@36.50.236.102:29102",
    initData: "user=%7B%22id%22%3A7614128738%2C%22first_name%22%3A%22Marguerite%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22Tyrome%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22margueritetyrome%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-5997017450704012831&start_param=5993795698&auth_date=1728704907&hash=1ceb476d49025879dad1a5659daf31ac8b827de03606b80f948f365db0bac7c2"
  },
  {
    proxy: "proxymart29380:UpFsrDHL@36.50.133.72:29380",
    initData: "user=%7B%22id%22%3A7496050969%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22koscwivu%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=8934967708481290346&start_param=5993795698&auth_date=1728704911&hash=19d26fece029880019ba1b59db7186f93c314521811ec97f20816be002dc1a2a"
  },
  {
    proxy: "proxymart29380:UpFsrDHL@36.50.133.72:29380",
    initData: "user=%7B%22id%22%3A7055633313%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22mxznvqta%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=1287174829965320301&start_param=5993795698&auth_date=1728704909&hash=9eb8fda0f802d6e1d567964ce12f9a7b46aba969c1e384cec3ecab3f3912a131"
  },
  {
    proxy: "proxymart29048:IpcoDRzM@199.48.244.48:29048",
    initData: "user=%7B%22id%22%3A7295672761%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22bojlumdf%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-4140651204720600646&start_param=5993795698&auth_date=1728704918&hash=d0b52d8f266c5ced19afaebc5e12b711813673ddd4f4fbb390590afd23f322b0"
  },
  {
    proxy: "proxymart29048:IpcoDRzM@199.48.244.48:29048",
    initData: "user=%7B%22id%22%3A7052605861%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22jpnbmszd%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=2469098259305413951&start_param=5993795698&auth_date=1728704922&hash=94ca717ff399ac8b713d71ed658614e582a63aa0d895c7bf13a19addb1402511"
  },
  {
    proxy: "proxymart29262:PbvFBKuR@36.50.133.136:29262",
    initData: "user=%7B%22id%22%3A7373766374%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22fykdirtz%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=5366988681959951810&start_param=5993795698&auth_date=1728704917&hash=f83b0a21735aaf69891de145ec2fe7bbb0d99a4ac8eb04ec4045c6536e03cb59"
  },
  {
    proxy: "proxymart29262:PbvFBKuR@36.50.133.136:29262",
    initData: "user=%7B%22id%22%3A7138410111%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%220997%F0%9F%92%8ECR%22%2C%22username%22%3A%22qrtlkpja%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-4774232435406133379&start_param=5993795698&auth_date=1728704972&hash=1bdf8fe9c15e6a56de9439e2a3125849c771e2122bdf7f82609ff77e4ee4af08"
  },
  {
    proxy: "proxymart29102:WzUiihpd@36.50.236.102:29102",
    initData: "user=%7B%22id%22%3A7094522456%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%20%F0%9F%8C%B1SEED%F0%9F%92%8ECR%22%2C%22username%22%3A%22acsbpnxw%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=3289525953265492444&start_param=5993795698&auth_date=1728704983&hash=141848b902ab030f5d6b64dd96af170e06e0fea881955944d3c1f1c5e122ad0c"
  }
] as UserData[];    
Main.start(users).then().catch(console.error);