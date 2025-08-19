import axios from 'axios';
export async function fetchJupiterPrices(tokenIds) {
  try {
    const idsString = tokenIds.join(',');
    const response = await axios.get(`https://lite-api.jup.ag/price/v3?ids=${idsString}`);
    return response;
  } catch (error) {
    console.error('Jupiter API error:', error.message);
    throw new Error('Failed to fetch prices from Jupiter API');
    return null;
  }
}
