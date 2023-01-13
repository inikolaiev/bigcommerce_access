import PageManager from '../page-manager';
import utils from '@bigcommerce/stencil-utils';
import csv from 'jquery-csv';

export default class BulkOrder extends PageManager {
    onReady() {
        this.renderProducts();
    }
    isLoading(isLoading) {
        const wrapper = document.getElementById('bulk-wrapper');
        if (isLoading) {
            wrapper.classList.add('load');
        } else {
            wrapper.classList.remove('load');
        }
    }
    addToCart() {
        const addToCartButton = $('#add-bulk-cart');
        addToCartButton.on('click', () => {
            const inputs = $('#bulk-products input');
            const urls = [];

            inputs.each(function () {
                if (this.value > 0) urls.push(`/cart.php?action=add&sku=${this.name}&qty=${this.value}`);
            });

            const send = url =>
                new Promise(resolve => resolve(fetch(url)));

            for (let i = 0, p = Promise.resolve(); i < urls.length; i++) {
                p = p.then(() => send(urls[i])
                    .then(() => this.updateCartContent()).catch(e => {
                        console.log(e);
                    }));
            }
        });
    }
    updateTotal() {
        const wrapper = document.getElementById('bulk-products');
        const inputs = wrapper.getElementsByTagName('input');
        const prices = wrapper.querySelectorAll('.price');
        const totalPrice = document.getElementById('priceTotal');

        for (let index = 0; index < inputs.length; index++) {
            inputs[index].addEventListener('change', () => {
                let total = 0;
                for (let i = 0; i < inputs.length; i++) {
                    total += prices[i].innerText * inputs[i].value;
                }
                totalPrice.innerText = `$${total.toFixed(2)}`;
            });
        }
    }
    getProductsSKu() {
        if (!this.context.customer_group_name.length) return null;
        const customerGroup = this.context.customer_group_name
            .toLowerCase()
            .split(' ')
            .join('-');

        return fetch(`https://store-q6toa31zw.mybigcommerce.com/content/${customerGroup.charAt(0).toUpperCase() + customerGroup.slice(1)}.csv`)
            .then((csvAsString) => csvAsString.text())
            .then(data => csv.toArrays(data))
            .then(productArray => {
                if (productArray.length > 0) {
                    return productArray.filter((product, index) => index !== 0);
                }
                return null;
            })
            .catch(() => null);
    }
    fetchProductsAllProducts() {
        return fetch('/graphql', {
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
                                       }
                                       description
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
    }
    renderProducts() {
        this.isLoading(true);
        this.getProductsSKu().then((data => {
            if (!data || !data.length) return this.createProductTemplate(null);
            const requiredProducts = [...data];

            this.fetchProductsAllProducts().then(products => {
                const fitProducts = products
                    .filter(product => requiredProducts
                        .map(record => record[0])
                        .includes(product.node.sku));

                requiredProducts.forEach(record => {
                    const [sku, customImageUrl] = record;
                    fitProducts.forEach((fitProduct, fitProductIndex) => {
                        if (fitProduct.node.sku === sku) {
                            fitProducts[fitProductIndex].customImageUrl = customImageUrl;
                        }
                    });
                });
                this.isLoading(false);
                fitProducts.map(product => this.createProductTemplate(product));
            }).then(() => {
                this.updateTotal();
                this.addToCart();
            }).finally(() => {
                this.isLoading(false);
            });
        }));
    }
    createProductTemplate(product) {
        console.log(product.customImageUrl);
        const products = document.getElementById('bulk-products');
        const productWrapper = document.createElement('div');
        const title = document.createElement('h3');
        const description = document.createElement('p');
        const price = document.createElement('span');
        const quantityInput = document.createElement('input');
        const image = document.createElement('img');
        const imageCSVWrapper = document.createElement('a');
        const imageCSV = document.createElement('img');
        const itemsInStock = document.createElement('span');
        if (product) {
            imageCSVWrapper.href = product.customImageUrl;
            imageCSVWrapper.target = '_blank';
            imageCSV.src = product.customImageUrl;
            imageCSVWrapper.append(imageCSV);
            image.src = product.node.images.edges[0].node?.urlOriginal;
            quantityInput.type = 'number';
            quantityInput.name = product.node.sku;
            quantityInput.placeholder = 'qty';
            quantityInput.min = '0';
            quantityInput.max = product.node.inventory.aggregated?.availableToSell;
            itemsInStock.innerText = `In stock:${product.node.inventory.aggregated?.availableToSell || 'no track'}`;
            quantityInput.step = '1';
            quantityInput.oninput = function () {
                this.value = Math.round(this.value);
                if (this.value > Number(this.max)) {
                    this.value = this.max;
                }
            };
            quantityInput.value = '0';
            productWrapper.classList.add('bulk-product');
            title.innerText = product.node.name;
            description.innerHTML = product.node.description.slice(0, 200);
            description.classList.add('bulk-product__description');
            price.classList.add('price');
            price.innerText = product.node.prices.basePrice.value;
            productWrapper.append(title, image, imageCSVWrapper, description, price, quantityInput, itemsInStock);
        } else {
            productWrapper.classList.add('bulk-product');
            productWrapper.innerText = 'Sorry, there are no products for you';
            document.getElementById('bulk-total').style.display = 'none';
        }
        products.append(productWrapper);
    }

    updateCartContent() {
        const cartQtyPromise = new Promise((resolve, reject) => {
            utils.api.cart.getCartQuantity({ baseUrl: this.context.secureBaseUrl, cartId: this.context.cartId }, (err, qty) => {
                if (err) {
                    if (err === 'Not Found') {
                        resolve(0);
                    } else {
                        reject(err);
                    }
                }
                resolve(qty);
            });
        });
        cartQtyPromise.then(qty => {
            $('body').trigger('cart-quantity-update', qty);
        });
    }
}
