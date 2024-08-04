import { useState, useEffect } from "react";
import { json, redirect } from "@remix-run/node";
import {
  useLoaderData,
  useSubmit,
  useNavigate,
} from "@remix-run/react";
import { authenticate } from "../shopify.server";
import {
  Card,
  ChoiceList,
  Layout,
  Page,
  Text,
  BlockStack,
  PageActions,
  Spinner,
  TextField,
  InlineGrid,
  Box
} from "@shopify/polaris";

 import { runScan } from "../models/Scans.server";
 
export async function loader({ request }) {
  const { session,admin } = await authenticate.admin(request);
  const {shop} = session;

  const response = await admin.graphql(
    `#graphql
    query {
      shop {
        domains {
          id
          host
          url
        }
      }
    }`,
  );
  
  const shopDomains = await response.json();
  return json({shopDomains});
}

export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const { shop } = session;
  
  const formData  = await request.formData();
  const formDataObject = Object.fromEntries(formData);

  const newScan = await runScan(formDataObject, shop);
  const scanId = newScan.id;

  return redirect(`/app/scans/${scanId}`)

};

export default function NewScanForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loaderData = useLoaderData();
  const shopDomains = loaderData.shopDomains.data.shop.domains;

  
  const [formState, setFormState] = useState({
    url: '',
    scanTypes: ['performance'],
    deviceStrategy: 'desktop',
    name: ''
  });
  
  const navigate = useNavigate();

  const submit = useSubmit();

  function checkErrors() {
    let errors = {};
   

    return errors;

  }


  function handleRun() {

    let errors = checkErrors();
    setIsSubmitting(true);

    const data = { 
      url: formState.url || shopDomains[0].url,
      scanTypes: formState.scanTypes || [],
      deviceStrategy: formState.deviceStrategy || "",
      name: formState.name || "ShopScan"
    };



    submit(data, { method: "post" });
  }

  return (
    <Page>
      <ui-title-bar title={"New ShopScan"}>
        <button variant="breadcrumb" onClick={() => navigate("/app/")}>
          Past Scans
        </button>
      </ui-title-bar>
      <Layout>

        {/* Is Submitting State */}
        {isSubmitting ? 
            <Box width="100%" >
                <BlockStack gap="500">
                    <InlineGrid gap="400" columns={3}>
                        <Card>
                            <BlockStack inlineAlign="center" gap="400">
                                <Spinner accessibilityLabel="Spinner example" size="large" />
                            </BlockStack>
                        </Card>
                        <Card>
                            <BlockStack inlineAlign="center" gap="400">
                                <Spinner accessibilityLabel="Spinner example" size="large" />
                            </BlockStack>                </Card>
                        <Card>
                            <BlockStack inlineAlign="center" gap="400">
                                <Spinner accessibilityLabel="Spinner example" size="large" />
                            </BlockStack>                
                        </Card>
                    </InlineGrid>
                <Card>
                    <BlockStack inlineAlign="center" gap="400">
                        <Spinner accessibilityLabel="Spinner example" size="large" />
                    </BlockStack>  
                </Card>
            </BlockStack>

          </Box>

          :  
        
        <Layout.Section>
          <BlockStack gap="500">
            <Card>
              <BlockStack gap="500">
               
                <Text as={"h2"} variant="headingLg">
                  Name 
                </Text>
                <TextField
                  id="name"
                  helpText="Give your scan a name so you can refer to it later"
                  label="name"
                  labelHidden
                  autoComplete="off"
                  value={formState.name}
                  onChange={(name) => setFormState({ ...formState, name: name })}
                  placeholder="Shop Scan"
                  // error={errors.url}
                />
                      <Text as={"h2"} variant="headingLg">
                  What URL would you like to scan?
                </Text>
                <ChoiceList
                  id="scantype"
                  title="Select a Domain Attached to you Shopify Store "
                  selected={formState.url}
                  onChange={(url) => setFormState({ ...formState, url: url })}
                  choices={shopDomains.map(url => ({ label: url.url, value: url.url }))}

                />
                <Text as={"h2"} variant="headingLg">
                  Choose your Scan Options
                </Text>
                <ChoiceList
                  id="scantype"
                  title="Scan Type "
                  selected={formState.scanTypes}
                  onChange={(selected) => setFormState({ ...formState, scanTypes: selected })}
                  choices={[
                    {label: 'Accessibility', value: 'accessibility'},
                    {label: 'Best Practices', value: 'best-practices'},
                    {label: 'Performance', value: 'performance'},
                    {label: 'Progressive Web App', value: 'pwa'},
                    {label: 'SEO', value: 'seo'},
                  ]}
                />

                <ChoiceList
                  id="deviceStrategy"
                  title="Device Strategy"
                  selected={formState.deviceStrategy}
                  onChange={(selected) => setFormState({ ...formState, deviceStrategy: selected })}
                  choices={[
                    {label: 'Desktop', value: 'desktop'},
                    {label: 'Mobile', value: 'mobile'},
                  ]}
                />
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
        
        } {/* END IS SUBMITTING STATE */}


        <Layout.Section>
          <PageActions
            secondaryActions={[]}
            primaryAction={{
              content: "Run Scan",
              loading: false,
              disabled: false,
              onAction: handleRun,
            }}
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
