import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { login } from "../../shopify.server";
import styles from "./styles.module.css";

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return json({ showForm: Boolean(login) });
};

export default function App() {
  const { showForm } = useLoaderData();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <img src="https://google-lighthouse-scanner.fly.dev/images/LighthouseScannerIcon_200.png"/>
        <h1 className={styles.heading}>Welcome to ShopScan</h1>
        <p className={styles.text}>
        Discover the detailed metrics and analytics of your Shopify store with ShopScan, the ultimate tool for conducting Google PageSpeed Insights scans right from your Shopify admin panel. Eliminate the guesswork and get clear, actionable data to help you enhance your store's user experience.
        </p>
   
      </div>
    </div>
  );
}
