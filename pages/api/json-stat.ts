// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type {
  NextApiRequest,
  NextApiResponse
} from 'next'

import { unzip } from 'lodash'

import JSONstat from "jsonstat-toolkit";
import oneSeries from './oneSeries.json';
import twoSeries from './twoSeries.json';
import sixSeries from './sixSeries.json';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  
  const stat = (await JSONstat(req.query.url)).Dataset(0) 
  res.setHeader('Cache-Control', 's-maxage=86400,stale-while-revalidate');

  res.status(200).json(unzip([
    getTimeSeriesData(stat),
    ...getSecondaryDimensionData(stat)
  ]))
}

// borrowed from https://stackoverflow.com/a/15310051/6091017
const cartesian = (...args) => {
  var r = [], max = args.length-1;
  function helper(arr, i) {
      for (var j=0, l=args[i].length; j<l; j++) {
          var a = arr.slice(0); // clone arr
          a.push(args[i][j]);
          if (i==max)
              r.push(a);
          else
              helper(a, i+1);
      }
  }
  helper([], 0);
  return r;
}


export function getTimeSeriesData(data) {
  return ['Time'].concat(data.Dimension(data.role.time[0]).id)
}

const tagDimensions = (serie) => {
  // The id makes up the query, the label is for the legend
  const queries = serie.categories
  .map(category => {
      return {
          [serie.dimension]: category.id,
          _label: category.label
      }
  })
  return queries
}


const getData = (stat, series) => {    
  const dimensions = series.map(tagDimensions);
  const queries = cartesian(...dimensions)
  .map((parts) => {
      // For every array of combinations of dimensional categories,
      // these are merged into one object
      // the labels are collected from each object into an array
      return parts.reduce((acc, curr) => {
          return {
              ...curr,
              ...acc,
              labels: [...acc.labels, curr._label]
          }
      }, {labels: []})
  })

  return queries.map((query) => {
    const names = query.labels.join(', ')
    
    return [names].concat(stat.Data(query, false))
  })
}

// Summarize the dimensions and categories we will fetch data for
const constructDataModel = (stat) => {
  const timeIndices = (stat.role?.time || [])
  .map((t) => stat.id.indexOf(t))

  // Any dimension that is not time
  const secondaryDimensions = stat.id
    .filter((_, index) => !timeIndices.includes(index))

  // We can safely ignore dimensions with size 1, moreover, they contribute noise
  const nonUnarySecondaryDimensions = secondaryDimensions
    .filter((id) => stat.Dimension(id)?.length > 1)

  // There's just one series, no need to specify dimensions
  if (nonUnarySecondaryDimensions.length === 0) {
      // Pick any name
      const name = Object.values(stat.Dimension(secondaryDimensions[0]).__tree__.category.label)[0]
      return [name].concat([stat.Data({}, false)])
  }
      
  const compiledData = nonUnarySecondaryDimensions
    .map(d => ({
        dimension: d,
        categories: 
            Object.entries(stat.Dimension(d).__tree__.category.label)
            .map(([k, v]) => ({id: k, label: v}))
    }))

  return compiledData
}

export function getSecondaryDimensionData(stat) {
  return getData(
    stat,
    constructDataModel(stat)
  )
}