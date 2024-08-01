import {
  Card,
  Layout,
  Page,
} from "@shopify/polaris";
import { useLoaderData, useNavigate, Outlet } from "@remix-run/react";
import { authenticate, ONE_TIME } from "../shopify.server";
import { getScans } from "../models/Scans.server";
// Components

import { ScanTable, EmptyScanState } from "../components/PastScans";
import { useState } from "react";

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

  const [page, setPage] = useState(1);
  const [scans, setScans] = useState(scanData);
  let scansPerPage = 10;

  let currentPageScans = scans.slice((page - 1) * scansPerPage, (page - 1) * scansPerPage + scansPerPage);

  const navigate = useNavigate();

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
            {scans === null ? (
              <EmptyScanState onAction={() => navigate("/app/scans/new")} />
            ) : (
              <ScanTable totalScans={scans.length} scansPerPage={scansPerPage} scans={currentPageScans} page={page} setPage={setPage} />
            )}
          </Card>
        </Layout.Section>
      </Layout>
      <Outlet />
    </Page>
  );
}