import 'focus-within-polyfill';

import './global/jquery-migrate';
import './common/select-option-plugin';
import PageManager from './page-manager';
import quickSearch from './global/quick-search';
import currencySelector from './global/currency-selector';
import mobileMenuToggle from './global/mobile-menu-toggle';
import menu from './global/menu';
import foundation from './global/foundation';
import quickView from './global/quick-view';
import cartPreview from './global/cart-preview';
import privacyCookieNotification from './global/cookieNotification';
import carousel from './common/carousel';
import svgInjector from './global/svg-injector';
import axios from 'axios';

export default class Global extends PageManager {
    onReady() {
        const { cartId, secureBaseUrl } = this.context;
        cartPreview(secureBaseUrl, cartId);
        quickSearch();
        currencySelector(cartId);
        foundation($(document));
        quickView(this.context);
        carousel(this.context);
        menu();
        mobileMenuToggle();
        privacyCookieNotification();
        svgInjector();
        this.brandsMenuInit();
        this.registerPopupLoad();
        this.gatOrderStatus();
        $('.slider-discount').slick({
            dots: false,
            infinite: true,
            slidesToShow: 4,
            slidesToScroll: 4,
            responsive: [
                {
                    breakpoint: 800,
                    settings: {
                        slidesToShow: 2,
                        slidesToScroll: 2,
                    },
                },
            ],
        });

        if ($('.video-slider').length) {
            $('.video-slider .slide').slick({
                dots: true,
                infinite: true,
                slidesToShow: 1,
                slidesToScroll: 1,
                autoplay: true,
                autoplaySpeed: 5000,
            });
        }
    }

    registerPopupLoad() {
        if (localStorage.getItem('newAccount') === 'true' && this.context.template === 'pages/home') {
            $('#register-modal').show();
            setTimeout(() => {
                $('#register-modal').hide();
                localStorage.setItem('newAccount', 'false');
            }, 3000);
        }
    }

    brandsMenuInit() {
        const $brandsWrapper = $('#brands-menu');
        const alphabets = new Array(26).fill(1).map((_, i) => String.fromCharCode(97 + i));
        const brandLink = brandLetter =>
            ` <li class="navPage-subMenu-item">
                <a class="navPage-subMenu-action navPages-action"
                   href="/brands?starting=${brandLetter}"
                >
                    ${brandLetter.toUpperCase()}
                </a>
             </li>`;

        for (const brand of alphabets) {
            $brandsWrapper.append($.parseHTML(brandLink(brand)));
        }
    }

    async gatOrderStatus() {
        if (!this.context.customerID) return;

        const config = {
            method: 'get',
            url: `http://localhost:4000/orders?customer=${this.context.customerID}`,
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        };

        const response = await axios(config);
        let incompletedOrders = 0;
        response.data.forEach(order => {
            if (order.status !== 'Completed' && order.status !== 'Shipped') {
                incompletedOrders++;
            }
        });
        console.log(response.data)
        if (incompletedOrders === 0) {
            $('#orderStatus').text('All of your orders were completed');
        } else {
            $('#orderStatus').text(`You have ${incompletedOrders} incomplete orders`);
        }
    }
}
