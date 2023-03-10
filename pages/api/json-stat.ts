// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type {
  NextApiRequest,
  NextApiResponse
} from 'next'

import JSONstat from "jsonstat-toolkit";
import oneSeries from './oneSeries.json';
import twoSeries from './twoSeries.json';

export function getTimeSeriesData(data) {
  return ['Time'].concat(data.Dimension(data.role.time[0]).id)
}

export function getSecondaryDimensionData(data) {
  const timeIndices = data.role.time
      .map((t) => data.id.indexOf(t))

  const secondaryDimensions = data.id
      .filter((_, index) => !timeIndices.includes(index))

  const nonUnarySecondaryDimension = secondaryDimensions
      .filter((id) => data.Dimension(id).length > 1)[0]

  // There's just one series, no need to specify dimensions
  if (nonUnarySecondaryDimension == undefined) {
      return [data.Data({}, false)]
  }

  const nonUnarySecondaryDimensionIds = data
      .Dimension(nonUnarySecondaryDimension).id

  return nonUnarySecondaryDimensionIds
      .map((id) => ['Data'].concat(data.Data({
          [nonUnarySecondaryDimension]: id
      }, false)))
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  const stat = (await JSONstat(twoSeries)).Dataset(0) 
  res.json([
    getTimeSeriesData(stat),
    ...getSecondaryDimensionData(stat)
  ])
}