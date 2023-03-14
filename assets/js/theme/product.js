/*
 Import all product specific js
 */
import PageManager from './page-manager';
import Review from './product/reviews';
import collapsibleFactory from './common/collapsible';
import ProductDetails from './common/product-details';
import videoGallery from './product/video-gallery';
import { classifyForm } from './common/utils/form-utils';
import modalFactory from './global/modal';
import React from 'react';
import { createRoot } from 'react-dom/client';
import RecommendedProducts from './components/recommendedProducts/recommended-products';
import RecommendedProductsSku from './components/recommendedProductsBySku/recommended-products-sku';

export default class Product extends PageManager {
    constructor(context) {
        super(context);
        this.url = window.location.href;
        this.$reviewLink = $('[data-reveal-id="modal-review-form"]');
        this.$bulkPricingLink = $('[data-reveal-id="modal-bulk-pricing"]');
        this.reviewModal = modalFactory('#modal-review-form')[0];
    }

    onReady() {
        // Listen for foundation modal close events to sanitize URL after review.
        $(document).on('close.fndtn.reveal', () => {
            if (this.url.indexOf('#write_review') !== -1 && typeof window.history.replaceState === 'function') {
                window.history.replaceState(null, document.title, window.location.pathname);
            }
        });

        let validator;

        // Init collapsible
        collapsibleFactory();

        this.productDetails = new ProductDetails($('.productView'), this.context, window.BCData.product_attributes);
        this.productDetails.setProductVariant();

        videoGallery();

        this.bulkPricingHandler();

        const $reviewForm = classifyForm('.writeReview-form');

        if ($reviewForm.length === 0) return;

        const review = new Review({ $reviewForm });

        $('body').on('click', '[data-reveal-id="modal-review-form"]', () => {
            validator = review.registerValidation(this.context);
            this.ariaDescribeReviewInputs($reviewForm);
        });

        $reviewForm.on('submit', () => {
            if (validator) {
                validator.performCheck();
                return validator.areAll('valid');
            }

            return false;
        });

        this.productReviewHandler();
        this.renderRelatedProducts();
        this.renderRecommendedProductsSku();
        this.giftProduct();
    }

    ariaDescribeReviewInputs($form) {
        $form.find('[data-input]').each((_, input) => {
            const $input = $(input);
            const msgSpanId = `${$input.attr('name')}-msg`;

            $input.siblings('span').attr('id', msgSpanId);
            $input.attr('aria-describedby', msgSpanId);
        });
    }

    productReviewHandler() {
        if (this.url.indexOf('#write_review') !== -1) {
            this.$reviewLink.trigger('click');
        }
    }

    bulkPricingHandler() {
        if (this.url.indexOf('#bulk_pricing') !== -1) {
            this.$bulkPricingLink.trigger('click');
        }
    }

    giftProduct() {
        const $modifierInputs = $('[data-product-option-change]');
        const $isGiftInput = $modifierInputs.find('.modifier-is input');
        const $giftDelivery = $modifierInputs.find('.modifier-Gift.Delivery');
        const $giftMessage = $modifierInputs.find('.modifier-Gift.message');
        const $giftEmail = $modifierInputs.find('.modifier-Email');
        const $giftAddress = $modifierInputs.find('.modifier-Address');

        if (!$isGiftInput.length) return;

        $giftDelivery.find('select').find('option').get(0).remove();

        if ($isGiftInput.val() === '121') {
            $giftDelivery.hide();
            $giftEmail.hide();
            $giftMessage.hide();
            $giftAddress.hide();
        }

        $isGiftInput.on('change', function (e) {
            if (this.value === '121') {
                $giftDelivery.show();
                $giftMessage.show();
                $giftEmail.show();
            } else {
                $giftDelivery.hide();
                $giftDelivery.find('select').val('');
                $giftMessage.hide();
                $giftMessage.find('textarea').val('');
                $giftEmail.hide();
                $giftEmail.find('input').val('');
                $giftAddress.hide();
                $giftAddress.find('input').val('');
                $giftAddress.find('input').prop('required', false);
                $giftEmail.find('input').prop('required', false);
            }
        });

        $giftDelivery.find('select').on('change', function (e) {
            if (this.value === '125') {
                $giftEmail.show();
                $giftEmail.find('input').prop('required', true);
                $giftEmail.find('input').prop('pattern', '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$');
                $giftAddress.find('input').prop('required', false);
                $giftAddress.hide();
                $giftAddress.find('input').val('');
            } else if (this.value === '126') {
                $giftAddress.show();
                $giftEmail.hide();
                $giftEmail.find('input').val('');
                $giftEmail.find('input').prop('required', false);
                $giftAddress.find('input').prop('required', true);
            }
        });
    }

    renderRelatedProducts() {
        // const container = document.getElementById('recommendedProducts');
        // const root = createRoot(container);
        // root.render(<RecommendedProducts context={this.context}/>);
    }
    renderRecommendedProductsSku() {
        const container = document.getElementById('recommendedProductsSku');
        const root = createRoot(container);
        root.render(<RecommendedProductsSku context={this.context}/>);
    }
}
