class MiningService {
    static async claimMining(headers: Headers, client: Deno.HttpClient): Promise<ClaimMiningResponse> {
        const response = await fetch("https://atletaclicker.online/api/v1/mining/claim", {
            "headers": headers,
            "method": "POST",
            client,
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