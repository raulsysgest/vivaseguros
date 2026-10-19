export interface User {
  id: string | number;
  name: string;
  email: string;
  role?: string;
  avatarUrl?: string;
  createdAt?: string;
  agentProducer?: string;
  isCoordinator?: boolean;
  status?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
