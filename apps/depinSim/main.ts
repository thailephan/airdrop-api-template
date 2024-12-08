import { TelegramApplication } from "../../application.ts";
import { Time, Timer } from "../../common/timer.ts";
import FetchHeaders from "../../services/headers/headers.ts";
import { AppProxyChecker } from "../../services/proxy/proxy-checker.ts";

class GameFetchHeaders extends FetchHeaders {
    constructor() {
        super();

        this.setKey("Origin", "https://app.depinsim.com");
        this.setKey("Referer", "https://app.depinsim.com/");
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


export interface UserInfo {
  id: string
  createTime: string
  updateTime: string
  source: number
  tgId: number
  tgUserName: string
  pointBalance: number
  miningBalance: number
  earnBalance: number
  consumeBalance: number
  inviteBalance: number
  inviteUser: any
  invitedNum: number
  userAvatar: any
  todayEnergy: number
  todayBoostNum: number
  inviteCode: string
  status: number
  accessToken: any
  userLevel: number
  minerList: MinerList[]
  minerCount: number
  profitPerHour: number
  pointTolevelUp: number
  levelPointRemain: number
  levelName: string
  miningUpdateTime: number
  tapBalance: number
  balanceChange: number
  levelChange: any
  oldBalance: number
  latestTransferTime: any
  vipFlag: number
  vipExpireDate: any
  levelDeleta: string
  premiumFlag: number
  vipStartDate: any
  autoTapping: number
  bountyAmount: number
  donationAmount: number
  bountyPoints: number
  donationPoints: number
  vipExpireFlag: number
  travelBalance: number
  travelDistance: number
  lastTravelTime: any
  yesterdayTravelRewards: number
  yesterdayTravelDistance: number
  unreadMsgCount: number
  playCredit: number
  gameBalance: number
  userTaskNumber: number
  marketingBalance: number
  waitWithdrawBalance: number
  waitWithdrawBalanceFee: number
  fakeFlag: number
  oldCredit: number
  coFlag: number
  verifyStatus: number
  openLeagueVerifyFlag: number
  publicKey: any
  homeGuideUpdateTime: string
  esimGuideUpdateTime: string
  timeChange: any
}

export interface MinerList {
  id: string
  createTime: string
  updateTime: string
  minerName: string
  minerPhoneNum: string
  remainingData: number
  dataConsumed: number
  totalProfit: number
  profitPerHour: number
  activeFlag: number
  status: number
  activateType: number
  userId: string
  esimId: any
  todayProfit: any
  miningRecordList: any
  expireDate: any
  esimInfo: any
  waitRank: any
  vipFlag: number
  originFlag: number
  esimFlag: number
  dailyProfit: number
  replaceFlag: number
}

enum StatusResponseCode {
    Success = 0,
    Error = 999,
}
interface BaseResponse<T> {
    code: StatusResponseCode;
    msg: string;
    data: T;
}

interface GetUserInfoResponse extends BaseResponse<UserInfo> { }
interface ActivateBoostsResponse extends BaseResponse<UserInfo> { }
interface TapResponse extends BaseResponse<any> { }


class GameTelegramApplication extends TelegramApplication {
    headers: FetchHeaders;
    user: UserData;
    EXECUTION_INTERVAL: number = Time.HOUR * 12;

    constructor(user: UserData) {
        super(user.initData, user.proxy);
        this.user = user;
        this.appName = "depinSim";
        this.headers = new GameFetchHeaders();
        this.setExecutionInterval(this.EXECUTION_INTERVAL + 5 * Time.MINUTE, this.EXECUTION_INTERVAL + 30 * Time.MINUTE);
    }

    async getUserInfo({ headers }: { headers: Headers }): Promise<GetUserInfoResponse> {
        const response = await fetch("https://api.depinsim.com/base/userInfo/7808136459d44d7fa6bd7e68ec0d6591", {
            "headers": headers,
            "body": null,
            "method": "POST"
        });
        return response.json();
    }
    async boosts({ headers }: { headers: Headers }): Promise<ActivateBoostsResponse> {
        const response = await fetch("https://api.depinsim.com/base/boost/7808136459d44d7fa6bd7e68ec0d6591", {
            "headers": headers,
            "body": null,
            "method": "POST"
        });
        return response.json();
    }
    async tap({ headers, tap }: { headers: Headers, tap: number }): Promise<TapResponse> {
        const response = await fetch(`https://api.depinsim.com/base/tap/7808136459d44d7fa6bd7e68ec0d6591/${tap}`, {
            "headers": headers,
            "body": null,
            "method": "POST"
        });
        return response.json();
    }
    override async onRunExecution(): Promise<void> {
        let todayBoostNum = 0;
        let todayEnergy = 0
        do {
            const { data: userInfoDataResponse, code } = await this.getUserInfo({ headers: this.headers.get() });
            if (code !== StatusResponseCode.Success) {
                this.log("userInfoDataResponse failed");
                return;
            }

            todayBoostNum = userInfoDataResponse.todayBoostNum;
            todayEnergy = userInfoDataResponse.todayEnergy;
            if (todayEnergy > 0) {
                const tapResponse = await this.tap({ headers: this.headers.get(), tap: userInfoDataResponse.todayEnergy });
                if (tapResponse.code === StatusResponseCode.Success) {
                    const { data: afterTapUserInfoResponse, code } = await this.getUserInfo({ headers: this.headers.get() });
                    if (code !== StatusResponseCode.Success) {
                        this.log("Failed to getUserInfo");
                        return;
                    }
                    todayBoostNum = afterTapUserInfoResponse.todayBoostNum;
                    todayEnergy = afterTapUserInfoResponse.todayEnergy;
                    this.log(`Tap success, todayBoostNum: ${todayBoostNum}, todayEnergy: ${todayEnergy}`);
                } else {
                    this.log("Failed to tap");
                    return;
                }
            }

            if (todayBoostNum > 0) {
                const boostsResponse = await this.boosts({ headers: this.headers.get() });
                if (boostsResponse.code === StatusResponseCode.Success) {
                    const { data: afterBoostsUserInfoResponse, code } = await this.getUserInfo({ headers: this.headers.get() });
                    if (code !== StatusResponseCode.Success) {
                        this.log("Failed to getUserInfo");
                        return;
                    }
                    todayBoostNum = afterBoostsUserInfoResponse.todayBoostNum;
                    todayEnergy = afterBoostsUserInfoResponse.todayEnergy;
                    this.log(`Boosts success, todayBoostNum: ${todayBoostNum}, todayEnergy: ${todayEnergy}`);
                } else {
                    this.log("Failed to boosts");
                    return;
                }
            }


            if (todayBoostNum === 0 && todayEnergy === 0) {
                break;
            }
            console.log(todayBoostNum, todayEnergy);
            const { promise, time } = Timer.sleepRandom(Time.MINUTE, 5 * Time.MINUTE);
            this.log(`Sleeping for ${time} second(s)`, "info");
            await promise;
        } while(true);
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
        initData: "query_id=AAFyEEJlAgAAAHIQQmXE62dU&user=%7B%22id%22%3A5993795698%2C%22first_name%22%3A%22thailephan%22%2C%22last_name%22%3A%22SEED%20%F0%9F%8C%B1%7C%20%F0%9F%A5%A5%22%2C%22username%22%3A%22thailephan%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2F8KU3glJr3QRZ6ubZdJWsTbeONSyYhWvR_E613pvrV1cpoU7kzHmnjpeKbinuit96.svg%22%7D&auth_date=1733627890&signature=DNUr4ETk_aQICrnasZ1FIMk_SYLcw-re5QI1wWqau6eZgGEwjE-Aqxj274C8zgLA6-A0NlsiA1Vbc6HZrpE9BA&hash=eee5cf742176dd918370b97aec375404c242346250ad09a74389132639ddcb5e"
    },
] as UserData[];
Main.start(users).then().catch(console.error);