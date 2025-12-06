import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Types for API responses
interface TreeNode {
  id: string;
  label: string;
  type: string;
  description?: string;
  hasChildren: boolean;
  metadata?: Record<string, unknown>;
}

// Internal data types
interface DataspaceData {
  id: string;
  name: string;
  description: string;
  properties: Record<string, string | number | boolean>;
  metadata: {
    createdAt: string;
    updatedAt: string;
    owner: string;
    tags: string[];
  };
}

interface ClassData {
  id: string;
  name: string;
  description: string;
  properties: Record<string, string | number | boolean>;
  metadata: {
    createdAt: string;
    updatedAt: string;
    owner: string;
    tags: string[];
  };
}

interface BusinessConceptData {
  id: string;
  name: string;
  description: string;
  properties: Record<string, string | number | boolean>;
  metadata: {
    createdAt: string;
    updatedAt: string;
    owner: string;
    tags: string[];
  };
}

interface DatasetData {
  id: string;
  name: string;
  description: string;
  classId: string;
  properties: {
    format: string;
    size: string;
    recordCount: number;
    lastRefreshed: string;
    quality: string;
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    owner: string;
    tags: string[];
  };
}

interface AttributeData {
  id: string;
  name: string;
  description: string;
  classId: string;
  properties: {
    dataType: string;
    nullable: boolean;
    isPrimaryKey: boolean;
    isForeignKey: boolean;
    defaultValue: string | null;
    constraints: string[];
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    owner: string;
    tags: string[];
  };
}

// Mock Data
const mockDataspaces: DataspaceData[] = [
  {
    id: 'ds-001',
    name: 'Customer Data Hub',
    description: 'Central repository for all customer-related data including profiles, interactions, and preferences.',
    properties: {
      region: 'North America',
      classification: 'PII',
      retention: '7 years',
      encrypted: true,
      recordCount: 2450000,
    },
    metadata: {
      createdAt: '2023-06-15T10:30:00Z',
      updatedAt: '2024-11-20T14:22:00Z',
      owner: 'Data Engineering Team',
      tags: ['customer', 'pii', 'gdpr-compliant'],
    },
  },
  {
    id: 'ds-002',
    name: 'Financial Transactions',
    description: 'Secure storage for all financial transaction records and audit trails.',
    properties: {
      region: 'Global',
      classification: 'Confidential',
      retention: '10 years',
      encrypted: true,
      recordCount: 15800000,
    },
    metadata: {
      createdAt: '2022-01-10T08:00:00Z',
      updatedAt: '2024-11-28T09:15:00Z',
      owner: 'Finance Operations',
      tags: ['finance', 'audit', 'sox-compliant'],
    },
  },
  {
    id: 'ds-003',
    name: 'Product Catalog',
    description: 'Master data for all products, SKUs, and inventory management.',
    properties: {
      region: 'Global',
      classification: 'Internal',
      retention: '5 years',
      encrypted: false,
      recordCount: 85000,
    },
    metadata: {
      createdAt: '2021-08-22T12:00:00Z',
      updatedAt: '2024-11-25T16:45:00Z',
      owner: 'Product Management',
      tags: ['product', 'inventory', 'master-data'],
    },
  },
  {
    id: 'ds-004',
    name: 'Analytics Warehouse',
    description: 'Aggregated and processed data optimized for business intelligence and reporting.',
    properties: {
      region: 'US-East',
      classification: 'Internal',
      retention: '3 years',
      encrypted: true,
      recordCount: 500000000,
    },
    metadata: {
      createdAt: '2023-03-01T09:00:00Z',
      updatedAt: '2024-11-29T11:30:00Z',
      owner: 'BI Team',
      tags: ['analytics', 'reporting', 'aggregated'],
    },
  },
];

const mockClasses: ClassData[] = [
  {
    id: 'cls-001',
    name: 'Customer',
    description: 'Represents an individual or organization that purchases products or services.',
    properties: {
      attributes: 12,
      relationships: 5,
      instances: 2450000,
      isAbstract: false,
    },
    metadata: {
      createdAt: '2022-04-10T14:00:00Z',
      updatedAt: '2024-10-15T10:20:00Z',
      owner: 'Data Architecture',
      tags: ['core-entity', 'customer-domain'],
    },
  },
  {
    id: 'cls-002',
    name: 'Order',
    description: 'A request by a customer to purchase one or more products or services.',
    properties: {
      attributes: 18,
      relationships: 8,
      instances: 8900000,
      isAbstract: false,
    },
    metadata: {
      createdAt: '2022-04-10T14:30:00Z',
      updatedAt: '2024-11-01T09:45:00Z',
      owner: 'Data Architecture',
      tags: ['core-entity', 'transaction'],
    },
  },
  {
    id: 'cls-003',
    name: 'Product',
    description: 'A tangible or intangible item offered for sale.',
    properties: {
      attributes: 25,
      relationships: 12,
      instances: 85000,
      isAbstract: false,
    },
    metadata: {
      createdAt: '2022-04-11T08:00:00Z',
      updatedAt: '2024-09-20T14:15:00Z',
      owner: 'Data Architecture',
      tags: ['core-entity', 'product-domain'],
    },
  },
  {
    id: 'cls-004',
    name: 'Payment',
    description: 'A financial transaction representing the transfer of value.',
    properties: {
      attributes: 15,
      relationships: 4,
      instances: 12000000,
      isAbstract: false,
    },
    metadata: {
      createdAt: '2022-05-02T11:00:00Z',
      updatedAt: '2024-11-10T16:30:00Z',
      owner: 'Data Architecture',
      tags: ['financial', 'transaction'],
    },
  },
  {
    id: 'cls-005',
    name: 'Address',
    description: 'Physical or digital location associated with entities.',
    properties: {
      attributes: 10,
      relationships: 3,
      instances: 3200000,
      isAbstract: false,
    },
    metadata: {
      createdAt: '2022-04-12T09:30:00Z',
      updatedAt: '2024-08-05T12:00:00Z',
      owner: 'Data Architecture',
      tags: ['supporting-entity', 'location'],
    },
  },
];

const mockBusinessConcepts: BusinessConceptData[] = [
  {
    id: 'bc-001',
    name: 'Customer Lifetime Value',
    description: 'The total revenue a business can expect from a single customer account throughout their relationship.',
    properties: {
      formula: 'Average Purchase Value × Purchase Frequency × Customer Lifespan',
      unit: 'USD',
      aggregationType: 'sum',
      refreshFrequency: 'monthly',
    },
    metadata: {
      createdAt: '2023-01-15T10:00:00Z',
      updatedAt: '2024-11-15T08:45:00Z',
      owner: 'Business Intelligence',
      tags: ['kpi', 'customer-analytics', 'revenue'],
    },
  },
  {
    id: 'bc-002',
    name: 'Net Revenue',
    description: 'Total revenue minus returns, allowances, and discounts.',
    properties: {
      formula: 'Gross Revenue - Returns - Discounts - Allowances',
      unit: 'USD',
      aggregationType: 'sum',
      refreshFrequency: 'daily',
    },
    metadata: {
      createdAt: '2022-06-01T12:00:00Z',
      updatedAt: '2024-11-28T10:00:00Z',
      owner: 'Finance',
      tags: ['kpi', 'financial', 'revenue'],
    },
  },
  {
    id: 'bc-003',
    name: 'Inventory Turnover',
    description: 'Measures how many times inventory is sold and replaced over a period.',
    properties: {
      formula: 'Cost of Goods Sold / Average Inventory',
      unit: 'ratio',
      aggregationType: 'average',
      refreshFrequency: 'weekly',
    },
    metadata: {
      createdAt: '2023-02-20T14:30:00Z',
      updatedAt: '2024-10-01T11:20:00Z',
      owner: 'Supply Chain',
      tags: ['kpi', 'operations', 'inventory'],
    },
  },
  {
    id: 'bc-004',
    name: 'Customer Churn Rate',
    description: 'The percentage of customers who stop using your product or service during a given time period.',
    properties: {
      formula: '(Customers at Start - Customers at End) / Customers at Start × 100',
      unit: 'percentage',
      aggregationType: 'average',
      refreshFrequency: 'monthly',
    },
    metadata: {
      createdAt: '2023-03-10T09:00:00Z',
      updatedAt: '2024-11-20T15:30:00Z',
      owner: 'Customer Success',
      tags: ['kpi', 'customer-analytics', 'retention'],
    },
  },
  {
    id: 'bc-005',
    name: 'Order Fulfillment Time',
    description: 'The average time from order placement to delivery completion.',
    properties: {
      formula: 'Delivery Date - Order Date',
      unit: 'days',
      aggregationType: 'average',
      refreshFrequency: 'daily',
    },
    metadata: {
      createdAt: '2023-04-05T16:00:00Z',
      updatedAt: '2024-11-25T13:45:00Z',
      owner: 'Operations',
      tags: ['kpi', 'operations', 'logistics'],
    },
  },
  {
    id: 'bc-006',
    name: 'Gross Margin',
    description: 'The difference between revenue and cost of goods sold, expressed as a percentage of revenue.',
    properties: {
      formula: '(Revenue - COGS) / Revenue × 100',
      unit: 'percentage',
      aggregationType: 'average',
      refreshFrequency: 'monthly',
    },
    metadata: {
      createdAt: '2022-07-12T10:30:00Z',
      updatedAt: '2024-11-18T09:15:00Z',
      owner: 'Finance',
      tags: ['kpi', 'financial', 'profitability'],
    },
  },
];

// Mock Datasets per Class
const mockDatasets: Record<string, DatasetData[]> = {
  'cls-001': [
    {
      id: 'ds-cust-001',
      name: 'Customer Profiles',
      description: 'Complete customer profile information including demographics and preferences.',
      classId: 'cls-001',
      properties: {
        format: 'Parquet',
        size: '2.4 GB',
        recordCount: 2450000,
        lastRefreshed: '2024-11-29T08:00:00Z',
        quality: '98.5%',
      },
      metadata: {
        createdAt: '2023-01-15T10:00:00Z',
        updatedAt: '2024-11-29T08:00:00Z',
        owner: 'Customer Data Team',
        tags: ['customer', 'profile', 'master-data'],
      },
    },
    {
      id: 'ds-cust-002',
      name: 'Customer Interactions',
      description: 'Historical record of all customer interactions across channels.',
      classId: 'cls-001',
      properties: {
        format: 'Delta Lake',
        size: '15.8 GB',
        recordCount: 45000000,
        lastRefreshed: '2024-11-29T12:00:00Z',
        quality: '96.2%',
      },
      metadata: {
        createdAt: '2023-03-20T14:00:00Z',
        updatedAt: '2024-11-29T12:00:00Z',
        owner: 'Customer Data Team',
        tags: ['customer', 'interactions', 'events'],
      },
    },
  ],
  'cls-002': [
    {
      id: 'ds-ord-001',
      name: 'Orders Master',
      description: 'Primary order records with complete order details.',
      classId: 'cls-002',
      properties: {
        format: 'Parquet',
        size: '8.2 GB',
        recordCount: 8900000,
        lastRefreshed: '2024-11-29T06:00:00Z',
        quality: '99.1%',
      },
      metadata: {
        createdAt: '2022-06-10T09:00:00Z',
        updatedAt: '2024-11-29T06:00:00Z',
        owner: 'Order Management',
        tags: ['orders', 'transactions', 'master-data'],
      },
    },
    {
      id: 'ds-ord-002',
      name: 'Order Line Items',
      description: 'Individual line items within each order.',
      classId: 'cls-002',
      properties: {
        format: 'Delta Lake',
        size: '12.5 GB',
        recordCount: 35000000,
        lastRefreshed: '2024-11-29T06:00:00Z',
        quality: '98.8%',
      },
      metadata: {
        createdAt: '2022-06-10T09:30:00Z',
        updatedAt: '2024-11-29T06:00:00Z',
        owner: 'Order Management',
        tags: ['orders', 'line-items', 'detail'],
      },
    },
  ],
  'cls-003': [
    {
      id: 'ds-prod-001',
      name: 'Product Catalog',
      description: 'Complete product catalog with all product information.',
      classId: 'cls-003',
      properties: {
        format: 'JSON',
        size: '450 MB',
        recordCount: 85000,
        lastRefreshed: '2024-11-28T22:00:00Z',
        quality: '99.5%',
      },
      metadata: {
        createdAt: '2021-08-15T10:00:00Z',
        updatedAt: '2024-11-28T22:00:00Z',
        owner: 'Product Management',
        tags: ['product', 'catalog', 'master-data'],
      },
    },
  ],
  'cls-004': [
    {
      id: 'ds-pay-001',
      name: 'Payment Transactions',
      description: 'All payment transaction records.',
      classId: 'cls-004',
      properties: {
        format: 'Parquet',
        size: '18.3 GB',
        recordCount: 12000000,
        lastRefreshed: '2024-11-29T10:00:00Z',
        quality: '99.9%',
      },
      metadata: {
        createdAt: '2022-05-02T11:00:00Z',
        updatedAt: '2024-11-29T10:00:00Z',
        owner: 'Finance Operations',
        tags: ['payment', 'financial', 'transactions'],
      },
    },
  ],
  'cls-005': [
    {
      id: 'ds-addr-001',
      name: 'Address Registry',
      description: 'Validated and standardized address records.',
      classId: 'cls-005',
      properties: {
        format: 'Parquet',
        size: '1.2 GB',
        recordCount: 3200000,
        lastRefreshed: '2024-11-27T18:00:00Z',
        quality: '97.8%',
      },
      metadata: {
        createdAt: '2022-04-12T09:30:00Z',
        updatedAt: '2024-11-27T18:00:00Z',
        owner: 'Data Quality Team',
        tags: ['address', 'location', 'standardized'],
      },
    },
  ],
};

// Mock Attributes per Class
const mockAttributes: Record<string, AttributeData[]> = {
  'cls-001': [
    {
      id: 'attr-cust-001',
      name: 'customer_id',
      description: 'Unique identifier for each customer.',
      classId: 'cls-001',
      properties: {
        dataType: 'UUID',
        nullable: false,
        isPrimaryKey: true,
        isForeignKey: false,
        defaultValue: null,
        constraints: ['NOT NULL', 'UNIQUE'],
      },
      metadata: {
        createdAt: '2022-04-10T14:00:00Z',
        updatedAt: '2024-10-15T10:20:00Z',
        owner: 'Data Architecture',
        tags: ['identifier', 'primary-key'],
      },
    },
    {
      id: 'attr-cust-002',
      name: 'email',
      description: 'Customer email address for communication.',
      classId: 'cls-001',
      properties: {
        dataType: 'VARCHAR(255)',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        defaultValue: null,
        constraints: ['NOT NULL', 'EMAIL_FORMAT'],
      },
      metadata: {
        createdAt: '2022-04-10T14:00:00Z',
        updatedAt: '2024-10-15T10:20:00Z',
        owner: 'Data Architecture',
        tags: ['contact', 'pii'],
      },
    },
    {
      id: 'attr-cust-003',
      name: 'full_name',
      description: 'Complete name of the customer.',
      classId: 'cls-001',
      properties: {
        dataType: 'VARCHAR(200)',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        defaultValue: null,
        constraints: ['NOT NULL'],
      },
      metadata: {
        createdAt: '2022-04-10T14:00:00Z',
        updatedAt: '2024-10-15T10:20:00Z',
        owner: 'Data Architecture',
        tags: ['name', 'pii'],
      },
    },
    {
      id: 'attr-cust-004',
      name: 'created_at',
      description: 'Timestamp when customer record was created.',
      classId: 'cls-001',
      properties: {
        dataType: 'TIMESTAMP',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        defaultValue: 'CURRENT_TIMESTAMP',
        constraints: ['NOT NULL'],
      },
      metadata: {
        createdAt: '2022-04-10T14:00:00Z',
        updatedAt: '2024-10-15T10:20:00Z',
        owner: 'Data Architecture',
        tags: ['audit', 'timestamp'],
      },
    },
  ],
  'cls-002': [
    {
      id: 'attr-ord-001',
      name: 'order_id',
      description: 'Unique identifier for each order.',
      classId: 'cls-002',
      properties: {
        dataType: 'UUID',
        nullable: false,
        isPrimaryKey: true,
        isForeignKey: false,
        defaultValue: null,
        constraints: ['NOT NULL', 'UNIQUE'],
      },
      metadata: {
        createdAt: '2022-04-10T14:30:00Z',
        updatedAt: '2024-11-01T09:45:00Z',
        owner: 'Data Architecture',
        tags: ['identifier', 'primary-key'],
      },
    },
    {
      id: 'attr-ord-002',
      name: 'customer_id',
      description: 'Reference to the customer who placed the order.',
      classId: 'cls-002',
      properties: {
        dataType: 'UUID',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: true,
        defaultValue: null,
        constraints: ['NOT NULL', 'REFERENCES customers(customer_id)'],
      },
      metadata: {
        createdAt: '2022-04-10T14:30:00Z',
        updatedAt: '2024-11-01T09:45:00Z',
        owner: 'Data Architecture',
        tags: ['foreign-key', 'relationship'],
      },
    },
    {
      id: 'attr-ord-003',
      name: 'total_amount',
      description: 'Total monetary value of the order.',
      classId: 'cls-002',
      properties: {
        dataType: 'DECIMAL(12,2)',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        defaultValue: '0.00',
        constraints: ['NOT NULL', 'CHECK (total_amount >= 0)'],
      },
      metadata: {
        createdAt: '2022-04-10T14:30:00Z',
        updatedAt: '2024-11-01T09:45:00Z',
        owner: 'Data Architecture',
        tags: ['financial', 'amount'],
      },
    },
    {
      id: 'attr-ord-004',
      name: 'order_status',
      description: 'Current status of the order.',
      classId: 'cls-002',
      properties: {
        dataType: 'ENUM',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        defaultValue: 'PENDING',
        constraints: ['NOT NULL', "IN ('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED')"],
      },
      metadata: {
        createdAt: '2022-04-10T14:30:00Z',
        updatedAt: '2024-11-01T09:45:00Z',
        owner: 'Data Architecture',
        tags: ['status', 'workflow'],
      },
    },
  ],
  'cls-003': [
    {
      id: 'attr-prod-001',
      name: 'product_id',
      description: 'Unique identifier for each product.',
      classId: 'cls-003',
      properties: {
        dataType: 'UUID',
        nullable: false,
        isPrimaryKey: true,
        isForeignKey: false,
        defaultValue: null,
        constraints: ['NOT NULL', 'UNIQUE'],
      },
      metadata: {
        createdAt: '2022-04-11T08:00:00Z',
        updatedAt: '2024-09-20T14:15:00Z',
        owner: 'Data Architecture',
        tags: ['identifier', 'primary-key'],
      },
    },
    {
      id: 'attr-prod-002',
      name: 'sku',
      description: 'Stock Keeping Unit code.',
      classId: 'cls-003',
      properties: {
        dataType: 'VARCHAR(50)',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        defaultValue: null,
        constraints: ['NOT NULL', 'UNIQUE'],
      },
      metadata: {
        createdAt: '2022-04-11T08:00:00Z',
        updatedAt: '2024-09-20T14:15:00Z',
        owner: 'Data Architecture',
        tags: ['inventory', 'code'],
      },
    },
    {
      id: 'attr-prod-003',
      name: 'price',
      description: 'Current selling price of the product.',
      classId: 'cls-003',
      properties: {
        dataType: 'DECIMAL(10,2)',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        defaultValue: '0.00',
        constraints: ['NOT NULL', 'CHECK (price >= 0)'],
      },
      metadata: {
        createdAt: '2022-04-11T08:00:00Z',
        updatedAt: '2024-09-20T14:15:00Z',
        owner: 'Data Architecture',
        tags: ['pricing', 'financial'],
      },
    },
  ],
  'cls-004': [
    {
      id: 'attr-pay-001',
      name: 'payment_id',
      description: 'Unique identifier for each payment.',
      classId: 'cls-004',
      properties: {
        dataType: 'UUID',
        nullable: false,
        isPrimaryKey: true,
        isForeignKey: false,
        defaultValue: null,
        constraints: ['NOT NULL', 'UNIQUE'],
      },
      metadata: {
        createdAt: '2022-05-02T11:00:00Z',
        updatedAt: '2024-11-10T16:30:00Z',
        owner: 'Data Architecture',
        tags: ['identifier', 'primary-key'],
      },
    },
    {
      id: 'attr-pay-002',
      name: 'amount',
      description: 'Payment amount.',
      classId: 'cls-004',
      properties: {
        dataType: 'DECIMAL(12,2)',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        defaultValue: null,
        constraints: ['NOT NULL', 'CHECK (amount > 0)'],
      },
      metadata: {
        createdAt: '2022-05-02T11:00:00Z',
        updatedAt: '2024-11-10T16:30:00Z',
        owner: 'Data Architecture',
        tags: ['financial', 'amount'],
      },
    },
    {
      id: 'attr-pay-003',
      name: 'payment_method',
      description: 'Method used for payment.',
      classId: 'cls-004',
      properties: {
        dataType: 'ENUM',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        defaultValue: null,
        constraints: ['NOT NULL', "IN ('CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'PAYPAL', 'CASH')"],
      },
      metadata: {
        createdAt: '2022-05-02T11:00:00Z',
        updatedAt: '2024-11-10T16:30:00Z',
        owner: 'Data Architecture',
        tags: ['payment', 'method'],
      },
    },
  ],
  'cls-005': [
    {
      id: 'attr-addr-001',
      name: 'address_id',
      description: 'Unique identifier for each address.',
      classId: 'cls-005',
      properties: {
        dataType: 'UUID',
        nullable: false,
        isPrimaryKey: true,
        isForeignKey: false,
        defaultValue: null,
        constraints: ['NOT NULL', 'UNIQUE'],
      },
      metadata: {
        createdAt: '2022-04-12T09:30:00Z',
        updatedAt: '2024-08-05T12:00:00Z',
        owner: 'Data Architecture',
        tags: ['identifier', 'primary-key'],
      },
    },
    {
      id: 'attr-addr-002',
      name: 'street_address',
      description: 'Street number and name.',
      classId: 'cls-005',
      properties: {
        dataType: 'VARCHAR(255)',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        defaultValue: null,
        constraints: ['NOT NULL'],
      },
      metadata: {
        createdAt: '2022-04-12T09:30:00Z',
        updatedAt: '2024-08-05T12:00:00Z',
        owner: 'Data Architecture',
        tags: ['location', 'address'],
      },
    },
    {
      id: 'attr-addr-003',
      name: 'postal_code',
      description: 'ZIP or postal code.',
      classId: 'cls-005',
      properties: {
        dataType: 'VARCHAR(20)',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        defaultValue: null,
        constraints: ['NOT NULL'],
      },
      metadata: {
        createdAt: '2022-04-12T09:30:00Z',
        updatedAt: '2024-08-05T12:00:00Z',
        owner: 'Data Architecture',
        tags: ['location', 'postal'],
      },
    },
  ],
};

// Helper to add delay for realistic API feel
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================================================
// Node Resolution Logic - Server determines the tree structure
// ============================================================================

/**
 * Get the initial/root nodes for the tree
 */
function getRootNodes(): TreeNode[] {
  return [
    {
      id: 'root-dataspaces',
      label: 'Dataspaces',
      type: 'root',
      hasChildren: true,
    },
    {
      id: 'root-classes',
      label: 'Classes',
      type: 'root',
      hasChildren: true,
    },
    {
      id: 'root-businessconcepts',
      label: 'Business Concepts',
      type: 'root',
      hasChildren: true,
    },
  ];
}

/**
 * Get children for any given node ID
 * The server determines what children a node has based on its ID and type
 */
function getChildrenForNode(nodeId: string): TreeNode[] {
  // Root nodes - return the corresponding data
  if (nodeId === 'root-dataspaces') {
    return mockDataspaces.map(ds => ({
      id: ds.id,
      label: ds.name,
      type: 'dataspace',
      description: ds.description,
      hasChildren: false,
      metadata: { ...ds.properties, ...ds.metadata },
    }));
  }

  if (nodeId === 'root-classes') {
    return mockClasses.map(cls => ({
      id: cls.id,
      label: cls.name,
      type: 'class',
      description: cls.description,
      hasChildren: true, // Classes have Datasets and Attributes as children
      metadata: { ...cls.properties, ...cls.metadata },
    }));
  }

  if (nodeId === 'root-businessconcepts') {
    return mockBusinessConcepts.map(bc => ({
      id: bc.id,
      label: bc.name,
      type: 'businessConcept',
      description: bc.description,
      hasChildren: false,
      metadata: { ...bc.properties, ...bc.metadata },
    }));
  }

  // Class nodes - return static children (Datasets folder, Attributes folder)
  if (nodeId.startsWith('cls-')) {
    const classData = mockClasses.find(c => c.id === nodeId);
    if (classData) {
      return [
        {
          id: `${nodeId}-datasets`,
          label: 'Datasets',
          type: 'classDetails',
          description: `Datasets associated with ${classData.name}`,
          hasChildren: true,
        },
        {
          id: `${nodeId}-attributes`,
          label: 'Attributes',
          type: 'classDetails',
          description: `Attributes defined in ${classData.name}`,
          hasChildren: true,
        },
      ];
    }
  }

  // ClassDetails nodes (Datasets folder or Attributes folder)
  if (nodeId.endsWith('-datasets')) {
    const classId = nodeId.replace('-datasets', '');
    const datasets = mockDatasets[classId] || [];
    return datasets.map(ds => ({
      id: ds.id,
      label: ds.name,
      type: 'dataset',
      description: ds.description,
      hasChildren: false,
      metadata: { ...ds.properties, ...ds.metadata },
    }));
  }

  if (nodeId.endsWith('-attributes')) {
    const classId = nodeId.replace('-attributes', '');
    const attributes = mockAttributes[classId] || [];
    return attributes.map(attr => ({
      id: attr.id,
      label: attr.name,
      type: 'attribute',
      description: attr.description,
      hasChildren: false,
      metadata: { ...attr.properties, ...attr.metadata },
    }));
  }

  // No children found
  return [];
}

// ============================================================================
// API Routes
// ============================================================================

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * GET /api/nodes
 * Returns the initial root nodes for the tree
 */
app.get('/api/nodes', async (_req, res) => {
  await delay(300);
  
  const nodes = getRootNodes();
  res.json({
    success: true,
    data: nodes,
  });
});

/**
 * GET /api/nodes/:nodeId/children
 * Returns the children of a specific node
 * The server determines what children a node has based on its ID
 */
app.get('/api/nodes/:nodeId/children', async (req, res) => {
  const { nodeId } = req.params;
  await delay(400);
  
  const children = getChildrenForNode(nodeId);
  res.json({
    success: true,
    data: children,
  });
});

// Serve static files from the client build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
