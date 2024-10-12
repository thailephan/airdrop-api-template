import data from "./data.json" with { type: "json" };

const Time  = {
    Second: 1000,
    Minute: 60 * 1000,
    Hour: 60 * 60 * 1000,
    Day: 24 * 60 * 60 * 1000,
}

const origin = "https://rich-teddy.slex.io";
const referer = "https://rich-teddy.slex.io/apps/rich-teddy";
interface Headers {
 cookie: string,
 userQs: string 
}
const getHeaders = ({ cookie, userQs }: Headers) => ({
    "Accept": "*/*",
    "Content-Type": "application/json",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Accept-Language": "en-US,en;q=0.9",
    "Origin": origin,
    "Referer": referer,
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    // "Cookie": cookie,
    "Sec-Ch-Ua": '"Brave";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Gpc": "1",
    "X-User-Qs": userQs,
})

interface IServiceIncreaseResponse {
    "success": boolean,
    "code": string,
    "msg": string,
    "retry": boolean,
    "data": number,
}

type MiningStatus ="canClaim" | "canStart" | "inProcess";
interface Request extends Headers {
    client: Deno.HttpClient, 
}
interface Response {
  mining: Mining
  balance: string
  pendingTaskCount: number;
  nextUpdateAt: string // 2024-09-21T09:15:41.000Z
  presentReceived: boolean;
}
interface Mining {
  status: string
  startedAt: string // 2024-09-21T09:15:41.000Z
  endsAt: string // 2024-09-21T09:15:41.000Z
  totalAmount: string
}

interface TapRequest extends Request {
  points: number;
}
interface TapResponse {
    balance: string
    gameV1: TapGameV1
}

export interface TapGameV1 {
  energy: number
  max: number
  eps: number
  t: number
}


interface DailyLoginResponse {
    rewards: string[];
    isClaimedToday: boolean;
    position: number;
}
interface ClaimDailyLoginResponse {
    status: DailyLoginResponse,
    balance: string;
}

interface TaskGroupResponse {
    pendingTaskCount: number;
    pending: TaskGroup[];
    completed: TaskGroup[];
    tasks: {
        completed: Task[];
        pending: Task[];
    }
}
interface TaskGroup {
    id: string;
    photo: string;
    title: string;
    shortDescription: string;
    description: string;
    tasks: {
        completed: Task[];
        pending: Task[];
    }
    amount: string;
}
interface Task {
    description: string;
    id: string;
    reward: string;
    title: string;
    type: string;
    url: string;
}

interface CompleteTaskRequest extends Request {
    taskId: string;
}
interface CompleteTaskResponse {
    balance: string;
    creditedRewardAmount: string;
    groups: TaskGroupResponse;
}

interface GetLuckyWheelResponse {
    options: any[]
    user: {
        freeSpinsAt: any
        slots: number
        maxSlots: number
        adv: any
    }
}
interface SpinLuckyWheelResponse {
    winner: { type: string };
    user: {
        freeSpinsAt: any
        slots: number
        maxSlots: number
        adv: any
    }
}

const Service = {
    status: async ({ client, ...headers}: Request): Promise<Response> => {
        const response = await fetch("https://rich-teddy.slex.io/api/rich-teddy-bot/status", {
            method: "GET",
            headers: getHeaders(headers),
            client,
        })
        const json = await response.json();
        return json;
    },
    claim: async ({ client, ...headers}: Request): Promise<Response> => {
        const response = await fetch("https://rich-teddy.slex.io/api/rich-teddy-bot/mining/claim", {
            method: "POST",
            headers: getHeaders(headers),
            client,
        })
        const json = await response.json();
        return json;
    },
    start: async ({ client, ...headers}: Request): Promise<Response> => {
        const response = await fetch("https://rich-teddy.slex.io/api/rich-teddy-bot/mining/start", {
            method: "POST",
            headers: getHeaders(headers),
            client,
        })
        const json = await response.json();
        return json;
    },
    tap: async ({ points, client, ...headers}: TapRequest): Promise<TapResponse> => {
        const response = await fetch("https://rich-teddy.slex.io/api/rich-teddy-bot/game/v1", {
            method: "POST",
            headers: getHeaders(headers),
            client,
            body: JSON.stringify({ points }),
        })
        const json = await response.json();
        return json;
    },
    dailyLogin: async ({ client, ...headers}: Request): Promise<DailyLoginResponse> => {
        const response = await fetch("https://rich-teddy.slex.io/api/rich-teddy-bot/daily", {
            method: "GET",
            headers: getHeaders(headers),
            client,
        })
        const json = await response.json();
        return json;
    },
    claimDailyLogin: async ({ client, ...headers}: Request): Promise<ClaimDailyLoginResponse> => {
        const response = await fetch("https://rich-teddy.slex.io/api/rich-teddy-bot/daily", {
            method: "POST",
            headers: getHeaders(headers),
            client,
        })
        const json = await response.json();
        return json;
    },
    getTasks: async ({ client, ...headers}: Request): Promise<TaskGroupResponse> => {
        const response = await fetch("https://rich-teddy.slex.io/api/rich-teddy-bot/task-groups", {
            method: "GET",
            headers: getHeaders(headers),
            client,
        })
        const json = await response.json();
        return json;
    },
    completeTask: async ({ taskId, client, ...headers}: CompleteTaskRequest): Promise<TaskGroupResponse> => {
        const response = await fetch("https://rich-teddy.slex.io/api/rich-teddy-bot/tasks/check/v2", {
            method: "POST",
            headers: getHeaders(headers),
            client,
            body: JSON.stringify({ id: taskId }),
        })
        const json = await response.json();
        return json;
    },
    getLuckyWheel: async ({ client, ...headers}: Request): Promise<GetLuckyWheelResponse> => {
        const response = await fetch("https://rich-teddy.slex.io/api/rich-teddy-bot/lucky-wheel", {
            method: "GET",
            headers: getHeaders(headers),
            client,
        })
        const json = await response.json();
        return json;
    },
    spinLuckyWheel: async ({ client, ...headers}: Request): Promise<SpinLuckyWheelResponse> => {
        const response = await fetch("https://rich-teddy.slex.io/api/rich-teddy-bot/lucky-wheel", {
            method: "POST",
            headers: getHeaders(headers),
            client,
        })
        return response.json();
    },
}

const generateRandomInRange = (min: number = 0, max: number = 1) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

async function execute(initData: string, proxy?: string) {
    const MIN_TAP_ENERGY = 100;
    // ignore soon
    const cookie = data[0].cookie;
    const userQs = initData;
    let client: Deno.HttpClient | undefined = undefined;
    if (proxy) {
        const [username, password, ip, port] = proxy.split(/[:@]/);
        client = Deno.createHttpClient({
            proxy: {
                url: `http://${ip}:${port}`,
                basicAuth: { username, password },
            }
        })
    } else {
        client = Deno.createHttpClient({ });
    }

    let retry = 0;
    // start date of unix in iso format 1970
    let nextClaimStart = "1970-01-01T00:00:00.000Z";
    let nextGroupTaskStart = "1970-01-01T00:00:00.000Z";

    while (true) {
        try {
            if (retry > 5) {
                console.log("Retry limit reached");
                break;
            }

            console.log("Check daily login");
            const dailyLoginResponse = await Service.dailyLogin({ cookie, userQs, client });
            if (!dailyLoginResponse.isClaimedToday) {
                console.log("Claiming daily login");
                const claimDailyLoginResponse = await Service.claimDailyLogin({ cookie, userQs, client });
                console.log("Claimed daily login", claimDailyLoginResponse);
            }

            // #region lucky wheel
            const getLuckyWheelResponse = await Service.getLuckyWheel({ cookie, userQs, client });
            let slots = getLuckyWheelResponse.user.slots;
            while (slots > 0) {
                console.log("Spinning lucky wheel");
                const spinLuckyWheelResponse = await Service.spinLuckyWheel({ cookie, userQs, client });
                console.log("Spinned lucky wheel", spinLuckyWheelResponse);
                slots = spinLuckyWheelResponse.user.slots;
                await new Promise(resolve => setTimeout(resolve, generateRandomInRange(20 * Time.Second, 40 * Time.Second)));
            }
            // #endregion

            // #region claiming
            const now = new Date().toISOString();
            if (now > nextClaimStart) {
                const statusResponse = await Service.status({ cookie, userQs, client });
                console.log("status", statusResponse);

                const miningStatus = statusResponse.mining.status;
                nextClaimStart = getNextClaimTime(statusResponse.mining.endsAt);
                switch (miningStatus as MiningStatus) {
                    case "canClaim": {
                        console.log("Claiming mining");
                        const claimResponse = await Service.claim({ cookie, userQs, client });
                        console.log("Claimed mining", claimResponse);

                        await new Promise(resolve => setTimeout(resolve, generateRandomInRange(3 * Time.Second, 10 * Time.Second)));
                        nextClaimStart = getNextClaimTime(claimResponse.mining.endsAt);

                        if (claimResponse?.mining?.status === "canStart") {
                            console.log("Starting mining");
                            const startResponse = await Service.start({ cookie, userQs, client });
                            const currentMiningEndsAt = startResponse.mining.endsAt;
                            console.log("Started mining", startResponse);

                            nextClaimStart = getNextClaimTime(currentMiningEndsAt);
                        }
                        break;
                    }
                    case "canStart": {
                        const startResponse = await Service.start({ cookie, userQs, client });
                        const currentMiningEndsAt = startResponse.mining.endsAt;
                        console.log("Started mining", startResponse);

                        nextClaimStart = getNextClaimTime(currentMiningEndsAt);
                        break;
                    }
                }

                console.log("Next mining start at", nextClaimStart);
            }
            // #endregion

            const waitToTappingTime = generateRandomInRange(5 * Time.Second, 10 * Time.Second);
            console.log(`Start tapping in ${waitToTappingTime} seconds`);
            await new Promise(resolve => setTimeout(resolve, waitToTappingTime));

            // #region tap
            for (let i = 0; i < 200; i++) {
                const tapPoints = generateRandomInRange(5, 50);
                const tapResponse = await Service.tap({ points: tapPoints, cookie, userQs, client });
                console.log(`Tapped ${tapPoints}`, tapResponse);

                if (tapResponse.gameV1.energy <= MIN_TAP_ENERGY) {
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, generateRandomInRange(6 * Time.Second, 10 * Time.Second)));
            }
            // #endregion

            // #region tasks
            if (new Date().toISOString() > nextGroupTaskStart) {
                const waitToDoingTaskTime = generateRandomInRange(5 * Time.Second, 10 * Time.Second);
                console.log(`Start tapping in ${waitToDoingTaskTime} seconds`);
                await new Promise(resolve => setTimeout(resolve, waitToDoingTaskTime));
                // #region tasks
                const tasksResponse = await Service.getTasks({ cookie, userQs, client });
                for (const taskGroup of tasksResponse.pending) {
                    console.log(`Starting task group "${taskGroup.title}" - ${taskGroup.id}`);
                    for (const task of taskGroup.tasks.pending) {
                        console.log("Completing task", task.title);
                        const completeTaskResponse = await Service.completeTask({ taskId: task.id, cookie, userQs, client });
                        console.log("Completed task", completeTaskResponse);

                        await new Promise(resolve => setTimeout(resolve, generateRandomInRange(10 * Time.Second, 30 * Time.Second)));
                    }
                    console.log(`Complete task group "${taskGroup.title}" - ${taskGroup.id}`);
                }

                for (const task of tasksResponse.tasks.pending) {
                    console.log("Completing task", task.title);
                    const completeTaskResponse = await Service.completeTask({ taskId: task.id, cookie, userQs, client });
                    console.log("Completed task", completeTaskResponse);
                    await new Promise(resolve => setTimeout(resolve, generateRandomInRange(10 * Time.Second, 30 * Time.Second)));
                }

                nextGroupTaskStart = new Date(new Date().getTime() + Time.Day).toISOString();
            }
            // #endregion

            retry = 0;
        } catch (e) {
            retry++;
            console.log(e);
        } finally {
            await new Promise(resolve => setTimeout(resolve, generateRandomInRange(10 * Time.Minute, 30 * Time.Minute)));
        }
    }
}
async function main() {
    const users = [
        {
            proxy: "proxymart29181:tOgaGRME@157.66.12.181:29181",
            initData: "user=%7B%22id%22%3A6091532790%2C%22first_name%22%3A%22may%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%20%F0%9F%8C%B1SEED%20%F0%9F%90%B8%F0%9F%92%8ECR%22%2C%22username%22%3A%22xzvtglhp%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=7158128597807651514&start_param=354275138&auth_date=1728699048&hash=c0b664913b5c711e6702791b2d31b7969812030ce76ca318fe4a26c7466f7fcb"
        },
        {
            proxy: "proxymart29519:BKKTgDcE@103.65.136.46:29519",
            initData: "user=%7B%22id%22%3A6083367699%2C%22first_name%22%3A%22may%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%20%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22tixhsqau%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=4720478226755123715&start_param=354275138&auth_date=1728699044&hash=61da423e479bba5de7d2e3bc1ab6bd4f34edfab57b8b7789d6791b8ec9310efc"
        },
        {
            proxy: "proxymart29519:BKKTgDcE@103.65.136.46:29519",
            initData: "user=%7B%22id%22%3A7172846926%2C%22first_name%22%3A%22may%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%20%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22myntafxs%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-1219562325365925762&start_param=354275138&auth_date=1728699051&hash=a52b22efd5d758628a1f4a1fef280fcc9f122ed6caa2ce2ac9b7f8e484c912ce"
        },
        {
            proxy: "proxymart29365:kptWtmoD@36.50.132.123:29365",
            initData: "user=%7B%22id%22%3A7487128929%2C%22first_name%22%3A%22Liliana%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22Cacheta%F0%9F%8C%B1SEED%F0%9F%92%8ECR%22%2C%22username%22%3A%22liliana1ld%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=7594848938359449830&start_param=354275138&auth_date=1728699540&hash=23a1bda5de8ab1bb42b8cbee8e75ae4c8c612648b261de18e4ce17a3d9eb14dc"
        },
        {
            proxy: "proxymart29365:kptWtmoD@36.50.132.123:29365",
            initData: "user=%7B%22id%22%3A6594749785%2C%22first_name%22%3A%22Carlena%20Dool%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22carlena2l%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=1807849495292850641&start_param=354275138&auth_date=1728699062&hash=43cc26bd783fdd64dbbcf711baef2495073ec2ea08426f7b8d554a4d8695d6f7"
        },
        {
            proxy: "proxymart29181:tOgaGRME@157.66.12.181:29181",
            initData: "user=%7B%22id%22%3A7274192019%2C%22first_name%22%3A%22Diane%22%2C%22last_name%22%3A%22Bradley%22%2C%22username%22%3A%22DianeBradley2010%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=8819785540742217404&start_param=354275138&auth_date=1728699039&hash=d6e96c5f8e15cf0583e2677bc209a2c03372082a386f0b3c4108fd6da7eb3b2b"
        },
        {
            proxy: "proxymart29209:yjVfRpvG@103.236.175.111:29209",
            initData: "user=%7B%22id%22%3A7162231983%2C%22first_name%22%3A%22C%E1%BA%A9m%20hi%E1%BB%81n%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22Ph%E1%BA%A1m%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22cri70281vzj%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-2262310358106678944&start_param=354275138&auth_date=1728699116&hash=3a400e8014a874e1caf1d1fe039b8e68e338cfd01eb85a2cb325b3340dda7a09"
        },
        {
            proxy: "proxymart29209:yjVfRpvG@103.236.175.111:29209",
            initData: "user=%7B%22id%22%3A7206351041%2C%22first_name%22%3A%22Summerslaverna%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22Dorriccug%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22krzfO39454%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=3323723746850303533&start_param=354275138&auth_date=1728699120&hash=8b0dee6210e29f51275cbfa2a52c1c77ecb0a5724568a07f288a8b15c44b2ddf"
        },
        {
            proxy: "proxymart29011:PWWnuvJU@36.50.133.11:29011",
            initData: "user=%7B%22id%22%3A7350116575%2C%22first_name%22%3A%22Reath%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22sDcDt94764%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=7455753346885882636&start_param=354275138&auth_date=1728699138&hash=9268df201eb2b97c6af7b70a6f0b0e365f37869ac6dc5ea91de036449873f544"   
        },
        {
            proxy: undefined,
            initData: "user=%7B%22id%22%3A7038003725%2C%22first_name%22%3A%22Jarvis%20Hanel%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%A6%86%F0%9F%90%B0%22%2C%22last_name%22%3A%22%F0%9F%8C%B1SEED%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22javis1l%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-1832277821165968890&start_param=354275138&auth_date=1728699147&hash=0f16d7867c3498a65a76ff0b081ba2a831e895e7e7f42055d41b1b76df569dff"
        },
        {
            proxy: "proxymart29011:PWWnuvJU@36.50.133.11:29011",
            initData: "user=%7B%22id%22%3A7396996476%2C%22first_name%22%3A%22mohamadreza.akbari%20%F0%9F%90%88%E2%80%8D%E2%AC%9BDUCKS%20%F0%9F%90%B0%F0%9F%A6%86%22%2C%22last_name%22%3A%22Ooo%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22cabibara1l%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=1111786430523540363&start_param=354275138&auth_date=1728699151&hash=328234292843098f2917ef4b3c249face6f562e7b06b6d669e15da4030064e52"   
        },
        {
            proxy: undefined,
            initData: "user=%7B%22id%22%3A5993795698%2C%22first_name%22%3A%22Thai%F0%9F%8C%B1SEED%22%2C%22last_name%22%3A%22Le%20%F0%9F%92%8ECR%20%F0%9F%9B%92%22%2C%22username%22%3A%22thailephan%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-4039645127383694343&start_param=354275138&auth_date=1728699184&hash=bb23f019686a5f744224cd181ce7dc77a6be6deec25e25bb94c279b5a80bf510"
        },
        {
            proxy: "proxymart29102:WzUiihpd@36.50.236.102:29102",
            initData: "user=%7B%22id%22%3A7614128738%2C%22first_name%22%3A%22Marguerite%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22Tyrome%20%F0%9F%92%8ECR%22%2C%22username%22%3A%22margueritetyrome%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=254237076839681134&start_param=354275138&auth_date=1728699193&hash=4cedc011079cf217f89deb94340d9eea4a8c088f92e38635f2cc6da1ece8db6f"
        },
        {
            proxy: "proxymart29380:UpFsrDHL@36.50.133.72:29380",
            initData: "user=%7B%22id%22%3A7496050969%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22koscwivu%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=8118259043276765171&start_param=354275138&auth_date=1728699213&hash=65fcf0ceea01f27f8a5e3b4d0386313ff798d37a22400708106e49217190bc86"
        },
        {
            proxy: "proxymart29380:UpFsrDHL@36.50.133.72:29380",
            initData: "user=%7B%22id%22%3A7055633313%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22mxznvqta%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-3954028300772279091&start_param=354275138&auth_date=1728699228&hash=d4bf7547a3b8332f42a2976a2e318a992a6661c5f6bc918805f84b923726a54c"
        },
        {
            proxy: "proxymart29048:IpcoDRzM@199.48.244.48:29048",
            initData: "user=%7B%22id%22%3A7295672761%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22bojlumdf%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-3955574417493091078&start_param=354275138&auth_date=1728699242&hash=5b5b058ae9ef40310504c6c06f6fd33408496c68735a0f6f430be59dbcc21b6e"
        },
        {
            proxy: "proxymart29048:IpcoDRzM@199.48.244.48:29048",
            initData: "user=%7B%22id%22%3A7052605861%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22jpnbmszd%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-8390385355959093086&start_param=354275138&auth_date=1728699270&hash=d1c7f746244d1682410252d8bcb4b19f8fe5a45b822f6b9b2e72f67172364648"
        },
        {
            proxy: "proxymart29262:PbvFBKuR@36.50.133.136:29262",
            initData: "user=%7B%22id%22%3A7373766374%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%F0%9F%92%8ECR%22%2C%22username%22%3A%22fykdirtz%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-160403620228858573&start_param=354275138&auth_date=1728699275&hash=1576ccd209fc73c41a116d683a9c4d91f9693a92e13c65424527f106ca1b9488"
        },
        {
            proxy: "proxymart29262:PbvFBKuR@36.50.133.136:29262",
            initData: "user=%7B%22id%22%3A7138410111%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%220997%F0%9F%92%8ECR%22%2C%22username%22%3A%22qrtlkpja%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=-1423049884856908910&start_param=354275138&auth_date=1728699288&hash=cfea88a63492be263c9cfd38b64fddcc63ce4ce85d1107986d0aca3c1b72d595"
        },
        {
            proxy: "proxymart29102:WzUiihpd@36.50.236.102:29102",
            initData: "user=%7B%22id%22%3A7094522456%2C%22first_name%22%3A%22may%20SEED%20%F0%9F%90%88%E2%80%8D%E2%AC%9B%22%2C%22last_name%22%3A%22lq%20%F0%9F%8C%B1SEED%F0%9F%92%8ECR%22%2C%22username%22%3A%22acsbpnxw%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=7181401956274620006&start_param=354275138&auth_date=1728699306&hash=4562767739d0b578242a8a758619a1617e006859643f85b97002600cf6d4ef8b"
        }
    ]
    await Promise.all(users.map(async (user) => {
        return await execute(user.initData, user.proxy);
    }));
}
main();

const getNextClaimTime = (currentMiningEndsAt: string) => {
    const nextClaimStartUnix = new Date(currentMiningEndsAt).getTime() + generateRandomInRange(2 * Time.Minute, 5 * Time.Minute);
    return new Date(nextClaimStartUnix).toISOString();
}