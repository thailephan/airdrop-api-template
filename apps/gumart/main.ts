import { TelegramApplication, TelegramApplicationConfigs } from "../../application.ts";
import { Time, Timer } from "../../common/timer.ts";
import FetchHeaders from "../../services/headers/headers.ts";
import { AppProxyChecker } from "../../services/proxy/proxy-checker.ts";

class GameFetchHeaders extends FetchHeaders {
    constructor() {
        super();

        this.setKey("Origin", "https://app.gumart.io");
        this.setKey("Referer", "https://app.gumart.io/");
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

interface BaseRequest {
    headers: Headers;
}
interface GetUserInfoRequest extends BaseRequest {
}
interface BaseResponse<T = any> {
  status_code: number
  message: string
  errors: any
  data: T
}
interface GetUserInfoResponse extends BaseResponse<UserInfoResponseData> {
}
interface UserInfoResponseData {
  user: User
}
interface User {
  telegram_id: number
  username: string
  tlg_age: number
  tlg_age_point: number
  tlg_rare_name: number
  tlg_rare_name_point: number
  tlg_premium: number
  tlg_premium_percent: number
  tlg_activity: number
  tlg_activity_point: number
  total_gum: number
  package: any
  invite_url: string
  avatar: string
}

class UserInfoService {
    static async getUserInfo(request: GetUserInfoRequest): Promise<GetUserInfoResponse> {
        const response = await fetch("https://api.gumart.click/api/siwe/user-info", {
            "headers": request.headers,
            "body": null,
            "method": "GET"
        });
        return response.json();
    }
}


interface HomeResponse extends BaseResponse<HomeData> {

}
interface HomeData {
  tier_current: string
  tier: string
  balance: string
  balance_text: string
  vip_boost: number
  boost: number
  premium_boost: number
  friend_boost: number
  earned_amount: number
  mint_speed: number
  claim_timestamp: number
  user_claim_timestamp: number
  boost_timestamp: number
  boost_end_timestamp: number
  boost_next_timestamp: number
  max_earn_duration: number
  item_type: any
  tick_level: number
  wallet: string
}
class HomeService {
    static async getHome(request: BaseRequest): Promise<HomeResponse> {
        const response = await fetch("https://api.gumart.click/api/home", {
            "headers": request.headers,
            "body": null,
            "method": "GET"
        });
        return response.json();
    }
}

interface ClaimResponse extends BaseResponse<ClaimResponseData> {
}
interface ClaimResponseData {
  claim_value: number
  balance: number
}
class ClaimService {
    static async claim(request: BaseRequest): Promise<ClaimResponse> {
        const response = await fetch("https://api.gumart.click/api/claim", {
            "headers": request.headers,
            "body": "null",
            "method": "POST"
        });
        return response.json();
    }

}

interface GetInvitePartnersResponse extends BaseResponse<PagingResponse> {
}
interface PagingResponse {
  data: InvitedPartner[]
  per_page: number
  next_cursor: any
  previous_cursor: any
}
interface InvitedPartner {
  id: number
  username: string
  avatar: string
  balance: string
  premium_boost: string
  friend_boost: string
  mint_speed: string
  total_ref: number
  total_indirect_ref: number
  total_commission: string
  created_at: string
}
interface InvitationSummaryResponse extends BaseResponse<InvitationSummaryData> {
}
interface InvitationSummaryData {
  total_ref: number
  total_ref_text: string
  friend_boost: number
  friend_boost_text: string
  ref_url: string
  ref_from: RefFrom
}
interface RefFrom {
  telegram_id: number
  username: string
  avatar: string
}
class InviteService {
    static async getPartners(request: BaseRequest): Promise<GetInvitePartnersResponse> {
        const response = await fetch("https://api.gumart.click/api/invite/partners?limit=100&order_by=balance&order=desc&keyword=&is_first=true&is_init=true&cursor=", {
            "headers": request.headers,
            "body": null,
            "method": "GET"
        });
        return response.json();
    }
    static async getInvitationSummary(request: BaseRequest): Promise<InvitationSummaryResponse> {
        const response = await fetch("https://api.gumart.click/api/invite", {
            "headers": request.headers,
            "body": null,
            "method": "GET"
        });
        return response.json();
    }
}

class ComissionService {
    static async getInvitationSummary(request: BaseRequest): Promise<any> {
        const response = await fetch("https://api.gumart.click/api/commission", {
            "headers": request.headers,
            "body": null,
            "method": "GET"
        });
        return response.json();
    }
}

class BoostService {
    static async boost(request: BaseRequest): Promise<any> {
        const response = await fetch("https://api.gumart.click/api/boost", {
            "headers": request.headers,
            "body": null,
            "method": "POST"
        });
        return response.json();
    }
}

class GameTelegramApplication extends TelegramApplication {
    headers: FetchHeaders;
    user: UserData;
    EXECUTION_INTERVAL: number = Time.HOUR * 3;
    token: string;

    constructor(user: UserData, configs?: TelegramApplicationConfigs) {
        super("", user.proxy, configs);
        this.token = user.token;
        this.user = user;
        this.appName = "gumart";
        this.headers = new GameFetchHeaders();
        this.setUserName(this.token);
        this.setExecutionInterval(this.EXECUTION_INTERVAL + 10 * Time.MINUTE, this.EXECUTION_INTERVAL + 60 * Time.MINUTE);
        if (typeof this.token === "string" && this.token.length >= 1) {
            this.headers.setKey("authorization", `Bearer ${this.token}`);
        } else {
            this.log("Invalid token, cannot start app");
            this.allowStartApp = false;
        }
    }
    private setUserName(username: string) {
        this.extractedInitData = { user: { username: username, } };
    }

    override async onRunExecution(): Promise<void> {
        const headers = this.headers.get();
        // userinfo
        const userInfoResponse = await UserInfoService.getUserInfo({ headers });
        if (userInfoResponse.errors) {
            throw Error("Failed to get userinfo");
        }
        this.setUserName(userInfoResponse.data.user.username);

        // home
        const homeResponse = await HomeService.getHome({ headers });
        if (homeResponse.errors) {
            throw Error("Failed to get home response");
        }

        // comission
        const _commissionResponse = await ComissionService.getInvitationSummary({ headers });

        const nowUnix = Date.now();
        const shouldClaimGum = nowUnix - homeResponse.data.claim_timestamp >= 30 * Time.MINUTE;
        // claim
        if (shouldClaimGum) {
            const claimResponse = await ClaimService.claim({ headers });
            if (claimResponse.errors) {
                this.log(`Claim error message: ${claimResponse.errors}`, "error");
            } else {
                this.log(`Claim success ${claimResponse.data.claim_value} GUM, total: ${claimResponse.data.balance}`);
            }
        }

        // home
        const homeAfterClaimResponse = await HomeService.getHome({ headers });
        if (homeAfterClaimResponse.errors) {
            throw Error("Failed to get home response after claim");
        }
        const secondsToTheNextBoost = nowUnix - homeResponse.data.boost_next_timestamp;
        if (secondsToTheNextBoost < 30 * Time.MINUTE) {
            const { promise, time } =  Timer.sleepRandom(secondsToTheNextBoost * 1000 + 10 * Time.SECOND, secondsToTheNextBoost + 60 * Time.SECOND);
            this.log(`Wait ${time} second(s) to boost`);
            await promise;
            const boostResponse = await BoostService.boost({ headers });
            if (boostResponse.errors) {
                this.log(`Boost error message: ${boostResponse.errors}`, "error");
            } else {
                this.log(`Boost success ${boostResponse.data.claim_value} GUM, total: ${boostResponse.data.balance}`);
            }
        }

        // partners
        // invite/
    }
}

interface UserData {
    token: string;
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
        token: "125365792|wavuOEHZ1hqVHUzH2Ehm3EQz6rHnX59Bzlz5VlgGc2530f03",
    },
] as UserData[];
Main.start(users).then().catch(console.error);