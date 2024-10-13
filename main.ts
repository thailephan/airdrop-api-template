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
                    logger.info("Daily checkin claimed");
                } else {
                    logger.info("Daily checkin already claimed");
                }
            }
        }

        const claimResponse = await this.claim();
        if (claimResponse.status === "success") {
            logger.info(`Claimed ${claimResponse.data.point} points and ${claimResponse.data.bonusReward} bonus reward`);
        }

        // const missions = await this.getMissions();
        // if (missions.status === "success") {
        //     const missionGroups = missions.data;
        //     for (const group of missionGroups) {
        //         for (const mission of group.missions) {
        //             if (this.failedToBeVerifyTasks.includes(mission.id)) {
        //                 logger.info(`Unable to verify mission: ${mission.name}`);
        //                 continue;
        //             }
        //             let isTaskVerified = false;
        //             if (!mission.status) {
        //                 logger.info(`Verifying task ${mission.name}`);
        //                 const verifyResponse = await this.verifyMissionTask(mission.id);
        //                 if (verifyResponse.data === true && verifyResponse.status === "success") {
        //                     isTaskVerified = true;
        //                     logger.info(`Task ${mission.name} is verified`);
        //                 } else {
        //                     this.failedToBeVerifyTasks.push(mission.id);
        //                     logger.info(`Failed to verify task ${mission.name}`, verifyResponse);
        //                 }
        //             }
        //             if (mission.status === "VERIFIED" || isTaskVerified) {
        //                 const claimResponse = await this.claimMissionTask(mission.id);
        //                 if (claimResponse.status === "success") {
        //                     logger.info(`Claimed mission ${mission.name}`, claimResponse);
        //                 }
        //             }
        //             if (mission.status === "CLAIMED") {
        //                 logger.info(`Mission ${mission.name} already completed`);
        //                 continue;
        //             }
        //         }
        //     }
        // }

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
                    logger.info(`Skill ${skillPriorityQueue[currentSkillIdIndex]} not found`); 
                    continue;
                    // just put here for not get ts error (skill is undefined)
                    return;
                }
                if (ignoreSkillId.includes(skill.skillId)) {
                    logger.info(`Skill ${skill.name} is ignored`);
                    continue;
                }
                logger.info(`Upgrading skill ${skill.name}`);
                let skillTimeWaiting = skill.timeWaiting; // timestamp in ms
                do {
                    const nextLevelResponse = await this.getNextSkillLevel(skill.skillId);
                    if (nextLevelResponse.status === "success") {
                        const nextLevelData = nextLevelResponse.data;
                        if (skill.levelCurrent >= skill.maxLevel) {
                            logger.info(`Skill ${skill.name} already maxed out`);
                            break;
                        }
                        const isAbleToUpgrade = pointSkill >= nextLevelData.feeUpgrade && point >= nextLevelData.feePointUpgrade;
                        if (isAbleToUpgrade) {
                            const upgradeResponse = await this.upgradeSkill(skill.skillId);
                            if (upgradeResponse.status === "success") {
                                logger.info(`Upgraded skill ${skill.name} to level ${skill.levelCurrent + 1}`);

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
                                            logger.info(`Waiting ${waitUpgrade / Time.MINUTE} minutes for ${skill.name} to be ready`);    
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

const users = [{
    proxy: undefined,
    initData: "query_id=AAFyEEJlAgAAAHIQQmURHFC9&user=%7B%22id%22%3A5993795698%2C%22first_name%22%3A%22Thai%F0%9F%8C%B1SEED%22%2C%22last_name%22%3A%22Le%20%F0%9F%92%8ECR%20%F0%9F%9B%92%22%2C%22username%22%3A%22thailephan%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&auth_date=1728801668&hash=b3d85e904a0d05aafbaa687d93836e1f4034d3e32cccd157edec362ce3289440",
}] as UserData[];    
Main.start(users).then().catch(console.error);