import type { NextApiRequest, NextApiResponse } from 'next'
import _ from 'lodash';
import Papa from 'papaparse';

function polygon(polygonTickerResponse) {
  const results = polygonTickerResponse.results;

  const transformedData = results.map(result => ({
    Time: new Date(result.t).toISOString(),
    Open: result.o,
    // High: result.h,
    // Low: result.l,
    // Close: result.c,
    // Volume: result.v,
    // VWAP: result.vw,
    // Trades: result.n,
  }));

  return Papa.unparse(transformedData);
}

const cache = {};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  
    const baseUrl = 'https://api.polygon.io';
    const apiKey = 'sBgJbqIpxS1Ee5HZABnPnkrupj4XikBz';
    const url = new URL(`${baseUrl}/${req.url.replace('/api/polygon/', '')}`);
    url.searchParams.append('apiKey', apiKey);
    
    const cacheKey = url.toString();

    if (cache[cacheKey]) {
      res.send(cache[cacheKey]);
      return;
    }


    const response = await fetch(cacheKey);
  
    if (!response.ok) {
      throw new Error(`Failed to fetch data from Polygon API: ${response.statusText}`);
    }
  
    const j = await response.json()
    const r = polygon(j)

    cache[cacheKey] = r;
    res.send(r);  
}

