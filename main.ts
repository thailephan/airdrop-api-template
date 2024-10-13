import FetchHeaders from "./services/headers/headers.ts";
import { TelegramApplication } from "./application.ts";
import { logger } from "./common/logger.ts";
import { AppProxyChecker } from "./services/proxy/proxy-checker.ts";
import { InitDataExtractor } from "./common/initData.ts";
import { Time, Timer } from "./common/timer.ts";

class GameFetchHeaders extends FetchHeaders {
    constructor() {
        super();
        this.setKey("Origin", "https://tma.cryptorank.io");
        this.setKey("Referer","https://tma.cryptorank.io/");
    }
}

interface AccountResponse {
  balance: number
  farming: AccountFarming
  dailyBonus: number
  wallet: string
}
interface AccountFarming {
  state: "START" | "END";
  timestamp: number;
}

type TaskResponse = TaskItem[];
export interface TaskItem {
  id: string
  name: string
  group: string
  type: "daily" | "quiz"
  reward: number
  linkUrl?: string
  iconUrl: string
  isDone: boolean
  storyText: any
  storyMediaFileUrl: any
  question?: TaskQuestion
  dailySequence?: number
}
export interface TaskQuestion {
  id: string
  text: string
  cryptorankUrl: string
  options: TaskOption[]
}
export interface TaskOption {
  id: string
  text: string
}

class GameTelegramApplication extends TelegramApplication {
    FARMING_INTERVAL = Time.HOUR * 6;
    headers: FetchHeaders;

    constructor(initData: string, proxy?: string) {
        super(initData, proxy);
        this.appName = "cryptorank";
        this.headers = new GameFetchHeaders();
    }
    async account(): Promise<AccountResponse> {
        const response = await fetch("https://api.cryptorank.io/v0/tma/account", {
        "headers": this.headers.get(),
        "method": "GET"
        });
        return response.json();
    }
    async startFarming(): Promise<AccountResponse> {
        const response = await fetch("https://api.cryptorank.io/v0/tma/account/start-farming", {
            "headers": this.headers.get(),
            "body": JSON.stringify({ }),
            "method": "POST"
        });
        return response.json();
    }
    async endFarming(): Promise<AccountResponse> {
        const response = await fetch("https://api.cryptorank.io/v0/tma/account/end-farming", {
            "headers": this.headers.get(),
            "body": JSON.stringify({ }),
            "method": "POST"
        });
        return response.json();
    }
    async getTasks(): Promise<TaskResponse> {
        const response = await fetch("https://api.cryptorank.io/v0/tma/account/tasks", {
            headers: this.headers.get(),
            method: "GET",
        })
        return response.json();
    }
    async claimTask(taskId: string): Promise<AccountResponse> {
        const response = await fetch(`https://api.cryptorank.io/v0/tma/account/claim/task/${taskId}`, {
            headers: this.headers.get(),
            body: JSON.stringify({ }),
            method: "POST",
        });
        return response.json();
    }

    override onExecutionStart(): { shouldStop: boolean; } {
        this.setExecutionInterval(this.FARMING_INTERVAL + 10 * Time.MINUTE, this.FARMING_INTERVAL + 15 * Time.MINUTE);
        return super.onExecutionStart();
    }
    override async onRunExecution(): Promise<void> {
        // @ts-ignore
        delete this.extractedInitData?.tgWebAppVersion;
        // @ts-ignore
        delete this.extractedInitData?.tgWebAppPlatform;
        // @ts-ignore
        delete this.extractedInitData?.tgWebAppThemeParams;

        const token = btoa(unescape(encodeURIComponent(JSON.stringify(this.extractedInitData))));
        this.headers.setKey("authorization", token);

        let farmingTimestamp = -1;
        const accountResponse = await this.account();
        if (accountResponse.farming.state === "START") {
            if (accountResponse.farming.timestamp < Date.now() - this.FARMING_INTERVAL) {
                const endFarmingResponse = await this.endFarming();
                if (endFarmingResponse.farming.state === "END") {
                    logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, "Farming ended");
                    const startFarmingResponse = await this.startFarming();
                    farmingTimestamp = startFarmingResponse.farming.timestamp;
                    logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, "Farming started");
                }
            } else {
                farmingTimestamp = accountResponse.farming.timestamp;
                logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, "Farming in progress");
            }
        } else if (accountResponse.farming.state === "END") {
            logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, "Farming ended");
            const startFarmingResponse = await this.startFarming();
            farmingTimestamp = startFarmingResponse.farming.timestamp;
            logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, "Farming started");
        }


        const taskResponse = await this.getTasks();
        const uncompletedTasks = taskResponse.filter(task => !task.isDone);
        for (const task of uncompletedTasks) {
            // if (task.type === "quiz") {
            //     const claimResponse = await this.claimTask(task.id);
            //     logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, "Claimed quiz task", claimResponse);
            // }
            if (task.type === "daily") {
                await Timer.sleep(20 * Time.SECOND);
                const accountResponse = await this.claimTask(task.id);
                logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, "Claimed daily task", task.name);
                farmingTimestamp = accountResponse.farming.timestamp;
            } else {
                logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, "Skipped daily task", task.name);
            }
        }

        if (farmingTimestamp > 0) {
            const diff = Date.now() - farmingTimestamp;
            const nextExecution = this.FARMING_INTERVAL - diff;
            this.setExecutionInterval(nextExecution + 2 * Time.MINUTE, nextExecution + 10 * Time.MINUTE);
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
    proxy: "proxymart49580:osknCMky@103.241.199.82:49580",
    initData: "user=%7B%22id%22%3A8149102788%2C%22first_name%22%3A%22Anderson%20Amanda%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22andersonamandaw2938%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=6496698772760189928&start_param=ref_5993795698_&auth_date=1728827126&hash=593511c3bc1016d79881b37d95e19c78a83f3dff1faa73758eba05c89e673a6d"
  },
  {
    proxy: "proxymart29181:tOgaGRME@157.66.12.181:29181",
    initData: "user=%7B%22id%22%3A6091532790%2C%22first_name%22%3A%22may%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%20%F0%9F%8C%B1SEED%20%F0%9F%90%B8%F0%9F%92%8ECR%22%2C%22username%22%3A%22xzvtglhp%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=2502527499840898777&start_param=ref_5993795698_&auth_date=1728827129&hash=e9753b571a651623ae36b197ffe7f3a8f6f0b9b8bfd347a576c19f111da29f6f"
  },
  {
    proxy: "proxymart29519:BKKTgDcE@103.65.136.46:29519",
    initData: "user=%7B%22id%22%3A6083367699%2C%22first_name%22%3A%22may%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%20%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22tixhsqau%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=3553426016459579236&start_param=ref_5993795698_&auth_date=1728827140&hash=3d5b60018d242e6c7e9ab448a381b49d90158afece1d329777157339a14d8fdc"
  },
  {
    proxy: "proxymart29519:BKKTgDcE@103.65.136.46:29519",
    initData: "user=%7B%22id%22%3A7172846926%2C%22first_name%22%3A%22may%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%20%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22myntafxs%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-3540188002516447553&start_param=ref_5993795698_&auth_date=1728827134&hash=cabcfc721fbf729573ffdd12b2033e03f0ca9275fe7987ff5e37a9f602a3e628"
  },
  {
    proxy: "proxymart29365:kptWtmoD@36.50.132.123:29365",
    initData: "user=%7B%22id%22%3A7487128929%2C%22first_name%22%3A%22Liliana%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22Cacheta%F0%9F%8C%B1SEED%F0%9F%92%8ECR%22%2C%22username%22%3A%22liliana1ld%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-5853263539007415799&start_param=ref_5993795698_&auth_date=1728827128&hash=c76e157034dc50eeadf5c7468de1218224bf1401a0714c87a7afa72ebfc61b8c"
  },
  {
    proxy: "proxymart29365:kptWtmoD@36.50.132.123:29365",
    initData: "user=%7B%22id%22%3A6594749785%2C%22first_name%22%3A%22Carlena%20Dool%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22carlena2l%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-9120061866689149931&start_param=ref_5993795698_&auth_date=1728827148&hash=d3262a52a0f19b56f30f01dbd512e00ed414eab264760b502e8732d717a2c92e"
  },
  {
    proxy: "proxymart29181:tOgaGRME@157.66.12.181:29181",
    initData: "user=%7B%22id%22%3A7274192019%2C%22first_name%22%3A%22Diane%22%2C%22last_name%22%3A%22Bradley%22%2C%22username%22%3A%22DianeBradley2010%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=1997259617478038735&start_param=ref_5993795698_&auth_date=1728827143&hash=9c020895a2437a7005cf24d410f9d5bdeaaef8c7a43365e28d16bb225fc89a40"
  },
  {
    proxy: "proxymart29209:yjVfRpvG@103.236.175.111:29209",
    initData: "user=%7B%22id%22%3A7162231983%2C%22first_name%22%3A%22C%E1%BA%A9m%20hi%E1%BB%81n%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22Ph%E1%BA%A1m%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22cri70281vzj%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=2191597462379943076&start_param=ref_5993795698_&auth_date=1728827145&hash=d2db5437e1b5408ceb5fce3247742ded2c0ea5c2f739a84cac7732ad2f653a75"
  },
  {
    proxy: "proxymart29209:yjVfRpvG@103.236.175.111:29209",
    initData: "user=%7B%22id%22%3A7206351041%2C%22first_name%22%3A%22Summerslaverna%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22Dorriccug%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22krzfO39454%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-4912276763079028360&start_param=ref_5993795698_&auth_date=1728827149&hash=a202908db03932d76c47b8a43f645950e6e11b1e0252a5ec5cb341a10c257015"
  },
  {
    proxy: "proxymart29011:PWWnuvJU@36.50.133.11:29011",
    initData: "user=%7B%22id%22%3A7350116575%2C%22first_name%22%3A%22Reath%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22sDcDt94764%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-6897609843930620244&start_param=ref_5993795698_&auth_date=1728827150&hash=a2283b4e97f62ce74fd66d1d2bcb1d69a8af5439d65c7c89b2440354148d34ab"
  },
  {
    proxy: undefined,
    initData: "user=%7B%22id%22%3A7038003725%2C%22first_name%22%3A%22Jarvis%20Hanel%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22javis1l%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=3719143537129367217&start_param=ref_5993795698_&auth_date=1728827351&hash=ceefcff30f895551d741cc1bc4c990f64ddc8e5e9971d53a7c4a1ac30a8a029e"
  },
  {
    proxy: "proxymart29011:PWWnuvJU@36.50.133.11:29011",
    initData: "user=%7B%22id%22%3A7396996476%2C%22first_name%22%3A%22mohamadreza.akbari%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%90%B0%F0%9F%A6%86%22%2C%22last_name%22%3A%22Ooo%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22cabibara1l%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=6672021634385703189&start_param=ref_5993795698_&auth_date=1728827257&hash=47199de27cd1fe052e7f18dbf50b71cf9dfcc6472551d20688c66e075beea820"
  },
  {
    proxy: undefined,
    initData: "user=%7B%22id%22%3A5993795698%2C%22first_name%22%3A%22Thai%F0%9F%8C%B1SEED%22%2C%22last_name%22%3A%22Le%20%F0%9F%92%8ECR%20%F0%9F%9B%92%22%2C%22username%22%3A%22thailephan%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=7766315537478427368&start_param=ref_5993795698_&auth_date=1728827332&hash=f328f191b6d83b173858521aa9220a9e6cb1441000db37c4ad863757cdfa1403"
  },
  {
    proxy: "proxymart29102:WzUiihpd@36.50.236.102:29102",
    initData: "user=%7B%22id%22%3A7614128738%2C%22first_name%22%3A%22Marguerite%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22Tyrome%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22margueritetyrome%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=7935756350174946651&start_param=ref_5993795698_&auth_date=1728827259&hash=7438457ae0317266ba9dee8b460f0b6c35b3b999e0706c6a51e47d49fa0b9ce7"
  },
  {
    proxy: "proxymart29380:UpFsrDHL@36.50.133.72:29380",
    initData: "user=%7B%22id%22%3A7496050969%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22koscwivu%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-704477293645349290&start_param=ref_5993795698_&auth_date=1728827259&hash=73caa143d1c15ef64db282fe2a57c190ca44ce87f3a108350cfbbb8938798416"
  },
  {
    proxy: "proxymart29380:UpFsrDHL@36.50.133.72:29380",
    initData: "user=%7B%22id%22%3A7055633313%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22mxznvqta%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-1737835040899099179&start_param=ref_5993795698_&auth_date=1728827259&hash=9db9e6e7a9f3dbfc85014e5a59bf2aa4bf0f0dcfc4537e845db1e061a59b241d"
  },
  {
    proxy: "proxymart29048:IpcoDRzM@199.48.244.48:29048",
    initData: "user=%7B%22id%22%3A7295672761%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22bojlumdf%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-4754190399030878572&start_param=ref_5993795698_&auth_date=1728827271&hash=0c5e953c69d5f94482897379fbfb040a57177a6771bacbd85a03e9a6acd473a6"
  },
  {
    proxy: "proxymart29048:IpcoDRzM@199.48.244.48:29048",
    initData: "user=%7B%22id%22%3A7052605861%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22jpnbmszd%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-5938810563497994350&start_param=ref_5993795698_&auth_date=1728827281&hash=f68321979a7396d1177e358297f43b2f15627105a4e896a1e5b1ac1b801590d4"
  },
  {
    proxy: "proxymart29262:PbvFBKuR@36.50.133.136:29262",
    initData: "user=%7B%22id%22%3A7373766374%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22fykdirtz%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-3301686700069698869&start_param=ref_5993795698_&auth_date=1728827274&hash=7e9179477084a1c439a91a15c911adf1843aa48052cf127200155c101c9339e4"
  },
  {
    proxy: "proxymart29262:PbvFBKuR@36.50.133.136:29262",
    initData: "user=%7B%22id%22%3A7138410111%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%220997%F0%9F%92%8ECR%22%2C%22username%22%3A%22qrtlkpja%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-8683531226489341946&start_param=ref_5993795698_&auth_date=1728827275&hash=7205b4da8c2b8a3f7cba321453fce9cbe72bb838301bd3776fb5abbe21ab2183"
  }
] as UserData[];    
Main.start(users).then().catch(console.error);