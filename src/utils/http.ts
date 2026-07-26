import axios from 'axios';

export const axiosJson = axios.create({
  timeout: 20_000,
  headers: {
    'User-Agent': 'bot-tele',
    Accept: 'application/json',
  },
});
