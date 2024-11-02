import { Helpers } from "./helpers.ts";

interface InitData {
    user: {
        id?: number,
        first_name?: string,
        last_name?: string,
        username?: string,
        language_code?: string,
        allows_write_to_pm?: boolean,
    }
    chat_instance?: string;
    chat_type?: string;
    auth_date?: number;
    hash?: string;
}
class InitDataExtractor {
    static extract(data: string): InitData {
        const jsonData = Helpers.convertStringToJSON(data);
        return {
            ...(jsonData as any),
            user: JSON.parse(jsonData.user),
        };
    }
}

export type { InitData };
export { InitDataExtractor };