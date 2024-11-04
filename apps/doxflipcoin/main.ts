import { TelegramApplication } from "../../application.ts";
import { Time, Timer } from "../../common/timer.ts";
import FetchHeaders from "../../services/headers/headers.ts";
import { AppProxyChecker } from "../../services/proxy/proxy-checker.ts";

class GameFetchHeaders extends FetchHeaders {
    constructor() {
        super();

        this.setKey("Origin", "https://coin-flip.click");
        this.setKey("Referer", "https://coin-flip.click/");
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


interface FlipResponse {
    flip: {
        id: number
        game_id: number
        user_id: number
        currency: string
        amount: string
        exp: string
        fee_amount: string
        coin_side: string
        is_win: boolean
        win_amount: string
    },
    user: {
        id: number
        username: string
        wallet_address: string
        chat_id: string
        referrer_id: string
        balance: string // coin left
        exp: string
        level: number
        streak_win: number
        streak_lose: number
    }
}
enum CoinSide {
    Head = "h",
    Tail = "t"
}

class GameTelegramApplication extends TelegramApplication {
    headers: FetchHeaders;
    user: UserData;
    EXECUTION_INTERVAL: number = Time.HOUR * 3;

    constructor(user: UserData) {
        super(user.initData, user.proxy);
        this.user = user;
        this.appName = "doxflipcoin";
        this.headers = new GameFetchHeaders();
        this.setExecutionInterval(this.EXECUTION_INTERVAL + 20 * Time.MINUTE, this.EXECUTION_INTERVAL + 60 * Time.MINUTE);
    }
    async login({ initData }: { initData: string}): Promise<{ token: string }> {
        const body = JSON.stringify({ initData });
        const response = await fetch("https://api.coin-flip.click/api/auth/login", {
            "headers": this.headers.get(),
            "body": body,
            "method": "POST"
        });
        return response.json();
    }
    async flip({ bet, side }: { bet: number, side: CoinSide }): Promise<FlipResponse> {
        const body = JSON.stringify({ coinSide: side, amount: bet });
        const response = await fetch("https://api.coin-flip.click/api/flips", {
            "headers": this.headers.get(),
            "body": body,
            "method": "POST"
        });
        return response.json();
    }
    async me(): Promise<FlipResponse["user"]> {
        const response = await fetch("https://api.coin-flip.click/api/users/me", {
            "headers": this.headers.get(),
            "body": null,
            "method": "GET"
        });
        return response.json();
    }

    override async onRunExecution(): Promise<void> {
        const FLIP_TIME = 500;
        const loginResponse = await this.login({ initData: this.user.initData });
        if (!loginResponse.token) {
            this.log("Login failed", "error");
            return;
        }
        this.headers.setKey("Authorization", `Bearer ${loginResponse.token}`);

        const me = await this.me();
        if (!me.id) {
            this.log("Get me failed", "error");
            return;
        } else {
            this.log(`User: ${me.username}, Balance: ${me.balance}, Streak Win/Lose: ${me.streak_win}/${me.streak_lose}`);
        }

        let lastFLips: CoinSide[] = [];
        let balance = parseInt(me.balance);
        let side = CoinSide.Head;
        let flipCount = 0;
        const MIN_BALANCE = 2e7;
        const betList = [500, 1000, 2000];

        while(flipCount < FLIP_TIME || balance >= MIN_BALANCE) {
            const bet = betList[Math.floor(Math.random() * betList.length)];
            const lastThreeFlips = lastFLips.slice(-3);
            const isLastThreeFlipsSame = lastThreeFlips.every((flip) => flip === lastThreeFlips[0]);
            if (isLastThreeFlipsSame) {
                side = lastThreeFlips[0] === CoinSide.Head ? CoinSide.Tail : CoinSide.Head;
            } else {
                side = Math.random() > 0.3 ? CoinSide.Head : CoinSide.Tail;
            }

            this.log(`Flip ${flipCount}: Bet ${bet}, Side ${side}, Balance: ${balance}`);
            const flipResponse = await this.flip({ bet, side });
            lastFLips.push(flipResponse.flip.coin_side as CoinSide);
            if (flipResponse.flip.is_win) {
                this.log(`Flip ${flipCount}: Win ${flipResponse.flip.win_amount}, Balance: ${balance}`);
            } else {
                this.log(`Flip ${flipCount}: Lose ${bet}, Balance: ${balance}`);
            }

            balance = Number(flipResponse.user.balance);
            flipCount++;
            if (lastFLips.length >= 100) {
                lastFLips = lastFLips.slice(97);
            }


            this.log("Wait 4s to next flip");
            await new Promise((resolve) => setTimeout(resolve, 4000));
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
        initData: "query_id=AAFyEEJlAgAAAHIQQmWXYBGh&user=%7B%22id%22%3A5993795698%2C%22first_name%22%3A%22Thai%F0%9F%8C%B1SEED%22%2C%22last_name%22%3A%22Le%20%F0%9F%92%8ECR%20%F0%9F%8D%85%22%2C%22username%22%3A%22thailephan%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&auth_date=1730728438&hash=da81a8314e6e5cabe07a6548333e81b0bb9977ffab1cbcd12d21704391691f37"
    },
] as UserData[];
Main.start(users).then().catch(console.error);