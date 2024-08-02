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
      <ui-title-bar title="Google Lighthouse Scanner">
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
          title="Google Lighthouse Scanner"
          size="small"
          primaryAction={{
            content: 'New Scan',
            onAction: () => {
              navigate("/app/scans/new")
            },
          }}
          description="Our Shopify app integrates a Google Lighthouse scanner directly into your store's dashboard, allowing you to conveniently assess the performance of your domains. By running comprehensive scans, you can evaluate key metrics such as speed, accessibility, and SEO. The app provides detailed reports that help you understand how well your site performs in these areas and identify specific improvements you can make. This tool is designed to help you ensure that your store offers a fast, accessible, and optimized experience for all visitors."
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
              src="https://developer.chrome.com/static/docs/lighthouse/overview/image/lighthouse-logo-3c45f51ca8cfc.svg"
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