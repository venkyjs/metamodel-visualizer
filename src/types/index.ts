export type NodeType = 'root' | 'dataspace' | 'class' | 'businessConcept' | 'classDetails' | 'dataset' | 'attribute' | string;

export interface GraphNode {
  id: string;
  name: string;
  type: NodeType;
  description?: string;
  properties?: Record<string, string | number | boolean>;
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    owner?: string;
    tags?: string[];
  };
}

export interface NodeData extends Record<string, unknown> {
  id: string;
  label: string;
  nodeType: NodeType;
  description?: string;
  properties?: Record<string, string | number | boolean>;
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    owner?: string;
    tags?: string[];
  };
  isExpanded?: boolean;
  isLoading?: boolean;
  parentId?: string | null;
  level?: number;
  classId?: string; // Used by classDetails nodes to identify the parent class
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

// Graph Config Types
export interface InitialNodeConfig {
  id: string;
  label: string;
  nodeType: NodeType;
}

export interface LabelMapping {
  endpoint: string;
  childType: NodeType;
}

export interface StaticChildConfig {
  idSuffix: string;
  label: string;
  nodeType: NodeType;
  descriptionTemplate?: string;
}

export type ClickBehavior = 'none' | 'fetchByLabel' | 'staticChildren';

export interface NodeTypeConfig {
  clickBehavior: ClickBehavior;
  labelMapping?: Record<string, LabelMapping>;
  staticChildren?: StaticChildConfig[];
}

export interface GraphConfig {
  initialNodes: InitialNodeConfig[];
  nodeTypeConfig: Record<string, NodeTypeConfig>;
}
