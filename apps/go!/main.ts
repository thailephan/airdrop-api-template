import { TelegramApplication } from "../../application.ts";
import { Helpers } from "../../common/helpers.ts";
import { logger } from "../../common/logger.ts";
import { Time, Timer } from "../../common/timer.ts";
import FetchHeaders from "../../services/headers/headers.ts";
import { AppProxyChecker } from "../../services/proxy/proxy-checker.ts";

class GameFetchHeaders extends FetchHeaders {
    constructor() {
        super();
        this.setKey("Origin", "https://gotap-dot-health-hero-bot.oa.r.appspot.com");
        this.setKey("Referer", "https://gotap-dot-health-hero-bot.oa.r.appspot.com/");
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

export interface UserTonWalletResponse {
  id: string
  wallet_connection: string
  total_taps: number
  new_user: boolean
  boost_level: UserTonWalletBoostLevel
}
export interface UserTonWalletBoostLevel {
  currentLevel: number
  nextLevel: number
  coinsToLevelUp: number
}

export interface UserGetStreakDetailsResponse {
  streaks: StreakDetail[]
}
export interface StreakDetail {
  day: number
  points: number
  status: "available" | "claimed" | "pending";
}

type UserRewardsResponse = UserRewardItem[]
export interface UserRewardItem {
  icon: string
  link?: string
  description: string
  prize: number
  type: string
  completed: boolean
  account: any
  wallet: any
  email: any
}

interface UserVerifyVisitResponse {
  status: "success" | "error";
  message: string
  reward: number
}


class GameTelegramApplication extends TelegramApplication {
    headers: FetchHeaders;
    user: UserData;
    EXECUTION_INTERVAL: number = Time.HOUR * 1;

    constructor(user: UserData) {
        super("", user.proxy);
        this.user = user;
        this.appName = "go!";
        this.headers = new GameFetchHeaders();
    }

    async userTonWallet(): Promise<UserTonWalletResponse> {
        const response = await fetch("https://api.goplatform.io/api/v1/users/tonWallet", {
            method: "POST",
            headers: this.headers.get(),
            body: JSON.stringify({
                wallet_address: this.user.wallet_address,
                userId: this.user.userId,
            }),
        });
        return response.json();
    }
    async userGetStreakDetails(): Promise<UserGetStreakDetailsResponse> {
      const response = await fetch("https://api.goplatform.io/api/v1/users/getStreakDetails", {
        method: "POST",
        headers: this.headers.get(),
        body: JSON.stringify({
            walletAddress: this.user.wallet_address,
        }),
      });
      return response.json();
    }
    async userStreakUpdate(): Promise<{ success: boolean }> {
        const response = await fetch("https://api.goplatform.io/api/v1/users/streakUpdate", {
          method: "POST",
          headers: this.headers.get(),
          body: JSON.stringify({
              walletAddress: this.user.wallet_address,
          }),
        });
        return response.json();
    }

    async userUserReward(): Promise<UserRewardsResponse> {
      const response = await fetch("https://api.goplatform.io/api/v1/users/userRewards", {
        method: "POST",
        headers: this.headers.get(),
        body: JSON.stringify({
            wallet_address: this.user.wallet_address,
        }),
      });

      return response.json();
    }

    async userTap(args: { tap_amount: number, tap_remaining: number }): Promise<{ success: boolean; user: any }> {
        const response = await fetch("https://api.goplatform.io/api/v1/users/taps", {
          method: "POST",
          headers: this.headers.get(),
          body: JSON.stringify({
              wallet_address: this.user.wallet_address,
              ...args,
          }),
        });
        return response.json();
    }

    async userVerifyVisit(quest_type: string): Promise<UserVerifyVisitResponse> {
      const response = await fetch("https://api.goplatform.io/api/v1/users/verifyVisit", {
        method: "POST",
        headers: this.headers.get(),
        body: JSON.stringify({
            wallet_address: this.user.wallet_address,
            quest_type
        }),
      });
      return response.json();
    }

    override async onRunExecution(): Promise<void> {
        this.setExecutionInterval(this.EXECUTION_INTERVAL);

        const tonWalletResponse = await this.userTonWallet();
        const userRewardsResponse = await this.userUserReward();

        const streakDetails = await this.userGetStreakDetails();
        const streak = streakDetails.streaks.find((streak) => streak.status === "available");
        if (streak) {
            const { success } = await this.userStreakUpdate();
            if (success) {
                this.log(`Streak ${streak.day}: claimed ${streak.points} points`);
            }
        }

        // tasks
        const ignoreTasks = ["telegram_join", "twitter_follow", "lion_emoji_task", "email_share", "share_eth_wallet"];
        const tasks = userRewardsResponse.filter((reward) => !reward.completed && !ignoreTasks.includes(reward.type));
        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            const response = await this.userVerifyVisit(task.type);
            if (response.status === "success") {
                this.log(`Task ${task.description} success: ${response.message} with ${response.reward} points`);
            } else {
                this.log(`Task ${task.description} failed: ${response.message}`);
            }

            await Timer.sleep(10 * Time.SECOND);
        }

        // taps
        const MAX_ENERGY = 2000;
        let counter = 0;
        do {
          let currentEnergy = MAX_ENERGY;
          const tapList = [];
          while (currentEnergy >= 50) {
              const randomTap = Math.min(Helpers.generateRandomNumberInRange(10, 40), currentEnergy);
              currentEnergy -= randomTap;

              tapList.push({
                  tap_amount: randomTap,
                  tap_remaining: currentEnergy,
              });
          }

          for(let i = 0; i < tapList.length; i++) {
              const tap = tapList[i];
              const { success } = await this.userTap(tap);

              if (success) {
                  this.log(`Tap ${tap.tap_amount} success, remaining ${tap.tap_remaining}`);
              } else {
                this.log(`Tap ${tap.tap_amount} failed, remaining ${tap.tap_remaining}`);
                break;
              }
              await Timer.sleep(3000);
          }

          this.log(`Waiting for energy regen...`);
          await Timer.sleepRandom(Time.MINUTE * 2, Time.MINUTE * 10).promise;
        } while (counter++ < 5) 
    }
}

interface UserData {
    proxy?: string | undefined;
    wallet_address: string;
    userId: string;
}
class Main {
    static async start(users: UserData[]) {
        const appProxyChecker = new AppProxyChecker();
        await Promise.all(users.map(async (user) => {
            const proxyIP = await appProxyChecker.check(user.proxy);
            logger.info(user.userId, proxyIP); 
            if (proxyIP) {
                const application = new GameTelegramApplication(user);
                return application.execute();
            }
        }));
    }
}

const users = [{
  "wallet_address": "UQBXqQpz8pkcOgYuAULK3fZg7R4hSt0w8K8hLlB-5foKY_ZH",
  "userId": "5993795698",
  "proxy": undefined,
}] as UserData[];
Main.start(users).then().catch(console.error);