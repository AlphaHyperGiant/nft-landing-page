const fetch = require('node-fetch')
const crypto = require('crypto')

const CONTRACT = process.env.CONTRACT_ADDRESS;
const AUTH = process.env.NFTPORT_AUTH;
const chain = "polygon";
const include = "metadata";

exports.handler = async (event, context) => {
  const headers = event.headers || {}
  const requestId =
    headers['x-request-id'] ||
    headers['X-Request-Id'] ||
    context.awsRequestId ||
    (crypto.randomUUID ? crypto.randomUUID() : `rid_${Date.now()}_${Math.random().toString(16).slice(2)}`)

  const wallet = event.queryStringParameters && event.queryStringParameters.wallet
  const pageRaw = event.queryStringParameters && event.queryStringParameters.page
  const debug = !!(event.queryStringParameters && event.queryStringParameters.debug)
  const page = Number(pageRaw || 1)

  const log = (msg, extra = {}) => {
    if (!debug) return
    console.log(JSON.stringify({ requestId, msg, ...extra }))
  }

  if (!wallet) {
    log('missing wallet query param')
    return {
      statusCode: 400,
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        'x-request-id': requestId,
      },
      body: JSON.stringify({
        requestId,
        isOwner: false,
        editions: [],
        next_page: null,
        error: 'Missing required query parameter: wallet',
      }),
    }
  }

  if (!AUTH) {
    log('missing env NFTPORT_AUTH')
    return {
      statusCode: 500,
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        'x-request-id': requestId,
      },
      body: JSON.stringify({
        requestId,
        error: 'Server misconfigured: missing NFTPORT_AUTH',
      }),
    }
  }

  if (!CONTRACT) {
    log('missing env CONTRACT_ADDRESS')
    return {
      statusCode: 500,
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        'x-request-id': requestId,
      },
      body: JSON.stringify({
        requestId,
        error: 'Server misconfigured: missing CONTRACT_ADDRESS',
      }),
    }
  }

  log('request', { wallet, page })

  const response = await getOwnedNfts({ wallet, page, requestId, log })

  return {
    'statusCode': 200,
    'headers': {
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/json',
      'x-request-id': requestId,
    },
    'body': JSON.stringify({ requestId, ...response })
  }
}

const getOwnedNfts = async ({ wallet, page, requestId, log }) => {
  const url = `https://api.nftport.xyz/v0/accounts/${wallet}/?`;
  
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: AUTH
    }
  };
  const query = new URLSearchParams({
    chain,
    include,
    page_number: page
  });

  let editions = []
  try {
    const data = await fetchData(url + query, options)
    log('received page', { page })
    const total = data.total;
    const pages = Math.ceil(total / 50);
    data.nfts.forEach(nft => {
      if(String(nft.contract_address).toLowerCase() === String(CONTRACT).toLowerCase()) {
        editions.push(nft.token_id)
      }
    })

    return {
      isOwner: editions.length > 0 ? true : false,
      editions,
      next_page: +page === pages ? null : +page + 1,
    }
  } catch(err) {
    log('error fetching NFTs', { err })
    return {
      error: err
    }
  }
}

async function fetchData(url, options) {
  return new Promise((resolve, reject) => {
    return fetch(url, options).then(res => {
      const status = res.status;            

      if(status === 200) {
        return resolve(res.json());
      } else {
        console.log(`Fetch failed with status ${status}`);
        return reject(res.json());
      }        
    }).catch(function (error) { 
      reject(error)
    });
  });
}
