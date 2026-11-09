import type { Schema, Struct } from '@strapi/strapi';

export interface ArticleFaqItem extends Struct.ComponentSchema {
  collectionName: 'components_article_faq_items';
  info: {
    description: 'One question and its answer, shown on the article and in its FAQ structured data';
    displayName: 'FAQ item';
  };
  attributes: {
    a: Schema.Attribute.Text & Schema.Attribute.Required;
    q: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'article.faq-item': ArticleFaqItem;
    }
  }
}
