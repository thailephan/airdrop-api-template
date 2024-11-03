import { TelegramApplication } from "../../application.ts";
import { Time, Timer } from "../../common/timer.ts";
import FetchHeaders from "../../services/headers/headers.ts";
import { AppProxyChecker } from "../../services/proxy/proxy-checker.ts";

class GameFetchHeaders extends FetchHeaders {
    constructor() {
        super();

        this.setKey("Origin", "https://app-master.piggybasket.io");
        this.setKey("Referer", "https://app-master.piggybasket.io/");
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
    EXECUTION_INTERVAL: number = Time.HOUR * 3;

    constructor(user: UserData) {
        super(user.initData, user.proxy);
        this.user = user;
        this.appName = "piggy-bank";
        this.headers = new GameFetchHeaders();
        this.setExecutionInterval(this.EXECUTION_INTERVAL + 5 * Time.MINUTE, this.EXECUTION_INTERVAL + 30 * Time.MINUTE);
    }

    async getMissions() {
        const response = await fetch("https://api-master.piggybasket.io/missions", {
            "headers": this.headers.get(),
            "body": null,
            "method": "GET"
        });
        return response.json();
    }
    async checkMission(mission: any) {
        const body = JSON.stringify({ name: mission.name });
        const response = await fetch("https://api-master.piggybasket.io/missions/check", {
            "headers": this.headers.get(),
            "body": body,
            "method": "POST"
        });
        return response.json();
    }

    async shot() {
        const isGoal = Math.random() > 0.13;
        const response = await fetch("https://api-master.piggybasket.io/shot", {
            "headers": this.headers.get(),
            "body": JSON.stringify({ goal: isGoal }),
            "method": "POST"
        });
        return response.json();
    }
    async getUser() {
        const response = await fetch("https://api-master.piggybasket.io/user", {
            "headers": this.headers.get(),
            "body": null,
            "method": "GET"
        });
        return response.json();
    }
    async claimOfflineReward() {
        const response = await fetch("https://api-master.piggybasket.io/user/offline-reward/claim", {
            "headers": this.headers.get(),
            "body": null,
            "method": "POST"
        });
        return response.json();
    }
    override async onRunExecution(): Promise<void> {
        this.headers.setKey("Telegram-data", this.user.initData);

        // const missionsResponse = await this.getMissions();
        // if (missionsResponse.ok) {
        //     const missions = missionsResponse.result;
        //     const isMissionCompleted = (mission: any) => mission.status === "completed";
        //     const uncompletedMissions = missions.filter((mission: any) => !isMissionCompleted(mission));
        //     for (const mission of uncompletedMissions) {
        //         if (mission.type === "game") {
        //             if (mission.progress?.current > mission.progress?.target) {
        //                 const response = await this.checkMission(mission);
        //                 if (response.ok) {
        //                     console.log("Mission completed", mission.name);
        //                 }
        //             }
        //         }
        //     }
        // }
        const userResponse = await this.getUser();
        if (userResponse.ok) {
            if (userResponse.result?.offlineReward) {
                this.log(`Offline reward are ${userResponse.result.offlineReward.coins} coins (${userResponse.result.offlineReward.balls} balls)`);

                const claimResponse = await this.claimOfflineReward();
                if (claimResponse.ok) {
                    console.log("Claim offline reward success");
                }
            }
        }
        const shotResponse = await this.shot();
        if (shotResponse.ok) {
            console.log(`Shot success`);
        }
        this.setExecutionInterval(1 * Time.MINUTE, 2 * Time.MINUTE);
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
        initData: "user=%7B%22id%22%3A5993795698%2C%22first_name%22%3A%22Thai%F0%9F%8C%B1SEED%22%2C%22last_name%22%3A%22Le%20%F0%9F%92%8ECR%20%F0%9F%8D%85%22%2C%22username%22%3A%22thailephan%22%2C%22language_code%22%3A%22en%22%7D&chat_instance=-8243214163447701802&chat_type=private&start_param=teamRef_9de0fc1b&auth_date=1730648437&hash=6ae2d1fb87793bc9a89ce7285c7a7c1f588e170b0494e25a7c06f34c8bc9754f"
    },
] as UserData[];
Main.start(users).then().catch(console.error);