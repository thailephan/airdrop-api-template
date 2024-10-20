module.exports = {
  apps: [
    {
      name: "dormint",
      time: true,
      script: "./main.ts",
      interpreter: "deno",
      auto_restart: false,
      interpreterArgs: "run --allow-net --unstable",
    },
  ]
};
