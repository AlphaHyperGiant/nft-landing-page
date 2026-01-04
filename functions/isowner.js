const fetch = require('node-fetch')

const CONTRACT = process.env.CONTRACT_ADDRESS;
const AUTH = process.env.NFTPORT_AUTH;
const chain = "polygon";
const include = "metadata";

exports.handler = async (event, context) => {
  const wallet = event.queryStringParameters && event.queryStringParameters.wallet
  const rawPage = event.queryStringParameters && event.queryStringParameters.page
  const page = Number.parseInt(rawPage, 10) || 1

  // Keep response shape stable for the client.
  if (!wallet) {
    return {
      statusCode: 400,
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Missing required query param: wallet',
        isOwner: false,
        editions: [],
        next_page: null,
      }),
    }
  }

  if (!CONTRACT || !AUTH) {
    return {
      statusCode: 500,
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Server misconfigured: missing CONTRACT_ADDRESS and/or NFTPORT_AUTH',
        isOwner: false,
        editions: [],
        next_page: null,
      }),
    }
  }

  try {
    const response = await getOwnedNfts(wallet, page)
    return {
      statusCode: 200,
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(response),
    }
  } catch (err) {
    const message =
      (err && err.message) ||
      (typeof err === 'string' ? err : 'Unknown error')

    return {
      statusCode: 502,
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: message,
        details: err && err.details ? err.details : undefined,
        isOwner: false,
        editions: [],
        next_page: null,
      }),
    }
  }
}

const getOwnedNfts = async (wallet, page) => {
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
  const data = await fetchData(url + query, options)
  console.log(`Received page ${page}`)
  const total = Number(data && data.total) || 0;
  const pages = Math.ceil(total / 50) || 1;
  const nfts = Array.isArray(data && data.nfts) ? data.nfts : [];

  nfts.forEach(nft => {
    if(nft && nft.contract_address === CONTRACT) {
      editions.push(nft.token_id)
    }
  })

  return {
    isOwner: editions.length > 0,
    editions,
    next_page: page >= pages ? null : page + 1,
  }
}

async function fetchData(url, options) {
  return new Promise((resolve, reject) => {
    return fetch(url, options)
      .then(async (res) => {
        const status = res.status;
        let body;
        try {
          body = await res.json();
        } catch {
          body = null;
        }

        if (res.ok) {
          return resolve(body);
        }

        const error = new Error(`NFTPort request failed with status ${status}`);
        error.details = body;
        return reject(error);
      })
      .catch((error) => reject(error));
  });
}
