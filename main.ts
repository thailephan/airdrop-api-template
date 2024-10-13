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
                    logger.info("Farming ended");
                    const startFarmingResponse = await this.startFarming();
                    farmingTimestamp = startFarmingResponse.farming.timestamp;
                    logger.info("Farming started");
                }
            } else {
                farmingTimestamp = accountResponse.farming.timestamp;
                logger.info("Farming in progress");
            }
        } else if (accountResponse.farming.state === "END") {
            logger.info("Farming ended");
            const startFarmingResponse = await this.startFarming();
            farmingTimestamp = startFarmingResponse.farming.timestamp;
            logger.info("Farming started");
        }


        const taskResponse = await this.getTasks();
        const uncompletedTasks = taskResponse.filter(task => !task.isDone);
        for (const task of uncompletedTasks) {
            // if (task.type === "quiz") {
            //     const claimResponse = await this.claimTask(task.id);
            //     logger.info("Claimed quiz task", claimResponse);
            // }
            if (task.type === "daily") {
                await Timer.sleep(20 * Time.SECOND);
                const accountResponse = await this.claimTask(task.id);
                logger.info("Claimed daily task", task.name);
                farmingTimestamp = accountResponse.farming.timestamp;
            } else {
                logger.info("Skipped daily task", task.name);
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

const users = [{
    proxy: undefined,
    initData: "query_id=AAFyEEJlAgAAAHIQQmV7498K&user=%7B%22id%22%3A5993795698%2C%22first_name%22%3A%22Thai%F0%9F%8C%B1SEED%22%2C%22last_name%22%3A%22Le%20%F0%9F%92%8ECR%20%F0%9F%9B%92%22%2C%22username%22%3A%22thailephan%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&auth_date=1728798015&hash=5fc43e026bd2095dd4ff9e279f2b8719d1830d728a33d060add2ff8fd2114674&tgWebAppVersion=7.10&tgWebAppPlatform=android&tgWebAppThemeParams={\"bg_color\":\"#212121\",\"button_color\":\"#8774e1\",\"button_text_color\":\"#ffffff\",\"hint_color\":\"#aaaaaa\",\"link_color\":\"#8774e1\",\"secondary_bg_color\":\"#181818\",\"text_color\":\"#ffffff\",\"header_bg_color\":\"#212121\",\"accent_text_color\":\"#8774e1\",\"section_bg_color\":\"#212121\",\"section_header_text_color\":\"#8774e1\",\"subtitle_text_color\":\"#aaaaaa\",\"destructive_text_color\":\"#ff595a\"}",
}] as UserData[];    
Main.start(users).then().catch(console.error);