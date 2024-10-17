// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";

import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import PrivacyWebhookHandlers from "./privacy.js";

const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
);

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js

app.use("/api/*", shopify.validateAuthenticatedSession());

app.use(express.json());

app.get("/api/products/count", async (_req, res) => {
  const client = new shopify.api.clients.Graphql({
    session: res.locals.shopify.session,
  });

  const countData = await client.request(`
    query shopifyProductCount {
      productsCount {
        count
      }
    }
  `);

  res.status(200).send({ count: countData.data.productsCount.count });
});



app.get("/api/products/details", async (_req, res) => {
  const client = new shopify.api.clients.Graphql({
    session: res.locals.shopify.session,
  });

  try {
    const productData = await client.request(`
      query {
        products(first: 10) {
          edges {
            node {
              id
              title
              variants(first: 1) {
                edges {
                  node {
                    price
                    inventoryQuantity
                    availableForSale
                  }
                }
              }
            }
          }
        }
      }
    `);

    // Extract product details from the response
    const products = productData.data.products.edges.map(edge => {
      const variant = edge.node.variants.edges[0]?.node || {}; // Get the first variant
      return {
        id: edge.node.id,
        name: edge.node.title,
        price: variant.price || 'N/A',
        stock: variant.inventoryQuantity || 0,
        status: variant.availableForSale ? 'Available' : 'Unavailable'
      };
    });

   
    
    res.status(200).send({ products });
  } catch (error) {
    console.error("Failed to fetch product details:", error);
    res.status(500).send({ error: error });
  }
});


app.get("/api/customers/details", async (_req, res) => {
  const client = new shopify.api.clients.Graphql({
    session: res.locals.shopify.session,
  });

  try {
    const customerData = await client.request(`
      query {
        customers(first: 10) {
          edges {
            node {
              id
              firstName
              lastName
              email
              createdAt
              state
            }
          }
        }
      }
    `);
     console.log("customerData" + customerData)
    // Extract the customer details from the response
    const customers = customerData.data.customers.edges.map(edge => ({
      id: edge.node.id,
      name: `${edge.node.firstName} ${edge.node.lastName}`,
      email: edge.node.email,
      dateJoined: edge.node.createdAt,
      status: edge.node.state
    }));

    console.log(customers)

    res.status(200).send({ customers });
  } catch (error) {
    console.error("Failed to fetch customer details:", error);
    
    res.status(500).send({ error: error });
  }
});


app.post("/api/products", async (_req, res) => {
  let status = 200;
  let error = null;

  try {
    await productCreator(res.locals.shopify.session);
  } catch (e) {
    console.log(`Failed to process products/create: ${e.message}`);
    status = 500;
    error = e.message;
  }
  res.status(status).send({ success: status === 200, error });
});

app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(
      readFileSync(join(STATIC_PATH, "index.html"))
        .toString()
        .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "")
    );
});

app.listen(PORT);
