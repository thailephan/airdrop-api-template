const Helpers = {
    convertStringToJSON: (str: string) => {
        // Split the string into key-value pairs
        const pairs = str.split('&');

        // Create an object to store the parsed JSON data
        const jsonData = {} as Record<string, string>;

        // Iterate over the pairs and parse them
        pairs.forEach(pair => {
            const [key, value] = pair.split('=');
            jsonData[key] = decodeURIComponent(value);
        });

        return jsonData;
    },
    generateRandomNumberInRange(min: number = 0, max: number = 1, options: { fixed: number } = { fixed: 0 }) {
        const value = Math.random() * (max - min) + min;
        if (options.fixed === 0) {
            return Math.round(value);
        }
        return parseFloat(value.toFixed(options.fixed));
    }
}

export { Helpers };