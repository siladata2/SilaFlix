// Zod schemas shared by API route handlers (server-side) and admin forms
// (client-side pre-check). Server-side validation is the one that matters —
// the client-side use is only for fast user feedback.
import { z } from 'zod';

export const movieInputSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'lowercase letters, numbers, hyphens only'),
  synopsis: z.string().max(4000).optional(),
  poster_url: z.string().url().optional().or(z.literal('')),
  backdrop_url: z.string().url().optional().or(z.literal('')),
  trailer_url: z.string().url().optional().or(z.literal('')),
  director: z.string().max(200).optional(),
  release_year: z.number().int().min(1888).max(2100).optional(),
  runtime_minutes: z.number().int().positive().optional(),
  language: z.string().max(50).optional(),
  content_rating: z.string().max(20).optional(),
  is_featured: z.boolean().optional(),
  is_published: z.boolean().optional(),
});

export const contactFormSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  subject: z.string().min(1).max(200),
  category: z.enum(['general', 'technical', 'account', 'copyright']).default('general'),
  message: z.string().min(10).max(5000),
  // Honeypot field — real users never fill this in. Reject silently if set.
  website: z.string().optional(),
});

export const reportSchema = z.object({
  content_type: z.enum(['movie', 'series', 'episode', 'reel', 'recap']),
  content_id: z.string().uuid(),
  reason: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
});

export const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8, 'At least 8 characters'),
    confirmPassword: z.string(),
    displayName: z.string().min(1).max(80),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
