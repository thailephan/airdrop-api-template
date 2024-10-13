module.exports = {
  apps: [
    {
      name: "gumart",
      time: true,
      script: "./main.ts",
      interpreter: "deno",
      interpreterArgs: "run --allow-net --unstable",
    },
  ]
};
