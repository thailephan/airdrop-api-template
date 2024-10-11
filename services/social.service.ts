class SocialService {
    static async get(headers: Headers): Promise<GetSocialsResponse> {
        const response = await fetch("https://atletaclicker.online/api/v1/socials", {
            "headers": headers,
            "method": "GET"
        });
        return response.json();
    }
    static async claimTask(headers: Headers, id: string): Promise<SocialsClaimTaskResponse> {
        const response = await fetch("https://atletaclicker.online/api/v1/socials/" + id, {
            "headers": headers,
            "method": "POST",
            "body": JSON.stringify({})
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