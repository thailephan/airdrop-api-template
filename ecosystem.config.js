module.exports = {
  apps: [
    {
      name: "cryptorank",
      time: true,
      script: "./main.ts",
      interpreter: "deno",
      interpreterArgs: "run --allow-net --unstable",
    },
  ]
};
