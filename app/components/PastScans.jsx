import {
    EmptyState,
    IndexTable,
    Link
  } from "@shopify/polaris";
import formatDate from "../util/formatdate";


export const EmptyScanState = ({ onAction }) => (
    <EmptyState
        heading="Insights on Your Shopify Store's Performance!"
        action={{
        content: "Run First Scan",
        onAction,
        }}
        image="/images/LighthouseScannerIcon_200_no_bg.png"
    >
        <p>Unlock a deeper understanding of your Shopify store's performance with ShopScan, the ultimate tool for running Google PageSpeed Insights scans directly from your Shopify admin panel. No more guessing about your store's speed and efficiency—ShopScan provides you with detailed insights to help you make informed decisions.</p>
    </EmptyState>
);
  
export const ScanTable = ({ totalScans, scansPerPage, scans, page, setPage}) => {
    
    // generate an array for relative id numbering on scans table
    const x = Array.from({ length: totalScans }, (_, index) => index + 1);

    let lastPage = Math.ceil(totalScans / scansPerPage);
    let nextScans = page < lastPage ? true : false;
    let prevScans = page > 1 ? true : false;


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
        { title: "TYPE"},
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

        <ScanTableRow key={index} page={page} index={index} scan={scan} x={x} scansPerPage={scansPerPage}/>
        )}
        )}
    </IndexTable>
    );
};
  
const ScanTableRow = ({ page, index, scan, x, scansPerPage}) => {
    return (
    <IndexTable.Row id={scan.id} position={scan.id} key={index}>
      <IndexTable.Cell>
        {x[index + (page - 1) * scansPerPage]}
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Link dataPrimaryLink="true" url={`/app/scans/${scan.id}`}>
          {scan.name}
        </Link>
      </IndexTable.Cell>
      <IndexTable.Cell>
          {scan.scanType}
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