import { TokenList } from '@uniswap/token-lists'
import schema from '@uniswap/token-lists/src/tokenlist.schema.json'
import Ajv from 'ajv'
import contenthashToUri from './contenthashToUri'
import { parseENSAddress } from './parseENSAddress'
import uriToHttp from './uriToHttp'
import tokenlist from '../tokenlist.json'

const tokenListValidator = new Ajv({ allErrors: true }).compile(schema)

/**
 * Contains the logic for resolving a list URL to a validated token list
 * @param listUrl list url
 * @param resolveENSContentHash resolves an ens name to a contenthash
 */
export default async function getTokenList(
  listUrl: string,
  resolveENSContentHash: (ensName: string) => Promise<string>
): Promise<TokenList> {
  //const json = await response.json()
  const json = tokenlist
  if (!tokenListValidator(json)) {
    const validationErrors: string =
      tokenListValidator.errors?.reduce<string>((memo, error) => {
        const add = `${error.dataPath} ${error.message ?? ''}`
        return memo.length > 0 ? `${memo}; ${add}` : `${add}`
      }, '') ?? 'unknown error'
    throw new Error(`Token list failed validation: ${validationErrors}`)
  }
  return json
}
