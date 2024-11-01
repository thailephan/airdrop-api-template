module.exports = {
  apps: [
    {
      name: "fatso",
      time: true,
      script: "./main.ts",
      interpreter: "deno",
      auto_restart: false,
      interpreterArgs: "run --allow-net --unstable",
    },
  ]
};
