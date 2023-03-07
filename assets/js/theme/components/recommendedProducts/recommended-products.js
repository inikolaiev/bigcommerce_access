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
    let currentProductsTags =
        context?.customFields.find(item => item.name === 'tags')?.value?.split(',') || [];

    async function getProducts() {
        const products = await useGetProducts();
        setAllProducts(products);
    }

    useEffect(() => {
        getProducts();
        setIsLoading(false);
    }, []);
    const fittedProducts = allProducts.filter(product => {
        const tags = product.node.customFields.edges.find(
            field => field.node.name === 'tags'
        )?.node.value.split(',') ?? [];

        return !(
            context.productName === product.node.name || tags.length === 0 ||
            !currentProductsTags.some(tag => tags.includes(tag))
        );
    }).sort((a, b) => {
        const tagsA = a.node.customFields.edges.find(
            field => field.node.name === 'tags'
        )?.node.value.split(',') ?? [];

        const tagsB = b.node.customFields.edges.find(
            field => field.node.name === 'tags'
        )?.node.value.split(',') ?? [];

        const tagsAHas = tagsA.filter(tag => currentProductsTags.includes(tag)).length;
        const tagsBHas = tagsB.filter(tag => currentProductsTags.includes(tag)).length;
        return tagsBHas - tagsAHas;
    });

    if (isLoading) {
        return <Spinner></Spinner>;
    }

    if (!currentProductsTags.length) {
        return <p>There is no related products</p>;
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
        <>
            {fittedProducts.length > 4 ?
                <Slider {...sliderSettings}>
                    {fittedProducts.map(product => (
                        <div key={product.node.sku}>
                            <a href={product.node.path} className={'tag-product'}>
                                <img src={product.node.images.edges[0].node?.urlOriginal} alt=""/>
                                <h4>{product.node.name}</h4>
                                {product.node.prices?.salePrice &&
                                    <p style={{color: 'red'}}>${product.node.prices.salePrice?.value}</p>
                                }
                                <p>${product.node.prices.basePrice.value}</p>
                            </a>
                        </div>
                    ))}
                </Slider> :
                <div style={{display: "flex", alignItems: "flex-end"}}>
                    {fittedProducts.map(product => (
                        <div key={product.node.sku} style={{flexBasis: '100%'}}>
                            <a href={product.node.path} className={'tag-product'}>
                                <img src={product.node.images.edges[0].node?.urlOriginal} alt=""/>
                                <h4>{product.node.name}</h4>
                                {product.node.prices?.salePrice &&
                                    <p style={{color: 'red'}}>${product.node.prices.salePrice?.value}</p>
                                }
                                <p>${product.node.prices.basePrice.value}</p>
                            </a>
                        </div>
                    ))}
                </div>
            }
        </>
    );
}
