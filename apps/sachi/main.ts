import { TelegramApplication } from "../../application.ts";
import { Time, Timer } from "../../common/timer.ts";
import FetchHeaders from "../../services/headers/headers.ts";
import { AppProxyChecker } from "../../services/proxy/proxy-checker.ts";

class GameFetchHeaders extends FetchHeaders {
    constructor() {
        super();

        this.setKey("Origin", "https://ts.sachi.game");
        this.setKey("Referer", "https://ts.sachi.game/");
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
    userId: string;
}
interface BaseResponse {
    success: boolean
    user: User
    serverTime: string
}
export interface ReferredReward {
  gold: number
  gem: number
  shards: number
}

export interface ReferredClaim {
  gold: number
  gem: number
  shards: number
}

export interface ReferralLeagueReward {
  gold: number
  gem: number
  shards: number
  _id: string
}

export interface ReferralLeagueClaim {
  gold: number
  gem: number
  shards: number
  _id: string
}

export interface WalletBonu {
  done: boolean
  claimed: boolean
  _id: string
}

export interface LeaguesReward {
  gold: number
  gem: number
  shards: number
  _id: string
}

export interface GoldMultiplier {
  reward: number
  spinCount: any
  endTime: number
  _id?: string
}

export interface DailyReward {
  gold: number
  gem: number
  shards: number
  _id: string
}

export interface SocialsJoined {
  tasks: Task[]
  socialsId: string
  _id: string
}

export interface Task {
  taskId: string
  claimed: boolean
  done: boolean
  temp: boolean
  doneAt?: string
  _id: string
}

export interface TableGame {
  categoryId: string
  level: number
  _id: string
}

export interface SpecialGame {
  categoryId: string
  level: number
  _id: string
}

export interface SpecialArea {
  categoryId: string
  level: number
  _id: string
}

export interface ServiceArea {
  categoryId: string
  level: number
  _id: string
}

export interface Staff {
  categoryId: string
  level: number
  _id: string
}

export interface User {
  referredReward: ReferredReward
  referredClaim: ReferredClaim
  _id: string
  tg_id: string
  username: string
  fullname: any
  wallet: string
  profileImage: string
  phone: any
  email: any
  country: any
  goldBalance: number
  gemBalance: number
  lifeTimeGoldBalance: number
  lifeTimeGemBalance: number
  weeklyGoldBalance: number
  shardsBalance: number
  league: string
  energy: number
  maxEnergy: number
  rechargeSpeed: number
  fullEnergyUses: number
  fullEnergyLeft: number
  lastFullEnergyUpdate: string
  referredCount: number
  referredBy: string
  referralLeagueReward: ReferralLeagueReward
  referralLeagueClaim: ReferralLeagueClaim
  mineReward: number
  claimableMineReward: number
  lastMineRewardClaimed: any
  profitPerHour: number
  streak: number
  walletBonus: WalletBonu[]
  lastEnergyUpdate: string
  leaguesReward: LeaguesReward[]
  goldMultiplier: GoldMultiplier[]
  dailyReward: DailyReward[]
  socialsJoined: SocialsJoined[]
  tableGames: TableGame[]
  specialGames: SpecialGame[]
  specialAreas: SpecialArea[]
  serviceAreas: ServiceArea[]
  staff: Staff[]
  specialCards: any[]
  createdAt: string
  updatedAt: string
  __v: number
}

interface GetUserRequest extends BaseRequest {
}
interface GetUserResponse extends BaseResponse {
    rank: number
}

interface UpdateUserRequest extends BaseRequest {
    data: {
        energy: number

        goldBalance: number
        lifeTimeGoldBalance: number
        weeklyGoldBalance?: number;
        goldMultiplier?: GoldMultiplier[],

        gemBalance?: number
        shardsBalance?: number
        lifeTimeGemBalance?: number
    }
}
interface UpdateUserResponse extends BaseResponse {
}

class Service {
    static getUser(request: GetUserRequest): Promise<GetUserResponse> {
        return fetch(`https://api.sachi.game/api/users/${request.userId}`, {
            "headers": request.headers,
            "body": null,
            "method": "GET"
        }).then((response) => response.json());
    }
    static updateUser(request: UpdateUserRequest): Promise<UpdateUserResponse> {
        return fetch(`https://api.sachi.game/api/users/${request.userId}`, {
            "headers": request.headers,
            "body": JSON.stringify(request.data),
            "method": "PUT"
        }).then((response) => response.json());
    }
}

class GameTelegramApplication extends TelegramApplication {
    headers: FetchHeaders;
    user: UserData;
    EXECUTION_INTERVAL: number = Time.HOUR * 1;

    constructor(user: UserData) {
        super(user.initData, user.proxy);
        this.user = user;
        this.appName = "sachi";
        this.headers = new GameFetchHeaders();
        this.setExecutionInterval(this.EXECUTION_INTERVAL + 20 * Time.MINUTE, this.EXECUTION_INTERVAL + 60 * Time.MINUTE);
    }

    override async onRunExecution(): Promise<void> {
        const request: GetUserRequest = {
            headers: this.headers.get(),
            userId: this.user.userId,
        };
        const userResponse = await Service.getUser(request);
        if (!userResponse.success) {
            console.error("Failed to get user", userResponse);
            return;
        }
        let user = userResponse.user;
        const accountData = {
            weeklyGoldBalance: user.weeklyGoldBalance,
            goldBalance: user.goldBalance,
            lifeTimeGoldBalance: user.lifeTimeGoldBalance,
            energy: user.energy,

            gemBalance: user.gemBalance,
            shardsBalance: user.shardsBalance,
            lifeTimeGemBalance: user.lifeTimeGemBalance,

            goldMultiplier: user.goldMultiplier || []
        }
        const goldInterval = setInterval( () => {
            const U = user.profitPerHour / 3600
              , se = accountData.goldBalance + U
              , we = accountData.lifeTimeGoldBalance + U;
            accountData.goldBalance = se,
            accountData.lifeTimeGoldBalance = we
        } , 1e3)
        const energyInterval = setInterval(() => {
            if (accountData.energy < 0) {
                accountData.energy = 0
            }
            const U = user.energy + user.rechargeSpeed;
            accountData.energy = Math.min(U, user.maxEnergy);
        }, 1e3)

        const times = 10000;
        let current = 0;
        const wheelSpinCostInEnergy = 900;
        while(times > current) {
            const shouldSpin = current % 5 === 0 && wheelSpinCostInEnergy <= accountData.energy;
            if (shouldSpin) {
                const newEnergy = accountData.energy - wheelSpinCostInEnergy;
                if (newEnergy >= 0) {
                    let raffleReward = randomRewards(rewards);
                    // let raffleReward = randomRewards(rewards.filter(r => r.type === "shards"));
                    if (newEnergy < 1000) {
                        const index = rewards.find(i => i.type === "energy")?.position || 0;
                        raffleReward = { rewardObj: rewards[index], index };
                    }

                    this.log(`${raffleReward?.rewardObj.iconName} - ${raffleReward?.rewardObj.reward}`, );
                    if(raffleReward) {
                        const reward = getUpdateUserWithSpinReward(raffleReward.rewardObj, user, accountData);
                        if (reward) {
                            this.log(`Energy left: ${reward.energy ?? newEnergy}`);
                            this.log(`Updating user with reward`);
                            const updateResponse = await Service.updateUser({
                                headers: this.headers.get(),
                                userId: this.user.userId,
                                data: {
                                    energy: reward.energy || newEnergy,
                                    goldBalance: reward.goldBalance || accountData.goldBalance,
                                    lifeTimeGoldBalance: reward.lifeTimeGoldBalance || accountData.lifeTimeGoldBalance,
                                    weeklyGoldBalance: reward.weeklyGoldBalance,
                                    goldMultiplier: reward.goldMultiplier,

                                    gemBalance: reward.gemBalance || undefined,
                                    shardsBalance: reward.shardsBalance || undefined,
                                    lifeTimeGemBalance: reward.lifeTimeGemBalance || undefined,
                                }
                            });
                            if (!updateResponse.success) {
                                throw Error(`Failed to update user ${JSON.stringify(updateResponse)}`);
                            } else {
                                this.log(`User updated successfully`);
                                user = updateResponse.user;
                                accountData.energy = user.energy || 0;
                                accountData.goldBalance = user.goldBalance || 0;
                                accountData.lifeTimeGoldBalance = user.lifeTimeGoldBalance || 0;
                                accountData.weeklyGoldBalance = user.weeklyGoldBalance || 0;
                                accountData.goldMultiplier = user.goldMultiplier || accountData.goldMultiplier;

                                accountData.shardsBalance = user.shardsBalance || 0;
                                accountData.gemBalance = user.gemBalance || 0;
                                accountData.lifeTimeGemBalance = user.lifeTimeGemBalance || 0;
                            }
                        }
                    }
                } else {
                    break;
                }
            } else {
                const updateResponse = await Service.updateUser({
                    headers: this.headers.get(),
                    userId: this.user.userId,
                    data: {
                        energy: accountData.energy,
                        goldBalance: accountData.goldBalance,
                        lifeTimeGoldBalance: accountData.lifeTimeGoldBalance,
                    }
                });
                // if (!updateResponse.success) {
                //     throw Error("Timing: Update user failed");
                // } else {
                    accountData.weeklyGoldBalance = updateResponse.user.weeklyGoldBalance || 0;
                //     this.log("Timing: Update user successfully");
                // }
            }


            current++;
            await Timer.sleep(Time.SECOND);
        }

        clearInterval(goldInterval);
        clearInterval(energyInterval);
    }
}

interface UserData {
    initData: string;
    proxy?: string | undefined;
    userId: string;
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
        // initData: "query_id=AAFyEEJlAgAAAHIQQmWXAYVQ&user=%7B%22id%22%3A5993795698%2C%22first_name%22%3A%22Thai%F0%9F%8C%B1SEED%22%2C%22last_name%22%3A%22Le%20%F0%9F%92%8ECR%20%F0%9F%8D%85%22%2C%22username%22%3A%22thailephan%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&auth_date=1730355085&hash=b36a3242c6817db2eafac75b304e0af8f4a11121053bcc0aa805f59ad4f0dab6"
        initData: "",
        userId: "5993795698",
    },
] as UserData[];
Main.start(users).then().catch(console.error);


function getUpdateUserWithSpinReward(U: Reward, user: User, updateUserRequest: { goldBalance: number, weeklyGoldBalance: number, lifeTimeGoldBalance: number, energy: number, gemBalance: number, shardsBalance: number, lifeTimeGemBalance: number, goldMultiplier: GoldMultiplier[] }) {
    // leaguesNames.indexOf(user.league);
    const se = new Date().getTime()
    //     , we = H => {
    //     Object.assign(n.current, H),
    //     w(ye => ({
    //         ...ye,
    //         ...H
    //     })),
    //     t.current += 1
     //}
    ;
    if (U.type === "gold") {
        let H = U.reward
            , ye = updateUserRequest.goldMultiplier //[...n.current.goldMultiplier || d.goldMultiplier || []];
        if (ye.length > 0) {
            ye.sort( (Ge: GoldMultiplier, Nt: GoldMultiplier) => Nt.reward - Ge.reward);
            const Ce = ye.filter(Ge => (Ge == null ? void 0 : Ge.spinCount) > 0)
            // @ts-ignore
                , $e = ye.filter(Ge => se <= new Date(Ge == null ? void 0 : Ge.endTime).getTime());
            Ce.length > 0 ? (Ce[0].spinCount -= 1,
            H *= Ce[0].reward) : $e.length > 0 && (H *= $e[0].reward),
            ye = [...Ce, ...$e]
        }
        const me = {
            goldMultiplier: ye,
            goldBalance: updateUserRequest.goldBalance + H, //(n.current.goldBalance || d.goldBalance || 0) + H,
            weeklyGoldBalance: updateUserRequest.weeklyGoldBalance + H, // (n.current.weeklyGoldBalance || d.weeklyGoldBalance || 0) + H,
            lifeTimeGoldBalance: updateUserRequest.lifeTimeGoldBalance + H, // (n.current.lifeTimeGoldBalance || d.lifeTimeGoldBalance || 0) + H
        };
        // we(me);
        return {
            // ...updateUserRequest,
            goldBalance: me.goldBalance,
            weeklyGoldBalance: me.weeklyGoldBalance,
            lifeTimeGoldBalance: me.lifeTimeGoldBalance,
            goldMultiplier: me.goldMultiplier
        }
    } else if (U.type === "energy") {
        let energy = updateUserRequest.energy + U.reward; // (a.current.energy || d.energy || 0) + U.raffleReward;
        energy = Math.min(energy, user.maxEnergy),
        updateUserRequest.energy = energy;
        // we({
        //     energy: energy
        // });
        return {
            // ...updateUserRequest,
            energy: energy,
        }
    } else if (U.type === "shards") {
        let H = (updateUserRequest.shardsBalance || 0) + U.reward // (n.current.shardsBalance || d.shardsBalance || 0) + U.raffleReward
            , ye = updateUserRequest.gemBalance || 0 // n.current.gemBalance || d.gemBalance || 0
            , me = updateUserRequest.lifeTimeGemBalance || 0// n.current.lifeTimeGemBalance || d.lifeTimeGemBalance || 0;
        H >= oneGemToShards && (ye += 1,
        H -= oneGemToShards,
        me += 1);
        // we({
        //     gemBalance: ye,
        //     shardsBalance: H,
        //     lifeTimeGemBalance: me
        // });
        return {
            // ...updateUserRequest,
            gemBalance: ye,
            shardsBalance: H,
            lifeTimeGemBalance: me
        }
    }
    else if (U.type === "gold multiplier") {
        const H = updateUserRequest.goldMultiplier
        // @ts-ignore
            , ye = H.findIndex(Ce => se <= new Date(Ce == null ? void 0 : Ce.endTime).getTime())
            , me = se + 30 * 60 * 1e3;
        ye !== -1 ? H[ye] = {
            ...H[ye],
            reward: H[ye].reward + 2,
            endTime: me
        } : H.push({
            reward: U.reward,
            endTime: me,
            spinCount: null,
            // _id: U._id
        });
        // we({
        //     goldMultiplier: H
        // });
        return {
            // ...updateUserRequest,
            goldMultiplier: H
        }
    }
    // else if (U.type === "mystery box") {
    //     const {raffleReward: H, index: ye} = V(S.MysteryBox.sort( (me, Ce) => me.chance - Ce.chance));
    //     if (H.type === "gold") {
    //         const me = {
    //             goldBalance: (n.current.goldBalance || d.goldBalance || 0) + H.raffleReward,
    //             weeklyGoldBalance: (n.current.weeklyGoldBalance || d.weeklyGoldBalance || 0) + H.raffleReward,
    //             lifeTimeGoldBalance: (n.current.lifeTimeGoldBalance || d.lifeTimeGoldBalance || 0) + H.raffleReward
    //         };
    //         we(me)
    //     } else if (H.type === "gold multiplier") {
    //         const me = [...n.current.goldMultiplier || d.goldMultiplier || []]
    //             , Ce = me.findIndex($e => $e.raffleReward === H.raffleReward);
    //         Ce !== -1 ? me[Ce] = {
    //             ...me[Ce],
    //             spinCount: (me[Ce].spinCount || 0) + S.goldMultiplierSpin
    //         } : me.push({
    //             raffleReward: H.raffleReward,
    //             spinCount: S.goldMultiplierSpin,
    //             endTime: null
    //         }),
    //         we({
    //             goldMultiplier: me
    //         })
    //     }
    //     return {
    //         raffleReward: H,
    //         index: ye
    //     }
    // }
}
const randomRewards = (U: Reward[]) => {
    const se = U.reduce((me, Ce) => me + Ce.chance, 0)
        , we = Math.random() * se;
    let H = 0
        , ye = 0;
    for (const me of U) {
        if (H += me.chance,
        we < H)
            return {
                rewardObj: me,
                index: ye
            };
        ye++
    }
    return null
}

interface Reward {
    "reward": number,
    "type": "shards" | "mystery box" | "gold multiplier" | "gold" | "energy",
    "chance": number,
    "iconName": string,
    "_id": string,
    "position": number
}
const rewards: Reward[] = [
    {
        "reward": 50,
        "type": "shards",
        // "chance": 0.29,
        "chance": 1,
        "iconName": "shards_50.png",
        "_id": "66f15a9990005e30d30016cc",
        "position": 8
    },
    {
        "reward": 25,
        "type": "shards",
        // "chance": 0.58,
        "chance": 1.2,
        "iconName": "shards_25.png",
        "_id": "66f15a9990005e30d30016cb",
        "position": 11
    },
    {
        "reward": 1,
        "type": "mystery box",
        // "chance": 0.63,
        "chance": 0,
        "iconName": "mystery_box_1.png",
        "_id": "66f15a9990005e30d30016ce",
        "position": 7
    },
    {
        "reward": 10,
        "type": "shards",
        // "chance": 1.17,
        "chance": 1.5,
        "iconName": "shards_10.png",
        "_id": "66f15a9990005e30d30016ca",
        "position": 4
    },
    {
        "reward": 5,
        "type": "shards",
        // "chance": 2.33,
        "chance": 2,
        "iconName": "shards_5.png",
        "_id": "66f15a9990005e30d30016c9",
        "position": 6
    },
    {
        "reward": 2,
        "type": "gold multiplier",
        // "chance": 5.5,
        "chance": 2,
        "iconName": "gold_multiplier_2.png",
        "_id": "66f15a9990005e30d30016cd",
        "position": 2
    },
    {
        "reward": 1000,
        "type": "gold",
        // "chance": 15,
        "chance": 3,
        "iconName": "gold_1000.png",
        "_id": "66f15a9990005e30d30016c6",
        "position": 1
    },
    {
        "reward": 2700,
        "type": "energy",
        "chance": 3,
        "iconName": "energy_2700.png",
        "_id": "66f15a9990005e30d30016c8",
        "position": 9
    },
    {
        "reward": 500,
        "type": "gold",
        // "chance": 15,
        "chance": 5.5,
        "iconName": "gold_500.png",
        "_id": "66f15a9990005e30d30016c5",
        "position": 3
    },
    {
        "reward": 1800,
        "type": "energy",
        "chance": 5.5,
        // "chance": 15,
        "iconName": "energy_1800.png",
        "_id": "66f15a9990005e30d30016c7",
        "position": 12
    },
    {
        "reward": 250,
        "type": "gold",
        // "chance": 20,
        "chance": 8,
        "iconName": "gold_250.png",
        "_id": "66f15a9990005e30d30016c4",
        "position": 5
    },
    {
        "reward": 100,
        "type": "gold",
        // "chance": 25,
        "chance": 1,
        "iconName": "gold_100.png",
        "_id": "66f15a9990005e30d30016c3",
        "position": 10
    }
]
const leaguesNames = [
    "Chipper",
    "Fish",
    "Pigeon",
    "Small Blind",
    "Big Blind",
    "Dealer",
    "Moneymaker",
    "Pro",
    "Shark",
    "Whale",
    "VIP",
    "High Roller"
]
const leagueReward: LeaguesReward[] = [
    {
        "gold": 0,
        "gem": 0,
        "shards": 0,
        "_id": "66fbd638ecb463a0e6f95ace"
    },
    {
        "gold": 0,
        "gem": 0,
        "shards": 0,
        "_id": "66fbd638ecb463a0e6f95acf"
    },
    {
        "gold": 0,
        "gem": 0,
        "shards": 0,
        "_id": "66fbd638ecb463a0e6f95ad0"
    },
    {
        "gold": 0,
        "gem": 0,
        "shards": 0,
        "_id": "66fbd638ecb463a0e6f95ad1"
    },
    {
        "gold": 0,
        "gem": 1,
        "shards": 0,
        "_id": "66fbd638ecb463a0e6f95ad2"
    },
    {
        "gold": 0,
        "gem": 1,
        "shards": 0,
        "_id": "66fbd638ecb463a0e6f95ad3"
    },
    {
        "gold": 0,
        "gem": 1,
        "shards": 0,
        "_id": "66fbd638ecb463a0e6f95ad4"
    },
    {
        "gold": 0,
        "gem": 1,
        "shards": 0,
        "_id": "66fbd638ecb463a0e6f95ad5"
    },
    {
        "gold": 0,
        "gem": 2,
        "shards": 0,
        "_id": "66fbd638ecb463a0e6f95ad6"
    },
    {
        "gold": 0,
        "gem": 3,
        "shards": 0,
        "_id": "66fbd638ecb463a0e6f95ad7"
    },
    {
        "gold": 0,
        "gem": 5,
        "shards": 0,
        "_id": "66fbd638ecb463a0e6f95ad8"
    },
    {
        "gold": 0,
        "gem": 10,
        "shards": 0,
        "_id": "66fbd638ecb463a0e6f95ad9"
    }
]
interface MysteryBox {
    raffleReward: number
    type: string
    chance: number
    _id: string
}
const mysteryBox: MysteryBox[] = [
    {
        "raffleReward": 10000,
        "type": "gold",
        "chance": 8,
        "_id": "66f15a9990005e30d30016cf"
    },
    {
        "raffleReward": 100000,
        "type": "gold",
        "chance": 2.5,
        "_id": "66f15a9990005e30d30016d0"
    },
    {
        "raffleReward": 1000000,
        "type": "gold",
        "chance": 0.5,
        "_id": "66f15a9990005e30d30016d1"
    },
    {
        "raffleReward": 50,
        "type": "gold multiplier",
        "chance": 56,
        "_id": "66f15a9990005e30d30016d2"
    }
]
const oneGemToShards = 100;