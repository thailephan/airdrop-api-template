module.exports = {
  apps: [
    {
      name: "kafirchain",
      time: true,
      script: "./main.ts",
      interpreter: "deno",
      auto_restart: false,
      interpreterArgs: "run --allow-read --allow-env --allow-net --unstable",
      out_file: "/dev/null",
      error_file: "/dev/null",
    },
  ]
};
