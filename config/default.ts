import "dotenv/config";

export default {
  port: process.env.PORT || 8080,
  application: {
    key: "mJ8e/N+v1nO2ZKyp9RU9V9QHmr0+lSMMZ1+I0byu2RY=",
    secret: "diwedbiwdubidb7387bcwe6c8gb8",
  },
  logLevel: "debug",
  db: {
    connectionString: process.env.DATABASE_URL,
  },
  redis: {
    connectionString: process.env.REDIS_URL || "redis://localhost:6379",
  },
  modules: {
    quickbook: {
      clientId: process.env.QUICKBOOK_CLIENT_ID,
      clientSecret: process.env.QUICKBOOK_CLIENT_SECRET,
      redirectUri: process.env.QUICKBOOK_REDIRECT_URI,
      tokenEndpoint: process.env.QUICKBOOK_TOKEN_ENDPOINT,
      environment: process.env.QUICKBOOK_ENVIRONMENT || "sandbox",
    },

    xero: {
      clientId: process.env.XERO_CLIENT_ID,
      clientSecret: process.env.XERO_CLIENT_SECRET,
      redirectUri: process.env.XERO_REDIRECT_URI,
      tokenEndpoint: process.env.XERO_TOKEN_ENDPOINT,
      environment: process.env.XERO_ENVIRONMENT || "sandbox",
      scopes: [
        "openid",
        "profile",
        "email",
        "accounting.transactions",
        "offline_access",
        "accounting.settings.read",
        "accounting.reports.read",
        "accounting.journals.read",
      ],
    },
  },
};
