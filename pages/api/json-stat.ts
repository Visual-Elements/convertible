// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

import JSONstat from "jsonstat-toolkit";

type Data = {
  name: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {

  let stat = await JSONstat(req.query.url)
  let table = stat.Dataset(0).toTable({type: 'array'})
  // Shift first column to last column
  // to conform to everviz expectations
  table.forEach((el) => {
    let a = el.shift()
    let b = el.pop()
    el.push(a)
    el.unshift(b)
  });
  res.json(table)
}
