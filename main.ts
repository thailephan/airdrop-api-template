import FetchHeaders from "./services/headers/headers.ts";
import { TelegramApplication } from "./application.ts";
import { logger } from "./common/logger.ts";
import { AppProxyChecker } from "./services/proxy/proxy-checker.ts";
import { InitDataExtractor } from "./common/initData.ts";
import UserService, { type FetchUsersResponse } from "./services/user.service.ts";
import UpgradeService from "./services/upgrade.service.ts";
import DailyRewardService from "./services/daily-reward.service.ts";
import { Time, Timer } from "./common/timer.ts";
import BoostService from "./services/boost.service.ts";
import SocialService from "./services/social.service.ts";
import MiningService from "./services/mining.service.ts";

class GameFetchHeaders extends FetchHeaders {
    constructor() {
        super();
        this.setKey("Origin", "https://atletaclicker.online");
        this.setKey("Referer", "https://atletaclicker.online/");
        this.setKey("Accept", "application/json, text/plain, */*");
        this.setKey("Content-Type", "application/json");
        this.setKey("user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36");
        this.setKey("Connection", "keep-alive");
        this.setKey("Accept-Encoding", "gzip, deflate, br");
        this.setKey("Cache-Control", "no-cache");
    }
}

class GameTelegramApplication extends TelegramApplication {
    headers: FetchHeaders;

    constructor(initData: string, proxy?: string) {
        super(initData, proxy);
        this.appName = "atleta";
        this.headers = new GameFetchHeaders();
    }

    override async onRunExecution(): Promise<void> {
        let nextExecutionTime = [6 * Time.HOUR, 6 * Time.HOUR];
        this.setExecutionInterval(nextExecutionTime[0], nextExecutionTime[1]);

        const headers = this.headers.get();
        let userResponse: FetchUsersResponse | undefined = undefined;
        let count = 0;
        do {
          try {
            userResponse = await UserService.fetchUsers(headers, this.client, this.initData);
            logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, "Fetch user success");
          } catch (e: any) {
            logger.error(`[${this.appName} ${this.extractedInitData?.user.username}]`, e.message, count);
          }
          if (count++ >= 5) {
            break;
          }
          await Timer.sleepRandom(5 * Time.SECOND, 10 * Time.SECOND).promise;
        } while(userResponse === undefined);
        if (count >= 5 || userResponse === undefined) {
          return;
        }
        headers.set("Authorization", `Bearer ${userResponse.token}`);

        const dailyRewardCheckResponse = await DailyRewardService.check(headers, this.client);
        logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, "Can claim daily reward:", dailyRewardCheckResponse.canClaim);
        if (dailyRewardCheckResponse.canClaim) {
            await Timer.sleepRandom(5 * Time.SECOND, 10 * Time.SECOND).promise;
            await DailyRewardService.claim(headers, this.client);
            logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, "Daily reward claimed");
        }

        // mining reward
        const claimMiningTime = userResponse.data.lastClaimedAt + (userResponse.data.timeCap * Time.HOUR);
        if (claimMiningTime <= Date.now()) {
            const miningRewardResponse = await MiningService.claimMining(headers, this.client);
            logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, "Mining reward claimed", miningRewardResponse.xp);
        }

        // get boosts, socials
        const boostsResponse = await BoostService.get(headers, this.client);
        const socialsResponse = await SocialService.get(headers, this.client);

        // claim boosts
        logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, "Start activating boosts");
        for (const boost of boostsResponse.data) {
            const diff = (boost.endTimestamp ?? 0) - Date.now();
            if (boost.endTimestamp && diff >= 10 * Time.MINUTE) {
                logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, "Skip boost", boost.name);
                continue;
            } else {
                if (diff > 0) {
                  await Timer.sleepRandom(diff, diff + 2 * Time.MINUTE).promise;
                }

                await BoostService.activateBoost(headers, this.client, boost._id);
                logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, "Activated boost", boost.name);
            }
        }

        // claim socials
        const ignoreSocialIds = ["6703de553756ba039e90e908"];
        logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, "Start claiming socials");
        for (const social of socialsResponse.data) {
            if (social.completedTimestamp || ignoreSocialIds.includes(social._id)) {
                continue;
            } else {
                await Timer.sleepRandom(Time.MINUTE, 2 * Time.MINUTE).promise;
                await SocialService.claimTask(headers, this.client, social._id);
                logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, "Claimed social", social.name);
            }
        }

        await Timer.sleepRandom(2 * Time.MINUTE, 5 * Time.MINUTE).promise;
        const { data: newUserResponse } = await UserService.fetchUsers(headers, this.client, this.initData);
        const upgradesResponse = await UpgradeService.getUpgrades(headers, this.client);
        const buyableUpgrades = upgradesResponse.data.filter((upgrade) => (
            upgrade.isAbleToBuy
            && upgrade.currentLevel < upgrade.maxLevel
            && upgrade.requiredLevel <= newUserResponse.level
        ));
        const affordableUpgrades = buyableUpgrades.filter((upgrade) => upgrade.price <= newUserResponse.points);
        let userCurrentPoints = newUserResponse.points;
        let isFirstUpgrade = true;
        for (const upgrade of affordableUpgrades) {
            if (upgrade.price > userCurrentPoints) {
                continue;
            }

            if (isFirstUpgrade) {
                isFirstUpgrade = false;
            } else {
                await Timer.sleepRandom(5 * Time.SECOND, 10 * Time.SECOND).promise;
            }
            await UpgradeService.upgrade(headers, this.client, upgrade.id);
            logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, "Bought upgrade", upgrade.name, "lv:", upgrade.currentLevel + 1);
            userCurrentPoints -= upgrade.price;
        }

        const now = Date.now();
        if (newUserResponse.lastClaimedAt) {
          const newClaimMiningTime = newUserResponse.lastClaimedAt + (newUserResponse.timeCap * Time.HOUR);
          const diff = newClaimMiningTime - now;
          nextExecutionTime = [diff + 5 * Time.MINUTE, diff + 10 * Time.MINUTE];
          this.setExecutionInterval(nextExecutionTime[0], nextExecutionTime[1]);
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
    initData: "user=%7B%22id%22%3A8149102788%2C%22first_name%22%3A%22Anderson%20Amanda%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22andersonamandaw2938%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-2029033736941230068&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728737951&hash=04bb3011a3805b0ba942b83e548595579cc58b0577bfe56cb88230aba1a50dcf"
  },
  {
    proxy: "proxymart29181:tOgaGRME@157.66.12.181:29181",
    initData: "user=%7B%22id%22%3A6091532790%2C%22first_name%22%3A%22may%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%20%F0%9F%8C%B1SEED%20%F0%9F%90%B8%F0%9F%92%8ECR%22%2C%22username%22%3A%22xzvtglhp%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=954819861544150428&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728737951&hash=08003ef729671bfdda732eed70d53445d8a514100b5adfd838d409581290c171"
  },
  {
    proxy: "proxymart29519:BKKTgDcE@103.65.136.46:29519",
    initData: "user=%7B%22id%22%3A6083367699%2C%22first_name%22%3A%22may%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%20%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22tixhsqau%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=511731517383880737&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728737960&hash=aabcc979fb97acfbcacd697e24522d4d72d94cb7e68e2588c721d04bc21ea2f3"        
  },
  {
    proxy: "proxymart29519:BKKTgDcE@103.65.136.46:29519",
    initData: "user=%7B%22id%22%3A7172846926%2C%22first_name%22%3A%22may%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%20%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22myntafxs%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-3486405822842547305&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728737955&hash=d160f70bc66340135e6789b8019a81043bd395e44b0a98a0469856f3826d6100"      
  },
  {
    proxy: "proxymart29365:kptWtmoD@36.50.132.123:29365",
    initData: "user=%7B%22id%22%3A7487128929%2C%22first_name%22%3A%22Liliana%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22Cacheta%F0%9F%8C%B1SEED%F0%9F%92%8ECR%22%2C%22username%22%3A%22liliana1ld%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-2334189008563334935&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728737959&hash=3e0be61f1b75111d32bf6fa75444baed3057fea6e2a800ef8608ff9dd8cebc32"
  },
  {
    proxy: "proxymart29365:kptWtmoD@36.50.132.123:29365",
    initData: "user=%7B%22id%22%3A6594749785%2C%22first_name%22%3A%22Carlena%20Dool%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22carlena2l%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=160319981414376985&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728737964&hash=3a2eee3ada720610f48080c6917224819b20101a3759fd18f8e141205c9d174a"
  },
  {
    proxy: "proxymart29181:tOgaGRME@157.66.12.181:29181",
    initData: "user=%7B%22id%22%3A7274192019%2C%22first_name%22%3A%22Diane%22%2C%22last_name%22%3A%22Bradley%22%2C%22username%22%3A%22DianeBradley2010%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-5881629679592255750&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728737985&hash=40346a2286839a2acc10685b065154ddf82fb341aa68f7e179d7b8a279114e11"
  },
  {
    proxy: "proxymart29209:yjVfRpvG@103.236.175.111:29209",
    initData: "user=%7B%22id%22%3A7162231983%2C%22first_name%22%3A%22C%E1%BA%A9m%20hi%E1%BB%81n%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22Ph%E1%BA%A1m%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22cri70281vzj%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=6343038452966421435&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728738037&hash=e57b304805ab962b29f0b3494b92b2da8724d40441c80c7b44683f59c3830a5f"
  },
  {
    proxy: "proxymart29209:yjVfRpvG@103.236.175.111:29209",
    initData: "user=%7B%22id%22%3A7206351041%2C%22first_name%22%3A%22Summerslaverna%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22Dorriccug%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22krzfO39454%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-3300334184424720893&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728737991&hash=d62a3578537caebf7178f744b669a5b75c365fdbff298cf7a663c0b3766acb36"
  },
  {
    proxy: "proxymart29011:PWWnuvJU@36.50.133.11:29011",
    initData: "user=%7B%22id%22%3A7350116575%2C%22first_name%22%3A%22Reath%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22sDcDt94764%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=7670739156593378196&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728737948&hash=aa36bf2601b738387da2bb33796925963833cc186d3c5b1359a7ab79b49a3d1e"
  },
  {
    proxy: undefined,
    initData: "user=%7B%22id%22%3A7038003725%2C%22first_name%22%3A%22Jarvis%20Hanel%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22javis1l%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=2270564748649386562&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728738368&hash=58e9fae901cc5962611b9670f4fe97b4aaa7aea8ffec55e60fb860f845ada131"
  },
  {
    proxy: "proxymart29011:PWWnuvJU@36.50.133.11:29011",
    initData: "user=%7B%22id%22%3A7396996476%2C%22first_name%22%3A%22mohamadreza.akbari%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%90%B0%F0%9F%A6%86%22%2C%22last_name%22%3A%22Ooo%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22cabibara1l%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=1574011668299873612&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728738369&hash=765dba4301eac870d403e8b77b6ef5eaf3c88228aa0c6ed9329734400b2e7d96"
  },
  {
    proxy: undefined,
    initData: "user=%7B%22id%22%3A5993795698%2C%22first_name%22%3A%22Thai%F0%9F%8C%B1SEED%22%2C%22last_name%22%3A%22Le%20%F0%9F%92%8ECR%20%F0%9F%9B%92%22%2C%22username%22%3A%22thailephan%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=5818109951027896480&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728738176&hash=6fb845f7a058ff5565634254652847e53fafb73dec2863c6385fcfb72d9eb6dd"
  },
  {
    proxy: "proxymart29102:WzUiihpd@36.50.236.102:29102",
    initData: "user=%7B%22id%22%3A7614128738%2C%22first_name%22%3A%22Marguerite%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22Tyrome%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22margueritetyrome%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=7142184114959708661&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728738178&hash=02f2e3711a8d0bcf43862d49b9a59785c7623cc42620984d9f416ef420bfece4"
  },
  {
    proxy: "proxymart29380:UpFsrDHL@36.50.133.72:29380",
    initData: "user=%7B%22id%22%3A7496050969%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22koscwivu%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-6529109041638252837&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728738179&hash=46950993681893d5876a85e0ea6da1e08dde9ad48152ae93944e29d63982784c"
  },
  {
    proxy: "proxymart29380:UpFsrDHL@36.50.133.72:29380",
    initData: "user=%7B%22id%22%3A7055633313%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22mxznvqta%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=1727227069290651169&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728738179&hash=3679466d6f135be2fe30ac4ee3fc83617b6d66d4e22a212a2f5e604d41463cfe"
  },
  {
    proxy: "proxymart29048:IpcoDRzM@199.48.244.48:29048",
    initData: "user=%7B%22id%22%3A7295672761%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22bojlumdf%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-6909097539847831081&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728738195&hash=cce7b33945397af947ce59fede7fd1b824a0a6f893f1d8e302ab143f9b7faf02"
  },
  {
    proxy: "proxymart29048:IpcoDRzM@199.48.244.48:29048",
    initData: "user=%7B%22id%22%3A7052605861%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22jpnbmszd%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=1489325514764936971&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728738195&hash=88082edc1336038be740f96518321c6a1b4b5ff54cb75d16a7ad49f8d72b0b58"
  },
  {
    proxy: "proxymart29262:PbvFBKuR@36.50.133.136:29262",
    initData: "user=%7B%22id%22%3A7373766374%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22fykdirtz%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=2698117846219566929&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728738195&hash=cbb4bda1bc10f77940219ee2f396c98df38cf692034be0efef8dd6cd4799d33d"
  },
  {
    proxy: "proxymart29262:PbvFBKuR@36.50.133.136:29262",
    initData: "user=%7B%22id%22%3A7138410111%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%220997%F0%9F%92%8ECR%22%2C%22username%22%3A%22qrtlkpja%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=1363976223316683163&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728738200&hash=4a9aec63147386cd6a0dc7bd119d57f36fbb5c6040382984a434e2e412de7d6d"
  },
  {
    proxy: "proxymart29102:WzUiihpd@36.50.236.102:29102",
    initData: "user=%7B%22id%22%3A7094522456%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%20%F0%9F%8C%B1SEED%F0%9F%92%8ECR%22%2C%22username%22%3A%22acsbpnxw%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=5747078258999740514&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728738203&hash=c6b19fed5c0c6506ea5997d24c2f8205edfe0a6357c78c47ef395b6f41173295"   
  }
] as UserData[];
Main.start(users).then().catch(console.error);