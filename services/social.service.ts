class SocialService {
    static async get(headers: Headers, client: Deno.HttpClient): Promise<GetSocialsResponse> {
        const response = await fetch("https://atletaclicker.online/api/v1/socials", {
            "headers": headers,
            "method": "GET",
            client,
        });
        return response.json();
    }
    static async claimTask(headers: Headers, client: Deno.HttpClient, id: string): Promise<SocialsClaimTaskResponse> {
        const response = await fetch("https://atletaclicker.online/api/v1/socials/" + id, {
            "headers": headers,
            "method": "POST",
            "body": JSON.stringify({}),
            client,
        });
        return response.json();
    }
}
export default SocialService;


export interface GetSocialsResponse {
  data: SocialItem[]
}

export interface SocialItem {
  _id: string
  id: number
  name: string
  reward: number
  url: string
  sort: number
  background?: string
  logo?: string
  isPartner?: boolean
  completedTimestamp: number | null;
  isTelegramLink?: boolean
  ru?: string
  en?: string
}


export interface SocialsClaimTaskResponse {
    data: {
        success: boolean
    }
}