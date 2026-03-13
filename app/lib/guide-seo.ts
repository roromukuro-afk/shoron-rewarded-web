import type { Metadata } from "next";

export const SITE_NAME = "小論設計室";
export const SITE_URL = "https://shoron-rewarded-web.vercel.app";
export const DEFAULT_AUTHOR = "佐藤 慶音";

type GuideSeoInput = {
  title: string;
  description: string;
  path: string;
  keywords: string[];
  publishedTime?: string;
  modifiedTime?: string;
};

export function buildGuideMetadata({
  title,
  description,
  path,
  keywords,
  publishedTime,
  modifiedTime,
}: GuideSeoInput): Metadata {
  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: path,
    },
    authors: [{ name: DEFAULT_AUTHOR }],
    openGraph: {
      type: "article",
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: "ja_JP",
      publishedTime,
      modifiedTime,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export function buildGuideJsonLd({
  title,
  description,
  path,
  keywords,
  publishedTime = "2026-03-14T00:00:00+09:00",
  modifiedTime = "2026-03-14T00:00:00+09:00",
}: GuideSeoInput) {
  const fullUrl = `${SITE_URL}${path}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: title,
        description,
        inLanguage: "ja",
        mainEntityOfPage: fullUrl,
        url: fullUrl,
        isAccessibleForFree: true,
        articleSection: "学習ガイド",
        keywords,
        datePublished: publishedTime,
        dateModified: modifiedTime,
        author: {
          "@type": "Person",
          name: DEFAULT_AUTHOR,
        },
        publisher: {
          "@type": "Organization",
          name: SITE_NAME,
          url: SITE_URL,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "ホーム",
            item: `${SITE_URL}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "学習ガイド",
            item: `${SITE_URL}/guide`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: title,
            item: fullUrl,
          },
        ],
      },
    ],
  };
}