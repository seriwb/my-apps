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
      <title>{title}</title>
      <link rel="stylesheet" href={`${root}assets/styles.css`} />
      <link rel="icon" type="image/png" href={`${root}assets/icons/picture-converter.png`} />
      <GaSnippet id={gaId} />
    </head>
  );
}
