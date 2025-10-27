import buildApp from "./app";

try {
  const app = buildApp();
  await app.listen({
    port: 3000,
    host: "0.0.0.0"
  });
} catch (err) {
  console.error(err);
  process.exit(1);
}
