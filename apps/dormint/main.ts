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
        proxy: "proxymart49580:osknCMky@103.241.199.82:49580",
        initData: "user=%7B%22id%22%3A8149102788%2C%22first_name%22%3A%22Anderson%20Amanda%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22andersonamandaw2938%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-3703971940514588014&start_param=ref_R3X2Z6UGB5ZBAQTFAEC6&auth_date=1729441038&hash=6a5afef0e4ab470aec622704287257d60c45473e9c6b113d9447077e7166beba"
    },
    {
        proxy: "proxymart29181:tOgaGRME@157.66.12.181:29181",
        initData: "user=%7B%22id%22%3A6091532790%2C%22first_name%22%3A%22may%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%20%F0%9F%8C%B1SEED%20%F0%9F%90%B8%F0%9F%92%8ECR%22%2C%22username%22%3A%22xzvtglhp%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-8348679544558785065&start_param=ref_R3X2Z6UGB5ZBAQTFAEC6&auth_date=1729441046&hash=77a1ce0332c9034d21c3a3108400027f5cf61a33d635feffa7e8191b6e01f259"
    },
    {
        proxy: "proxymart29519:BKKTgDcE@103.65.136.46:29519",
        initData: "user=%7B%22id%22%3A6083367699%2C%22first_name%22%3A%22may%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%20%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22tixhsqau%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=3788779407970419428&start_param=ref_R3X2Z6UGB5ZBAQTFAEC6&auth_date=1729441042&hash=b7b1dc4334384363ded7760219b06e5dae81aa50351506569f97d38c9072cc6b"
    },
    {
        proxy: "proxymart29519:BKKTgDcE@103.65.136.46:29519",
        initData: "user=%7B%22id%22%3A7172846926%2C%22first_name%22%3A%22may%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%20%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22myntafxs%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=3880405589765825463&start_param=ref_R3X2Z6UGB5ZBAQTFAEC6&auth_date=1729441151&hash=119bfff9095878dfbd6c637f50c425bbb8f5ebbca053725543f058eacb6a5031"
    },
    {
        proxy: "proxymart29181:tOgaGRME@157.66.12.181:29181",
        initData: "user=%7B%22id%22%3A7274192019%2C%22first_name%22%3A%22Diane%22%2C%22last_name%22%3A%22Bradley%22%2C%22username%22%3A%22DianeBradley2010%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=3116353396174768994&start_param=ref_R3X2Z6UGB5ZBAQTFAEC6&auth_date=1729441040&hash=c916027f885533f4accaac87c830945943e745509dab5a89ca11d2eb616b1ac0"
    },
    {
        proxy: "proxymart29209:yjVfRpvG@103.236.175.111:29209",
        initData: "user=%7B%22id%22%3A7162231983%2C%22first_name%22%3A%22C%E1%BA%A9m%20hi%E1%BB%81n%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22Ph%E1%BA%A1m%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22cri70281vzj%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=1196069832047795450&start_param=ref_R3X2Z6UGB5ZBAQTFAEC6&auth_date=1729441150&hash=fb604a7d530cfd7831a35d832578f2932e0940a50d995498e7ad37b1fdf13b7c"
    },
    {
        proxy: "proxymart29209:yjVfRpvG@103.236.175.111:29209",
        initData: "user=%7B%22id%22%3A7206351041%2C%22first_name%22%3A%22Summerslaverna%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22Dorriccug%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22krzfO39454%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-7138876048337240336&start_param=ref_R3X2Z6UGB5ZBAQTFAEC6&auth_date=1729441464&hash=c655008a78275c77b03bf57a9dea3cc0c45729261ccf8f90463fa520e9ebf2f9"
    },
    {
        proxy: "proxymart29011:PWWnuvJU@36.50.133.11:29011",
        initData: "user=%7B%22id%22%3A7350116575%2C%22first_name%22%3A%22Reath%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22sDcDt94764%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-3759169080004659230&start_param=ref_R3X2Z6UGB5ZBAQTFAEC6&auth_date=1729441462&hash=277bd5ee69420620a5e7681b50651b9ee37a3be16fefd7fae2b970e284f7db97"
    },
    {
        proxy: undefined,
        initData: "user=%7B%22id%22%3A7038003725%2C%22first_name%22%3A%22Jarvis%20Hanel%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22javis1l%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-1251052646378949763&start_param=ref_R3X2Z6UGB5ZBAQTFAEC6&auth_date=1729441148&hash=38d5475b9841259bf809ceb3fa68070cd0ee55e030726f5f9ce60f374afba61e"        
    },
    {
        proxy: "proxymart29011:PWWnuvJU@36.50.133.11:29011",
        initData: "user=%7B%22id%22%3A7396996476%2C%22first_name%22%3A%22mohamadreza.akbari%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%90%B0%F0%9F%A6%86%22%2C%22last_name%22%3A%22Ooo%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22cabibara1l%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=370791872801206693&start_param=ref_R3X2Z6UGB5ZBAQTFAEC6&auth_date=1729441149&hash=c5f67bb8e94b649b48a8e7c3e6b9781613e46433cea0a92a220b0fd1bcae0f29"
    },
    {
        proxy: undefined,
        initData: "user=%7B%22id%22%3A5993795698%2C%22first_name%22%3A%22Thai%F0%9F%8C%B1SEED%22%2C%22last_name%22%3A%22Le%20%F0%9F%92%8ECR%20%F0%9F%8D%85%22%2C%22username%22%3A%22thailephan%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=4971010998574050272&start_param=ref_R3X2Z6UGB5ZBAQTFAEC6&auth_date=1729441251&hash=d998492602e96635a5ca3c69059a33ba2f5fa936dc68b2411b6aef11356cffdb"
    },
    {
        proxy: "proxymart29102:WzUiihpd@36.50.236.102:29102",
        initData: "user=%7B%22id%22%3A7614128738%2C%22first_name%22%3A%22Marguerite%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22Tyrome%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22margueritetyrome%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=9132860777202286303&start_param=ref_R3X2Z6UGB5ZBAQTFAEC6&auth_date=1729441253&hash=0728dc6d757700baf7fa9bf732b78aae31c2e205ba8ce4fe0079544cc71f9cf2"
    },
    {
        proxy: "proxymart29380:UpFsrDHL@36.50.133.72:29380",
        initData: "user=%7B%22id%22%3A7496050969%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22koscwivu%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=2636281956775678174&start_param=ref_R3X2Z6UGB5ZBAQTFAEC6&auth_date=1729441255&hash=888100570a183fbc61d7a62cc8e3739935a73c0ce301aaf8ad84929072e22c23"
    },
    {
        proxy: "proxymart29380:UpFsrDHL@36.50.133.72:29380",
        initData: "user=%7B%22id%22%3A7055633313%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22mxznvqta%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-5188561579009175773&start_param=ref_R3X2Z6UGB5ZBAQTFAEC6&auth_date=1729441255&hash=51810ac067bac915b04cd5124db0a1df8ae95409999913af492b4b15dcab9bd2"
    },
    {
        proxy: "proxymart29048:IpcoDRzM@199.48.244.48:29048",
        initData: "user=%7B%22id%22%3A7295672761%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22bojlumdf%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-124363014979502659&start_param=ref_R3X2Z6UGB5ZBAQTFAEC6&auth_date=1729441363&hash=ada57c87b99eb7cd679c365cc9432fb1762acd5686c138146483d72449d9c61e"
    },
    {
        proxy: "proxymart29262:PbvFBKuR@36.50.133.136:29262",
        initData: "user=%7B%22id%22%3A7138410111%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%220997%F0%9F%92%8ECR%22%2C%22username%22%3A%22qrtlkpja%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=57902414935563933&start_param=ref_R3X2Z6UGB5ZBAQTFAEC6&auth_date=1729441361&hash=00628191cb687c936042dd0c41ab4b5c26a419ba3d8b4b37bc8ffbaafaf87fd9"
    },
    {
        proxy: "proxymart29102:WzUiihpd@36.50.236.102:29102",
        initData: "user=%7B%22id%22%3A7094522456%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%20%F0%9F%8C%B1SEED%F0%9F%92%8ECR%22%2C%22username%22%3A%22acsbpnxw%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=2257192605729730972&start_param=ref_R3X2Z6UGB5ZBAQTFAEC6&auth_date=1729441361&hash=32d56682d19c4958373253572501072cc30883d7e42665a5fd3402bc36ee126b"
    }
] as UserData[];
Main.start(users).then().catch(console.error);