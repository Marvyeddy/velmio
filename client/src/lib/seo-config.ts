const SITE_URL = (
    import.meta.env.VITE_SITE_URL || "http://localhost:5173"
  ).replace(/\/+$/, "");
  
  export const SEO_CONFIG = {
    siteName: "Velmio",
  
    siteUrl: SITE_URL,
  
    title: "Velmio - Your Intelligent AI Assistant",
  
    description:
      "Chat with AI, analyze your documents, search the web, and experience personalized conversations with Velmio.",
  
    image: `${SITE_URL}/og-image.png`,
  
    locale: "en_US",
  };