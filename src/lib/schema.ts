const SITE_URL = 'https://phogotarot.com';
const SITE_NAME = 'Phở Gõ Tarot';
const LOGO_URL = `${SITE_URL}/images/logo.png`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const ORGANIZATION_ID = `${SITE_URL}/#organization`;

type BreadcrumbItem = {
  name: string;
  url: string;
};

type FAQItem = {
  question: string;
  answer: string;
};

type ArticleInput = {
  url: string;
  title: string;
  description?: string;
  image?: string;
  keywords?: string;
  datePublished?: string;
  dateModified?: string;
  type?: 'Article' | 'BlogPosting';
};

export function absoluteUrl(pathOrUrl: string | URL, site = SITE_URL) {
  return new URL(pathOrUrl, site).href;
}

export function imageUrl(image: unknown, site = SITE_URL) {
  if (!image) return undefined;
  if (typeof image === 'string') return absoluteUrl(image, site);
  if (typeof image === 'object' && 'src' in image && typeof image.src === 'string') {
    return absoluteUrl(image.src, site);
  }
  return undefined;
}

export function organizationSchema() {
  return {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: SITE_NAME,
    alternateName: ['Pho Go Tarot', 'Tiệm Phở Gõ Tarot'],
    url: `${SITE_URL}/`,
    logo: {
      '@type': 'ImageObject',
      url: LOGO_URL,
      width: 112,
      height: 112
    },
    sameAs: [
      'https://www.facebook.com/phogotarot',
      'https://www.tiktok.com/@phogo_tarot',
      'https://www.instagram.com/pho_go_tarot/',
      'https://www.youtube.com/@phogotarot'
    ]
  };
}

export function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: SITE_NAME,
    publisher: {
      '@id': ORGANIZATION_ID
    },
    inLanguage: 'vi-VN'
  };
}

export function webPageSchema({
  url,
  name,
  description,
  type = 'WebPage',
  extra = {}
}: {
  url: string;
  name: string;
  description?: string;
  type?: string;
  extra?: Record<string, unknown>;
}) {
  return {
    '@type': type,
    '@id': `${url}#webpage`,
    url,
    name,
    ...(description && { description }),
    isPartOf: {
      '@id': WEBSITE_ID
    },
    publisher: {
      '@id': ORGANIZATION_ID
    },
    inLanguage: 'vi-VN',
    ...extra
  };
}

export function webApplicationSchema({ url, name, description }: { url: string; name: string; description?: string }) {
  return {
    '@type': 'WebApplication',
    '@id': `${url}#app`,
    name,
    url,
    ...(description && { description }),
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Any',
    isAccessibleForFree: true,
    publisher: {
      '@id': ORGANIZATION_ID
    },
    inLanguage: 'vi-VN'
  };
}

export function breadcrumbListSchema(url: string, items: BreadcrumbItem[]) {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${url}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url)
    }))
  };
}

export function faqPageSchema(url: string, items: FAQItem[]) {
  return {
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  };
}

export function articleSchema(input: ArticleInput) {
  return {
    '@type': input.type || 'Article',
    '@id': `${input.url}#article`,
    headline: input.title,
    url: input.url,
    mainEntityOfPage: {
      '@id': `${input.url}#webpage`
    },
    ...(input.description && { description: input.description }),
    ...(input.image && { image: input.image }),
    ...(input.keywords && { keywords: input.keywords }),
    ...(input.datePublished && { datePublished: input.datePublished }),
    ...(input.dateModified && { dateModified: input.dateModified }),
    author: {
      '@id': ORGANIZATION_ID
    },
    publisher: {
      '@id': ORGANIZATION_ID
    },
    inLanguage: 'vi-VN'
  };
}

export function itemListSchema(items: Array<{ name: string; url: string; image?: string; type?: string }>) {
  return {
    '@type': 'ItemList',
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': item.type || 'Article',
        name: item.name,
        url: item.url,
        ...(item.image && { image: item.image })
      }
    }))
  };
}

export function graphSchema(nodes: unknown[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': [organizationSchema(), websiteSchema(), ...nodes]
  };
}
