import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { CredentialsSignin } from "next-auth";
import axios, { isAxiosError } from "axios";

class AgentAuthError extends CredentialsSignin {
  constructor(message: string) {
    super();
    this.code = message;
  }
}

interface AgentLoginResponse {
  msg: string;
  token?: string;
  ID?: number;
  name?: string;
  agent_producer?: string;
  status?: string;
  is_coordinator?: boolean;
  error?: string;
}

const backendBaseUrl = () =>
  process.env.BACKEND_API_URL || "http://localhost:8000/api";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === "production",
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email ou Username", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim();
        const password = credentials?.password?.toString();

        if (!email || !password) {
          throw new AgentAuthError("E-mail e senha são obrigatórios");
        }

        try {
          const { data } = await axios.post<AgentLoginResponse>(
            `${backendBaseUrl()}/agents/login`,
            { email, password },
            {
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "X-Requested-With": "XMLHttpRequest",
              },
              timeout: 30000,
            },
          );

          if (data.msg === "logado" && data.token && data.ID != null) {
            return {
              id: String(data.ID),
              name: data.name ?? "Agente",
              agentProducer: data.agent_producer ?? "",
              status: data.status ?? "",
              isCoordinator: Boolean(data.is_coordinator),
              accessToken: data.token,
            };
          }

          throw new AgentAuthError(data.error ?? "Credenciais inválidas");
        } catch (error) {
          if (error instanceof AgentAuthError) {
            throw error;
          }
          if (isAxiosError(error) && error.response?.data) {
            const body = error.response.data as AgentLoginResponse;
            throw new AgentAuthError(body.error ?? "Credenciais inválidas");
          }
          throw new AgentAuthError(
            "Não foi possível contactar o servidor. Tente novamente.",
          );
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.id = user.id;
        token.agentProducer = user.agentProducer;
        token.isCoordinator = user.isCoordinator;
        token.status = user.status;
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? token.sub ?? "";
        session.user.name = (token.name as string) ?? session.user.name;
        session.user.agentProducer = token.agentProducer as string | undefined;
        session.user.isCoordinator = token.isCoordinator as boolean | undefined;
        session.user.status = token.status as string | undefined;
      }
      return session;
    },
  },
  events: {
    async signOut(message) {
      if (!("token" in message) || !message.token?.accessToken) {
        return;
      }
      try {
        await axios.post(
          `${backendBaseUrl()}/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${message.token.accessToken as string}`,
              Accept: "application/json",
              "X-Requested-With": "XMLHttpRequest",
            },
          },
        );
      } catch {
        // Token may already be revoked or expired
      }
    },
  },
});
