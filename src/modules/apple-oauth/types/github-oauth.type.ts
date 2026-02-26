export interface GithubAccessTokenResponse {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
  error_uri?: string;
}

export interface GithubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  email: string | null;
}

export interface GithubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
}
