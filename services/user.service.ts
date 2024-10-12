class UserService {
    static async fetchUsers(headers: Headers, client: Deno.HttpClient, initData: string): Promise<FetchUsersResponse> {
        const body = JSON.stringify({ initData });
        const response = await fetch("https://atletaclicker.online/api/v1/users", {
            "headers": headers,
            "body": body,
            "method": "POST",
            "mode": "cors",
            "credentials": "include",
            client,
        });
        return response.json();
    }
}
export default UserService;


export interface FetchUsersResponse {
    data: FetchUsersData;
    status: string
    token: string
}
export interface FetchUsersData {
    username: string
    telegramId: string
    lang: string
    inviteLink: string
    points: number
    unclaimedPoints: number
    minerSpeed: number
    timeCap: number
    xp: number
    level: number
    lastEntry: string
    vibrate: boolean
    miningStartedAt: number
    lastClaimedAt: number
    claimedTimestamp: number
    welcomeTimestamp: number
    onboardingTimestamp: number
    upgrades: Upgrade[]
    boosts: any[]
    socials: Social[]
    dailyReward: DailyReward
}
export interface Upgrade {
    upgradeId: string
    level: number
    increment: number
    levelChanges?: LevelChange[]
}
export interface LevelChange {
    level: number
    increment: number
    appliedAt: number
}
export interface Social {
    socialId: string
    completedTimestamp: number
}
export interface DailyReward {
    streak: number
    totalRewardsClaimed: number
    lastClaimed: number
}