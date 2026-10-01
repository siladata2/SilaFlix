export type UserRole = 'user' | 'moderator' | 'editor' | 'admin' | 'super_admin';

export type ContentType = 'movie' | 'series' | 'episode' | 'reel' | 'recap';

export interface Profile {
  id: string;
  user_id: string;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Movie {
  id: string;
  title: string;
  slug: string;
  synopsis?: string | null;
  poster_url?: string | null;
  backdrop_url?: string | null;
  trailer_url?: string | null;
  video_url?: string | null;
  stream_url?: string | null;
  director?: string | null;
  release_year?: number | null;
  runtime_minutes?: number | null;
  language?: string | null;
  content_rating?: string | null;
  rating_score?: number | null;
  is_featured?: boolean;
  is_published?: boolean;
  status?: string;
  view_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Series {
  id: string;
  title: string;
  slug: string;
  synopsis?: string | null;
  poster_url?: string | null;
  backdrop_url?: string | null;
  trailer_url?: string | null;
  release_year?: number | null;
  language?: string | null;
  content_rating?: string | null;
  is_featured?: boolean;
  is_published?: boolean;
  status?: string;
  created_at: string;
  updated_at: string;
}

export interface Episode {
  id: string;
  series_id: string;
  season_id?: string | null;
  season_number: number;
  episode_number: number;
  title: string;
  synopsis?: string | null;
  thumbnail_url?: string | null;
  video_url?: string | null;
  duration_minutes?: number | null;
  is_published?: boolean;
  created_at: string;
}

export interface Reel {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url?: string | null;
  caption?: string | null;
  description?: string | null;
  views_count?: number;
  likes_count?: number;
  is_published?: boolean;
  created_at: string;
}

export interface Recap {
  id: string;
  title: string;
  slug: string;
  content: string;
  thumbnail_url?: string | null;
  is_published?: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  created_at: string;
}

export interface DownloadOption {
  id: string;
  content_type: ContentType;
  content_id: string;
  quality: string;
  format: string;
  file_size_bytes: number;
  download_url: string;
  authorization_status: string;
  language?: string | null;
  subtitle_language?: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { user_id: string };
        Update: Partial<Profile>;
      };
      movies: {
        Row: Movie;
        Insert: Partial<Movie> & { title: string; slug: string };
        Update: Partial<Movie>;
      };
      series: {
        Row: Series;
        Insert: Partial<Series> & { title: string; slug: string };
        Update: Partial<Series>;
      };
      episodes: {
        Row: Episode;
        Insert: Partial<Episode> & { series_id: string; episode_number: number; title: string };
        Update: Partial<Episode>;
      };
      reels: {
        Row: Reel;
        Insert: Partial<Reel> & { title: string; video_url: string };
        Update: Partial<Reel>;
      };
      recaps: {
        Row: Recap;
        Insert: Partial<Recap> & { title: string; slug: string; content: string };
        Update: Partial<Recap>;
      };
      categories: {
        Row: Category;
        Insert: Partial<Category> & { name: string; slug: string };
        Update: Partial<Category>;
      };
      download_options: {
        Row: {
          id: string;
          content_type: ContentType;
          content_id: string;
          quality: string;
          file_size_bytes: number;
          download_url: string;
          created_at: string;
        };
        Insert: any;
        Update: any;
      };
      reports: {
        Row: {
          id: string;
          content_type: ContentType;
          content_id: string;
          reason: string;
          description?: string | null;
          status: string;
          created_at: string;
        };
        Insert: any;
        Update: any;
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: any;
          created_at: string;
        };
        Insert: any;
        Update: any;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
    };
  };
}
