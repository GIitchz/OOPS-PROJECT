import express from "express";
import Stripe from "stripe";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const stripe = new Stripe("sk_test_51SVe5oF5yqxI3yG1Mr6VxxJ6tDF80NJDrcbgyjtUuvEstryQDnZpV4IX92SaUMexZgW8YABKNYkBIK72cpl1ZwFT00zMTZpFji");

app.post("/create-checkout-session", async (req, res) => {
    const { amount, orderId } = req.body;

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "inr",
                        unit_amount: amount,
                        product_data: { name: "Order Payment" }
                    },
                    quantity: 1
                }
            ],
            mode: "payment",

            /** ⭐⭐ IMPORTANT ⭐⭐ */
            success_url: "http://localhost:5173/order-success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}",
            cancel_url: "http://localhost:5173/checkout"
        });

        res.json({ url: session.url });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

app.post("/get-payment-info", async (req, res) => {
    const { session_id } = req.body;

    try {
        const session = await stripe.checkout.sessions.retrieve(session_id);
        const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);

        res.json({
            session_id: session.id,
            payment_intent: session.payment_intent,
            status: paymentIntent.status,
            amount: paymentIntent.amount
        });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.listen(5000, () => console.log("Stripe backend running on port 5000"));
