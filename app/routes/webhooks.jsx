import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { topic, shop, session, admin } = await authenticate.webhook(request);

  console.log("Webhook received", { topic, shop, session, admin });
  // if (!admin) {
  //   // The admin context isn't returned if the webhook fired after a shop was uninstalled.
  //   throw new Response();
  // }

  // The topics handled here should be declared in the shopify.app.toml.
  // More info: https://shopify.dev/docs/apps/build/cli-for-apps/app-configuration
  switch (topic) {
    case "APP_UNINSTALLED":
      if (session) {
        await db.session.deleteMany({ where: { shop } });
      }
      break;
    case "CUSTOMERS_DATA_REQUEST":

      return new Response("Customers data request received", { status: 200 });

    case "CUSTOMERS_REDACT":

      return new Response("Customers redact received", { status: 200 });

    case "SHOP_REDACT":
      // Delete shop scan records when shop_redact is received 2 days after uninstall
        await db.Scan.deleteMany({ where: { shop } });
        console.log("Shop redact received. Data deleted for shop", shop);
        return new Response("Shop redact received", { status: 200 });

    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }

  throw new Response();
};
