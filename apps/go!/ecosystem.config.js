module.exports = {
  apps: [
    {
      name: "go",
      time: true,
      script: "./main.ts",
      interpreter: "deno",
      interpreterArgs: "run --allow-net --unstable",
    },
  ]
};
