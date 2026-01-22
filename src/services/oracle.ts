import axios from 'axios';

class PriceOracle {
  private static instance: PriceOracle;
  private price: number | null = null;
  private readonly COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd';
  private readonly POLLING_INTERVAL = 10000; // 10 seconds

  private constructor() {}

  public static getInstance(): PriceOracle {
    if (!PriceOracle.instance) {
      PriceOracle.instance = new PriceOracle();
    }
    return PriceOracle.instance;
  }

  public startPolling(): void {
    // Initial fetch
    this.fetchPrice();
    
    // Start polling interval
    setInterval(() => {
      this.fetchPrice();
    }, this.POLLING_INTERVAL);
    
    console.log('Price Oracle polling started');
  }

  private async fetchPrice(): Promise<void> {
    try {
      const response = await axios.get(this.COINGECKO_URL);
      if (response.data && response.data.stellar && response.data.stellar.usd) {
        this.price = response.data.stellar.usd;
        console.log(`Fetched XLM price: $${this.price}`);
      } else {
        console.warn('Invalid response structure from CoinGecko:', response.data);
      }
    } catch (error: any) {
      console.error('Error fetching XLM price:', error.message);
      // Just log the error. Price remains old value if it exists, or null.
    }
  }

  public getPrice(): number | null {
    return this.price;
  }
}

export default PriceOracle.getInstance();
