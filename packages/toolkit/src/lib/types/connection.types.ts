export type ConnectionData = {
  accessToken?: string | null;
  refreshToken?: string | null;
  apiKey?: string | null;
  username?: string | null;
  password?: string | null;
  publicKey?: string | null;
  privateKey?: string | null;
  database?: string | null;
  host?: string | null;
  port?: number | null;
  metadata?: any | null;
};

export type ConnectionType = 'oauth2' | 'basic' | 'apiKey' | 'keyPair' | 'database';
