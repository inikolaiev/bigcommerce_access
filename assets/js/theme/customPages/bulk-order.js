import PageManager from '../page-manager';
import utils from '@bigcommerce/stencil-utils';

export default class BulkOrder extends PageManager {
    onReady() {
        this.renderProducts();
    }
    addToCart() {
        const addToCartButton = $('#add-bulk-cart');
        addToCartButton.on('click', () => {
            const inputs = $('#bulk-products input');
            const urls = [];

            inputs.each(function () {
                urls.push(`/cart.php?action=add&sku=${this.name}&qty=${this.value}`);
            });

            const send = url =>
                new Promise(resolve => resolve($.get(url)));

            for (let i = 0, p = Promise.resolve(); i < urls.length; i++) {
                p = p.then(() => send(urls[i])
                    .then(() => this.updateCartContent()));
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
                totalPrice.innerText = `$${total}`;
            });
        }
    }
    getProductsSKu() {
        if (!this.context.customer_group_name.length) return null;

        const customerGroup = this.context.customer_group_name
            .split(' ')
            .join('-');
        const productsString = $(`#page-content .${customerGroup}`)
            .text();

        return !productsString.length ?
            null :
            productsString.split(',').map(item => item);
    }
    fetchProductsAllProducts() {
        return fetch('/graphql', {
            method: 'POST',
            credentials: 'same-origin',
            // eslint-disable-next-line no-undef
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bearerToken}` },
            body: JSON.stringify({
                query: ` query ExtendedProductsById {
                        site {
                            products(first: 49) {
                               edges {
                                   node {
                                       name
                                       sku
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
        if (!this.getProductsSKu()) {
            return this.createProductTemplate(null);
        }

        const requiredProducts = [...this.getProductsSKu()];
        this.fetchProductsAllProducts().then(products => {
            products
                .filter(product => requiredProducts
                    .includes(product.node.sku))
                .map(product => this.createProductTemplate(product));
        }).then(() => {
            this.updateTotal();
            this.addToCart();
        });
    }
    createProductTemplate(product) {
        const products = document.getElementById('bulk-products');
        const productWrapper = document.createElement('div');
        const title = document.createElement('h3');
        const description = document.createElement('p');
        const price = document.createElement('span');
        const quantityInput = document.createElement('input');
        const image = document.createElement('img');
        if (product) {
            image.src = product.node.images.edges[0].node.urlOriginal;
            quantityInput.type = 'number';
            quantityInput.name = product.node.sku;
            quantityInput.placeholder = 'qty';
            quantityInput.min = '0';
            quantityInput.value = '0';
            productWrapper.classList.add('bulk-product');
            title.innerText = product.node.name;
            description.innerHTML = product.node.description.slice(0, 200);
            description.classList.add('bulk-product__description');
            price.classList.add('price');
            price.innerText = product.node.prices.basePrice.value;
            productWrapper.append(title, image, description, price, quantityInput);
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
