import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";

import { MediaCard } from "@shopify/polaris";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  return json({ apiKey: process.env.SHOPIFY_API_KEY});
};

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">
          Home
        </Link>
      </NavMenu>
    
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
// export function ErrorBoundary() {
//   return boundary.error(useRouteError());
// }

// Custom error boundary 
// https://github.com/Shopify/shopify-app-template-remix/issues/597
// ex: throw new Error("Data not found");

export const ErrorBoundary = () => {
  const error = useRouteError();
  let formattedStack = error;
  if(error.stack){
    formattedStack = error.stack.split('\n').join('<br />');
  }
  try {
    // Catch redirect Response thrown by @shopify/shopify-app-remix
    const shopifyError = boundary.error(error);
    return shopifyError;
  } catch {
    // Run your own code here
    return (
      <div id="custom_error_ui" style={{alignItems:'center', textAlign:'center',padding:'25px',display:'flex', justifyItems:'center', justifyContent:'center',flexDirection:'column', width: '100%'}}>
        <img width="250px" src="/images/LighthouseScannerIcon_200_no_bg.png" alt="error" />
        <h1 style={{fontSize: '24px'}}> Something Has Gone Wrong :(</h1>
        <p style={{padding: '20px'}}> Refresh Your page. </p>
        <p> If this persists contact chris@chrislikescode.com. </p>
        {/* <h2> Custom Error Boundary in root.jsx </h2> */}
          {/* <p dangerouslySetInnerHTML={{ __html: formattedStack }} /> */}
        </div>
        
    )
  }
};


export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
