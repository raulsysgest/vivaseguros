import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      agentProducer?: string;
      isCoordinator?: boolean;
      status?: string;
    } & DefaultSession["user"];
  }

  interface User {
    accessToken?: string;
    agentProducer?: string;
    isCoordinator?: boolean;
    status?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    id?: string;
    agentProducer?: string;
    isCoordinator?: boolean;
    status?: string;
  }
}
