import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Config file path
const configPath = path.join(__dirname, '../config/graph-config.json');

// Types
interface GraphNode {
  id: string;
  name: string;
  type: 'dataspace' | 'class' | 'businessConcept' | 'classDetails' | 'dataset' | 'attribute';
  description: string;
  properties: Record<string, string | number | boolean>;
  metadata: {
    createdAt: string;
    updatedAt: string;
    owner: string;
    tags: string[];
  };
}

interface Dataset {
  id: string;
  name: string;
  type: 'dataset';
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

interface Attribute {
  id: string;
  name: string;
  type: 'attribute';
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
const mockDataspaces: GraphNode[] = [
  {
    id: 'ds-001',
    name: 'Customer Data Hub',
    type: 'dataspace',
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
    type: 'dataspace',
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
    type: 'dataspace',
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
    type: 'dataspace',
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

const mockClasses: GraphNode[] = [
  {
    id: 'cls-001',
    name: 'Customer',
    type: 'class',
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
    type: 'class',
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
    type: 'class',
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
    type: 'class',
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
    type: 'class',
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

const mockBusinessConcepts: GraphNode[] = [
  {
    id: 'bc-001',
    name: 'Customer Lifetime Value',
    type: 'businessConcept',
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
    type: 'businessConcept',
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
    type: 'businessConcept',
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
    type: 'businessConcept',
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
    type: 'businessConcept',
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
    type: 'businessConcept',
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
const mockDatasets: Record<string, Dataset[]> = {
  'cls-001': [ // Customer class datasets
    {
      id: 'ds-cust-001',
      name: 'Customer Profiles',
      type: 'dataset',
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
      type: 'dataset',
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
  'cls-002': [ // Order class datasets
    {
      id: 'ds-ord-001',
      name: 'Orders Master',
      type: 'dataset',
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
      type: 'dataset',
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
  'cls-003': [ // Product class datasets
    {
      id: 'ds-prod-001',
      name: 'Product Catalog',
      type: 'dataset',
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
  'cls-004': [ // Payment class datasets
    {
      id: 'ds-pay-001',
      name: 'Payment Transactions',
      type: 'dataset',
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
  'cls-005': [ // Address class datasets
    {
      id: 'ds-addr-001',
      name: 'Address Registry',
      type: 'dataset',
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
const mockAttributes: Record<string, Attribute[]> = {
  'cls-001': [ // Customer class attributes
    {
      id: 'attr-cust-001',
      name: 'customer_id',
      type: 'attribute',
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
      type: 'attribute',
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
      type: 'attribute',
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
      type: 'attribute',
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
  'cls-002': [ // Order class attributes
    {
      id: 'attr-ord-001',
      name: 'order_id',
      type: 'attribute',
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
      type: 'attribute',
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
      type: 'attribute',
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
      type: 'attribute',
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
  'cls-003': [ // Product class attributes
    {
      id: 'attr-prod-001',
      name: 'product_id',
      type: 'attribute',
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
      type: 'attribute',
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
      type: 'attribute',
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
  'cls-004': [ // Payment class attributes
    {
      id: 'attr-pay-001',
      name: 'payment_id',
      type: 'attribute',
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
      type: 'attribute',
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
      type: 'attribute',
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
  'cls-005': [ // Address class attributes
    {
      id: 'attr-addr-001',
      name: 'address_id',
      type: 'attribute',
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
      type: 'attribute',
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
      type: 'attribute',
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

// API routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve graph config - reads from file on each request for hot reload
app.get('/api/config', (_req, res) => {
  try {
    const configData = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configData);
    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Error reading config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load configuration',
    });
  }
});

app.get('/api/dataspaces', async (_req, res) => {
  await delay(600);
  res.json({
    success: true,
    data: mockDataspaces,
  });
});

app.get('/api/classes', async (_req, res) => {
  await delay(500);
  res.json({
    success: true,
    data: mockClasses,
  });
});

app.get('/api/businessConcepts', async (_req, res) => {
  await delay(700);
  res.json({
    success: true,
    data: mockBusinessConcepts,
  });
});

// Get datasets for a specific class
app.get('/api/classes/:classId/datasets', async (req, res) => {
  const { classId } = req.params;
  await delay(400);
  
  const datasets = mockDatasets[classId] || [];
  res.json({
    success: true,
    data: datasets,
  });
});

// Get attributes for a specific class
app.get('/api/classes/:classId/attributes', async (req, res) => {
  const { classId } = req.params;
  await delay(400);
  
  const attributes = mockAttributes[classId] || [];
  res.json({
    success: true,
    data: attributes,
  });
});

// Generic endpoint for fetching by type
app.get('/api/:type', async (req, res) => {
  const { type } = req.params;
  await delay(500);
  
  switch (type.toLowerCase()) {
    case 'dataspaces':
      res.json({ success: true, data: mockDataspaces });
      break;
    case 'classes':
      res.json({ success: true, data: mockClasses });
      break;
    case 'businessconcepts':
      res.json({ success: true, data: mockBusinessConcepts });
      break;
    default:
      res.status(404).json({ success: false, message: `Unknown type: ${type}` });
  }
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
