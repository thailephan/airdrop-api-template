class MiningService {
    static async claimMining(headers: Headers): Promise<ClaimMiningResponse> {
        const response = await fetch("https://atletaclicker.online/api/v1/mining/claim", {
            "headers": headers,
            "method": "POST"
        });
        return response.json();
    }
}
export default MiningService;

export interface ClaimMiningResponse {
    points: number
    xp: number
    timeCap: number
    level: number
    lastClaimedAt: number
    miningStartedAt: number
}