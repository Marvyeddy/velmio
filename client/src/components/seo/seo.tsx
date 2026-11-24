import { SEO_CONFIG } from "@/lib/seo-config";

type SEOProps = {
  title?: string;
  description?: string;
  noIndex?: boolean;
  canonical?: string;
  image?: string;
};

export function SEO({
  title,
  description = SEO_CONFIG.description,
  noIndex,
  canonical,
  image = SEO_CONFIG.image,
}: SEOProps) {
  const pageTitle = title
    ? `${title} | ${SEO_CONFIG.siteName}`
    : SEO_CONFIG.title;

  return (
    <>
      {/* Primary metadata */}
      <title>{pageTitle}</title>

      <meta name="description" content={description} />

      {noIndex !== undefined && (
        <meta
          name="robots"
          content={noIndex ? "noindex, nofollow" : "index, follow"}
        />
      )}

      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph */}
      <meta property="og:type" content="website" />

      <meta property="og:site_name" content={SEO_CONFIG.siteName} />

      <meta property="og:locale" content={SEO_CONFIG.locale} />

      <meta property="og:title" content={pageTitle} />

      <meta property="og:description" content={description} />

      <meta property="og:image" content={image} />

      <meta property="og:image:alt" content="Velmio AI Assistant" />

      {image === SEO_CONFIG.image && (
        <>
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
        </>
      )}

      {canonical && <meta property="og:url" content={canonical} />}

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />

      <meta name="twitter:title" content={pageTitle} />

      <meta name="twitter:description" content={description} />

      <meta name="twitter:image" content={image} />

      <meta name="twitter:image:alt" content="Velmio AI Assistant" />
    </>
  );
}
