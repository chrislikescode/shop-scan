import { authenticate } from "../shopify.server";
import { useLoaderData, useNavigate} from "@remix-run/react";
import { Page, Layout, Card, Text, Grid, EmptyState,
    BlockStack, Button, InlineStack, DataTable, Box,Tooltip, Collapsible, InlineGrid, Scrollable } from '@shopify/polaris';
import { styled } from 'styled-components';
import { getScanById } from "../models/Scans.server";
import formatDate from "../util/formatdate";
import { useState, useCallback, useEffect} from "react";

import FinalScore from "../components/FinalScore";


export async function loader({ request, params }) {
    const {session} = await authenticate.admin(request);
    const {shop} = session;
    const id = params.id;
    const scanData = await getScanById(shop, id);
    if(!scanData){
      return {error: "Scan not found"};
    }
    let parsedData = JSON.parse(scanData.data);
    let scanType = scanData.scanType;
    if(scanType == "seo"){
      scanType = "SEO";
    }

    // PWA doesn;t have final score 
    // console.log(Object.keys(parsedData.lighthouseResult));
    // console.log(parsedData.lighthouseResult.entities);

    let finalScores = null;
    let finalScoresKey = null;  
    if (parsedData.lighthouseResult.categories) {
      const categories = parsedData.lighthouseResult.categories;
      finalScores = categories ? categories : null;
      finalScoresKey = categories ? Object.keys(categories) : null;
    }

    let scanKeyData = {
      "requestedUrl": parsedData.lighthouseResult.requestedUrl,
      "finalUrl": parsedData.lighthouseResult.finalUrl,
      "userAgent": parsedData.lighthouseResult.userAgent,
      "fetchTime": parsedData.lighthouseResult.fetchTime,
      "failedAuditsCount" : 0,
      "passedAuditsCount" : 0,
      "nanAuditsCount" : 0,
      "finalScores" : finalScores,
      "finalScoresKey" : finalScoresKey,
      "scanName" : scanData.name,
      "scanType" : scanType,
      "screenshot": parsedData.lighthouseResult.fullPageScreenshot.screenshot.data ? parsedData.lighthouseResult.fullPageScreenshot.screenshot.data : null,
      "entities": parsedData.lighthouseResult.entities ? parsedData.lighthouseResult.entities : null
    }
    
    let audits = parsedData.lighthouseResult.audits;
    parsedData = Object.entries(audits).map(([key, value]) => ({ [key]: value }));
    let headerImage;
    Object.entries(audits).forEach(([key, value]) => {
      if (key === "final-screenshot" && value.details) {
        headerImage = value.details.data;
      }
    
      const score = value.score;
    
      if (score === 1) {
        scanKeyData.passedAuditsCount += 1;
      } else if (score === null) {
        scanKeyData.nanAuditsCount += 1;
      } else {
        scanKeyData.failedAuditsCount += 1;
      }
    });
    
   
    return ({parsedData,scanKeyData,headerImage});
}


// STYLED COMPONENTS
const SolidCircle = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: ${props => props.color};
`;

// UTIL COMPONENTS
function truncateString(str, num) {
  if (str.length <= num) {
    return str;
  }
  return str.slice(0, num) + '...';
}


// MEDIA CARD
const MediaCardImage = ({ dataUrl }) => {
    return <img src={dataUrl} alt="Dynamic Image" width="100%" height="200px" style={{verticalAlign: 'bottom', objectFit: 'cover', objectPosition: 'top'}} />;
  };
// METRICS BLOCK COMPONENTS
const MetricsContainer = ({ metricData }) => {
    return (
      <>
        {metricData.map((metricObject) => {
          const metricKey = Object.keys(metricObject)[0];
          const metricData = metricObject[metricKey];
  
          return (
            <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 6, xl: 6}}>
                <MetricBlock
                key={metricData.id} // Using the metric id as the unique key
                metricKey={metricKey} // Pass the key as a prop
                metricData={metricData}
                />
            </Grid.Cell>
          );
        })}
      </>
    );
  };

const MetricBlock = ({metricData}) => {

    const metricColor = metricData.score >= 0.9 ? "green" : metricData.score >= 0.5 ? "yellow" : "red";
    
    return (
        <Card>
        <SolidCircle color={metricColor}/>
         <Text as="h2">
             {metricData.title}
         </Text>
         <Text variant="heading3xl" as="h2">
             {metricData.displayValue}
         </Text>
     </Card>
    )  
};



// AUDIT BLOCK COMPONENTSs
const AuditDataTable = ({auditDetails}) => {
    // Build the content type,column header and rows arrays from the audit data
    let dataContentTypes= [];
    let dataHeadings = [];
    let dataRows = [];

    // build the heading keys to push the item values in the right order into the data rows
    let headingKeys = [];
    
    auditDetails.headings.forEach(heading => {
      dataHeadings.push(heading.label);
      dataContentTypes.push(heading.valueType);
      headingKeys.push(heading.key);
    })

    // loop over the items in the itemData
    for(let i = 0; i < auditDetails.items.length; i++){
      let dataRow = []
      // loop through each idea, as many times as there are header keys and push
      // all the values into the data row using the heading keys
      for(let x = 0; x < headingKeys.length; x++){
        // Check for "node" in items 
        if(typeof auditDetails.items[i][headingKeys[x]] !== "object"){
          let value = auditDetails.items[i][headingKeys[x]];
          let valueType = dataContentTypes[x];

          if(typeof value === "string"){
            value = truncateString(value, 250);
          } 

          if(valueType === "bytes"){
            value = (value/1000000).toFixed(2) + "MB";
          } else if (valueType === "ms"){
            value = (value/1).toFixed(2) + "ms";
          }

          dataRow.push(value);
        } else { // if Node object in items then push each key value pair into the data row
            // let nodeKeys = Object.keys(auditDetails.items[i][headingKeys[x]]); 

            // nodeKeys.forEach(nodeKey => { 
            //   if(typeof auditDetails.items[i][headingKeys[x]][nodeKey] !== "object"){
            //     dataRows.push([nodeKey, auditDetails.items[i][headingKeys[x]][nodeKey]]);
            //   }
            // })
        }
      }
      dataRows.push(dataRow);
    }

    return (    
        
    <DataTable
        columnContentTypes={dataContentTypes}
        headings={dataHeadings}
        rows={dataRows}
      />
    
    )
  }

// use this function to check the audit block for a details setion and add any UI components that should be rendered
// in the collapsible section of the audit block
// loop through the detail items in each audit block - check the details itmes type and render the appropriate UI component
const SupplementAuditBlockUI = ({ auditDetails }) => {

  let tableContent = 0;
  let listContent = [];
  let treemapContent;
  let filmstripContent;
  let opportunityContent;
  let debugContent=[];

  switch(auditDetails.type){
    case "table":
      tableContent = <AuditDataTable auditDetails={auditDetails}/>
      break;
    case "list":
      auditDetails.items.forEach(item => {
       listContent.push(<AuditDataTable auditDetails={item}/>)
      })
      break;
    case "treemap-data":
      treemapContent = <TreeMap treeMapData={auditDetails.nodes}/>
      break;
    case "filmstrip":
      filmstripContent = <FilmStripFactory filmStripData={auditDetails.items} />
      break;
    case "opportunity":
      opportunityContent = <AuditDataTable auditDetails={auditDetails}/>
      break;
    case "debugdata":
      debugContent = <DebugDataTable auditData={auditDetails}/>
      break;
    default:
      break;
  }


  return (
    <>
    {tableContent ? tableContent : <></>}
    {listContent.length > 0 ? listContent : <></>}
    {treemapContent ? treemapContent : <></>}
    {filmstripContent ? filmstripContent : <></>}
    {opportunityContent ? opportunityContent : <></>} 
    {debugContent ? debugContent : <></>}
    </>
  );
};


// gets an array of audit data
const AuditBlockFactory = ({auditData}) =>{
  const [openFailed, setOpenFailed] = useState(true);
  const [openPassed, setOpenPassed] = useState(false);
  const [openNan, setOpenNan] = useState(false);

  const handleFailedOpen = useCallback(() => setOpenFailed((open) => !open), []);
  const handlePassedOpen = useCallback(() => setOpenPassed((open) => !open), []);
  const handleNanOpen = useCallback(() => setOpenNan((open) => !open), []);


  let passedAudits =[];
  let failedAudits =[]; 
  let nullAudits = [];
  auditData.forEach(audit => {
    let auditKey = Object.keys(audit)[0];
    if(audit[auditKey].score == null){
      nullAudits.push(audit);
      return;
    }
    audit[auditKey].score == 1 ? passedAudits.push(audit) : failedAudits.push(audit);
  })

    const auditBlocks = (
      <>
      <BlockStack gap="400">
      
      {/* Failed Audits  */}
      <Card>
        <Box padding="200">
          <InlineStack align="space-between">
            <Text as="h2" tone="critical" variant="headingLg">
              Failed Audits 
            </Text>
            <Button
                onClick={handleFailedOpen}
                ariaExpanded={openFailed}
                ariaControls="failed-audits"
              >
                {openFailed ? "Close Failed Audits" : "View Failed Audits"}
              </Button>
          </InlineStack>
        </Box>

        <Collapsible
            open={openFailed}
            id="failed-audits"
            transition={{duration: '500ms', timingFunction: 'ease-in-out'}}
            expandOnPrint
          >   
          <BlockStack gap="400">
            {failedAudits.map((audit, index) => (
              <AuditBlock key={index} auditData={audit} />
            ))}
          </BlockStack>

        </Collapsible>
      </Card>
{/* Passed Audits */}
      <Card>
      <Box padding="200">
        <InlineStack align="space-between">
            <Text as="h2" tone="success" variant="headingLg">
              Passed Audits 
            </Text>
            <Button
              onClick={handlePassedOpen}
              ariaExpanded={openPassed}
              ariaControls="passed-audits"
            >
              {openPassed ? "Close Passed Audits" : "View Passed Audits"}
            </Button>
        </InlineStack>
        </Box>
        <Collapsible
            open={openPassed}
            id="passed-audits"
            transition={{duration: '500ms', timingFunction: 'ease-in-out'}}
            expandOnPrint
          >   
          <BlockStack gap="400">
            {passedAudits.map((audit, index) => (
              <AuditBlock key={index} auditData={audit} />
            ))}
          </BlockStack>
        </Collapsible>
      </Card>

{/* NAN Audits */}
      <Card>
      <Box padding="200">

        <InlineStack align="space-between">
          <Text as="h2" tone="" variant="headingLg">
          Audits Not Applicable
          </Text>
          <Button
            onClick={handleNanOpen}
            ariaExpanded={openNan}
            ariaControls="nan-audits"
          >
            {openNan ? "Close NaN Audits" : "View Nan Audits"}
          </Button>
        </InlineStack>
        </Box>
      
        <Collapsible
          open={openNan}
          id="nan-audits"
          transition={{duration: '500ms', timingFunction: 'ease-in-out'}}
          expandOnPrint
        >   
          <BlockStack gap="400">
              {nullAudits.map((audit, index) => (
                <AuditBlock key={index} auditData={audit} />
              ))}
          </BlockStack>
        </Collapsible>
      </Card>
      </BlockStack>

      <Box minHeight="50px"></Box>

      </>
    );

  return(
      <>
          {auditBlocks}
      </>
  )
} 
const AuditBlock = ({auditData}) => {
    // Accessing the title property without knowing the first key
    const auditKey = Object.keys(auditData);
    const auditTitle = auditData[auditKey].title;
    let auditDescription = auditData[auditKey].description;
    const auditDisplayValue = auditData[auditKey].displayValue;
    let hasSupplementalUI;
    let auditDetails;

    if (auditData[auditKey]?.details?.items?.length > 0 || auditData[auditKey]?.details?.nodes?.length > 0) {
        hasSupplementalUI = true;
        auditDetails = auditData[auditKey].details;
    } else {
        hasSupplementalUI = false;
    }

    // Match and Extract the URL Link and URL Text Link fro the audit description 

    // Define the regular expression to match the URL
    const urlRegex = /\((https?:\/\/[^\)]+)\)/;
    const textRegex = /\[([^\]]+)\]/;

    // Use the regex to extract the URL
    const urlMatch = auditDescription.match(urlRegex);
    const textMatch = auditDescription.match(textRegex);
    let auditLink;
    let auditLinkText; 
    if (urlMatch && urlMatch[1] && textMatch && textMatch[1]) {
      auditLink = urlMatch[1];
      auditLinkText = textMatch[1]
    } 
    auditDescription = auditDescription.replace(urlRegex, '');
    auditDescription = auditDescription.replace(textRegex, '');
    auditDescription = auditDescription.replace(/\s\s+/g, ' ').trim();
    auditDescription = auditDescription.replace(/[.,;:!?]?\s*$/, '');

    return(
        <Card>
          <BlockStack gap="500">
            <InlineStack wrap={false} gap="400" blockAlign="center" align="space-between">
                  <Text as="h2" variant="headingLg">
                      {auditTitle}    
                  </Text>
                  <Text as="h2" variant="headingMd" tone="success">
                    {auditDisplayValue ? auditDisplayValue : <></>}
                  </Text>
                  {auditLink ? 
                  <Button
                  variant="plain"
                  url={auditLink}
                  external="true"
                  target="_blank"
                  >
                 {auditLinkText}
                  </Button>
                  : <></> }
              </InlineStack>
              <BlockStack gap="500">
                <Text as="p">
                    {auditDescription}
                </Text>
                { hasSupplementalUI ?  <SupplementAuditBlockUI auditDetails={auditDetails} /> : <> </>}
              </BlockStack>

          </BlockStack>
      </Card>

    )
    
};

// DEBUG DATA HANDLER
const DebugDataTable = ({auditData}) => {
  let dataRows = [];
  let dataTypes = [];
  auditData.items.forEach(audit => {
    for (const key in audit){
      if(typeof audit[key] === "object"){return}
      dataRows.push([key,audit[key]]);
      dataTypes.push(typeof item);
    }
   })
  return (<DataTable columnContentTypes={dataTypes} headings={[]} rows={dataRows} />)
}

// TREEMAP COMPONENTS
const TreeMapTable = ({treeNodeData, totalBytes}) =>{
    // Build the content type,column header and rows arrays from the audit data
    
    let dataHeadings= ['Name','Resource Bytes', 'Unused Bytes', '% of Total'];
    let dataContentTypes = ['text', 'bytes', 'bytes', 'percent'];
    let dataRows = [];

    treeNodeData.forEach(node => {
      if(!node.children){
        let dataRow = [truncateString(node.name,100), node.resourceBytes, node.unusedBytes, ((node.resourceBytes/totalBytes) *100).toFixed(2)];
        dataRows.push(dataRow);
      }
    })


    return (    
        
    <DataTable
        columnContentTypes={dataContentTypes}
        headings={dataHeadings}
        rows={dataRows}
      />
    
    )


}
const TreeNodeFactory = ({treeNodeData, totalBytes}) => {
  const treeNodes = (
    <>
      {treeNodeData.map((node, index) => (
        <TreeMapNode key={index} treeNodeData={node} totalBytes={totalBytes}/>
      ))}
    </>
  );
  return (
    <>
        {treeNodes}
    </>
  )
}
const TreeMapNode = ({treeNodeData, totalBytes}) => {

    const percentOfTotal = treeNodeData.resourceBytes/totalBytes;
    const columnSpanData = Math.max(Math.round(percentOfTotal * 100) * 1.8, 5); 

    if(percentOfTotal < .001){return}

    const tooltipContent = (
      `${treeNodeData.name}  Resource Bytes: ${treeNodeData.resourceBytes/1000000}MB \n ${Math.floor(percentOfTotal*100)}%`
    )

    return(
        <Box width={columnSpanData + "%"}>
          <Card> 
          <Tooltip width='wide' content={tooltipContent}>
            <Text as={"h2"}> {truncateString(treeNodeData.name, 20)} </Text>
            <Text as={"p"}> Resource Bytes: {(treeNodeData.resourceBytes/1000000).toFixed(2)}MB -- {Math.floor(percentOfTotal*100)}% </Text>
            {/* <Text as={"p"}> Unused Byes: {treeNodeData.unusedBytes/1000000}MB </Text>   */}
            </Tooltip>
          </Card>
        </Box>
    )
}
const TreeMap = ({treeMapData}) =>{

    const sortedNodes = treeMapData.sort((a, b) => b.resourceBytes - a.resourceBytes);
    
    let totalBytes = 0;
    let totalUnusedBytes = 0; 

    sortedNodes.forEach(node => {
      if(!node.children){
        totalUnusedBytes += node.unusedBytes;
        totalBytes += node.resourceBytes;
      } else {
        node.children.forEach(child => {
          totalUnusedBytes += child.unusedBytes;
          totalBytes += child.resourceBytes;
        })
      }
     })       


    return(
        <InlineStack>
          <TreeNodeFactory treeNodeData={sortedNodes} totalBytes={totalBytes} />
          <TreeMapTable treeNodeData={sortedNodes} totalBytes={totalBytes}/>
        </InlineStack>
    )


}


// FILM STRIP COMPONENTS
const FilmStripFactory = ({filmStripData}) => {
  const filmStrips = (
    <>
      {filmStripData.map((filmStripNode, index) => (
        <FilmStripNode key={index} filmStripNodeData={filmStripNode} />
      ))}
    </>
  )
  return (
    <>
      <InlineStack wrap={false}>
        {filmStrips}
      </InlineStack>
    </>
  )
}
const FilmStripNode = ({filmStripNodeData}) => { 

  const tooltipContent = `${filmStripNodeData.timing}ms`;

  return(
    <Tooltip  content={tooltipContent}>
      <img width="100%" src={filmStripNodeData.data}/>
    </Tooltip>
  )

}

// Opportunity Block Components - kind of just a data table? 


export default function Scan() {
    const {parsedData, scanKeyData, headerImage, error} = useLoaderData();

    let navigate = useNavigate();  

    if(error){
      const navigateToScans = () => {
        navigate("/app/");
      }
      return (
      <Page>
         <ui-title-bar title={"Run a New ScanShop Scan"}>
            <button variant="breadcrumb" onClick={() => navigate("/app/")}>
              Past Scans
            </button>
            <button variant="primary" onClick={() => navigate("/app/scans/new")}>
            Scan
          </button>
          </ui-title-bar>
          <EmptyState
              heading="That Scan Does Not Exist 😢"
              action={{ content: "Go Back to Scans", onAction: navigateToScans }}
          >
        </EmptyState>
      </Page>
        )
      }
    return (
        <Page>
           <ui-title-bar title={"Run a New ShopScan"}>
            <button variant="breadcrumb" onClick={() => navigate("/app/")}>
              Past Scans
            </button>
            <button variant="primary" onClick={() => navigate("/app/scans/new")}>
            Scan
          </button>
          </ui-title-bar>
            <Layout>
                <Layout.Section>
                    <BlockStack gap="500">
                    <Text variant="heading2xl" tone="subdued" as="h1"> {scanKeyData.scanName} </Text>

                   
                      <Grid>
                      {scanKeyData.finalScores ? 
                    
                        <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 6, lg: 6, xl: 6}}>
                          <FinalScore score={scanKeyData.finalScores[scanKeyData.finalScoresKey].score * 100} scantype={scanKeyData.scanType} />
                        </Grid.Cell>
                        : <></> }

                      {scanKeyData.screenshot ? 
                         <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 6, lg: 6, xl: 6}}>
                          <Box style={{position: 'relative', width:'100%'}} >
                            <h2 style={{position: 'absolute', bottom:'10px', left:'10px', color:"white", zIndex:"99",fontSize:'20px', textShadow: `-1px -1px 0 #000, 1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000`}}> Scan Screenshot </h2>
                            <Scrollable shadow style={{height: '250px', borderRadius: '10px'}} focusable >
                                  <img src={scanKeyData.screenshot}  width="100%" />
                              </Scrollable>
                          </Box>
                         </Grid.Cell>
                      : <></>}

                      {scanKeyData.entities.length > 0 ? 
                         <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 6, lg: 6, xl: 6}}>
                            <Card title="Past Scan Details" sectioned>
                              <Text variant="headingLg" as="h2">
                                Entities on Page           
                              </Text>
                              <Box paddingBlock="200">
                              <Scrollable style={{height: '200px', borderRadius: '10px'}} focusable >
                                <BlockStack gap="400">
                                {scanKeyData.entities.map((entity, index) => ( 
                                  <Box>
                                    <Text as="h2">Name:  {entity.name} </Text>
                                    <Text as="h2">URL:  {entity.origins[0]} </Text>
                                  </Box>
                                  ))}
                                </BlockStack>
                                </Scrollable>
                              
                                            
                              </Box>
                           
                          </Card>
                        </Grid.Cell>

                  
                      : <></>}





                       

                        <Grid.Cell columnSpan={{xs: 6, sm: 6, md: 6, lg: 6 , xl: 6}}> 
                          <Card title="Past Scan Details" sectioned>
                            <Text variant="headingLg" as="h2">
                                Key Scan Details ✨                
                            </Text>
                            <Box paddingBlock="200">
                              <Text variant="headingMd" as="h3">
                                Scan Type : {scanKeyData.scanType}                         
                              </Text>                    
                            </Box>
                            <Box paddingBlock="200">
                              <Text variant="headingMd" as="h3">
                                Requested URL                         
                              </Text>
                              <Text variant="" as="h3">
                                {scanKeyData.requestedUrl}                              
                              </Text>
                            </Box>
                            <Box paddingBlock="200">
                              <Text variant="headingMd" as="h3">
                                Final Scanned URL                           
                              </Text>
                              <Text variant="" as="h3">
                                {scanKeyData.finalUrl}                              
                              </Text>
                              <Text as="p" tone="subdued">
                                After any redirects or page actions
                              </Text>
                            </Box>
                            {/* <Box paddingBlock="200">
                              <Text variant="headingMd" as="h3">
                                User Agent                         
                              </Text>
                              <Text variant="" as="h3">
                                {scanKeyData.userAgent}                              
                              </Text>
                            </Box> */}
                            <Box paddingBlock="200">
                              <Text variant="headingMd" as="h3">
                                Fetch Time                         
                              </Text>
                              <Text variant="" as="h3">
                                {formatDate(scanKeyData.fetchTime)}                              
                              </Text>
                            </Box>
                          </Card>
                        </Grid.Cell>    


                        
                      
                      </Grid>       

                        <InlineGrid gap="400" columns={3}>
                          <Card>
                            <BlockStack inlineAlign="center">
                                <Text variant="heading2xl" as="h2" tone="success">
                                {scanKeyData.passedAuditsCount} 
                                </Text>
                                <Text variant="" as="h2" tone="success">
                                Passed Audits
                                </Text>
                              </BlockStack>
                          </Card>
                          <Card>
                            <BlockStack inlineAlign="center">
                                <Text variant="heading2xl" as="h2" tone="critical">
                                {scanKeyData.failedAuditsCount} 
                                </Text>
                                <Text variant="" as="h2" tone="critical">
                                Failed Audits
                                </Text>
                            </BlockStack>
                          </Card>
                          <Card>
                            <BlockStack inlineAlign="center">
                              <Text variant="heading2xl" as="h2" tone="">
                              {scanKeyData.nanAuditsCount} 
                              </Text>
                              <Text variant="" as="h2" tone="">
                              Audits not Applicable
                              </Text>
                            </BlockStack>
                          </Card>
                        </InlineGrid>       
                      <AuditBlockFactory auditData={parsedData} />
                    </BlockStack>
                </Layout.Section>
            </Layout>
        </Page>
    );
}
