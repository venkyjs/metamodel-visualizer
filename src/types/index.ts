export type NodeType = 'root' | 'dataspace' | 'class' | 'businessConcept' | 'classDetails' | 'dataset' | 'attribute' | string;

export interface NodeData extends Record<string, unknown> {
  id: string;
  label: string;
  nodeType: NodeType;
  description?: string;
  metadata?: Record<string, unknown>;
  isExpanded?: boolean;
  isLoading?: boolean;
  parentId?: string | null;
  level?: number;
  hasChildren?: boolean;
  // Animation properties
  isNewNode?: boolean;
  isRelationshipNode?: boolean;
  animateEntrance?: boolean;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: number;
}
