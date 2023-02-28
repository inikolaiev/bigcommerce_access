import PageManager from './page-manager';

export default class Brands extends PageManager {
    constructor() {
        super();
        this.firstBlogLetter = new URLSearchParams(window.location.search).get('starting').toLowerCase() || null;
    }
    onReady() {
        this.renderBrands();
    }

    isLoading(isLoading) {
        const wrapper = document.getElementById('brandPage');
        if (isLoading) {
            wrapper.classList.add('load');
        } else {
            wrapper.classList.remove('load');
        }
    }

    getAllBrands() {
        return fetch('/graphql', {
            method: 'POST',
            credentials: 'same-origin',
            // eslint-disable-next-line no-undef
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bearerToken}` },
            body: JSON.stringify({
                query: ` query BrandsQuery {
                            site {
                                brands{
                                   edges {
                                       node {
                                            name
                                            seo {
                                                metaDescription
                                            }
                                            defaultImage {
                                                url(width: 150)
                                            }
                                            id
                                            path
                                       }
                                   }
                                }
                            }
                        }`,
            }),
        })
            .then(response => response.json())
            .then(result => result.data.site.brands.edges)
            .catch(error => console.log('error', error));
    }

    brandTemplate(brand) {
        return `
            <li class="brand">
                <article class="card">
                    <figure class="card-figure">
                        <a class="card-figure__link" aria-label="${brand.node.name}" href="${brand.node.path}">
                            <img style="width: 100%;" src="${brand.node.defaultImage?.url || 'https://placehold.jp/300x300.png'}" alt="brand image">
                        </a>
                    </figure>
                    <div class="card-body">
                        <h3 class="card-title">
                            <a href="{{url}}">${brand.node.name}</a>
                        </h3>
                    </div>
                </article>
            </li>
        `;
    }

    renderBrands() {
        const $brandsWrapper = $('#brandsRendering');
        this.isLoading(true);

        this.getAllBrands().then((data) => {
            const fittedBrands = data.filter(brand => !this.firstBlogLetter || brand.node.name.at(0).toLowerCase() === this.firstBlogLetter);

            if (!fittedBrands.length) {
                $brandsWrapper.append($.parseHTML(`<li style="font-size: 20px">No brands with the first letter '${this.firstBlogLetter}'</li>`));
                return null;
            }

            fittedBrands.forEach(brand => {
                $brandsWrapper.append($.parseHTML(this.brandTemplate(brand)));
            });
        }).then(() => {
            this.isLoading(false);
        });
    }
}
