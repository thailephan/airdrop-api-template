module.exports = {
  apps: [
    {
      name: "atleta",
      time: true,
      script: "./main.ts",
      interpreter: "deno",
      interpreterArgs: "run --allow-net --unstable",
    },
  ]
};
