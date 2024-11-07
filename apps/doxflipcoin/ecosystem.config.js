module.exports = {
  apps: [
    {
      name: "doxflipcoin",
      time: true,
      script: "./main.ts",
      interpreter: "deno",
      auto_restart: false,
      interpreterArgs: "run --allow-net --unstable",
      out_file: "/dev/null",
      error_file: "/dev/null",
    },
  ]
};