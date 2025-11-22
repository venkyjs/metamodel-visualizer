import type { NodeData } from '../types';

// Mock Data Store
const MOCK_DATA: Record<string, string[]> = {
  '1': ['2', '3', '4', '5', '6'],
  '5': ['A', 'B', 'C'],
  'A': ['A1', 'A2'],
  'B': ['B1', 'B2'],
  'C': ['C1', 'C2'],
  '2': ['2A', '2B'],
  '3': ['3A', '3B'],
  '4': ['4A', '4B'],
  '6': ['6A', '6B'],
};

// Generic funnel for API calls
export async function request<T>(
  operation: () => Promise<T>,
  onError?: (error: Error) => void
): Promise<T | null> {
  try {
    // Global Request Interceptor (e.g. adding auth headers would go here)
    console.log('API Request started');
    
    const result = await operation();
    
    // Global Response Interceptor
    console.log('API Request successful');
    return result;
  } catch (error) {
    console.error('API Request failed', error);
    if (onError) onError(error as Error);
    return null;
  }
}

// Mock API Call
export const fetchChildren = async (nodeId: string): Promise<NodeData[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const childrenIds = MOCK_DATA[nodeId] || [];
      // Generate random children if not in mock data to allow infinite exploration
      const finalChildren = childrenIds.length > 0 ? childrenIds : generateRandomChildren(nodeId);
      
      resolve(
        finalChildren.map((id) => ({
          label: id,
          parentId: nodeId,
          isExpanded: false,
        }))
      );
    }, 800); // Simulate network delay
  });
};

function generateRandomChildren(parentId: string): string[] {
  // Just for demo purposes: empty for deeper levels unless explicitly defined
  // or let's make it infinite? The user said "The details of next level... will come from an API call. Mock the API call for now."
  // Let's keep it finite for defined keys, but return empty for others to stop expansion, 
  // or maybe generate simple generic ones like "5-1", "5-2" if we want infinite.
  // For now, returning empty array if not in MOCK_DATA is safer to avoid clutter unless we want to show off.
  // Let's add a few generic ones if we click deeply.
  if (parentId.length > 3) return []; 
  return [`${parentId}-1`, `${parentId}-2`];
}
