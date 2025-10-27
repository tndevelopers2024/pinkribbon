import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// 🏪 Replace these with your store credentials
const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const ACCESS_TOKEN = process.env.SHOPIFY_TOKEN;

app.post("/create-draft-order", async (req, res) => {
  try {
    const { box, items, card, message, total } = req.body;

    const draftOrder = {
      draft_order: {
        line_items: [
          {
            title: "Custom Gift Box",
            price: total.toFixed(2),
            quantity: 1,
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

    const response = await fetch(
      `https://${SHOPIFY_STORE}/admin/api/2024-10/draft_orders.json`,
      {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(draftOrder),
      }
    );

    const data = await response.json();

    if (data.errors || !data.draft_order) {
      console.error("Shopify API error:", data);
      return res.status(400).json({ error: "Shopify API error", details: data });
    }

    // ✅ Send checkout link to frontend
    res.json({ checkoutUrl: data.draft_order.invoice_url });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🎁 GiftBox App running on port ${PORT}`));
