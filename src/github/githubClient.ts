import axios, { type AxiosInstance } from 'axios';

export const createGitHubClient = (token: string): AxiosInstance =>
  axios.create({
    baseURL: 'https://api.github.com',
    timeout: 30_000,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'bot-tele',
    },
  });
