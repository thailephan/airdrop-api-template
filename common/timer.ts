import { Helpers } from "./helpers.ts";

export enum Time {
    MiliSecond = 1,
    SECOND = Time.MiliSecond * 1000,
    MINUTE = Time.SECOND * 60,
    HOUR = Time.MINUTE * 60,
    DAY = Time.HOUR * 24,
}

class Timer {
    static sleep(ms: number) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
    static sleepRandom(minMs: number, maxMs: number) {
        const randomTime = Helpers.generateRandomNumberInRange(minMs, maxMs, { fixed: 2 });
        return { timeMs: randomTime, time: randomTime / 1000, promise: Timer.sleep(randomTime) };
    }
}

export { Timer }