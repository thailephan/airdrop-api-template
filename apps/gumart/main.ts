import { TelegramApplication, TelegramApplicationConfigs } from "../../application.ts";
import { hmacSha256 } from "../../common/hmac.ts";
import { Time, Timer } from "../../common/timer.ts";
import FetchHeaders from "../../services/headers/headers.ts";
import { AppProxyChecker } from "../../services/proxy/proxy-checker.ts";
import { ProxyMartRotateProxyController } from "../../services/proxy/proxy-controller.ts";

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
        console.log(`start ${this.token}`)
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

        const shouldClaimGum = Date.now() - homeResponse.data.claim_timestamp >= 5 * Time.MINUTE;
        // claim
        if (shouldClaimGum) {
            const [requestAt, hash] = loop();
            const signature = await generateGumartAPIRequestKey(requestAt, t(), n(), r());
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
    static appProxyChecker = new AppProxyChecker();
    static rotateProxyController = new ProxyMartRotateProxyController("ae6b50a4-5067-48df-8b2d-8f15e6595a17");
    static async start(users: UserData[]) {
        const NUM_OF_ACCOUNT_TO_REROTATE_RROXY = 5;

        while (true) {
            const totalUsers = users;
            // const randomUserIndexes = Array.from({ length: totalUsers.length }, (_, index) => index).sort(() => Math.random() - 0.5);
            const failedUsers: UserData[] = [];
            for(let i = 0; i < totalUsers.length; i += 1) {
                // const user = totalUsers[randomUserIndexes[i]];
                const user = totalUsers[i];
                const proxyIP = await Main.appProxyChecker.check(user.proxy);
                if (proxyIP) {
                    const application = new GameTelegramApplication(user, { maxRuns: 1 });
                    await application.execute();

                    const { host: proxyHost, port: proxyPort } = extractProxyComponents(user.proxy) as { host: string, port: number } || { };
                    if (i % NUM_OF_ACCOUNT_TO_REROTATE_RROXY === 0 && proxyHost && proxyPort) {
                        const rotateProxyResponse = await Main.rotateProxyController.action(proxyHost, proxyPort);
                        console.log(`${proxyHost}:${proxyPort}: Proxy rotated: ${rotateProxyResponse.success}, new IP: ${proxyIP}`);
                        await Timer.sleepRandom(2 * Time.MINUTE + 10 * Time.SECOND, 2 * Time.MINUTE + 40 * Time.SECOND).promise;
                    } else {
                        await Timer.sleep(20 * Time.SECOND);
                    }
                } else {
                    failedUsers.push(user);
                }
            }

            if (failedUsers.length > 0) {
                const paidProxy = failedUsers.find(user => !!user.proxy);
                const firstCheckProxyIP = await Main.appProxyChecker.check(paidProxy?.proxy);
                if (paidProxy && paidProxy.proxy && !firstCheckProxyIP) {
                    const proxy = paidProxy.proxy;
                    const MAX_PROXY_RETRY_TIMES = 10;
                    let proxyRetryCount = 0;
                    while (proxyRetryCount < MAX_PROXY_RETRY_TIMES) {
                        try {
                            const proxyComponents = extractProxyComponents(proxy) as { host: string, port: number } || { };
                            if (!proxyComponents.host || !proxyComponents.port) {
                                break;
                            }

                            await Main.rotateProxyController.action(proxyComponents.host, proxyComponents.port);
                            await Timer.sleepRandom(2 * Time.MINUTE + 10 * Time.SECOND, 2 * Time.MINUTE + 40 * Time.SECOND).promise;

                            const proxyIP = await Main.appProxyChecker.check(proxy);
                            if (proxyIP === undefined) {
                                throw Error(`${proxyComponents.host}:${proxyComponents.port}: ProxyIP is undefined`);
                            } else {
                                break;
                            }
                        } catch (e) {
                            console.log(`Retry ${proxyRetryCount} for failed users, failed to check proxy: ${e}`);
                            proxyRetryCount++;
                        }
                    }
                }

                for (let i = 0; i < failedUsers.length; i += 1) {
                    const user = failedUsers[i];
                    const proxyIP = await Main.appProxyChecker.check(user.proxy);
                    if (proxyIP) {
                        const application = new GameTelegramApplication(user, { maxRuns: 1, proxyController: Main.rotateProxyController });
                        await application.execute();

                        const { host: proxyHost, port: proxyPort } = extractProxyComponents(user.proxy) as { host: string, port: number } || { };
                        if (i !== 0 && i % NUM_OF_ACCOUNT_TO_REROTATE_RROXY === 0 && proxyHost && proxyPort) {
                            const rotateProxyResponse = await Main.rotateProxyController.action(proxyHost, proxyPort);
                        console.log(`${proxyHost}:${proxyPort}: Proxy rotated: ${rotateProxyResponse.success}, new IP: ${proxyIP}`);
                            await Timer.sleepRandom(2 * Time.MINUTE + 10 * Time.SECOND, 2 * Time.MINUTE + 40 * Time.SECOND).promise;
                        } else {
                            await Timer.sleep(20 * Time.SECOND);
                        }
                    }
                }
            }

            const { promise, time } = Timer.sleepRandom(5 * Time.MINUTE, 10 * Time.MINUTE);
            console.log(`Wait ${time} second(s) to next execution`);
            await promise;
        }
    }
}

// list generator
// "[\n".concat(...Array(4).fill(0).map((_, index) => {
//     return `${index === 0 ? "" : "\n"}\t"", // account ${index + 1}`;
// }), "\n]")
const accounts = [
    // hemi (1)
    "137537535|roxDdGFWD9lz6uu43pK4yNF2hsCcHM3qDdAjSGnR9c5163ef", // account thailephan
	"131015347|vJAfROWAjpkSI6znL6RyZGHOiwqzb7ohukXekRUS6cd5e465", // account 1
	// "", // account 2 (unused)
	"131017564|m3x4cpMb1D1iLL1NmrQjO4zGPitRrqGfA6RtWciD63a3384e", // account 3
	"130836053|FTryrUjhJXBzqrziZFCaPGx0eFs5JnLK2ZCbdnHPbbb08925", // account 4
	"130845695|M1C12FGDoq5a79DXDVhNDt2qtkOqqzaSA5z4cX6v8a6feae5", // account 5
	"130881366|6u03twrveUdXEhmoymhFTJdLPCnhYyTZlogGVFl6200774ab", // account 6
	"130885241|8pbrEQZLiLJJpMq9Xg7bUW2seldsQ1X1ruZDrRaDc8c931da", // account 7
	"130887382|h4H0ZRZ02YrA1mL603cT3MyoNWZ9CaYKg3tlf09qc3714339", // account 8
	"131029594|nJ9xKPHXKCzifdln5fZdS9V6AgbpRa6joxACw5rr78057658", // account 9
	"130891306|dAIL4skwps0VzXBS3kVwQVOWZImC8HLMmAuW8u0Be558957d", // account 10
	"130894025|LTmLqcya9bOc919V6OiiqjuJuyGWbhIqrPxkRodg22cb32c3", // account 11
	"130894025|LTmLqcya9bOc919V6OiiqjuJuyGWbhIqrPxkRodg22cb32c3", // account 12
	"131034268|DqaF7xvY3DNcgV3mfRTQHnwK8dIScM8lI5ZQFrYA79e3dbaa", // account 13
	"131038387|EhVOVfOdQIOGAw0RYZc2yIbhF9vPEav2irEgjpTSe20b84e3", // account 14
	"131039409|L1xPIvhgnEy7CCWIIrCPYhiB9py7sHjRn9Q6igze73c121a7", // account 15
	"131041203|4VUO1BRewsweASpkc1q7yVlDVbKIJuZJf8yN02xv53f2204a", // account 16
	"131042149|vNjrKt5azhJHanWcUjBy2x7WQC6OzX4JWpoEMGLz03af3699", // account 17
	"131043383|rlAW5JEfPAPBnJUDMm2B3fFMRvsYxMxJdp6h8dX757751ee5", // account 18
	"131044652|eLTSXST7fm8ujVOaXRZIasnTN61l09HbXzdjqRo8d2033a22", // account 19
	"131045804|1VVvobJWGnWzCGprfmm7B07FugKo0Jo3PNn8yOlGcf24cdba", // account 20
	"131046966|MsOaIEL8d2bBw6WyoBDO79YM1jpfuy7edHpRMLID8cdf4413", // account 21
	"131048511|pYqrW832fu7YTsCNMSgZFY8E1om6bu0gv6DOQIMPfaa6adf6", // account 22
	"131049699|GJjYwafQh8bsDhNHsczsdim5AX2g4bX96fcTkOiFbf895740", // account 23
	"131051868|Wstr9VkmThD8xnvjOc2m30OKVleAc3Z4Q3zk3SJab22613b9", // account 24
	"131055458|buoQnTRmyjWrNVwPlY2SAjX2NeDpYJ15IgtmWN4ob012a012", // account 25
	"131056902|PRQ9XYz3J3Itt4ctiiqZAFlY6soXfO5IynWIvFmjc846dc41", // account 26
	"131057687|sMT2oMO7HWRBMp9H1MszZocb8xGPODtsdWirJL75a577d757", // account 27
	"131058444|t6fycOBHDBvzsnzfGLPRzBus0fScBHNyQaPgBVd856b8ce73", // account 28
	"131059775|kTzqQQ5yZWe0VSbD4v1frhBMctA2RE1caztuB92h775e3ba5", // account 29
	"131060608|JiuiU5JcRVinEfcO3AjJKH1445ynZ84xpp699bhxe4f72de8", // account 30
	"131061670|4OyZ0bR8NXL01ve3LuPagjcGIsgGiD3OmMKawqO18bb6911b", // account 31
	"131064066|OyuvublJf0Wlubcl36rwm6C6WN77v62G91AP1mio65a0c982", // account 32
	"131065481|vrnqsL4zFR8Wt48g6sePSMR9m6KT4Z7zFjQBWvNif9ed68f3", // account 33
	"131067570|uDF02ZJqqvBxAIusNmd7ZZ3mnzUqIGvje2qaCU2Rdb090a8e", // account 34
	"131068918|kTkrJDG0ZhJkMnmlPvVvasICHHYm21KTBy0l58im5d96c980", // account 35
	"131070333|TgODFhqkJEDbt1jTEH7Ccl2qBe8HfUaiZe9HLH8gcb80f659", // account 36
	"131071753|Xiz4jG5ELi239e847qwOYVaETng113BZPEdaESE97f7df051", // account 37
	"131072744|TdGjasmFxT9iKYJkUrRbtSvoSYAPiynzzNX0pIt5b1a34a7a", // account 38
	"131073804|U1ixIINj3UseNxGFdfXq6hw4rXZZSeJXubQQexuud3b52f95", // account 39
	"131075271|f0WsZSS8w0EwPRdIdszZLqcQiMsfUN6pqKzBghuG9f19ddcd", // account 40
	"131076834|JyBz7ZLRMwT9ET058wP2i0eJrIqKXGBqYcGtmsK455bb37ff", // account 41
	"131078541|3zQhzGN68WBTs1QCyeJeAXc2v8n2ErB5T0GbhsPa0b7e0031", // account 42
	"131079961|mkeUN8Kp1famJ5b3CpuBU6hxaSxIFnY3dyIegZFXfcbc1b5a", // account 43
	"131080833|PLwdGABvkIaWLfhF2e15bJtXGaQ4WcM1ox7iux2f06e5eeab", // account 44
	"131081425|7ymBNqmk2x54zvE3exYhVA3MD8GEgS5bI8Jg00oLde01437c", // account 45
	"131082235|pAICOLr73B9WwUEWhqgrYkbpXmX4puettBIQCxdW837ed1f3", // account 46
	"131083373|Qs4xEc3unsx9Yne6qwxxECDf63MuZlUxvVfEX7kye4346e1e", // account 47
	"131084230|8Y6hISZLrkQpbfwXKuvX7PTfIAOnfQivvvTX5sNef0f8fb66", // account 48
	"131084934|z1JrsgA3uZT6IqE62o4cuZ5TVBZBYuRKe4N8n35wcd1e316c", // account 49
	"131085781|LFQHNCU1qXv8XPQUmZKKvVkgfRmKYWtfRBS8X1vJbb9657ff", // account 50
	"131086589|bRl4CwKX4xR9FDmhyMpfGM6uMqOsBNKO8qdyndgrfaa5a01b", // account 51
	"131089270|LqJZk0K8GYeCHh89xJkDdVPWVpv5mHWmU7VFKqZ906d5844a", // account 52
	"131090155|9D5vVqayHFulagZwkWe1xq3NG7EXXBD41Egjsb020f30c381", // account 53
	"131090942|Nx1XlVZLLGlbZTag23uUN6HrEG1KIAUWq695qxmz8d745cd5", // account 54
	"131091897|gSW8LGfdfNN68eWng2oYgVwrLPlojqaH5QaV8UkYdbaf36ab", // account 55
	"131093070|ZqPme2Vzx9IzZeoLTSip3oMOyNVWdkZeTB4jQR48d4a836e1", // account 56
	"131096436|XM08nQ7ZAgv2PpbXveQcryXwQqHflIVSURrEp0TL9777d899", // account 57
	"131097536|RnbDqrwPd3u22qPY5IlwoJ1j0bosC43x8ASRVQM016403dd6", // account 58
	"131098556|oKIIAFg7SpyVEupgFxS4Fy0InvsYgCrgPwUxK7qR14de624e", // account 59
	"131099861|1bbm1znQeDQmXneQiLDCOF4WFjLIXVZqRfUcV89R4040c092", // account 60

    // raspberry pi local (1)
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
	"149917002|vjMMqjFfD8C3g4dummmahH0WoDlZv5JRDGW6trP7b96e0b26", // account 101
	"147972919|3f3FZh88iy6GCwgGwg8CuDXMXzeLv981IBtlSWjj6cb903e4", // account 102
	"147974940|eYTYhSIdg9CshNb9cPofJeAatakZ6bvbEsmf650a6475bf58", // account 103
	"151654459|jCRdDDHzwt73r49sYPgqWXVGOTPaBG7gJHlfkJGs49c5befc", // account 104
	"151664332|4gkQ0G1QWIMCWucxtErUgSLbZlusMvKpRTQdYpLm23803311", // account 105
	"151664648|9RtBw2bgMT6ANTcuBUyWin8aB6eppFjpDfh4YeHe4fb7cbc5", // account 106
	"151664959|si7nLJtKzhNAcaR9YhnF3HTBiUArI8G9H5e0RAR4c9d696d7", // account 107
	"151665222|FQescC4DySThw66wWFC1JukAz0bReLeLwp8Qcc2822e4409e", // account 108
	"151665552|ub9XV0b99VIABly3qreoxScr4UZnVKkIOeRYJympaecbd21e", // account 109
	"151665955|5Vv9eQ8axmtu6eMLrLJqdQYerH0CdbrmpSKIVtFH9ed37cbf", // account 110
	"151666402|hCKDWb2FuSnukGpHZNRL5OzmYq65a2raVZ28imY3aa5b1fe7", // account 111
	"151667171|gs9e9FDU2c5wVJVhkIepkWqyQBQhlkpyrdHRgeJi94b56789", // account 112
	"151667727|xhqRmc1SrFxIjEbdSMWi4zFARVGtVUanZ1y8iMEv761f94a4", // account 113
	"151668385|PJKjTYCyfLbOp2Ssb8bcsyeEHKss9dAFQV4Qb3fC538b7700", // account 114
	"151669465|GFSj8KnQDPNQXQJEFRtaMfWwnq12gqxFRRtQuLZ90b8fb715", // account 115
	"151670347|498aVFV9U3ST0rXnWLHJVwMMGGqmYQvYuHylPEHU05321c2a", // account 116
	"151670908|rfWhmYIhOUoDKWCWaSADtpe8CwZSHbsELE8ERuel56fb3377", // account 117
	"151671196|0GYFJ4KMArQLadslXhiFbpY2owaY1QdHAaWt4CPz62245b7d", // account 118
	"151671665|1dqX2vOCDWgB387Npbxfmyj1vCtZgVPYElBFlZbc2d18de98", // account 119
	"151672218|bGucTpT8bJmfU8Ql539Lbn2bbnGXJunfmED3W3Eb524a4696", // account 120

	"151673031|sBXn2CStcVfY7kJrKWIlddHzc86HtWEwv1fmTSKh1109b6c1", // account 121
	"156205557|j1XvXJ53xrNN6G1AWGGCigaAXPP58mSdwq8XwaVQf9e595bd", // account 122
	"151674133|EDWlr7L8cWe1BkFoSnUrkTz4kCeZEEYOtSxqcgie7d83aa36", // account 123
	"151675051|irIeCwVql4Wv3wXaBG5wEoy1miFwyPS7VXJQauMS7425ec1b", // account 124
	"151675561|2dHmKSDKrPHSV7sAYCx4b3RQ0a9fyrDwgNme2pggb57d316e", // account 125
	"151678396|icU2HSbQEy0qhartW6yzBjQhSp5IVwOMmMvTFsQKf77750d3", // account 126
	"151679080|9ZebPEgWioHrwcvwIYlp9ZHupIBLci7QVOdRJ2964cb667ba", // account 127
	"151679284|VbZyaIpzKsCIsZ0zpBc2d4LSlgl9KoQrgXUt2X3y327d310e", // account 128
	"151679534|GK1Iih2GsklYmt0ob8u6IgBmr8DCxzeljhmS5V7K5dc738fb", // account 129
	"151679740|GNaqz6ejOZ93zV18qur8T1ylysRnxIp8TUD9IOUQ5aed119c", // account 130
	"151680116|eKXKyOU13NIUM5WCPuYRCx7FNOJGM6NAJZcESU0dc043ea81", // account 131
	"151680519|rcYSoNigoIvuoJAv3Kt2afo3nFIsQVkdDpfQR2Bt18bf3f03", // account 132
	"151680837|evdhB6o11j9fAfzv5zYJANRwK1WDGRNfFyOLv3qn2de4dd1a", // account 133
	"151681095|GwuRAM2jbVbx2iLFEsoHvnO0AajWYywEuH8tzoR018456b0e", // account 134
	"151685586|J7u8RJv6TymaAjQzTwLfqXG5gjY9CsWTmF1MYrzJa4dc297e", // account 135
	"151686379|CELTNgmpHKF5QCiHsM2YD2W1QZixEi9UC7gQtdORb2a69d28", // account 136
	"151687350|Xne93ygJv6CDKpLYZcuRDmogZF9xIqtYLHgWLkbc53497a29", // account 137
	"151688175|n2mFlzJ0zdb959UBkQ7kjS9mVBiRoT1mbGRny7Vu888d9f58", // account 138
	"151690407|agHyie47PP3MvZ3fY7Z6KRAnZ0oCj8825K7ru43K213edf24", // account 139
	"151690940|51OnD9C6Pv2we6HpwrkZdkBfghPSdg3xKxhcmet77726d844", // account 140
	"151691987|tv6zrH5kaz2EqNhQBsdc3fHduMa7rEkURroARYPu66c9c35d", // account 141
	"151693665|QMgtibc5TLkXZ4vuSFdfCuRuRefv9Upv4WQ1uXRo511710b9", // account 142
	"151695146|HGjwgxveQoLE6gVcGNFQ5vkuY84OmjYncltqrpAZ1d36ee54", // account 143
	"151696167|Dji8tL21etXijydLBIAJ0FYL9ZvrB8TGfCt6ETum61383197", // account 144
	"151696711|kffNRQf5V4EwHv1Iwf7zv9qpT5hAbxouJBI409zN8eef382c", // account 145
	"151697443|nvLoerdEvJNhOYuOYl9S5l4GKGkxyRpWuuo0Gaig0fa812aa", // account 146
	"151698189|BgaVjIECoUG5zkAt1FyxSy5mANGoIOtkR85YSsrneec3aa22", // account 147
	"151699131|kQevFK6sXfRgqOLciQMwFtKsxoqvQ8tgACHmv3BD50cf1042", // account 148
	"151699904|8hhLNffvNtn0kV9CkgcFPKSgtg1m0Z1ppqURhsvy53dfe06c", // account 149
	"151700799|s0sgCIuFJO2Pcv4ezm03CnWbXBLYheiB39RigQM849cf358b", // account 150
	"151726663|35oNgfEIgsYlqNhVmpX7EggGu0oway1Ushui0ypW2f359f3c", // account 151
	"151727871|jWSNwmkl23KHr4xO1Rkmnk89jK9PNPRRRHblvmDT93049882", // account 152
	"151728711|KMGSVXFwDCSjzOW3mBVXvXvgmzF0vHYIidNpv6kRb92cc650", // account 153
	"151730139|SLRmeNxFql5xBEN5JWLnTHwb0UZTK0vNVNb52xtq413ec543", // account 154
	"151730883|nRAwWdb1YnYYRBRYpL6R5URy9w2nXQ0dcrNgYE5b91d5de67", // account 155
	"151732021|Z832fa4cvMP46TAtUYuU1W8hk2sEQIHD3L2OdX2K824afa6e", // account 156
	"151732969|fYiun2XLOCWz5z4vkqosQAVWeuZtm0LkzJwGFhPe1e816f4a", // account 157
	"151733966|oBEJlwZQf9BRPPyaBosnQlAgMx42op4bPgu1cVNT4ebf5703", // account 158
	"151734722|T33cb36RCIu9p5AQzuYikZZHm1HcVdztRQQQLwDS4a23151e", // account 159
	"151735497|S4Eb3q42OlkfvfDhZiXIbEDYZJjFZ8kwXWFOD4kh9c168457", // account 160
	"151737052|G2aySxzk2eHy6NPcoe7CGINE2zNaPph22i5OUv36fa2ede53", // account 161
	"151737892|WEUvJlsTPyRCTPn0b71JDqHLQeLCjeMxMv8rZU5U9e8ab647", // account 162
	"151738565|lzhy6SvLEsfkYQ9buCsBWqeK2nb9HcFFSz5I8JJp8f9dbb49", // account 163
	"151739149|ElDWztcAk9XsES5FJWyDgNAwzHUmh0O2BfyitLewfaf21880", // account 164
	"151739929|2GZC6pusCkOB7zx6a3QsSwsgOT8ZBsnBvKioDWDa91542435", // account 165
	"151740608|EN9ADBjoYtbdOtE1QzXiYH5bvdIbjrRTD70aKQksa58b26c0", // account 166
	"151741915|CPMSg3eGIkpAUBJUhXXFYX4ppfLGE4b41CuGvoUof556aeba", // account 167
	"151742630|xkjofAEfjzfyyu92a1Ov8pE2wzurY9qy6tDtbhjB2eed9357", // account 168
	"151743118|wMAsU7nQVvZqSVv3bv8EeaAwy3avlwF2miGQBsRY21572afd", // account 169
	"151743601|k45xxFExIqZD7qd2nlpVBTHsGm3tCYr58nQ8CS6w22579291", // account 170
	"151744297|xdZJCGPM3rM1GoCsFvGKi3spNv0EDnIPEI475TZX3033cd26", // account 171
	"151744785|AX6QTmdwi68mYR5UgSZ5FAI1flordYCytTi81QOeffc3c795", // account 172
	"151745439|GM78mFZ9l2YUiPfiwwuqLKCqgtt7k9d4xoZG6FqI741374ea", // account 173
	"151745995|XQJurV9aEfSnpOyd0Fhv02lAxyglOzOgdAlMDRSif1d0352c", // account 174
	"151746633|uFQyBsZfV8Ju8k7jJ3oM7ct8FrbN6qJSQnZbksXX2089b32a", // account 175
	"151747103|rClMW4T3Erz7D7Dj3yo7kGhYZyKJ7n39eI2JUWbT9af0f080", // account 176
	"151747587|hhcX4L4NO06e2jq7mOyirOx70oobyTcJOOTPmmrF7e1306f0", // account 177
	"151748122|mdvHnLVCo6Bs9TBk4aqNe9A60kgl4asGcowepWrN99ecb003", // account 178
	"151748613|DApeBIS56VhnijGfDU8e3RibncPV6b4SuMGQJ0wfd947ad10", // account 179
	"151749250|B6SSTuoUgNp4pIWnG3qgoN4TPzWIG67iTDEqcGvC7b28e356", // account 180

	"151749716|tjHtF9lkcceJS5ydVtIbeiZnmoQ0NiH5GKTBbImLa474eb3d", // account 181
	"151750432|qPJ9EVjB20K501rMY1XefSFagW1yoCQ5keEQ88WDb29d4156", // account 182
	"151751179|Byq1HVpbluMk84Gp7HHoou02V0yojTSnSeYNfbrT0361842d", // account 183
	"151751910|6s9d2FaOUOZ7GBJIl3CDdn2axvAurLbF7mKCw41wc0cc8d68", // account 184
	"151752626|003DFuT8i7vZjHaFZOFpNjaVQ3CVXLJylQSeUviDf49daa2a", // account 185
	"151753298|w6YK3JSBsnZdUBoAe5tYAg9ipOXXBHalauKdOPmf96e2e6c0", // account 186
	"151755865|ckhWoHT9YzaTYM0tLplF7ANuIwbULQsS7mQAL4NR3fd4c033", // account 187
	"151756614|nRoRn1dNlG1zEBtS23vI9kFPNMXlHEY8iAW0pvjA6f9f3fd2", // account 188
	"151757252|mRknhN1X63woKDjMy2Yz7I0QxCB12NP2PQwpOcUz75d74896", // account 189
	"151758706|GQkkfVconedEgY7xAYijGlD8i7J2vXuNwmplq8yJde9d869f", // account 190
	"151759448|6QLWu1nFSpsWWBrf0hBeGxODl7xeIAL59aBYuMV928eae001", // account 191
	"151760159|6oiCrE1HNPNpRg5goH5SJGVry0jpkKaqcFx6rC8A1edaf64e", // account 192
	"151760666|likiA8T6iyzo5H2IB6CuoEscY1w50ckEDJnQklnX4dd04af4", // account 193
	"151761360|7wtSMkMTsjVEFC8v1lyWWEl8fDQb98hFoQpjDwUMe3787665", // account 194
	"151763039|uAzFfyICaTXD3Il6GFP0B9vLzkz4k3hzZY5ZhXC3fdf73a49", // account 195
	"151770322|rxPHnFNLdYlGt5At0n3SS0ku05V5ndWxhECvgL9A226c45cc", // account 196
	"151770781|uPzRI5yhdC7Nv6xqjdRTepNki2NTm8xL3HeRP6Dw8bb8a688", // account 197
	"151775743|Z0o2o426Mto5kwJKqEgP99mRjpW2EgHeUpxZWe4p3032e1a9", // account 198
	"151777193|6aeWWoUP1xO8fcZFWOuKdESoWYBblZcApv5gEtCDd31f8881", // account 199
	"151782677|qTKZTjKNMUfKegkBohWh2UcYtGhuRGfTja7tIKDv5d4b9dda", // account 200
	"151853013|oa1BtLWAUv9TTaLvUS9Un6e7pbZKRS7e4Ss2uiXZd56bddcc", // account 201
	"151853365|4Ztj54dyhc3XY6zWwuF1hD33RLTgACkHMgOtVdzT38066aa6", // account 202
	"151853892|NZJdMIpuGtGoEJi59j1NRzaynNwJr7rJHvcE926O9afe4d35", // account 203
	"151854273|fyKtWEyovzFmHU0Xlv4n9ji9stklClQLEQfNScdha6d2bffa", // account 204
	"151854728|rUIRQWo9E36PSi8e66Hw0Yid9uhyhggjr05kUaZM958bf7e7", // account 205
	"151855104|r96mbxfeNxtmcl4PhVAJxL5QD1upntf103ESLqlW9f6c8be1", // account 206
	"151855710|gm8R7dXyBXbP2Fkt6w4aNH8jAVLTAlkEgHxk0ltC0304c52a", // account 207
	"151856190|KrA5vds17LGDtqiz5xWqQ1Wuc9fxLODjafTBHhxS5df23386", // account 208
	"151856544|jPbrwzRNaFKTrVKiRv1EtkAH6MD2HOtosRgRtDF750f700b3", // account 209
	"151856858|yduUtdeTaxTbadlIgkwvere3JvCP0ywckQweTqPbefc67002", // account 210
	"151857207|cw1QDOcuJmvX4hapO7CYzhN9nF0yVSXpNZB7fjB8bff5ab2a", // account 211
	"151857577|LnRVozPGXlxoVKfw17OGKeWDFw2s02KiAPkZSD4T33c23595", // account 212
	"151857969|fCNW4193Ge0YIbMBjkou5Cbe6FqZIUF0Ww36ndJB659780e3", // account 213
	"151858264|xTukBjVyiW45qUlP0VQUbWPPDWdCZBuPWkCEn78Hdef6039b", // account 214
	"151858505|E83QAIEDO2Py3PMOIECiFT0iLLuLhzvM4AWTCu0o4c2fd3e6", // account 215
	"151858806|PK3p3cWszzb1wC4254Rl0nS92rFaIFyOITl6kRWv4ada800a", // account 216
	"151859168|3WvCZaeNwkn86f6fX4S4xy41vGHra1vuLfFYowmvc0f00780", // account 217
	"151859505|PdR39HDWd4hDclq3C9l14JUF4udFJdorbo6PMZ9Qc18d70a7", // account 218
	"151860404|4Lbsi5DuboGqex19MkfXWhqB2BfjvNHdtSm3ehvBa3b8f00f", // account 219
	"151861650|hrvFK8y8Oi8qUOAjQcaNxTLTwao2XP7MwvNVORx1b505bd7b", // account 220
	"151861992|Mb1lcbimAODKYLtU7o8wtoLFDcAiGRHzbq66cbyz879bf889", // account 221
	"151862228|F9pRwLDGy6FZqgldLGCzdiGzzEbnQOXHC0JlzElSdbb652ef", // account 222
	"151862521|cDtCbLSTFi6xdrJ3WpO5jxpxC45GU4FJq2Odl7Zg4cbe6328", // account 223
	"151862785|N0WuhMmBnVF67tupTgcORzYs6MpWLOnIAwAjKSuRc0682402", // account 224
	"151863098|U2qY4dCxApOkdp7wB8peCLh73OPVnhBYeOZZylJA5c0f06ed", // account 225
	"151863432|RQYjVMmkYo4JXNg7v9BRhVUU3imoshf85rOCTDxJ567000a4", // account 226
	"151863796|DQzC1qJ0tRNrWj53BB0HuX0pwAx1SAW41V8AUZl51bc54d8b", // account 227
	"151864142|G0WljfhqGJjeh5mTawzP8vBfYubrsDZxuskwvzZF1e48a735", // account 228
	"151864712|pbsKhUDBrElY6De4JvBUVBnsWhr1L6zK13JhbKXxf331cf5c", // account 229
	"151865241|peWIn7QsvGNtwYNIqR3KXnODtufHXd7hnldKIjnp5476852c", // account 230
	"151865917|k6vOv4tPnJOIXY1SW92HOL3PaSSkOY7LOrJUbYrj3686caf3", // account 231
	"151866351|KgJMfx7PmvrUC7f8P7dul4nL961j22o4ig8J8hqn564fd5ff", // account 232
	"151866959|HBmeVCOEYEChYM5t81c5fQCvOtCbfbmxTwinWn31e07a893c", // account 233
	"151867436|z5yc5meSGqkT6fRJaFbFv7W3F2TyjN0JiGAfM6te45c1b48c", // account 234
	"151868045|U3kXybeuYb12SPu6nMe6Qu8GFUlDYa6C0gZLbBaz8ca31eb2", // account 235
	"151868446|ZUTvgxBSdVhcaIoov9sD1Ae8TFcUPjgrbBP6cmkKff80f93d", // account 236
	"151869102|Ml6fOqYsqbMIgOWMZ2EljZVj5wF2sAbfEez6zzgJe27241cf", // account 237
	"151869661|thwkN5kuRi9fHX5OAl43jrOE0rUaW47Rq19dExXg923a873b", // account 238
	"151870296|siHq4k9dWjWN4emHd4KBByVYjSGRIydHJljD8A9z12e5ed1b", // account 239
	"151870739|BFWmAF5Reb7ySwOBKuqCLtOirVg4H9inEoh44Nr8551f9086", // account 240
]
const proxies = [
    // raspberry pi
    undefined,

    // hemi server
    "proxymart49015:JWHMkzig@103.170.246.83:49015",
    "proxymart50677:tjtrPste@103.90.231.0:50677",
    "proxymart49484:MgLyVQUJ@103.241.199.84:49484",
    "proxymart50188:BsMvKShe@103.90.231.0:50188",
    undefined,
];
const accountsPerProxy = Math.ceil(accounts.length / proxies.length);

const start_proxy_segment_index = 0;
const end_proxy_segment_index = 1;
proxies.slice(start_proxy_segment_index, end_proxy_segment_index).forEach((proxy, index) => {
    const selectedAccounts = accounts.slice(index * accountsPerProxy, (index + 1) * accountsPerProxy).map((item) => ({
        token: item,
        proxy,
    })) as UserData[];
    Main.start(selectedAccounts).then().catch(console.error);
})


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

function extractProxyComponents(proxy?: string) {
    if (!proxy) {
        return false;
    }
    const [username, password, host, portStr] = proxy.split(/[:@]/);
    const port = parseInt(portStr);
    if (!username || !password || !host || !port) {
        return undefined;
    }
    if (!host.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)) {
        return undefined;
    }
    if (isNaN(port) || port < 0 || port > 65535) {
        return undefined;
    }

    return {
        username,
        password,
        host,
        port,
    }
}