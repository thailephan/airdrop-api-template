module.exports = {
  apps: [
    {
      name: "depin-alliance",
      time: true,
      script: "./main.ts",
      interpreter: "deno",
      interpreterArgs: "run --allow-net --unstable",
    },
  ]
};
