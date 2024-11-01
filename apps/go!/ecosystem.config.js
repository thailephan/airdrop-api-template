module.exports = {
  apps: [
    {
      name: "go",
      time: true,
      script: "./main.ts",
      interpreter: "deno",
      interpreterArgs: "run --allow-net --unstable",
      out_file: "/dev/null",
      error_file: "/dev/null",
    },
  ]
};
