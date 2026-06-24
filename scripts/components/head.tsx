import { GaSnippet } from "./ga-snippet";

interface HeadProps {
  title: string;
  root: string;
  gaId: string;
  description: string;
  canonical: string;
  ogType: "website" | "article";
  ogUrl: string;
  ogImage?: string;
  jsonLd?: object;
}

export function Head({ title, root, gaId, description, canonical, ogType, ogUrl, ogImage, jsonLd }: HeadProps) {
  return (
    <head>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      {/* 基本SEOメタ */}
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {/* OGP */}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="seriwb apps" />
      <meta property="og:locale" content="ja_JP" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={ogUrl} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      {/* 構造化データ JSON-LD */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;700&family=M+PLUS+1:wght@400;500;700&family=Share+Tech+Mono&display=swap"
      />
      <title>{title}</title>
      <link rel="stylesheet" href={`${root}assets/styles.css`} />
      <link rel="icon" type="image/svg+xml" href={`${root}assets/favicon.svg`} />
      <GaSnippet id={gaId} />
    </head>
  );
}
