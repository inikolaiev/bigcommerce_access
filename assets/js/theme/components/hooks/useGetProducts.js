// eslint-disable-next-line no-unused-vars,import/no-extraneous-dependencies
import React from 'react';

export default async function seGetProducts() {
    const products = await fetch('/graphql', {
        method: 'POST',
        credentials: 'same-origin',
        // eslint-disable-next-line no-undef
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bearerToken}` },
        body: JSON.stringify({
            query: ` query ExtendedProducts {
                        site {
                            products(first: 49) {
                               edges {
                                   node {
                                       name
                                       id
                                       sku
                                       inventory {
                                           hasVariantInventory
                                           isInStock
                                           aggregated {
                                               availableToSell
                                               warningLevel
                                           }
                                       }
                                       images {
                                            edges {
                                                node {
                                                    urlOriginal
                                                }
                                            }
                                       }
                                       prices {
                                            basePrice {
                                                value
                                                currencyCode
                                            }
                                            salePrice {
                                                value
                                                currencyCode
                                            }
                                       }
                                       description
                                       path
                                       customFields{
                                          edges {
                                            node {
                                              name
                                              value
                                            }
                                          }
                                        }
                                   }
                               }
                            }
                        }
                    }`,
        }),
    })
        .then(response => response.json())
        .then(result => result.data.site.products.edges)
        .catch(error => console.log('error', error));

    return products;
}
