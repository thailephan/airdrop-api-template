import { TelegramApplication } from "../../application.ts";
import { Time, Timer } from "../../common/timer.ts";
import FetchHeaders from "../../services/headers/headers.ts";
import { AppProxyChecker } from "../../services/proxy/proxy-checker.ts";

class GameFetchHeaders extends FetchHeaders {
    constructor() {
        super();

        this.setKey("Origin", "https://tg-bot-front.fatso.family");
        this.setKey("Referer", "https://tg-bot-front.fatso.family/");
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
        this.appName = "fatso";
        this.headers = new GameFetchHeaders();
        this.setExecutionInterval(this.EXECUTION_INTERVAL + 20 * Time.MINUTE, this.EXECUTION_INTERVAL + 60 * Time.MINUTE);
    }

    async tapping(): Promise<{ success: boolean }> {
        this.headers.setKey("next-action", "e9b14869820461e356a8e9c0e1be50ed6a0f0c57");
        this.headers.setKey("next-router-state-tree", "%5B%22%22%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%2C%22%2F%23tgWebAppData%3Dquery_id%253DAAFyEEJlAgAAAHIQQmWXAYVQ%2526user%253D%25257B%252522id%252522%25253A5993795698%25252C%252522first_name%252522%25253A%252522Thai%2525F0%25259F%25258C%2525B1SEED%252522%25252C%252522last_name%252522%25253A%252522Le%252520%2525F0%25259F%252592%25258ECR%252520%2525F0%25259F%25258D%252585%252522%25252C%252522username%252522%25253A%252522thailephan%252522%25252C%252522language_code%252522%25253A%252522en%252522%25252C%252522allows_write_to_pm%252522%25253Atrue%25257D%2526auth_date%253D1730355085%2526hash%253Db36a3242c6817db2eafac75b304e0af8f4a11121053bcc0aa805f59ad4f0dab6%26tgWebAppVersion%3D7.10%26tgWebAppPlatform%3Dandroid%26tgWebAppThemeParams%3D%257B%2522bg_color%2522%253A%2522%2523ffffff%2522%252C%2522text_color%2522%253A%2522%2523000000%2522%252C%2522hint_color%2522%253A%2522%2523707579%2522%252C%2522link_color%2522%253A%2522%25233390ec%2522%252C%2522button_color%2522%253A%2522%25233390ec%2522%252C%2522button_text_color%2522%253A%2522%2523ffffff%2522%252C%2522secondary_bg_color%2522%253A%2522%2523f4f4f5%2522%252C%2522header_bg_color%2522%253A%2522%2523ffffff%2522%252C%2522accent_text_color%2522%253A%2522%25233390ec%2522%252C%2522section_bg_color%2522%253A%2522%2523ffffff%2522%252C%2522section_header_text_color%2522%253A%2522%2523707579%2522%252C%2522subtitle_text_color%2522%253A%2522%2523707579%2522%252C%2522destructive_text_color%2522%253A%2522%2523e53935%2522%257D%22%2C%22refresh%22%5D%7D%2Cnull%2Cnull%2Ctrue%5D");
        const response = await fetch("https://tg-bot-front.fatso.family/", {
            headers: this.headers.get(),
            method: "POST",
            body: JSON.stringify([
                {
                    "id": "a1b23ee7-5812-4101-97a1-09083dcb39d1"
                }
            ]),
            client: this.client,
        });
        if (response.status === 200) {
            return { success: true };
        }

        return { success: false };
    }

    override async onRunExecution(): Promise<void> {
        const longRest = 5 * Time.MINUTE;
        const shortRest = 2 * Time.SECOND;
        let shortRestCount = 1000;
        // call tapping every 2 seconds
        while(shortRestCount >= 0) {
            const tapResponse = await this.tapping(); 
            this.log(`${shortRestCount}: Tap ${tapResponse.success}` , "info")
            const { promise, time } = Timer.sleepRandom(shortRest, shortRest + 5 * Time.SECOND);
            this.log(`Wait ${time} seconds`, "info");
            await promise;
            shortRestCount--;
        }

        this.setExecutionInterval(longRest, longRest + 2 * Time.MINUTE);
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
        initData: "query_id=AAFyEEJlAgAAAHIQQmWXAYVQ&user=%7B%22id%22%3A5993795698%2C%22first_name%22%3A%22Thai%F0%9F%8C%B1SEED%22%2C%22last_name%22%3A%22Le%20%F0%9F%92%8ECR%20%F0%9F%8D%85%22%2C%22username%22%3A%22thailephan%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&auth_date=1730355085&hash=b36a3242c6817db2eafac75b304e0af8f4a11121053bcc0aa805f59ad4f0dab6"
    },
] as UserData[];
Main.start(users).then().catch(console.error);