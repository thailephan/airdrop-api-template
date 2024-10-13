import FetchHeaders from "./services/headers/headers.ts";
import { TelegramApplication } from "./application.ts";
import { logger } from "./common/logger.ts";
import { AppProxyChecker } from "./services/proxy/proxy-checker.ts";
import { InitDataExtractor } from "./common/initData.ts";
import { Timer, Time } from "./common/timer.ts";

class GameFetchHeaders extends FetchHeaders {
    constructor() {
        super();
        this.setKey("Origin", "https://app.depinalliance.xyz");
        this.setKey("Referer", "https://app.depinalliance.xyz/");
    }
}

interface AuthResponse {
  data: AuthResponseData
  status: string
  message: string
}
interface AuthResponseData {
  currentStatus: "MINING";
  accessToken: string
}

interface InfoResponse {
    data: {
        username: string
        code: string
        status: string
        miningPower: number
        maximumPower: number
        point: number
        pointUnClaimed: number
        xp: number
        xpLevelFrom: number
        xpLevelTo: number
        pointSkill: number
        ratePurchase: number
        rateBonusReward: number
        avatar: string
        totalDevice: number
        level: number
        lastLoginTime: number
        timeStartMining: number
        currentTime: number
        lastCheckin: number
        pointBonus: number
        isPremium: boolean
        detectDevice: string
        devicePlatform: string
        pointEarned: number
    }
    status: string;
    message?: string;
}
interface ConfigResponse {
  "data": {
    "maxDevice": number
    "pointBuyDevice": number,
    "urlImage": string;
  },
  "status": string;
  "message": string;
}
interface ClaimResponse {
  "data": {
    "point": number,
    "bonusReward": number
  },
  "status": string
  "message": string;
}

interface GetDailyCheckinResponse {
  data: DailyCheckinItem[]
  status: string
  message: string
}
interface DailyCheckinItem {
  name: string
  time: number
  point: number
  xp: number
  isChecked: boolean
}

interface GetMissionResponse {
    data: MissionGroup[]
    status: string
    message: string
}
export interface MissionGroup {
  group: string
  missions: Mission[]
}
export interface Mission {
  id: number
  name: string
  image?: string
  description: string
  type: string
  url?: string
  point: number
  xp: number
  status: null | "VERIFIED" | "CLAIMED"
  amount: number
  rewardName: string
  rewardImage: string
}

interface VerifyMissionTaskResponse {
  data: boolean
  status: string
  message: string
}

interface ClaimMissionTaskResponse {
  data: any
  status: string
  message: string
}

interface GetSkillsResponse {
  data: SkillInfo
  status: string
  message: string
}
export interface SkillInfo {
  skill: Skill[]
  pointSkill: number
  point: number
}
export interface Skill {
  skillId: number
  name: string
  image: string
  levelCurrent: number
  maxLevel: number
  timeWaiting: number
}

interface GetSkillNextLevelResponse {
  data: GetSkillNextLevelData
  status: string
  message: string
}

export interface GetSkillNextLevelData {
  skillId: number
  name: string
  description: string
  levelCurrent: number
  levelUpgrade: number
  feeUpgrade: number
  feePointUpgrade: number
  effectCurrent: number
  rateEffect: number
}


class GameTelegramApplication extends TelegramApplication {
    headers: FetchHeaders;
    NEXT_INTERVAL = 6 * Time.HOUR;
    failedToBeVerifyTasks: Mission["id"][] = [];

    constructor(initData: string, proxy?: string) {
        super(initData, proxy);
        this.appName = "depin-alliance";
        this.headers = new GameFetchHeaders();
    }

    async userAuth(): Promise<AuthResponse> {
        const response = await fetch("https://api.depinalliance.xyz/users/auth", {
            method: "POST",
            headers: this.headers.get(),
            body: JSON.stringify({ initData: this.initData }),
        });
        const json = await response.json();
        return json;
    }
    async info(): Promise<InfoResponse> {
        const response = await fetch("https://api.depinalliance.xyz/users/info", {
            method: "GET",
            headers: this.headers.get(),
            body: null,
        });
        return response.json();
    }
    async config(): Promise<ConfigResponse> {
        const response = await fetch("https://api.depinalliance.xyz/users/config", {
            method: "GET",
            headers: this.headers.get(),
            body: null,
        });
        return response.json();
    }
    async claim(): Promise<ClaimResponse> {
        const response = await fetch("https://api.depinalliance.xyz/users/claim", {
            method: "GET",
            headers: this.headers.get(),
            body: null,
        });
        return response.json();
    }
    async getDailyCheckin(): Promise<GetDailyCheckinResponse> {
        const response = await fetch("https://api.depinalliance.xyz/missions/daily-checkin", {
            method: "GET",
            headers: this.headers.get(),
            body: null,
        });
        return response.json();
    }
    async claimDailyCheckin(): Promise<Response> {
        const response = await fetch("https://api.depinalliance.xyz/missions/daily-checkin", {
            method: "POST",
            headers: this.headers.get(),
            body: null,
        });
        return response.json();
    }
    async getMissions(): Promise<GetMissionResponse> {
        const response = await fetch("https://api.depinalliance.xyz/missions", {
            method: "GET",
            headers: this.headers.get(),
            body: null,
        });
        return response.json();
    }
    async verifyMissionTask(taskId: string | number): Promise<VerifyMissionTaskResponse> {
        const response = await fetch(`https://api.depinalliance.xyz/missions/verify-task/${taskId}`, {
            method: "GET",
            headers: this.headers.get(),
            body: null,
        })
        return response.json();
    }
    async claimMissionTask(taskId: string | number): Promise<ClaimMissionTaskResponse> {
        const response = await fetch(`https://api.depinalliance.xyz/missions/claim-task/${taskId}`, {
            method: "GET",
            headers: this.headers.get(),
            body: null,
        });
        return response.json();
    }

    async getSkills(): Promise<GetSkillsResponse> {
        const response = await fetch("https://api.depinalliance.xyz/users/skills", {
            method: "GET",
            headers: this.headers.get(),
            body: null,
        });
        return response.json();
    }
    async getNextSkillLevel(skillId: string | number): Promise<GetSkillNextLevelResponse> {
        const response = await fetch(`https://api.depinalliance.xyz/users/skills/${skillId}/next-level`, {
            headers: this.headers.get(),
            method: "GET",
            body: null,
        });
        return response.json();
    }
    async upgradeSkill(skillId: string | number): Promise<{
        "data": boolean,
        "status": string;
        "message": string;
    }> {
        const response = await fetch("https://api.depinalliance.xyz/users/upgrade-skill", {
            headers: this.headers.get(),
            method: "POST",
            body: JSON.stringify({ skillId }),
        });
        return response.json();
    }
    BASE_EXECUTION_TIME_TO_FETCH_MISSIONS = 3;
    currentExecutionTimeToFetchMissions = 0;

    override async onRunExecution(): Promise<void> {
        this.setExecutionInterval(this.NEXT_INTERVAL + 30 * Time.MINUTE, this.NEXT_INTERVAL + 90 * Time.MINUTE);
        const authResponse = await this.userAuth();
        if (authResponse.status !== "success") {
            throw new Error(authResponse.message);
        }
        const accessToken = authResponse.data.accessToken;
        this.headers.setKey("Authorization", `Bearer ${accessToken}`);

        const infoResponse = await this.info();

        const lastCheckin = infoResponse.data.lastCheckin;
        const dailyCheckinList = await this.getDailyCheckin();
        if (dailyCheckinList.status === "success") {
            const firstUncheckLogin = dailyCheckinList.data.find((item) => !item.isChecked);
            if (firstUncheckLogin) {
                if (lastCheckin < firstUncheckLogin.time) {
                    await this.claimDailyCheckin();
                    logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, "Daily checkin claimed");
                } else {
                    logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, "Daily checkin already claimed");
                }
            }
        }

        const claimResponse = await this.claim();
        if (claimResponse.status === "success") {
            logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, `Claimed ${claimResponse.data.point} points and ${claimResponse.data.bonusReward} bonus reward`);
        }

        if (this.currentExecutionTimeToFetchMissions === 0) {
            const missions = await this.getMissions();
            if (missions.status === "success") {
                const missionGroups = missions.data;
                for (const group of missionGroups) {
                    for (const mission of group.missions) {
                        if (this.failedToBeVerifyTasks.includes(mission.id)) {
                            logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, `Unable to verify mission: ${mission.name}`);
                            continue;
                        }
                        let isTaskVerified = false;
                        if (!mission.status) {
                            logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, `Verifying task ${mission.name}`);
                            const verifyResponse = await this.verifyMissionTask(mission.id);
                            if (verifyResponse.data === true && verifyResponse.status === "success") {
                                isTaskVerified = true;
                                logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, `Task ${mission.name} is verified`);
                            } else {
                                this.failedToBeVerifyTasks.push(mission.id);
                                logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, `Failed to verify task ${mission.name}`, verifyResponse);
                            }
                        }
                        if (mission.status === "VERIFIED" || isTaskVerified) {
                            const claimResponse = await this.claimMissionTask(mission.id);
                            if (claimResponse.status === "success") {
                                logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, `Claimed mission ${mission.name}`, claimResponse);
                            }
                        }
                        if (mission.status === "CLAIMED") {
                            logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, `Mission ${mission.name} already completed`);
                            continue;
                        }
                    }
                }
            }
            this.currentExecutionTimeToFetchMissions = this.BASE_EXECUTION_TIME_TO_FETCH_MISSIONS;
        } else {
            this.currentExecutionTimeToFetchMissions -= 1;
        }

        const ignoreSkillId = [5];
        const skillPriorityQueue = [4, 1, 2 ,3];
        let skillsResponse = await this.getSkills();

        if (skillsResponse.status === "success" && skillsResponse.data.skill.every(k => k.timeWaiting < Date.now())) {
            let skills = skillsResponse.data.skill;
            let point = skillsResponse.data.point;
            let pointSkill = skillsResponse.data.pointSkill;

            for (let currentSkillIdIndex = 0; currentSkillIdIndex < skillPriorityQueue.length; currentSkillIdIndex++) {
                if (point <= 0 || pointSkill <= 0) {
                    break;
                }

                const skill = skills.find(s => s.skillId === skillPriorityQueue[currentSkillIdIndex]);
                if (skill === undefined) {
                    logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, `Skill ${skillPriorityQueue[currentSkillIdIndex]} not found`); 
                    continue;
                    // just put here for not get ts error (skill is undefined)
                    return;
                }
                if (ignoreSkillId.includes(skill.skillId)) {
                    logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, `Skill ${skill.name} is ignored`);
                    continue;
                }
                logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, `Upgrading skill ${skill.name}`);
                let skillTimeWaiting = skill.timeWaiting; // timestamp in ms
                do {
                    const nextLevelResponse = await this.getNextSkillLevel(skill.skillId);
                    if (nextLevelResponse.status === "success") {
                        const nextLevelData = nextLevelResponse.data;
                        if (skill.levelCurrent >= skill.maxLevel) {
                            logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, `Skill ${skill.name} already maxed out`);
                            break;
                        }
                        const isAbleToUpgrade = pointSkill >= nextLevelData.feeUpgrade && point >= nextLevelData.feePointUpgrade;
                        if (isAbleToUpgrade) {
                            const upgradeResponse = await this.upgradeSkill(skill.skillId);
                            if (upgradeResponse.status === "success") {
                                logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, `Upgraded skill ${skill.name} to level ${skill.levelCurrent + 1}`);

                                skillsResponse = await this.getSkills();
                                if (skillsResponse.status === "success") {
                                    point = skillsResponse.data.point;
                                    pointSkill = skillsResponse.data.pointSkill;
                                    skills = skillsResponse.data.skill;

                                    const skillData = skills.find(s => s.skillId === skill.skillId);
                                    if (skillData) {
                                        skillTimeWaiting = skillData.timeWaiting;
                                        const diff = skillTimeWaiting - Date.now();

                                        if (diff < Time.MINUTE * 60) {
                                            const waitUpgrade = 5 * Time.MINUTE + diff;
                                            logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, `Waiting ${waitUpgrade / Time.MINUTE} minutes for ${skill.name} to be ready`);    
                                            await Timer.sleep(waitUpgrade);
                                        }
                                    } else {
                                        break;
                                    }
                                }
                            } else {
                                break;
                            }
                        } else {
                            break;
                        }
                    } else {
                        break;
                    }
                } while(skillTimeWaiting < Date.now());
            }
        }
    }
}

interface UserData {
    proxy?: string | undefined;
    initData: string;
}
class Main {
    static async start(users: UserData[]) {
        const appProxyChecker = new AppProxyChecker();
        await Promise.all(users.map(async (user) => {
            const proxyIP = await appProxyChecker.check(user.proxy);
            logger.info(InitDataExtractor.extract(user.initData).user.username, proxyIP); 
            if (proxyIP) {
                const application = new GameTelegramApplication(user.initData, user.proxy);
                return application.execute();
            }
        }));
    }
}

const users = [
  {
    proxy: "proxymart49580:osknCMky@103.241.199.82:49580",
    initData: "user=%7B%22id%22%3A8149102788%2C%22first_name%22%3A%22Anderson%20Amanda%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22andersonamandaw2938%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=7134045387308361407&start_param=I3mK3RH12V&auth_date=1728829918&hash=d47f2de6e3e8e20c2b9d57b77e58da8be6d077e317b9be05114b1eb327cb895d"
  },
  {
    proxy: "proxymart29181:tOgaGRME@157.66.12.181:29181",
    initData: "user=%7B%22id%22%3A6091532790%2C%22first_name%22%3A%22may%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%20%F0%9F%8C%B1SEED%20%F0%9F%90%B8%F0%9F%92%8ECR%22%2C%22username%22%3A%22xzvtglhp%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-4455218168546390451&start_param=I3mK3RH12V&auth_date=1728829933&hash=c844489edc429f84ad90c6cc528fa73190274e2c415081b02302e6c75d594ac0"
  },
  {
    proxy: "proxymart29519:BKKTgDcE@103.65.136.46:29519",
    initData: "user=%7B%22id%22%3A6083367699%2C%22first_name%22%3A%22may%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%20%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22tixhsqau%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-480882787176359585&start_param=I3mK3RH12V&auth_date=1728829930&hash=6c4f2d8f1163571be9324eaa623387f0207404fc0804b95cb351a87e4c551046"
  },
  {
    proxy: "proxymart29519:BKKTgDcE@103.65.136.46:29519",
    initData: "user=%7B%22id%22%3A7172846926%2C%22first_name%22%3A%22may%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%20%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22myntafxs%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-2394350437254426363&start_param=I3mK3RH12V&auth_date=1728829933&hash=3cf32fe47e40fb14554f78df61c695688741bdd08d4bc857045891fa94460126"
  },
  {
    proxy: "proxymart29365:kptWtmoD@36.50.132.123:29365",
    initData: "user=%7B%22id%22%3A7487128929%2C%22first_name%22%3A%22Liliana%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22Cacheta%F0%9F%8C%B1SEED%F0%9F%92%8ECR%22%2C%22username%22%3A%22liliana1ld%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=929840214209900477&start_param=I3mK3RH12V&auth_date=1728829926&hash=7052970cc36dcd2ff66971c729386c94bba7372d058e7bf83151e127ec27fc24"
  },
  {
    proxy: "proxymart29365:kptWtmoD@36.50.132.123:29365",
    initData: "user=%7B%22id%22%3A6594749785%2C%22first_name%22%3A%22Carlena%20Dool%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22carlena2l%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-2279069975351911454&start_param=I3mK3RH12V&auth_date=1728829917&hash=9b1078d22b806b7c13ee3e2e1e94f6c21ff88db019f2fbfae5b9e9e4f06758d5"
  },
  {
    proxy: "proxymart29181:tOgaGRME@157.66.12.181:29181",
    initData: "user=%7B%22id%22%3A7274192019%2C%22first_name%22%3A%22Diane%22%2C%22last_name%22%3A%22Bradley%22%2C%22username%22%3A%22DianeBradley2010%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=2019496073094832977&start_param=I3mK3RH12V&auth_date=1728829933&hash=24325b5ab3e1266ae4faa03e53079eaba2f30c5a0e0c30f7bdb973be66a1c24b"
  },
  {
    proxy: "proxymart29209:yjVfRpvG@103.236.175.111:29209",
    initData: "user=%7B%22id%22%3A7162231983%2C%22first_name%22%3A%22C%E1%BA%A9m%20hi%E1%BB%81n%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22Ph%E1%BA%A1m%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22cri70281vzj%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=667952489405815525&start_param=I3mK3RH12V&auth_date=1728829934&hash=6184b0f662f2587b1c8faa1bec3cd16718b3e99780c3ca702c73c5dd5e6ba408"
  },
  {
    proxy: "proxymart29209:yjVfRpvG@103.236.175.111:29209",
    initData: "user=%7B%22id%22%3A7206351041%2C%22first_name%22%3A%22Summerslaverna%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22Dorriccug%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22krzfO39454%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-3911369964316153645&start_param=I3mK3RH12V&auth_date=1728829942&hash=8cf9115dfe7c344ebf39efeaeb01f35fc92721313cef9978553c88d509a0a922"
  },
  {
    proxy: "proxymart29011:PWWnuvJU@36.50.133.11:29011",
    initData: "user=%7B%22id%22%3A7350116575%2C%22first_name%22%3A%22Reath%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22sDcDt94764%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=6071655489309926468&start_param=I3mK3RH12V&auth_date=1728829944&hash=4c806da396017078a55d4f50befcaa23ff2182375f9a3db1f2c46e1e9cb1759f"  
  },
  {
    proxy: undefined,
    initData: "user=%7B%22id%22%3A7038003725%2C%22first_name%22%3A%22Jarvis%20Hanel%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22javis1l%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-4089697637182329421&start_param=I3mK3RH12V&auth_date=1728830027&hash=94fc97399ce8ad8deae8fc60f2d9652fe753310766143405fa299252516a26b9"
  },
  {
    proxy: "proxymart29011:PWWnuvJU@36.50.133.11:29011",
    initData: "user=%7B%22id%22%3A7396996476%2C%22first_name%22%3A%22mohamadreza.akbari%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%90%B0%F0%9F%A6%86%22%2C%22last_name%22%3A%22Ooo%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22cabibara1l%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-279392538770612968&start_param=I3mK3RH12V&auth_date=1728830056&hash=5ab1b66c62d3b8eafe13e8b36a876d9fddf6e81a915539501edb63491a3bc311"  
  },
  {
    proxy: undefined,
    initData: "user=%7B%22id%22%3A5993795698%2C%22first_name%22%3A%22Thai%F0%9F%8C%B1SEED%22%2C%22last_name%22%3A%22Le%20%F0%9F%92%8ECR%20%F0%9F%9B%92%22%2C%22username%22%3A%22thailephan%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=7391664399698162377&start_param=I3mK3RH12V&auth_date=1728830059&hash=aea2a2346d3ff62e74a46ab69fc36f7db85648bedf1f2a1925c82a78b0261190"
  },
  {
    proxy: "proxymart29102:WzUiihpd@36.50.236.102:29102",
    initData: "user=%7B%22id%22%3A7614128738%2C%22first_name%22%3A%22Marguerite%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22Tyrome%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22margueritetyrome%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-1493901940578550202&start_param=I3mK3RH12V&auth_date=1728830064&hash=a41713bc74d963c102f0f8b1b45a55ae69a37071034fecbaec7041fa494a6fa4"
  },
  {
    proxy: "proxymart29380:UpFsrDHL@36.50.133.72:29380",
    initData: "user=%7B%22id%22%3A7496050969%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22koscwivu%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=8021026327063526415&start_param=I3mK3RH12V&auth_date=1728830070&hash=1e7d1ab58f1cd9d18b3a8f276a5a5ab73acdaba7cca7a59a761f98684ee70e98"
  },
  {
    proxy: "proxymart29380:UpFsrDHL@36.50.133.72:29380",
    initData: "user=%7B%22id%22%3A7055633313%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22mxznvqta%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=2408209735321824743&start_param=I3mK3RH12V&auth_date=1728830076&hash=fe957a366c6cea7ecb811801f24c90218d82dd00890fb8de959787c1f7ab1814"
  },
  {
    proxy: "proxymart29048:IpcoDRzM@199.48.244.48:29048",
    initData: "user=%7B%22id%22%3A7295672761%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22bojlumdf%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=8458877280730952320&start_param=I3mK3RH12V&auth_date=1728830108&hash=8aa4b5be44000cf20bf68f4d9d805c1c9f74ce4be3fdba6b289124e8e5d451c7"
  },
  {
    proxy: "proxymart29048:IpcoDRzM@199.48.244.48:29048",
    initData: "user=%7B%22id%22%3A7052605861%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22jpnbmszd%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=1668868219759711574&start_param=I3mK3RH12V&auth_date=1728830089&hash=64bfbcb2926103dcd6ba162e93af1b3d90e71c5f77fd829b9de6185cdb73dc05"
  },
  {
    proxy: "proxymart29262:PbvFBKuR@36.50.133.136:29262",
    initData: "user=%7B%22id%22%3A7373766374%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22fykdirtz%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-3845733515490437359&start_param=I3mK3RH12V&auth_date=1728830101&hash=949a62b585b75567364c1fabd4f6c128fc0a6054c963914bc59cb9aac72f8d81"
  },
  {
    proxy: "proxymart29262:PbvFBKuR@36.50.133.136:29262",
    initData: "user=%7B%22id%22%3A7138410111%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%220997%F0%9F%92%8ECR%22%2C%22username%22%3A%22qrtlkpja%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=4343534713746601969&start_param=I3mK3RH12V&auth_date=1728830089&hash=9d79c53bc34baba53dd8f40f89e7886c9b1e2dd511bbffd400edc87319235e09"
  },
  {
    proxy: "proxymart29102:WzUiihpd@36.50.236.102:29102",
    initData: "user=%7B%22id%22%3A7094522456%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%20%F0%9F%8C%B1SEED%F0%9F%92%8ECR%22%2C%22username%22%3A%22acsbpnxw%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=1541895168994343551&start_param=I3mK3RH12V&auth_date=1728830125&hash=3786db68135309c30805a6854f09b0aa77a764d95cb9e70345608755590315c2"
  }
] as UserData[];    
Main.start(users).then().catch(console.error);