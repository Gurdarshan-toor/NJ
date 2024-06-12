import { useEffect, useState } from 'react';
import {
  useApi,
  useTranslate,
  reactExtension,
  Text,
  Image,
  InlineLayout,
  BlockSpacer,
  BlockStack,
  Checkbox,
  Heading,
  Pressable,
  Divider,
  useCartLines,
  useApplyCartLinesChange,
  useSettings
} from '@shopify/ui-extensions-react/checkout';

// Define the extension and its functionality
export default reactExtension(
  'purchase.checkout.cart-line-list.render-after',
  () => <Extension />,
);

// Define the ID of the variant you want to manage
// const variantId = "gid://shopify/ProductVariant/44075232264381";

// Define the structure of the variant data
interface variantData {
  title: string;
  price: {
    amount: string;
    currencyCode: string;
  };
  product: {
    title: string;
    featuredImage?: {
      url: string;
    };
  };
}

// Define the component function
function Extension() {
  // Get the API object from the Shopify UI Extensions React library
  const { query } = useApi();
  // State to store the variant data
  const [variantData, setVariant] = useState<null | variantData>(null);
  // State to manage whether the variant is selected
  const [isSelected, setisSelected] = useState(false);

  // Get the cart lines and apply cart lines change from the Shopify UI Extensions React library
  const cartLines = useCartLines();
  const applyCartLinesChange = useApplyCartLinesChange();


  const settings = useSettings();
  const variantId =  settings.selected_variant as string;

  // Effect to fetch variant data when the component mounts or when the query object changes
  useEffect(() => {
    async function getVariantData() {
      const queryResult = await query<{ node: variantData }>(`{
        node(id: "${variantId}") {
          ... on ProductVariant {
            title
            price {
              amount
              currencyCode
            }
            image {
              url
            }
            product {
              title
              featuredImage {
                url
              }
            }
          }
        }
      }`);

      if (queryResult.data && queryResult.data.node) {
        setVariant(queryResult.data.node);
      } else {
        console.error('Failed to fetch variant data:', queryResult.errors);
      }
    }

    if (variantId) {
      getVariantData();
    }
  }, [query]);

  // Effect to check if the variant is already in the cart and update the isSelected state
  useEffect(() => {
    const isVariantInCart = cartLines.some(cartLine => cartLine.merchandise.id === variantId);
    setisSelected(isVariantInCart);
  }, [cartLines]);

  // Function to toggle selection and add/remove item from the cart
  const toggleSelection = () => {
    setisSelected(!isSelected);
    if (!isSelected) {
      applyCartLinesChange({
        type: "addCartLine",
        quantity: 1,
        merchandiseId: variantId
      });
    } else {
      const cartLineId = cartLines.find(cartLine => cartLine.merchandise.id === variantId)?.id;
      if (cartLineId) {
        applyCartLinesChange({
          type: "removeCartLine",
          quantity: 1,
          id: cartLineId
        });
      }
    }
  };

  // If variant data is not yet fetched, show loading text
  if (!variantId || !variantData) {
    return <Text>Loading...</Text>;
  }

  // Determine the image URL to display
  const variantImageUrl = variantData.image?.url;
  const productImageUrl = variantData.product?.featuredImage?.url;
  const imageUrl = variantImageUrl || productImageUrl;

  // Render the component
  return (
    <>
      <BlockSpacer spacing="base" />
      <Heading level={2}>Other Product you may like</Heading>
      <BlockSpacer spacing="base" />
      {/* Pressable component for checkbox */}
      <Pressable onPress={toggleSelection}>
        {/* Inline layout for alignment */}
        <InlineLayout
          blockAlignment="center"
          spacing={["base", "base"]}
          columns={["auto","auto", "auto"]}
          padding="base"
        >
          {/* Checkbox component */}
          <Checkbox checked={isSelected}>
            {/* Image component */}
            <Image
              source={variantData.image?.url || variantData.product?.featuredImage?.url}
            />
          </Checkbox>
          {/* BlockStack for text */}
          <BlockStack style={{ display: 'block', width: '100%' }}>
          <Text style={{ fontWeight: 'bold' }}>{variantData.product?.title} - {variantData.title}</Text>
          <Text style={{ fontWeight: 'bold' }}>{variantData.price?.amount} {variantData.price?.currencyCode}</Text>
          </BlockStack>
        </InlineLayout>
      </Pressable>
    </>
  );
}
