export const loader = async () => {
  if (process.env.COMMUNITY_BASE_URL.startsWith("https://stage.")) {
    return new Response("User-agent: *\nDisallow: /", {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="robots.txt"`,
      },
    });
  }
  return new Response("Not found", {
    status: 404,
  });
};
