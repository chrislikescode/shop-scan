import {
  Card,
  Layout,
  Page,
  MediaCard,
} from "@shopify/polaris";
import { useLoaderData, useNavigate, Outlet } from "@remix-run/react";
import { authenticate, ONE_TIME } from "../shopify.server";
import { getScans } from "../models/Scans.server";
// Components

import { ScanTable, EmptyScanState } from "../components/PastScans";
import { useEffect, useState } from "react";

export async function loader({ request }) {
  const { session, billing } = await authenticate.admin(request);
  const {shop} = session;

  let shopName = shop.split(".")[0];
  // Billing Require Example
  const billingCheck = await billing.require({
    plans: [ONE_TIME],
    isTest: true,
    onFailure: async () => billing.request({ 
      plan: ONE_TIME,
      isTest: true,
      returnUrl: `https://admin.shopify.com/store/${shopName}/apps/google-lighthouse-scanner/app`,
     }),  
  });

  // Billing Check Example
  // billing.check returns : { hasActivePayment: boolean, appSubscriptions: AppSubscription[], oneTimePurchases: [{id: string, name: string, test: boolean, status: string}] }
  // const { hasActivePayment, appSubscriptions } = await billing.check({
  //   plans: [ONE_TIME],
  //   isTest: true,q
  // });
  // console.log("Has Active Payment", hasActivePayment);
  // console.log("App Subscriptions", appSubscriptions);

  const scans = await getScans(shop, 1, 100);
  return {scanData: scans};
};


// export async function action({ request }) {
//   const { session } = await authenticate.admin(request);
//   const { shop } = session;
  
//   const scanData  = await await getScans(shop, 1, 1);

//   console.log("Scan Data", scanData);

// }; 

export default function Performance() {
  const { scanData } = useLoaderData();
  const [scans, setScans] = useState(scanData);
  const [page, setPage] = useState(1);
  const [currentPageScans, setCurrrentPageScans] = useState(scans.slice((page - 1) * 10, (page - 1) * 10 + 10));

  const navigate = useNavigate();

  let scansPerPage = 5;

  useEffect(() =>{
    setCurrrentPageScans(scans.slice((page - 1) * scansPerPage, (page - 1) * scansPerPage + scansPerPage));
  },[page])

  return (
    <Page>
      <ui-title-bar title="ShopScan">
        <button variant="primary" onClick={() => navigate("/app/scans/new")}>
          Scan
        </button>
      </ui-title-bar>
      <Layout>
      
        <Layout.Section>
          <Card padding="0">
            {scanData.length < 1 ? (
              <>
              <EmptyScanState onAction={() => navigate("/app/scans/new")} />
              </>
            ) : (
              <>
          <MediaCard
          title="ShopScan"
          size="small"
          primaryAction={{
            content: 'New Scan',
            onAction: () => {
              navigate("/app/scans/new")
            },
          }}
          description="Unlock a deeper understanding of your Shopify store's performance with ShopScan, the ultimate tool for running Google PageSpeed Insights scans directly from your Shopify admin panel. No more guessing about your store's speed and efficiency—ShopScan provides you with detailed insights to help you make informed decisions."
          // popoverActions={[{content: 'Dismiss', onAction: () => {}}]}
        >
            <img
              alt=""
              width="100%"
              height="100%"
              style={{
                objectFit: 'contain',
                objectPosition: 'center',
              }}
              src="/assets/images/Lighthouse_200.png"
            />
        </MediaCard>
              <ScanTable totalScans={scans.length} scansPerPage={scansPerPage} scans={currentPageScans} page={page} setPage={setPage} />
              </>
            )}
          </Card>
        </Layout.Section>
      </Layout>
      <Outlet />
    </Page>
  );
}