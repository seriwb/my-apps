export interface AssetPatterns {
  mac?: string;
  win?: string;
  linux?: string;
}

export interface AppNotes {
  mac?: string;
  win?: string;
  linux?: string;
}

export interface AppDef {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  screenshots: string[];
  features: string[];
  platforms: string[];
  release_tag_prefix: string;
  asset_patterns: AssetPatterns;
  notes?: AppNotes;
}

export interface AppEntry {
  id: string;
}

export interface SiteConfig {
  owner: string;
  repo: string;
  apps: AppEntry[];
}

export interface ReleaseAsset {
  name: string;
  browser_download_url: string;
}

export interface Release {
  tag_name: string;
  name: string | null;
  body: string | null;
  published_at: string;
  assets: ReleaseAsset[];
}

export interface ResolvedReleaseNote {
  tag: string;
  version: string;
  publishedAt: string;
  name: string | null;
  body: string;
}

export interface ResolvedApp {
  def: AppDef;
  version: string;
  publishedAt: string | null;
  downloadUrls: Record<string, string>;
  releases: ResolvedReleaseNote[];
}
