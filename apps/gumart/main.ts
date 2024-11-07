import { TelegramApplication, TelegramApplicationConfigs } from "../../application.ts";
import { hmacSha256 } from "../../common/hmac.ts";
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
    static async claim(request: BaseRequest & { requestKey: string, requestTime: number }): Promise<ClaimResponse> {
        const headers = new Headers(request.headers);
        headers.set("x-request-at", request.requestTime.toString());
        headers.set("x-request-key", request.requestKey.toString());

        const response = await fetch("https://api.gumart.click/api/claim", {
            "headers": headers,
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
    static async boost(request: BaseRequest): Promise<BaseResponse<{ active_boost: number, boost_timestamp: number, boost_end_timestamp: number }>> {
        const response = await fetch("https://api.gumart.click/api/boost", {
            "headers": request.headers,
            "body": null,
            "method": "POST"
        });
        return response.json();
    }
}

class WalletService {
    static async getWallet(request: BaseRequest): Promise<any> {
        const response = await fetch("https://api.gumart.click/api/wallet", {
            "headers": request.headers,
            "body": null,
            "method": "GET"
        });
        return response.json();
    }
}
class OrderService {
    static async getDepositWithdrawOrders(request: BaseRequest): Promise<any> {
        const response = await fetch("https://api.gumart.click/api/deposit-withdraw-order?filters[0][key]=token_id&filters[0][data]=&page=1&per_page=20", {
            "headers": request.headers,
            "body": null,
            "method": "GET"
        });
        return response.json();
    }
}
class GameTelegramApplication extends TelegramApplication {
    headers: FetchHeaders;
    user: UserData;
    EXECUTION_INTERVAL: number = Time.HOUR * 1;
    token: string;
    weights = { partnerAndInvite: 0.4 };

    constructor(user: UserData, configs?: TelegramApplicationConfigs) {
        super("", user.proxy, configs);
        this.token = user.token;
        this.user = user;
        this.appName = "gumart";
        this.headers = new GameFetchHeaders();
        this.setUserName(this.token);
        this.setExecutionInterval(this.EXECUTION_INTERVAL + 10 * Time.MINUTE, this.EXECUTION_INTERVAL + 50 * Time.MINUTE);
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

        const shouldClaimGum = Date.now() - homeResponse.data.claim_timestamp >= 30 * Time.MINUTE;
        // claim
        if (shouldClaimGum) {
            const [requestAt, hash] = loop();
            const signature = await generateGumartAPIRequestKey(hash, t(), n(), r());
            const claimResponse = await ClaimService.claim({ headers, requestKey: signature, requestTime: requestAt });
            if (claimResponse.errors) {
                this.log(`Claim error message: ${claimResponse.errors}`, "error");
            } else {
                this.log(`Claim success ${claimResponse.data.claim_value} GUM, total: ${claimResponse.data.balance}`);
            }
        }

        const _walletResponse = await WalletService.getWallet({ headers });

        // home
        const _homeAfterCallWallet = await HomeService.getHome({ headers });
        const _depositWithdrawOrders = await OrderService.getDepositWithdrawOrders({ headers });
        await Timer.sleepRandom(10 * Time.SECOND, 30 * Time.SECOND).promise;
        const homeAfterClaimResponse = await HomeService.getHome({ headers });

        if (homeAfterClaimResponse.errors) {
            throw Error("Failed to get home response after claim");
        }
        const secondsToTheNextBoost = homeAfterClaimResponse.data.boost_next_timestamp * 1e3 - Date.now();
        if (secondsToTheNextBoost <= 0) {
            // if (secondsToTheNextBoost > 0) {
            //     const { promise, time } =  Timer.sleepRandom(secondsToTheNextBoost + 10 * Time.SECOND, secondsToTheNextBoost + 60 * Time.SECOND);
            //     this.log(`Wait ${time} second(s) to boost`);
            //     await promise;
            // }
            const boostResponse = await BoostService.boost({ headers });
            if (boostResponse.errors) {
                this.log(`Boost error message: ${boostResponse.errors}`, "error");
            } else {
                this.log(`Boost success. Next boost in ${boostResponse.data.boost_end_timestamp} seconds`);
            }
        }

        // partners
        // invite
        const shouldLoadPartnerAndInvite = Math.random() < this.weights.partnerAndInvite;
        if (shouldLoadPartnerAndInvite) {
            const _partners = await InviteService.getPartners({ headers });
            // if (partnersResponse.errors) {
            //     this.log(`Failed to get partners: ${partnersResponse.errors}`, "error");
            // } else {
            //     this.log(`Total partners: ${partnersResponse.data.data.length}`);
            // }
            const _invite = await InviteService.getInvitationSummary({ headers });
            // if (invitationSummaryResponse.errors) {
            //     this.log(`Failed to get invitation summary: ${invitationSummaryResponse.errors}`, "error");
            // } else {
            //     this.log(`Total ref: ${invitationSummaryResponse.data.total_ref}`);
            // }
        }
    }
}

interface UserData {
    id: number;
    token: string;
    proxy?: string | undefined;
}
class Main {
    static async start(users: UserData[]) {
        const appProxyChecker = new AppProxyChecker();
        // await Promise.all(users.map(async (user) => {
        //     const proxyIP = await appProxyChecker.check(user.proxy);
        //     // logger.info(user.userId, proxyIP); 
        //     if (proxyIP) {
        //         const application = new GameTelegramApplication(user);
        //         return application.execute();
        //     }
        // }));
        while (true) {
            const totalUsers = users.length;
            const randomUserIndexes = Array.from({ length: totalUsers }, (_, index) => index).sort(() => Math.random() - 0.5);
            for(let i = 0; i < totalUsers; i += 1) {
                const user = users[randomUserIndexes[i]];
                const application = new GameTelegramApplication(user, { maxRuns: 1 });
                await application.execute();
                await Timer.sleepRandom(10 * Time.SECOND, 30 * Time.SECOND).promise;
            }

            const { promise, time } = await Timer.sleepRandom(30 * Time.MINUTE, 60 * Time.MINUTE);
            console.log(`Wait ${time} second(s) to next execution`);
            await promise;
        }
    }
}

// list generator
// "[\n".concat(...Array(4).fill(0).map((_, index) => {
//     return `${index === 0 ? "" : "\n"}\t"", // account ${index + 1}`;
// }), "\n]")
const list = [
    // hemi (1)
	// "131015347|vJAfROWAjpkSI6znL6RyZGHOiwqzb7ohukXekRUS6cd5e465", // account 1
	// // "", // account 2 (unused)
	// "131017564|m3x4cpMb1D1iLL1NmrQjO4zGPitRrqGfA6RtWciD63a3384e", // account 3
	// "130836053|FTryrUjhJXBzqrziZFCaPGx0eFs5JnLK2ZCbdnHPbbb08925", // account 4
	// "130845695|M1C12FGDoq5a79DXDVhNDt2qtkOqqzaSA5z4cX6v8a6feae5", // account 5
	// "130881366|6u03twrveUdXEhmoymhFTJdLPCnhYyTZlogGVFl6200774ab", // account 6
	// "130885241|8pbrEQZLiLJJpMq9Xg7bUW2seldsQ1X1ruZDrRaDc8c931da", // account 7
	// "130887382|h4H0ZRZ02YrA1mL603cT3MyoNWZ9CaYKg3tlf09qc3714339", // account 8
	// "131029594|nJ9xKPHXKCzifdln5fZdS9V6AgbpRa6joxACw5rr78057658", // account 9
	// "130891306|dAIL4skwps0VzXBS3kVwQVOWZImC8HLMmAuW8u0Be558957d", // account 10
	// "130894025|LTmLqcya9bOc919V6OiiqjuJuyGWbhIqrPxkRodg22cb32c3", // account 11
	// "130894025|LTmLqcya9bOc919V6OiiqjuJuyGWbhIqrPxkRodg22cb32c3", // account 12
	// "131034268|DqaF7xvY3DNcgV3mfRTQHnwK8dIScM8lI5ZQFrYA79e3dbaa", // account 13
	// "131038387|EhVOVfOdQIOGAw0RYZc2yIbhF9vPEav2irEgjpTSe20b84e3", // account 14
	// "131039409|L1xPIvhgnEy7CCWIIrCPYhiB9py7sHjRn9Q6igze73c121a7", // account 15
	// "131041203|4VUO1BRewsweASpkc1q7yVlDVbKIJuZJf8yN02xv53f2204a", // account 16
	// "131042149|vNjrKt5azhJHanWcUjBy2x7WQC6OzX4JWpoEMGLz03af3699", // account 17
	// "131043383|rlAW5JEfPAPBnJUDMm2B3fFMRvsYxMxJdp6h8dX757751ee5", // account 18
	// "131044652|eLTSXST7fm8ujVOaXRZIasnTN61l09HbXzdjqRo8d2033a22", // account 19
	// "131045804|1VVvobJWGnWzCGprfmm7B07FugKo0Jo3PNn8yOlGcf24cdba", // account 20
	// "131046966|MsOaIEL8d2bBw6WyoBDO79YM1jpfuy7edHpRMLID8cdf4413", // account 21
	// "131048511|pYqrW832fu7YTsCNMSgZFY8E1om6bu0gv6DOQIMPfaa6adf6", // account 22
	// "131049699|GJjYwafQh8bsDhNHsczsdim5AX2g4bX96fcTkOiFbf895740", // account 23
	// "131051868|Wstr9VkmThD8xnvjOc2m30OKVleAc3Z4Q3zk3SJab22613b9", // account 24
	// "131055458|buoQnTRmyjWrNVwPlY2SAjX2NeDpYJ15IgtmWN4ob012a012", // account 25
	// "131056902|PRQ9XYz3J3Itt4ctiiqZAFlY6soXfO5IynWIvFmjc846dc41", // account 26
	// "131057687|sMT2oMO7HWRBMp9H1MszZocb8xGPODtsdWirJL75a577d757", // account 27
	// "131058444|t6fycOBHDBvzsnzfGLPRzBus0fScBHNyQaPgBVd856b8ce73", // account 28
	// "131059775|kTzqQQ5yZWe0VSbD4v1frhBMctA2RE1caztuB92h775e3ba5", // account 29
	// "131060608|JiuiU5JcRVinEfcO3AjJKH1445ynZ84xpp699bhxe4f72de8", // account 30
	// "131061670|4OyZ0bR8NXL01ve3LuPagjcGIsgGiD3OmMKawqO18bb6911b", // account 31
	// "131064066|OyuvublJf0Wlubcl36rwm6C6WN77v62G91AP1mio65a0c982", // account 32
	// "131065481|vrnqsL4zFR8Wt48g6sePSMR9m6KT4Z7zFjQBWvNif9ed68f3", // account 33
	// "131067570|uDF02ZJqqvBxAIusNmd7ZZ3mnzUqIGvje2qaCU2Rdb090a8e", // account 34
	// "131068918|kTkrJDG0ZhJkMnmlPvVvasICHHYm21KTBy0l58im5d96c980", // account 35
	// "131070333|TgODFhqkJEDbt1jTEH7Ccl2qBe8HfUaiZe9HLH8gcb80f659", // account 36
	// "131071753|Xiz4jG5ELi239e847qwOYVaETng113BZPEdaESE97f7df051", // account 37
	// "131072744|TdGjasmFxT9iKYJkUrRbtSvoSYAPiynzzNX0pIt5b1a34a7a", // account 38
	// "131073804|U1ixIINj3UseNxGFdfXq6hw4rXZZSeJXubQQexuud3b52f95", // account 39
	// "131075271|f0WsZSS8w0EwPRdIdszZLqcQiMsfUN6pqKzBghuG9f19ddcd", // account 40
	// "131076834|JyBz7ZLRMwT9ET058wP2i0eJrIqKXGBqYcGtmsK455bb37ff", // account 41
	// "131078541|3zQhzGN68WBTs1QCyeJeAXc2v8n2ErB5T0GbhsPa0b7e0031", // account 42
	// "131079961|mkeUN8Kp1famJ5b3CpuBU6hxaSxIFnY3dyIegZFXfcbc1b5a", // account 43
	// "131080833|PLwdGABvkIaWLfhF2e15bJtXGaQ4WcM1ox7iux2f06e5eeab", // account 44
	// "131081425|7ymBNqmk2x54zvE3exYhVA3MD8GEgS5bI8Jg00oLde01437c", // account 45
	// "131082235|pAICOLr73B9WwUEWhqgrYkbpXmX4puettBIQCxdW837ed1f3", // account 46
	// "131083373|Qs4xEc3unsx9Yne6qwxxECDf63MuZlUxvVfEX7kye4346e1e", // account 47
	// "131084230|8Y6hISZLrkQpbfwXKuvX7PTfIAOnfQivvvTX5sNef0f8fb66", // account 48
	// "131084934|z1JrsgA3uZT6IqE62o4cuZ5TVBZBYuRKe4N8n35wcd1e316c", // account 49
	// "131085781|LFQHNCU1qXv8XPQUmZKKvVkgfRmKYWtfRBS8X1vJbb9657ff", // account 50
	// "131086589|bRl4CwKX4xR9FDmhyMpfGM6uMqOsBNKO8qdyndgrfaa5a01b", // account 51
	// "131089270|LqJZk0K8GYeCHh89xJkDdVPWVpv5mHWmU7VFKqZ906d5844a", // account 52
	// "131090155|9D5vVqayHFulagZwkWe1xq3NG7EXXBD41Egjsb020f30c381", // account 53
	// "131090942|Nx1XlVZLLGlbZTag23uUN6HrEG1KIAUWq695qxmz8d745cd5", // account 54
	// "131091897|gSW8LGfdfNN68eWng2oYgVwrLPlojqaH5QaV8UkYdbaf36ab", // account 55
	// "131093070|ZqPme2Vzx9IzZeoLTSip3oMOyNVWdkZeTB4jQR48d4a836e1", // account 56
	// "131096436|XM08nQ7ZAgv2PpbXveQcryXwQqHflIVSURrEp0TL9777d899", // account 57
	// "131097536|RnbDqrwPd3u22qPY5IlwoJ1j0bosC43x8ASRVQM016403dd6", // account 58
	// "131098556|oKIIAFg7SpyVEupgFxS4Fy0InvsYgCrgPwUxK7qR14de624e", // account 59
	// "131099861|1bbm1znQeDQmXneQiLDCOF4WFjLIXVZqRfUcV89R4040c092", // account 60

    // raspberry pi local (1)
    "137537535|roxDdGFWD9lz6uu43pK4yNF2hsCcHM3qDdAjSGnR9c5163ef", // account thailephan
	"137471391|kvYibCxNqZ2FuESLxAkxsY7FCCic0cGY8g8K98sY838fdf69", // account 61
	"137473436|FeRmYLNVrqeybe1gUoOZqmSyNX6kl5xin3tTtNKm3451d0ee", // account 62
	"137474967|xdFqOUJCPvvVlmdI4Z2ZvnLOnyMA0jwIRBcKDwSzaa2c6b78", // account 63
	"137476564|5Fhp1NKgBezdC7dm5Kh8N5oI8P4WS44mWzYbh1ag7cc57735", // account 64
	"137477901|vWS7HlVxsUjXd1bJ9jrJ86bFoXE0ZfbCw1bbkd6I63825d8b", // account 65
	"137479138|dU9H9CCd8eYkNO6hSvYJnaUAKwSy63yr9OYqKb1n3c9ddd2f", // account 66
	"137480107|eNI7oZEwu9L5viCXe9VVxhzoeOQrCkB5QAnkzdgjd1c665d7", // account 67
	"137481625|nR771c4OWwYiGA1pmB1eY2G1C6gBz7fvd27iATcB69778e7d", // account 68
	"137482353|EQxuIV8MnmvCLrQNnwLkauuAU6LTFjKp7P4ybttn121c5ac6", // account 69
	"137483148|Nj9iunPOVwjPJk4JGWpuJaF01tbhAsAtt9h0TnLp957e040b", // account 70
	"137484108|JdJHPmrc2plJxPJ69oOdGgbNmHA18wHbsoYv4XWrfccde23f", // account 71
	"137485372|qu9fzzycJwIAVy346Hpx9gLSs81BVYgpCH8PHNCka9ae17bd", // account 72
	"137486721|TtbHsUGLEJDcISQdCSrVU7qEWXIsomxUTCoQayIU44a99b8e", // account 73
	"137487660|CWQkNKwI3CsjDBqSGPlhzStf6PlOrOPUzCC4a5zu379a11b8", // account 74
	"137488806|2irCttdEkTSIBfMkQ7iCgecGsn98AJTwWeUJ8iEH65119eb6", // account 75
	"137489762|qWd2CdtVFUa2SfoR8mCiZitoWHiHiyMJgUgKx4zI2805a876", // account 76
	"137490893|pVBNR9KjMeJUxzWeceirhE8Wq94s1C0Ol5rm9SQEbfb9d06c", // account 77
	"137491928|Hnx9HFCYBi27L79u08PqTt7vc51Smd7IfQAh6wz0f7c0bfac", // account 78
	"137493748|9PgyjRyg5pMNwTiKU2wAD6e3zflGBXkbSZWVqEl85cb71606", // account 79
	"137495550|FtS3ysNlOCd3O5LhYEYniOgRTkdVgu0I8xVdfRGHbe8ef544", // account 80
	"137510119|edyEZMikZedk6KXWswwsTrKIScDGzkBdhryNMannb20e683b", // account 81
	"137511399|HJBdoVwRzWtlazJDH6LUHfB3tkV2TusgC0tOQlMXfc65b85a", // account 82
	"137512350|1eKBEUh2OM0AvQGAGE8Jr2koyOGbhLDitoQa4YnN3cb00bc0", // account 83
	"137513420|ykpG1FK83plzt3vva8dNB9tsRwv2s0q3rviGPLDH9457dfdc", // account 84
	"137514258|iiI5AM8wEGeIgeVIJnwMLLKuY6HQmVqcNQMBekgm657d3204", // account 85
	"137515120|mcxKFlWgGf41PLZIaCZha1uOTodanqLFH2AZdvsc2a9de2ed", // account 86
	"137516266|0Pg3QFQuyXeWKAD2HaXHjIqmDI8Ne6itSA3Ex9mRc34b10b6", // account 87
	"137517823|IQUZxcwdQQxFTQhbVK3GW17NAtklbBqPzNMZgv8D2977d9d8", // account 88
	"137519000|Wyi6KSN80RrbFSFqSbao0hSs8Hrk6BaQVULlcyar1ffaded9", // account 89
	"137520212|8zzbszQcswXnFr0Jr5lSWhLcGILBcHBplQFESq0Za4109f94", // account 90
	"137521266|e7gYaqDOxI7USiWtkIdNnmxZDmcxVqeNRaQGeBON7bb2f43b", // account 91
	"137522585|dPSIpaIHeD4HXjtscHyIXzT53BS1fNrsU9iqLlDg0a402cb9", // account 92
	"137524200|pzVo0khCLOgOfRbx266kfmyfOKuYl6Educ97kz3caac5bca9", // account 93
	"137526164|GLFEBpkE1WdZLli2aUBslX9rHbjfWl7v6ONGNvu6a8596a0f", // account 94
	"137528459|45JPueL0cJIu8fpZcBw6vZVWspXQN0sLk0PKTyDD7432cb26", // account 95
	"137530587|2LT6qVNJxRvZtfaQFcuqP7Spy12Zw4Q2LcqM06WB927b2816", // account 96
	"137532307|G66qwvj6WcA8mQZ5buxCLdAur1HOivtSfwgW8Z51c985ac56", // account 97
	"137533967|XFromeoDjFT8mGiKy2e8Q2Mn44ekZ94hZHy1r1hy8f26ae90", // account 98
	"137535035|dirGeIyuoptAMLzOmQZRGhMBd9ihGwgtP7gpxUgP992603db", // account 99
	"137535763|A6f7RHM3ag8arPMQVFn942MmyOPoIXuicihDFgOAc2156d1a", // account 100

	// "149917002|vjMMqjFfD8C3g4dummmahH0WoDlZv5JRDGW6trP7b96e0b26", // account 101
	// "147972919|3f3FZh88iy6GCwgGwg8CuDXMXzeLv981IBtlSWjj6cb903e4", // account 102
	// "147974940|eYTYhSIdg9CshNb9cPofJeAatakZ6bvbEsmf650a6475bf58", // account 103
	// "", // account 104
	// "", // account 105
	// "", // account 106
	// "", // account 107
	// "", // account 108
	// "", // account 109
	// "", // account 110
	// "", // account 111
	// "", // account 112
	// "", // account 113
	// "", // account 114
	// "", // account 115
	// "", // account 116
	// "", // account 117
	// "", // account 118
	// "", // account 119
	// "", // account 120
	// "", // account 121
	// "", // account 122
	// "", // account 123
	// "", // account 124
	// "", // account 125
	// "", // account 126
	// "", // account 127
	// "", // account 128
	// "", // account 129
	// "", // account 130
	// "", // account 131
	// "", // account 132
	// "", // account 133
	// "", // account 134
	// "", // account 135
	// "", // account 136
	// "", // account 137
	// "", // account 138
	// "", // account 139
	// "", // account 140
	// "", // account 141
	// "", // account 142
	// "", // account 143
	// "", // account 144
	// "", // account 145
	// "", // account 146
	// "", // account 147
	// "", // account 148
	// "", // account 149
	// "", // account 150

]
const users = list.map((item) => {
    return {
        token: item,
    }
}).filter(s => !!s) as UserData[];
Main.start(users).then().catch(console.error);


const generateGumartAPIRequestKey = async (timestamp: number, t: string, n: string, key: string) => {
    const message = t + timestamp + n;
    return (await hmacSha256(message, key)).toString()
}
const mappingFunction = (e: string) => {
    const n = Object.fromEntries(Object.entries({
        a: "Q",
        b: "3",
        c: "X",
        d: "9",
        e: "V",
        f: "4",
        g: "Z",
        h: "1",
        i: "B",
        j: "7",
        k: "M",
        l: "0",
        m: "J",
        n: "L",
        o: "6",
        p: "Y",
        q: "5",
        r: "K",
        s: "8",
        t: "W",
        u: "2",
        v: "C",
        w: "A",
        x: "R",
        y: "E",
        z: "D",
        A: "u",
        B: "n",
        C: "t",
        D: "g",
        E: "h",
        F: "a",
        G: "s",
        H: "o",
        I: "p",
        J: "c",
        K: "m",
        L: "v",
        M: "f",
        N: "d",
        O: "j",
        P: "x",
        Q: "b",
        R: "i",
        S: "k",
        T: "z",
        U: "l",
        V: "y",
        W: "q",
        X: "r",
        Y: "e",
        Z: "w",
        0: "H",
        1: "N",
        2: "S",
        3: "I",
        4: "O",
        5: "P",
        6: "F",
        7: "G",
        8: "T",
        9: "U"
    }).map( ([r,s]) => [s, r]));
    return e.split("").map(r => n[r] || r).join("")
}
const t = () => mappingFunction("9OU49SIPXHFNIX4O4VIOTGSFNXX933IP");
const r = () => mappingFunction("UHHTQVQUUVIGSV3I3S44FQI4HXQOTUGP");
const n = () => mappingFunction("QGFNXTSSINPUGXT3X3XSVNTUGSPQGIPO");
function loop() {
    let datas = Math.round(Date.now() / 1e3).toString();
    const result = [];
    const sighash = {
        0: 3,
        1: 4,
        2: 1,
        3: 6,
        4: 9,
        5: 0,
        6: 8,
        7: 2,
        8: 5,
        9: 7
    } as any;
    let byteCount = 0;
    for (let i = 0; i < datas.length; i++) {
        const char = datas[i] as any;
        result.push(sighash[char]);
        byteCount += parseInt(datas[i]);
    }
    result.push(byteCount);
    return [parseInt(datas), parseInt(result.join(''))];
}