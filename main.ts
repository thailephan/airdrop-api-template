import FetchHeaders from "./services/headers/headers.ts";
import { TelegramApplication } from "./application.ts";
import { logger } from "./common/logger.ts";
import { AppProxyChecker } from "./services/proxy/proxy-checker.ts";
import { InitDataExtractor } from "./common/initData.ts";
import UserService from "./services/user.service.ts";
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

        const headers = this.headers.get();
        const userResponse = await UserService.fetchUsers(headers, this.initData);
        if (userResponse.status !== "existing") {
            throw new Error("User not found");
        }

        headers.set("Authorization", `Bearer ${userResponse.token}`);

        const upgrades = await UpgradeService.getUpgrades(headers);

        const dailyRewardCheckResponse = await DailyRewardService.check(headers);
        logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, "Can claim daily reward:", dailyRewardCheckResponse.canClaim);
        if (dailyRewardCheckResponse.canClaim) {
            await Timer.sleepRandom(5 * Time.SECOND, 10 * Time.SECOND).promise;
            const r = await DailyRewardService.claim(headers);
            logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, "Daily reward claimed");
        }

        // mining reward
        const claimMiningTime = userResponse.data.lastClaimedAt + (userResponse.data.timeCap * Time.HOUR);
        if (claimMiningTime <= Date.now()) {
            const miningRewardResponse = await MiningService.claimMining(headers);
            logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, "Mining reward claimed", miningRewardResponse.xp);
        }

        // get boosts, socials
        const boostsResponse = await BoostService.get(headers);
        const socialsResponse = await SocialService.get(headers);

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

                await BoostService.activateBoost(headers, boost._id);
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
                await SocialService.claimTask(headers, social._id);
                logger.info(`[${this.appName} ${this.extractedInitData?.user.username}]`, "Claimed social", social.name);
            }
        }

        const { data: newUserResponse } = await UserService.fetchUsers(headers, this.initData);
        const buyableUpgrades = upgrades.data.filter((upgrade) => (
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
            await UpgradeService.upgrade(headers, upgrade.id);
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
    proxy: "proxymart29181:tOgaGRME@157.66.12.181:29181",
    initData: "user=%7B%22id%22%3A6091532790%2C%22first_name%22%3A%22may%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%20%F0%9F%8C%B1SEED%20%F0%9F%90%B8%F0%9F%92%8ECR%22%2C%22username%22%3A%22xzvtglhp%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=954819861544150428&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728663350&hash=c4e87e10c8f1c2edb16338b0168cfeeda454f7ab36fd03596868cff93f74a631"
  },
  {
    proxy: "proxymart29519:BKKTgDcE@103.65.136.46:29519",
    initData: "user=%7B%22id%22%3A6083367699%2C%22first_name%22%3A%22may%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%20%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22tixhsqau%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=511731517383880737&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728663355&hash=a01d4b96858d9cac252883aeda0c6fe06c050375a39fcb45cf17c755aa195783"
  },
  {
    proxy: "proxymart29519:BKKTgDcE@103.65.136.46:29519",
    initData: "user=%7B%22id%22%3A7172846926%2C%22first_name%22%3A%22may%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%20%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22myntafxs%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-3486405822842547305&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728663355&hash=7deef86c8982ba9c26a77a99350f09b1b350b30b5e611c8a4c14ab03e730287d"
  },
  {
    proxy: "proxymart29365:kptWtmoD@36.50.132.123:29365",
    initData: "user=%7B%22id%22%3A7487128929%2C%22first_name%22%3A%22Liliana%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22Cacheta%F0%9F%8C%B1SEED%F0%9F%92%8ECR%22%2C%22username%22%3A%22liliana1ld%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-2334189008563334935&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728663357&hash=b421707195b3bb9388007985d930edcc220bd4c7f6bd5bb1674df3e5b766807f"
  },
  {
    proxy: "proxymart29365:kptWtmoD@36.50.132.123:29365",
    initData: "user=%7B%22id%22%3A6594749785%2C%22first_name%22%3A%22Carlena%20Dool%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22carlena2l%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=160319981414376985&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728663360&hash=3334a4dcb32795b9f5ae355aba5ee77ad658f25c437d9807fd031c80f19e39db"
  },
  {
    proxy: "proxymart29181:tOgaGRME@157.66.12.181:29181",
    initData: "user=%7B%22id%22%3A7274192019%2C%22first_name%22%3A%22Diane%22%2C%22last_name%22%3A%22Bradley%22%2C%22username%22%3A%22DianeBradley2010%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-5881629679592255750&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728663444&hash=2bda18e8e84bb7c6c73a3b2a28e84e666995fea1ae7a70a61036a72772820f48"
  },
  {
    proxy: "proxymart29209:yjVfRpvG@103.236.175.111:29209",
    initData: "user=%7B%22id%22%3A7162231983%2C%22first_name%22%3A%22C%E1%BA%A9m%20hi%E1%BB%81n%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22Ph%E1%BA%A1m%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22cri70281vzj%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=6343038452966421435&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728663442&hash=8eb54d5898ec3907b698686e7bfcb822928dcd8e915a9daf2fab237ec0494378"
  },
  {
    proxy: "proxymart29209:yjVfRpvG@103.236.175.111:29209",
    initData: "user=%7B%22id%22%3A7206351041%2C%22first_name%22%3A%22Summerslaverna%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22Dorriccug%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22krzfO39454%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-3300334184424720893&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728663442&hash=e8d69f506a61ad9f15cdadf2e2868e35761db96a217cd9087240fd7c7d81dbef"
  },
  {
    proxy: "proxymart29011:PWWnuvJU@36.50.133.11:29011",
    initData: "user=%7B%22id%22%3A7350116575%2C%22first_name%22%3A%22Reath%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22sDcDt94764%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=7670739156593378196&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728663444&hash=eb9a0b735d3b7daf17538bb1d2c57753349ac2e3e6aa6e06e706d51a0acc5d37"
  },
  {
    proxy: undefined,
    initData: "user=%7B%22id%22%3A7038003725%2C%22first_name%22%3A%22Jarvis%20Hanel%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22javis1l%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=2270564748649386562&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728663420&hash=a6a5a9c4d494d3cdaa9f610985efb43bf03af00f6e408f88828393390fe4ac47"
  },
  {
    proxy: "proxymart29011:PWWnuvJU@36.50.133.11:29011",
    initData: "user=%7B%22id%22%3A7396996476%2C%22first_name%22%3A%22mohamadreza.akbari%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%90%B0%F0%9F%A6%86%22%2C%22last_name%22%3A%22Ooo%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22cabibara1l%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=1574011668299873612&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728663445&hash=08db7c32e2f13d0e7b16fa8a5504c844d00b3719738b564efc32066ea96da639"
  },
  {
    proxy: undefined,
    initData: "user=%7B%22id%22%3A5993795698%2C%22first_name%22%3A%22Thai%F0%9F%8C%B1SEED%22%2C%22last_name%22%3A%22Le%20%F0%9F%92%8ECR%20%F0%9F%9B%92%22%2C%22username%22%3A%22thailephan%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=5818109951027896480&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728663487&hash=53ce10a0715ca766dcf1132fd0004f90e5d74b1db8b7cf66f9d80c687f69b052"
  },
  {
    proxy: "proxymart29102:WzUiihpd@36.50.236.102:29102",
    initData: "user=%7B%22id%22%3A7614128738%2C%22first_name%22%3A%22Marguerite%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22Tyrome%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22margueritetyrome%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=7142184114959708661&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728663524&hash=87c9a5081539918c0b45397926334090b7002d8b383b17fa7e0156fe3a17a4b0"
  },
  {
    proxy: "proxymart29380:UpFsrDHL@36.50.133.72:29380",
    initData: "user=%7B%22id%22%3A7496050969%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22koscwivu%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-6529109041638252837&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728663526&hash=3172f1b5fc5dbd8cb5aa02524fab8d079b662ec27976a249bc1f4c35e72d586b"
  },
  {
    proxy: "proxymart29380:UpFsrDHL@36.50.133.72:29380",
    initData: "user=%7B%22id%22%3A7055633313%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22mxznvqta%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=1727227069290651169&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728663525&hash=2acd8aa17e7f707b452a58eda05307c90d951f2978fd497bf52b1401ce547811"
  },
  {
    proxy: "proxymart29048:IpcoDRzM@199.48.244.48:29048",
    initData: "user=%7B%22id%22%3A7295672761%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22bojlumdf%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-6909097539847831081&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728663535&hash=2725804f830c20857ab7f2b6e7da6a4e32c43d1bae952534030b007d93a59d16"
  },
  {
    proxy: "proxymart29048:IpcoDRzM@199.48.244.48:29048",
    initData: "user=%7B%22id%22%3A7052605861%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22jpnbmszd%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=1489325514764936971&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728663537&hash=95d40649bb9fe1f5bc9a8d3adbc8d45c039622d09dfdd1cd464b4d4085d7d471"
  },
  {
    proxy: "proxymart29262:PbvFBKuR@36.50.133.136:29262",
    initData: "user=%7B%22id%22%3A7373766374%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22fykdirtz%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=2698117846219566929&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728663560&hash=dc31e14897e402927d48253708fc064e3f6ec4133c5e8153d1d940270645254e"
  },
  {
    proxy: "proxymart29262:PbvFBKuR@36.50.133.136:29262",
    initData: "user=%7B%22id%22%3A7138410111%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%220997%F0%9F%92%8ECR%22%2C%22username%22%3A%22qrtlkpja%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=1363976223316683163&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728663598&hash=36cbd2da7b71c619ce1e25d09171ac7ed339ed3ee680361a688098a7e92d8b58"
  },
  {
    proxy: "proxymart29102:WzUiihpd@36.50.236.102:29102",
    initData: "user=%7B%22id%22%3A7094522456%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%20%F0%9F%8C%B1SEED%F0%9F%92%8ECR%22%2C%22username%22%3A%22acsbpnxw%22%2C%22language_code%22%3A%22vi%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=5747078258999740514&start_param=be4688f1-f9fa-42f6-9a6e-ffee166c9483&auth_date=1728663599&hash=30ec956a1e1b7999934b83de186e61eb47b101534a3398b68266b9637627f8c7"
  }
] as UserData[];
Main.start(users).then().catch(console.error);