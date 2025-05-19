interface QuickbookConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  tokenEndpoint: string;
  environment: "sandbox" | "production";
}
