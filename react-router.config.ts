import type { Config } from "@react-router/dev/config";
import "dotenv/config";

export default {
  ssr: true,
  allowedActionOrigins: [
    process.env.COMMUNITY_BASE_URL.replace(/^https?:\/\//, ""),
  ],
  future: {
    v8_trailingSlashAwareDataRequests: true,
  },
} satisfies Config;
