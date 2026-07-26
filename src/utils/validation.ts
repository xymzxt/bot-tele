import { z } from 'zod';

export const repositoryNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[A-Za-z0-9_.-]+$/, 'Repository name can only contain letters, numbers, dot, dash, and underscore');

export const githubPatSchema = z
  .string()
  .trim()
  .min(20, 'GitHub token is too short')
  .max(255, 'GitHub token is too long');

export const urlSchema = z.string().trim().url('URL tidak valid. Contoh: https://example.com');
