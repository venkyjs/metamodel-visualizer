import type { ApiResponse } from '../types';

const API_BASE_URL = '/api';

// Tree node as returned by the server
export interface TreeNode {
  id: string;
  label: string;
  type: string;
  description?: string;
  hasChildren: boolean;
  metadata?: Record<string, unknown>;
}

// Generic funnel for API calls
export async function request<T>(
  operation: () => Promise<T>,
  onError?: (error: Error) => void
): Promise<T | null> {
  try {
    console.log('API Request started');
    
    const result = await operation();
    
    console.log('API Request successful');
    return result;
  } catch (error) {
    console.error('API Request failed', error);
    if (onError) onError(error as Error);
    return null;
  }
}

/**
 * Fetch the initial root nodes for the tree
 */
export const fetchRootNodes = async (): Promise<TreeNode[]> => {
  const response = await fetch(`${API_BASE_URL}/nodes`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch root nodes');
  }
  
  const result: ApiResponse<TreeNode[]> = await response.json();
  
  if (!result.success) {
    throw new Error(`API error: ${result.message}`);
  }
  
  return result.data;
};

/**
 * Fetch children of a specific node
 * The server determines what children a node has based on its ID
 */
export const fetchNodeChildren = async (nodeId: string): Promise<TreeNode[]> => {
  const response = await fetch(`${API_BASE_URL}/nodes/${encodeURIComponent(nodeId)}/children`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch children for node ${nodeId}`);
  }
  
  const result: ApiResponse<TreeNode[]> = await response.json();
  
  if (!result.success) {
    throw new Error(`API error: ${result.message}`);
  }
  
  return result.data;
};
