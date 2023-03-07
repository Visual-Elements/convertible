// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
    res.json([
        ["a", "b", "c"],
        [1,2,3],
        [4,5,6],
        [7,8,9]
    ])
}
