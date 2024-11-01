async function main() {
    let count = 0;
    let currentPoint = 550;

    const headers = new Headers();
    setInterval(async () => {
        count++;
        const response = await fetch("https://telegram.miners.club/prod-api/api/telegram/updateTelegramInfo?depletePower=550&points=4624", {
            headers
        })
        console.log(count, response);
    }, 1000);
}

main();