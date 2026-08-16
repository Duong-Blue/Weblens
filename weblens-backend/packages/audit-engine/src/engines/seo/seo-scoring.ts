export enum SeoCategory {
  INDEXABILITY = 'Indexability',
  ON_PAGE = 'OnPage',
  CONTENT = 'Content',
  LINKS = 'Links',
  STRUCTURED_DATA = 'StructuredData',
  PAGE_EXPERIENCE = 'PageExperience',
}

export const SEO_CATEGORY_WEIGHTS: Record<SeoCategory, number> = {
  [SeoCategory.INDEXABILITY]: 25,
  [SeoCategory.ON_PAGE]: 25,
  [SeoCategory.CONTENT]: 20,
  [SeoCategory.LINKS]: 10,
  [SeoCategory.STRUCTURED_DATA]: 10,
  [SeoCategory.PAGE_EXPERIENCE]: 10,
};
