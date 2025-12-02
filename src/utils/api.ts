import type { NodeData, GraphNode, ApiResponse, NodeType, GraphConfig } from '../types';

const API_BASE_URL = '/api';

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

// Fetch graph configuration
export const fetchConfig = async (): Promise<GraphConfig> => {
  const response = await fetch(`${API_BASE_URL}/config`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch graph configuration');
  }
  
  const result: ApiResponse<GraphConfig> = await response.json();
  
  if (!result.success) {
    throw new Error(`API error: ${result.message}`);
  }
  
  return result.data;
};

// Fetch from a dynamic endpoint (config-driven)
export const fetchFromEndpoint = async (endpoint: string, childType: NodeType): Promise<NodeData[]> => {
  const response = await fetch(endpoint);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch from ${endpoint}`);
  }
  
  const result: ApiResponse<GraphNode[]> = await response.json();
  
  if (!result.success) {
    throw new Error(`API error: ${result.message}`);
  }
  
  return result.data.map((node) => ({
    id: node.id,
    label: node.name,
    nodeType: childType,
    description: node.description,
    properties: node.properties,
    metadata: node.metadata,
    isExpanded: false,
    isLoading: false,
    level: 1,
  }));
};

// Fetch nodes by type
export const fetchNodesByType = async (type: string): Promise<NodeData[]> => {
  const response = await fetch(`${API_BASE_URL}/${type}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${type}`);
  }
  
  const result: ApiResponse<GraphNode[]> = await response.json();
  
  if (!result.success) {
    throw new Error(`API error: ${result.message}`);
  }
  
  // Transform GraphNode to NodeData
  return result.data.map((node) => ({
    id: node.id,
    label: node.name,
    nodeType: node.type,
    description: node.description,
    properties: node.properties,
    metadata: node.metadata,
    isExpanded: false,
    isLoading: false,
    level: 1,
  }));
};

// Fetch datasets for a specific class
export const fetchClassDatasets = async (classId: string): Promise<NodeData[]> => {
  const response = await fetch(`${API_BASE_URL}/classes/${classId}/datasets`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch datasets for class ${classId}`);
  }
  
  const result: ApiResponse<GraphNode[]> = await response.json();
  
  if (!result.success) {
    throw new Error(`API error: ${result.message}`);
  }
  
  return result.data.map((node) => ({
    id: node.id,
    label: node.name,
    nodeType: 'dataset' as NodeType,
    description: node.description,
    properties: node.properties,
    metadata: node.metadata,
    isExpanded: false,
    isLoading: false,
    level: 1,
    classId: classId,
  }));
};

// Fetch attributes for a specific class
export const fetchClassAttributes = async (classId: string): Promise<NodeData[]> => {
  const response = await fetch(`${API_BASE_URL}/classes/${classId}/attributes`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch attributes for class ${classId}`);
  }
  
  const result: ApiResponse<GraphNode[]> = await response.json();
  
  if (!result.success) {
    throw new Error(`API error: ${result.message}`);
  }
  
  return result.data.map((node) => ({
    id: node.id,
    label: node.name,
    nodeType: 'attribute' as NodeType,
    description: node.description,
    properties: node.properties,
    metadata: node.metadata,
    isExpanded: false,
    isLoading: false,
    level: 1,
    classId: classId,
  }));
};

// Type mapping for API calls
export const getApiEndpoint = (label: string): string => {
  switch (label.toLowerCase()) {
    case 'dataspaces':
      return 'dataspaces';
    case 'classes':
      return 'classes';
    case 'business concepts':
      return 'businessConcepts';
    default:
      return label.toLowerCase();
  }
};
