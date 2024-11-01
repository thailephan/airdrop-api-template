import { TelegramApplication } from "../../application.ts";
import { Helpers } from "../../common/helpers.ts";
import { logger } from "../../common/logger.ts";
import { Time, Timer } from "../../common/timer.ts";
import FetchHeaders from "../../services/headers/headers.ts";
import { AppProxyChecker } from "../../services/proxy/proxy-checker.ts";

class GameFetchHeaders extends FetchHeaders {
    constructor() {
        super();

        this.setKey("Origin", "https://web.dormint.io");
        this.setKey("Referer", "https://web.dormint.io/");
        this.setKey("Accept", "application/json, text/plain, */*");
        this.setKey("Content-Type", "application/json");
        this.setKey("user-agent", "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36");
        this.setKey("Connection", "keep-alive");
        this.setKey("Accept-Encoding", "gzip, deflate, br");
        this.setKey("Cache-Control", "no-cache");
        this.setKey("sec-ch-ua-mobile", "?1");
        this.setKey("sec-ch-ua-platform", "Android");
        this.setKey("sec-fetch-dest", "empty");
        this.setKey("sec-fetch-mode", "cors");
        this.setKey("sec-fetch-site", "cross-site");
        this.setKey("sec-gpc", "1");
    }
  }


class GameTelegramApplication extends TelegramApplication {
    headers: FetchHeaders;
    user: UserData;
    EXECUTION_INTERVAL: number = Time.HOUR * 8;

    constructor(user: UserData) {
        super(user.initData, user.proxy);
        this.user = user;
        this.appName = "dormint";
        this.headers = new GameFetchHeaders();
        this.setExecutionInterval(this.EXECUTION_INTERVAL + 20 * Time.MINUTE, this.EXECUTION_INTERVAL + 60 * Time.MINUTE);
    }

    async verify(): Promise<{ auth_token: string }> {
        const response = await fetch(`https://api-new.dormint.io/api/auth/telegram/verify?${this.initData}`, {
            headers: this.headers.get(),
            client: this.client,
            method: "GET",
        });

        if (response.status === 200) {
            return {
                auth_token: await response.text(),
            }
        }

        return {
            auth_token: "",
        }
    }

    async getFarmingStatus({ auth_token }: { auth_token: string }): Promise<{
        status: "ok" | "error"
        farming_status: "farming_status_finished" | "farming_status_started"
        farming_speed: number
        farming_time: number
        farming_value: number
        farming_left: number
        sleepcoin_balance: number
        health_rate: number
        strike: number
        has_new_quests: boolean
    }> {
        const response = await fetch("https://api-new.dormint.io/tg/farming/status", {
            method: "POST",
            headers: this.headers.get(),
            body: JSON.stringify({
                auth_token,
            }),
            client: this.client,
        });
        return response.json();
    }

    async startFarming({ auth_token }: { auth_token: string }): Promise<{
        status: "ok" | "error"
        farming_speed: number
        farming_time: number
        sleepcoin_balance: number
        health_rate: number
    }> {
        const response = await fetch("https://api-new.dormint.io/tg/farming/start", {
            headers: this.headers.get(),
            method: "POST",
            body: JSON.stringify({
                auth_token,
            }),
            client: this.client,
        });
        if (response.status === 200) {
            return response.json();
        }

        return {
            status: "error",
            farming_speed: 0,
            farming_time: 0,
            sleepcoin_balance: 0,
            health_rate: 0,
        }
    }

    override onExecutionStart(): { shouldStop: boolean; } {
        // if now > 24 oct 2024 20:00 then stop
        if (Date.now() > 1737733200000) {
            return { shouldStop: true };
        }
        return super.onExecutionStart();
    }
    override async onRunExecution(): Promise<void> {
        const { auth_token } = await this.verify();
        if (!auth_token) {
            this.log("Failed to verify", "error");
            return;
        }

        let executeInterval = this.EXECUTION_INTERVAL;
        const farmStatus = await this.getFarmingStatus({ auth_token });
        if (farmStatus.farming_status && farmStatus.farming_status === "farming_status_finished") {
            const startFarming = await this.startFarming({ auth_token });
            if (startFarming.status === "ok") {
                executeInterval = startFarming.farming_time * Time.SECOND;
                this.log(`Farming started. Speed: ${startFarming.farming_speed}, Time: ${(startFarming.farming_time * Time.SECOND) / Time.MINUTE} minutes, Sleepcoin: ${startFarming.sleepcoin_balance}, Health Rate: ${startFarming.health_rate}`, "info");
            } else {
                this.log("Failed to start farming", "error");
            }
        } else {
            this.log("Farming is already started", "info");
        }

        this.setExecutionInterval(executeInterval + 20 * Time.MINUTE, executeInterval + 60 * Time.MINUTE);
    }
}

interface UserData {
    initData: string;
    proxy?: string | undefined;
}
class Main {
    static async start(users: UserData[]) {
        const appProxyChecker = new AppProxyChecker();
        await Promise.all(users.map(async (user) => {
            const proxyIP = await appProxyChecker.check(user.proxy);
            // logger.info(user.userId, proxyIP); 
            if (proxyIP) {
                const application = new GameTelegramApplication(user);
                return application.execute();
            }
        }));
    }
}

const users = [
    {
        proxy: undefined,
        initData: "user=%7B%22id%22%3A5993795698%2C%22first_name%22%3A%22Thai%F0%9F%8C%B1SEED%22%2C%22last_name%22%3A%22Le%20%F0%9F%92%8ECR%20%F0%9F%8D%85%22%2C%22username%22%3A%22thailephan%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=4971010998574050272&start_param=ref_R3X2Z6UGB5ZBAQTFAEC6&auth_date=1729441251&hash=d998492602e96635a5ca3c69059a33ba2f5fa936dc68b2411b6aef11356cffdb"
    },
] as UserData[];
Main.start(users).then().catch(console.error);