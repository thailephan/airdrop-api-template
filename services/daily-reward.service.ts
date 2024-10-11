class DailyRewardService {
    static async check(headers: Headers): Promise<CheckDailyRewardResponse> {
        const response = await fetch("https://atletaclicker.online/api/v1/daily-reward/check", {
            "headers": headers,
            "method": "GET"
        });
        return response.json();
    }
    static async claim(headers: Headers): Promise<ClaimDailyRewardResponse> {
        const response = await fetch("https://atletaclicker.online/api/v1/daily-reward/claim", {
            "headers": headers,
            "method": "POST",
            "body": JSON.stringify({})
        });
        return response.json();
    }
}
export default DailyRewardService;

export interface ClaimDailyRewardResponse {
    amountClaimed: number
    streak: number
}
export interface CheckDailyRewardResponse {
    canClaim: boolean
    streak: number
    amountToClaim: number
}