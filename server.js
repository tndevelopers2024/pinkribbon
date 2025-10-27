import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(express.json());

// ✅ Enable CORS for your Shopify store domain
app.use(cors({
  origin: ["https://20pcrm-5c.myshopify.com"], // your Shopify store domain
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "x-api-key"]
}));

// 🏪 Environment variables (from Vercel)
const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const ACCESS_TOKEN = process.env.SHOPIFY_TOKEN;

app.post("/create-draft-order", async (req, res) => {
  try {
    const { box, items, card, message, total, image } = req.body;

    const variantId = 46452309655715; // Hidden "Custom Gift Box" variant
    const baseVariantPrice = 1; // Actual price of that variant in your store

    // 1️⃣ Update the variant image dynamically
    await fetch(`https://${SHOPIFY_STORE}/admin/api/2024-10/products/8909216809123/images.json`, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": ACCESS_TOKEN,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        image: { src: image || "https://cdn.shopify.com/s/files/1/0722/5887/9651/files/9.jpg?v=1758791209" }
      })
    });

    // 2️⃣ Calculate discount
    const discountAmount = baseVariantPrice - total;

    // 3️⃣ Create draft order with adjusted total
    const draftOrder = {
      draft_order: {
        line_items: [
          {
            variant_id: variantId,
            quantity: 1,
            applied_discount: {
              description: "Gift Box Builder Adjustment",
              value_type: "fixed_amount",
              value: Math.abs(discountAmount).toFixed(2),
              amount: Math.abs(discountAmount).toFixed(2),
              title: "Gift Box Builder"
            },
            properties: [
              { name: "🎁 Box", value: box },
              { name: "🧴 Items", value: items.join(", ") },
              { name: "💌 Card", value: card || "None" },
              { name: "✍️ Message", value: message || "" },
              { name: "💲 Total Price", value: "₹" + total.toFixed(2) }
            ]
          }
        ]
      }
    };

    const response = await fetch(`https://${SHOPIFY_STORE}/admin/api/2024-10/draft_orders.json`, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(draftOrder),
    });

    const data = await response.json();
    if (data.errors || !data.draft_order) {
      console.error("Shopify API error:", data);
      return res.status(400).json({ error: "Shopify API error", details: data });
    }

    res.setHeader("Access-Control-Allow-Origin", "https://20pcrm-5c.myshopify.com");
    res.json({ checkoutUrl: data.draft_order.invoice_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// 🧪 Test route (optional)
app.get("/", (req, res) => res.send("GiftBox Builder API is running ✅"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🎁 Server running on port ${PORT}`));
