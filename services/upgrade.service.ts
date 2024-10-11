class UpgradeService {
    static async getUpgrades(headers: Headers): Promise<GetUpgradeResponse> {
        const response = await fetch("https://atletaclicker.online/api/v1/upgrades", {
          method: "GET",
          headers: headers
        });
        return await response.json();
    }
    static async upgrade(headers: Headers, id: number): Promise<UpgradeResponse> {
      const response = await fetch("https://atletaclicker.online/api/v1/upgrades/" + id, {
          method: "POST",
          headers: headers,
          body: JSON.stringify({})
      });
      return await response.json();
    }
}

export default UpgradeService;

export interface GetUpgradeResponse {
  data: UpgradeItem[]
}

export interface UpgradeItem {
  id: number
  name: string
  requiredLevel: number
  maxLevel: number
  startingPrice: number
  incrementPrice: number
  incrementGain: number
  startingGain: number
  currentLevel: number
  gain: number
  price: number
  isAbleToBuy: boolean
}

export interface UpgradeResponse {
  data: UpgradeItem[]
}