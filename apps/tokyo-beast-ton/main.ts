import { TelegramApplication } from "../../application.ts";
import { Helpers } from "../../common/helpers.ts";
import { Time, Timer } from "../../common/timer.ts";
import FetchHeaders from "../../services/headers/headers.ts";
import { AppProxyChecker } from "../../services/proxy/proxy-checker.ts";

class GameFetchHeaders extends FetchHeaders {
    constructor() {
        super();

        this.setKey("Origin", "https://app.love-drop.tokyo-beast.com");
        this.setKey("Referer", "https://app.love-drop.tokyo-beast.com/");
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


export interface Response<P = any> {
  payload: P;
  timestamp: number
}

export interface LoginPayload {
  user: User
  token: Token
}

export interface User {
  id: string
  user_name: string
  status: number
  avatar: string
  coin_number: number
  coin_tap: number
  stanina_level: number
  referral_code: string
  coin_level: number
  is_premium: boolean
  wallet_address: string
  time_remain: any
  created_at: string
  updated_at: string
}

export interface Token {
  tokenType: string
  accessToken: string
  accessTokenExpires: string
  refreshToken: string
}
export interface MyProgressPayload {
  id: string
  user_id: string
  current_stamina: number
  tap_score_this_hour: number
  coin_tap_today: number
}


type CreateUserProgressPayload = boolean;
class GameTelegramApplication extends TelegramApplication {
    headers: FetchHeaders;
    user: UserData;
    EXECUTION_INTERVAL: number = 5 * Time.MINUTE;

    constructor(user: UserData) {
        super(user.initData, user.proxy);
        this.user = user;
        this.appName = "tokyo-beast-ton";
        this.headers = new GameFetchHeaders();
        this.setExecutionInterval(this.EXECUTION_INTERVAL);
    }

    async login(args: { referral_code: string, initData: string, token?: string }): Promise<Response<LoginPayload>>{
        const response = await fetch("https://api.love-drop.tokyo-beast.com/api/v1/auth/client/login", {
            headers: this.headers.get(),
            "body": JSON.stringify(args),
            "method": "POST"
        });
        return response.json();
    }
    async myprogress(): Promise<Response<MyProgressPayload>> {
        const response = await fetch("https://api.love-drop.tokyo-beast.com/api/v1/user-progress/my-progress", {
            "headers": this.headers.get(),
            "body": null,
            "method": "GET"
        });
        return response.json();
    }
    async createUserProgress(args: {
        "current_stamina": number,
        "score": number,
        "tap_score": number,
        "token": string,
    }): Promise<Response<CreateUserProgressPayload>> {
        const body = JSON.stringify(args)
        const response = await fetch("https://api.love-drop.tokyo-beast.com/api/v1/user-progress/create-user-progress", {
            "headers": this.headers.get(),
            "body": body,
            "method": "POST"
        });
        return response.json();
    }

    override async onRunExecution(): Promise<void> {
        const loginResponse = await this.login({ referral_code: "", initData: this.initData });
        if (!loginResponse.payload) {
            throw new Error("Login failed");
        }
        const token = loginResponse.payload.token.accessToken;
        this.headers.setKey("Authorization", `Bearer ${token}`);
        const myProgressResponse = await this.myprogress();

        const MAX_STAMINA = 1000;
        const MAX_CLICK_TIME = 100;
        let currentClickTime = 0;

        let stamina = myProgressResponse.payload?.current_stamina ?? MAX_STAMINA;
        let coin = loginResponse.payload.user.coin_number;
        let coinTap = loginResponse.payload.user.coin_tap;
        while(currentClickTime < MAX_CLICK_TIME && stamina > 100) {
            const tapScore = Math.min(Helpers.generateRandomNumberInRange(50, 100), stamina);
            stamina -= tapScore;
            const score = coin + tapScore;
            const tap_score = coinTap + tapScore;
            const response = await this.createUserProgress({
                current_stamina: stamina,
                score,
                tap_score,
                token
            });
            this.log(`Tap score: ${tap_score}, Score: ${score}, Stamina: ${stamina}`, "info");
            if (!response.payload) {
                throw new Error("Create user progress failed");
            }
            this.log(`Click success: ${tapScore} scores`, "info");

            await Timer.sleep(10 * Time.SECOND);
            stamina = Math.min(stamina + 10, MAX_STAMINA);
            coin += tapScore;
            coinTap += tapScore;
            currentClickTime++;
        }
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
        initData: "query_id=AAFyEEJlAgAAAHIQQmUI2C2N&user=%7B%22id%22%3A5993795698%2C%22first_name%22%3A%22Thai%F0%9F%8C%B1SEED%22%2C%22last_name%22%3A%22Le%20%F0%9F%92%8ECR%20%F0%9F%8D%85%22%2C%22username%22%3A%22thailephan%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2F8KU3glJr3QRZ6ubZdJWsTbeONSyYhWvR_E613pvrV1cpoU7kzHmnjpeKbinuit96.svg%22%7D&auth_date=1731551214&hash=1fdc697f9efd12894a41790db23c051e48aeb8f9ffe00e206d328ce5229453fe"
    },
] as UserData[];
Main.start(users).then().catch(console.error);