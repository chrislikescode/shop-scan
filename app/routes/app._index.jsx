import {
  Card,
  EmptyState,
  Layout,
  Page,
  IndexTable,
  Link
} from "@shopify/polaris";
import { useLoaderData, useNavigate, Outlet} from "@remix-run/react";
import { authenticate, ONE_TIME } from "../shopify.server";
import { getScans } from "../models/Scans.server";
import formatDate from "../util/formatdate";

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


  const scans = await getScans(shop);
  return {scanData: scans};
};



const EmptyScanState = ({ onAction }) => (
  <EmptyState
      heading="Run a Google Lighthouse Scan on your Shopify store"
      action={{
      content: "Scan",
      onAction,
      }}
      image="https://developer.chrome.com/static/docs/lighthouse/overview/image/lighthouse-logo-3c45f51ca8cfc.svg"
  >
      <p>Run a Google Lighthouse Scan on your store and learn ways you can improve your site. </p>
  </EmptyState>
);

const ScanTable = ({ scans }) => {

 let x = 0;


  return (
    <IndexTable
      resourceName={{
        singular: "Past Scan",
        plural: "Past Scans",
      }}
      itemCount={scans.length}
      headings={[
        { title: "ID" },
        { title: "NAME"},
        { title: "URL" },
        { title: "DATE"}
      ]}
      selectable={false}
    >
      {scans.map((scan) => {
        x += 1;
      return (
        <ScanTableRow key={scan.id} scan={scan} x={x} />
        )}
      )}
    </IndexTable>
  );
};

const ScanTableRow = ({ scan, x }) => {
  
  return (
  <IndexTable.Row id={scan.id} position={scan.id}>
    <IndexTable.Cell>
        {x}
    </IndexTable.Cell>
    <IndexTable.Cell>
      <Link url={`/app/scans/${scan.id}`}>
        {scan.name}
      </Link>
    </IndexTable.Cell>
    <IndexTable.Cell>
        {scan.shop}
    </IndexTable.Cell>
    <IndexTable.Cell>
        {formatDate(scan.createdAt)}
    </IndexTable.Cell>
  </IndexTable.Row>
  )
};

export default function Performance() {
  const { scanData } = useLoaderData();
  const scans = scanData;
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
              <ScanTable scans={scans} />
            )}
          </Card>
        </Layout.Section>
      </Layout>
      <Outlet />
    </Page>
  );
}