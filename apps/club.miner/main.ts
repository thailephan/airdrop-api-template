import { TelegramApplication } from "../../application.ts";
import { Helpers } from "../../common/helpers.ts";
import { Time, Timer } from "../../common/timer.ts";
import FetchHeaders from "../../services/headers/headers.ts";
import { AppProxyChecker } from "../../services/proxy/proxy-checker.ts";

class GameFetchHeaders extends FetchHeaders {
    constructor() {
        super();

        // this.setKey("Origin", "https://tg-bot-front.fatso.family");
        // this.setKey("Referer", "https://tg-bot-front.fatso.family/");
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

export interface TelegramInfoResponse {
  addDayPoints: number
  cardinalSecond: number
  deplete: number
  earnPoints: number
  equipmentLevel: any
  levelCap: number
  limitAmount: number
  offlineIncome: number
  physical: number
  points: number
  secondPhysical: number
  stamina: number
  userId: number
  userLevel: number
}

class GameTelegramApplication extends TelegramApplication {
    headers: FetchHeaders;
    user: UserData;
    EXECUTION_INTERVAL: number = 6 * Time.MINUTE;

    constructor(user: UserData) {
        super(user.initData, user.proxy);
        this.user = user;
        this.appName = "club.miner";
        this.headers = new GameFetchHeaders();
        this.setExecutionInterval(this.EXECUTION_INTERVAL + 1 * Time.MINUTE, this.EXECUTION_INTERVAL + 2 * Time.MINUTE);
    }
    async login({ headers }: { headers: Headers }): Promise<{ code: number, msg: string, token: string }> {
      const response = await fetch("https://telegram.miners.club/prod-api/api/user/telegramLoginAndRegister?inviteCode=", {
        "headers": headers,
        "referrerPolicy": "no-referrer",
        "body": JSON.stringify({ }),
        "method": "POST",
      });
      
      const data = await response.json();
      return data;
    }
    async getUserInfo({ headers }: { headers: Headers }): Promise<{ code: number }>{
      const response = await fetch("https://telegram.miners.club/prod-api/api/user/getUserInfo", {
        "headers": headers,
        "referrerPolicy": "no-referrer",
        "body": null,
        "method": "GET",
      });
      const data = await response.json();

      return { code: data.code };
    }
    async getTelegramInfo({ headers }: { headers: Headers }): Promise<TelegramInfoResponse> {
      const response = await fetch("https://telegram.miners.club/prod-api/api/telegram/getTelegramInfo", {
          "headers": headers,
          "referrerPolicy": "no-referrer",
          "body": null,
          "method": "GET"
        });
        const data = await response.json();
        return data.data;
    };
    async updateTelegramInfo({ headers, depletePower, points }: { headers: Headers, depletePower: number, points: number }): Promise<TelegramInfoResponse> {
      const response = await fetch(`https://telegram.miners.club/prod-api/api/telegram/updateTelegramInfo?depletePower=${depletePower}&points=${points}`, {
        "headers": headers,
        "referrerPolicy": "no-referrer",
        "body": null,
        "method": "POST"
      });
      const data = await response.json();
      return data.data;
    }
    isTired(limitAmount: number, addDayPoints: number): boolean {
        return limitAmount === null || limitAmount <= 0 ? !1 : addDayPoints >= limitAmount
    }

    override async onRunExecution(): Promise<void> {
      const MIN_STAMINA = 100;
      this.setExecutionInterval(this.EXECUTION_INTERVAL + 1 * Time.MINUTE, this.EXECUTION_INTERVAL + 2 * Time.MINUTE);

      this.headers.setKey("tma-authorization", this.user.initData );
      const loginResponse = await this.login({ headers: this.headers.get() });
      if (!loginResponse.token) {
        this.log(`Login failed: ${loginResponse.msg}`, "error");
        return;
      }

      this.headers.setKey("token", loginResponse.token);
      const _ = await this.getUserInfo({ headers: this.headers.get() });

      const tgInfoResponse = await this.getTelegramInfo({ headers: this.headers.get() });
      const { deplete, points, stamina, levelCap, userLevel, limitAmount, addDayPoints } = tgInfoResponse;
      const isTired = this.isTired(limitAmount, addDayPoints);
      if (isTired) {
          this.log(`Miner is tired`, "info");
          const now = new Date();
          const tomorrow = new Date(now);
          tomorrow.setDate(now.getDate() + 1);
          tomorrow.setHours(Helpers.generateRandomNumberInRange(1, 12), 0, 0, 0);
          const sleepTime = tomorrow.getTime() - now.getTime();
          this.setExecutionInterval(sleepTime, sleepTime + 1 * Time.MINUTE);
          return;
      }
      let currentStamina = stamina;
      let currentPoints = points;
      while(true) {
        if (currentStamina < MIN_STAMINA) {
          this.log(`Stamina is too low: ${currentStamina}`, "info");
          break;
        }
        if (currentPoints >= levelCap) {
          this.log(`Level: ${userLevel} cap reached: ${currentPoints}`, "info");
          break;
        }

        const randomTap = Helpers.generateRandomNumberInRange(30, 120);
        const depleteTap = deplete * randomTap;
        const tapNumber = Math.min(currentStamina, depleteTap);
        const depletePower = currentStamina - tapNumber;

        const { points: latestPoints, limitAmount, addDayPoints } = await this.updateTelegramInfo({ headers: this.headers.get(), depletePower, points: currentPoints + tapNumber });
        const isTired = this.isTired(limitAmount, addDayPoints);
        if (isTired) {
          this.log(`Miner is tired`, "info");
          const now = new Date();
          const tomorrow = new Date(now);
          tomorrow.setDate(now.getDate() + 1);
          tomorrow.setHours(Helpers.generateRandomNumberInRange(1, 12), 0, 0, 0);
          const sleepTime = tomorrow.getTime() - now.getTime();
          this.setExecutionInterval(sleepTime, sleepTime + 1 * Time.MINUTE);
          break
        }

        if (currentPoints !== latestPoints) {
          this.log(`Tap: ${tapNumber}, Stamina updated: ${currentPoints} -> ${latestPoints}`, "info");
          currentStamina -= tapNumber;
          currentPoints = latestPoints;
        } else {
          this.log(`Tap: ${tapNumber}, Failed to update stamina: ${currentStamina}`, "error");
        }

        await Timer.sleep(5 * Time.SECOND);
      }

      this.log(`Execution completed. stamina: ${currentStamina}`, "info");
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
        initData: "query_id=AAFyEEJlAgAAAHIQQmXp247z&user=%7B%22id%22%3A5993795698%2C%22first_name%22%3A%22Thai%F0%9F%8C%B1SEED%22%2C%22last_name%22%3A%22Le%20%F0%9F%92%8ECR%20%F0%9F%8D%85%22%2C%22username%22%3A%22thailephan%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&auth_date=1730429820&hash=832ec27efb4439896bf6f3b8544ef5f37f2e17cc04fe6f11192c3bd5752e1627"
    },
] as UserData[];
Main.start(users).then().catch(console.error);