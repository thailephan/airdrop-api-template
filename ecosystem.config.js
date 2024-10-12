module.exports = {
  apps: [
    {
      name: "rich-teddy",
      time: true,
      script: "./main.ts",
      interpreter: "deno",
      interpreterArgs: "run --allow-net",
    },
  ]
};
