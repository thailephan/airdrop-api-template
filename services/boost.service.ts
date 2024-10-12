class BoostService {
    static async get(headers: Headers, client: Deno.HttpClient): Promise<GetBoostsResponse> {
        const response = await fetch("https://atletaclicker.online/api/v1/boosts", {
          method: "GET",
          headers: headers,
          client: client,
        });
        return await response.json();
    }
    static async activateBoost(headers: Headers, client: Deno.HttpClient, id: string): Promise<ActivateBoostResponse> {
        const response = await fetch("https://atletaclicker.online/api/v1/boosts/activate/" + id, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({}),
            client: client,
        });
        return await response.json();
    }
}

export default BoostService;

export interface GetBoostsResponse {
  data: BoostItem[]
}

export interface BoostItem {
  _id: string
  id: number
  name: string
  boostTime: number
  boostAmount: number
  startedTimestamp: number | undefined
  endTimestamp: number | undefined
}


export interface ActivateBoostResponse {
  data: {
    success: boolean
    hash: string
  }
  statusCode?: number;
  message?: string;
  success: boolean;
}