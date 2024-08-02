import {
    EmptyState,
    IndexTable,
    Link
  } from "@shopify/polaris";
import formatDate from "../util/formatdate";


export const EmptyScanState = ({ onAction }) => (
    <EmptyState
        heading="Run a Google Lighthouse Scan on your Shopify store"
        action={{
        content: "Scan",
        onAction,
        }}
        image="https://developer.chrome.com/static/docs/lighthouse/overview/image/lighthouse-logo-3c45f51ca8cfc.svg"
    >
        <p>Our Shopify app integrates a Google Lighthouse scanner directly into your store's dashboard, allowing you to conveniently assess the performance of your domains. By running comprehensive scans, you can evaluate key metrics such as speed, accessibility, and SEO. The app provides detailed reports that help you understand how well your site performs in these areas and identify specific improvements you can make. This tool is designed to help you ensure that your store offers a fast, accessible, and optimized experience for all visitors.</p>
    </EmptyState>
);
  
export const ScanTable = ({ totalScans, scansPerPage, scans, page, setPage}) => {
    
    const x = Array.from({ length: totalScans }, (_, index) => index + 1);

    let nextScans = true;
    let prevScans = false;
    
    if( scansPerPage > scans.length) { 
        nextScans = false;
    } 

    if(page > 1){
        prevScans = true;
    }

    if(scans.length == 0){
        return <></>
    }

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
        pagination={{
            hasNext: nextScans,
            hasPrevious: prevScans,
            onPrevious: () => {
                if (page === 1) return;
                setPage(page - 1);
            },
            onNext: () => {
                setPage(page + 1);
            },
          }}
    >
        {scans.map((scan,index) => {
        return (
        <ScanTableRow page={page} index={index} key={scan.id} scan={scan} x={x} scansPerPage={scansPerPage}/>
        )}
        )}
    </IndexTable>
    );
};
  
const ScanTableRow = ({ scan, x, index, page, scansPerPage}) => {
    return (
    <IndexTable.Row id={scan.id} position={scan.id}>
      <IndexTable.Cell>
        {x[index + (page - 1) * scansPerPage]}
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Link dataPrimaryLink="true" url={`/app/scans/${scan.id}`}>
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