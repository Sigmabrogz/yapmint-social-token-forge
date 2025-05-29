
export interface YapsData {
  yaps_l24h: number;
  rank?: number;
  score?: number;
}

export const fetchYapsData = async (username: string): Promise<YapsData> => {
  try {
    console.log(`Fetching Yaps data for username: ${username}`);
    
    const proxyUrl = `https://sun-bittersweet-whimsey.glitch.me/yaps?username=${username}`;
    console.log(`Making request to: ${proxyUrl}`);
    
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Received data:', data);
    
    // Handle the response structure from your Glitch proxy
    if (data && typeof data.yaps_l24h === 'number') {
      return {
        yaps_l24h: data.yaps_l24h,
        rank: data.rank,
        score: data.score
      };
    } else {
      // Fallback if data structure is unexpected
      console.warn('Unexpected API response structure:', data);
      return {
        yaps_l24h: data.yaps_l24h || 0,
        rank: data.rank,
        score: data.score
      };
    }
    
  } catch (error) {
    console.error('Error fetching Yaps data:', error);
    throw new Error('Failed to fetch Yaps data from Kaito API');
  }
};
