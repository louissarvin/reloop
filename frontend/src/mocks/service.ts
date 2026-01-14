import type { Listing, Token, User } from './types';

// Mock Data
const MOCK_TOKENS: Record<string, Token> = {
  '1': {
    id: '1',
    name: '2023 Tesla Model 3 Long Range',
    image: 'https://images.unsplash.com/photo-1536700503339-1e4b06520771?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
    description: 'Pristine condition, single owner, 15k miles. Full Self-Driving capability included.',
    depth: 3,
    splits: [6, 4, 2], // 12% total cascade
    history: [
      { date: '2023-01-15', type: 'MINT', to: 'Alice' },
      { date: '2023-06-20', type: 'SALE', from: 'Alice', to: 'Bob', price: 35000 },
    ]
  },
  '2': {
    id: '2',
    name: '2021 Porsche 911 Carrera S',
    image: 'https://images.unsplash.com/photo-1503376763036-066120622c74?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
    description: 'Gentian Blue Metallic. Sport Chrono Package. 12k miles. Garage kept.',
    depth: 5,
    splits: [6, 5, 4, 3, 2], // 20% max cascade
    history: [
      { date: '2021-03-10', type: 'MINT', to: 'Charlie' },
    ]
  },
  '3': {
    id: '3',
    name: '2024 Rivian R1T',
    image: 'https://images.unsplash.com/photo-1670987677943-26a9925255c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
    description: 'Launch Edition. Quad-Motor AWD. Large Battery Pack. 5k miles.',
    depth: 2,
    splits: [5, 3], // 8% total
    history: []
  }
};

const MOCK_LISTINGS: Listing[] = [
  { tokenId: '1', seller: 'Bob', price: 32000, active: true, token: MOCK_TOKENS['1'] },
  { tokenId: '2', seller: 'Charlie', price: 115000, active: true, token: MOCK_TOKENS['2'] },
  { tokenId: '3', seller: 'Dave', price: 78000, active: true, token: MOCK_TOKENS['3'] },
];

const MOCK_USER: User = {
  address: '0x123...abc',
  balance: 150000,
  inventory: [],
  earnings: 2450
};

export class MockService {
  static async getListings(): Promise<Listing[]> {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
    return [...MOCK_LISTINGS];
  }

  static async getListingById(id: string): Promise<Listing | undefined> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return MOCK_LISTINGS.find(l => l.tokenId === id);
  }

  static async getTokenById(id: string): Promise<Token | undefined> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return MOCK_TOKENS[id];
  }

  static async getUser(): Promise<User> {
    return MOCK_USER;
  }

  static async buyToken(listingId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log(`Bought listing ${listingId}`);
    return true;
  }

  static async listToken(token: any): Promise<boolean> {
     await new Promise(resolve => setTimeout(resolve, 1500));
     console.log('Listed token', token);
     return true;
  }
}
