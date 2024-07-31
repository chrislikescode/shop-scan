import db from "../db.server";
import axios from "axios";

export async function getScan(shop) {
  const scan = await db.scan.findFirst({
      where: {
        shop: shop,
      },
      orderBy: {
        createdAt: 'desc', // Ensure this field exists in your model
      },
    });  

    if (!scan) {
      return ({data: null});
    }
  
    return ({data: scan.data});
}

export async function getScans(shop) {
  const scans = await db.scan.findMany({
    where: {
      shop: shop,
    },
    orderBy: {
      createdAt: 'asc', // Ensure this field exists in your model
    },
    select: {
      id: true,
      shop: true,
      name: true,
      createdAt: true,
    },
  });

  if (!scans || scans.length === 0) {
    return null;
  }

  return scans;
}

export async function getScanById(shop,id) {

  const scan = await db.scan.findFirst({
    where: {
      shop: shop,
      id:  parseInt(id, 10),
     }
    }
  )

  if (!scan) {
    return null;
  }
  
  return scan;
};


function ensureHttps(url) {
  // Check if the URL already includes 'http://' or 'https://'
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    // If it doesn't, add 'https://'
    return `https://${url}`;
  } else if (url.startsWith('http://')) {
    // If it starts with 'http://', replace it with 'https://'
    return `https://${url.slice(7)}`;
  }
  
  // If it already starts with 'https://', return the URL as is
  return url;
}


async function constructPageSpeedApiUrl(data) {

  const {url, scanTypes, deviceStrategy} = data;

  const baseUrl = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

  const cleanedUrl = ensureHttps(url);
  const params = new URLSearchParams({url: cleanedUrl, key: process.env.GOOGLE_PAGE_SPEED_API_KEY});

  if (scanTypes) params.append("category", scanTypes);
  if (deviceStrategy) params.append("strategy", deviceStrategy);

  return `${baseUrl}?${params.toString()}`;
}

export async function runScan(data,shop) {
    try {
        const API_URL = await constructPageSpeedApiUrl(data);
        const response = await axios.get(API_URL);
        const responseData = response.data;
        const cleanData = await formatScanData(responseData);
        const savedScan = await saveScan(cleanData,shop,data.name);
        return savedScan;
    } catch (error) {
        console.error("Error running new scan", error);
        throw error
    }       
}


async function formatScanData(data) {

    return {
      ...data,
    };
}

async function saveScan(data, shop, name) {
    const scan = await db.Scan.create({
      data: {
        shop: shop,
        data: JSON.stringify(data),
        name: name,
      },
    });
    return scan;
}