import { GaSnippet } from "./ga-snippet";

interface HeadProps {
  title: string;
  root: string;
  gaId: string;
}

export function Head({ title, root, gaId }: HeadProps) {
  return (
    <head>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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
