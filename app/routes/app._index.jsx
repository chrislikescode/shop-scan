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
  // throw new Error("Oh no! Something went wrong!");

  let shopName = shop.split(".")[0];

  // Billing Require 
  await billing.require({
    plans: [ONE_TIME],
    isTest: true,
    onFailure: async () => billing.request({ 
      plan: ONE_TIME,
      isTest: true,
      returnUrl: `https://admin.shopify.com/store/${shopName}/apps/google-shop-scan/app`,
     }),  
  });

  const scans = await getScans(shop, 1, 100);
  return {scanData: scans};
};


function getScansOnCurrentPage(scans, page, scansPerPage){
  return scans.slice((page - 1) * scansPerPage, (page - 1) * scansPerPage + scansPerPage);
}

export default function Performance() {
  const { scanData } = useLoaderData();
  const [page, setPage] = useState(1);
  let scansPerPage = 5;
  const [currentPageScans, setCurrrentPageScans] = useState(getScansOnCurrentPage(scanData, page, scansPerPage));

  const navigate = useNavigate();

  useEffect(() =>{
    setCurrrentPageScans(getScansOnCurrentPage(scanData, page, scansPerPage));
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
              src="/images/LighthouseScannerIcon_200_no_bg.png"
            />
        </MediaCard>
              <ScanTable totalScans={scanData.length} scansPerPage={scansPerPage} scans={currentPageScans} page={page} setPage={setPage} />
              </>
            )}
          </Card>
        </Layout.Section>
      </Layout>
      <Outlet />
    </Page>
  );
}