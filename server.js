import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: ["https://20pcrm-5c.myshopify.com"], 
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

// ✅ variables from Vercel
const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const ACCESS_TOKEN = process.env.SHOPIFY_TOKEN;

// ✅ Create Draft Order
app.post("/create-draft-order", async (req, res) => {
  try {
    const { box, items, card, message, total } = req.body;

    // ✅ Build Shopify line_items
    const line_items = [];

    // ✅ Box
    if (box) {
      line_items.push({
        variant_id: Number(box.variantId),
        quantity: 1,
        properties: [
          { name: "Type", value: "Gift Box" },
          { name: "Image", value: box.image }
        ]
      });
    }

    // ✅ Inside products
    items.forEach((i) => {
      line_items.push({
        variant_id: Number(i.variantId),
        quantity: Number(i.qty),
        properties: [
          { name: "Type", value: "Gift Product" },
          { name: "Image", value: i.image }
        ]
      });
    });

    // ✅ Card
    if (card) {
      line_items.push({
        variant_id: Number(card.variantId),
        quantity: 1,
        properties: [
          { name: "Type", value: "Gift Card" },
          { name: "Image", value: card.image }
        ]
      });
    }

    // ✅ Build draft order payload
    const draftOrder = {
      draft_order: {
        line_items,
        note: message || "",
        tags: "Gift-Box-Builder",
        applied_discount: {
          description: "Custom Gift Builder",
          value_type: "fixed_amount",
          value: "0.00",
          amount: "0.00"
        }
      }
    };

    // ✅ Call Shopify Admin API
    const response = await fetch(
      `https://${SHOPIFY_STORE}/admin/api/2024-10/draft_orders.json`,
      {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": ACCESS_TOKEN,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(draftOrder)
      }
    );

    const data = await response.json();

    if (data.errors || !data.draft_order) {
      console.error("❌ Shopify Error:", data);
      return res.status(400).json({ error: "Shopify API error", details: data });
    }

    // ✅ Get invoice URL
    const checkoutUrl = data.draft_order.invoice_url;

    return res.json({ checkoutUrl });

  } catch (err) {
    console.error("❌ Server Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/", (req, res) => res.send("✅ GiftBox API Running"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server started: ${PORT}`));
