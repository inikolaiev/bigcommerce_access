// eslint-disable-next-line no-unused-vars,import/no-extraneous-dependencies
import React, { useEffect, useState, Fragment } from 'react';
// eslint-disable-next-line no-unused-vars
import Spinner from '../spinner/spinner';
import useGetProducts from '../hooks/useGetProducts';
// eslint-disable-next-line no-unused-vars,import/no-extraneous-dependencies
import Slider from 'react-slick';

export default function RecommendedProducts({ context }) {
    const [allProducts, setAllProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const currentProductSkus = context?.customFields.find(item => item.name === 'recommended')?.value?.split(',') || [];
    async function getProducts() {
        const products = await useGetProducts();
        setAllProducts(products);
    }

    useEffect(() => {
        getProducts();
        setIsLoading(false);
    }, []);

    const fittedProducts = allProducts.filter(product => {
        const productSku = product.node.sku;
        return currentProductSkus.includes(productSku);
    });

    if (isLoading) {
        return <Spinner></Spinner>;
    }

    if (!fittedProducts.length) {
        return <p>There is no recommended products</p>;
    }

    const sliderSettings = {
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
    };

    return (
        <div>
            <h2>Recommended products by sku:</h2>
            {fittedProducts.length > 4 ?
                <Slider {...sliderSettings}>
                    {fittedProducts.map(product => (
                        <div key={product.node.sku}>
                            <a href={product.node.path} className={'tag-product'}>
                                <img src={product.node.images.edges[0].node?.urlOriginal} alt=""/>
                                <h4>{product.node.name}</h4>
                                {product.node.prices?.salePrice &&
                                    <p style={{ color: 'red' }}>${product.node.prices.salePrice?.value}</p>
                                }
                                <p>${product.node.prices.basePrice.value}</p>
                            </a>
                        </div>
                    ))}
                </Slider> :
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    {fittedProducts.map(product => (
                        <div key={product.node.sku} style={{ flexBasis: '100%' }}>
                            <a href={product.node.path} className={'tag-product'}>
                                <img src={product.node.images.edges[0].node?.urlOriginal} alt=""/>
                                <h4>{product.node.name}</h4>
                                {product.node.prices?.salePrice &&
                                    <p style={{ color: 'red' }}>${product.node.prices.salePrice?.value}</p>
                                }
                                <p>${product.node.prices.basePrice.value}</p>
                            </a>
                        </div>
                    ))}
                </div>
            }
        </div>
    );
}
