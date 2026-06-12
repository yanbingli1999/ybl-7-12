export type VariableType = 'cost' | 'duration' | 'revenue' | 'custom';

export type TemplateCategory = 'engineering' | 'software' | 'finance' | 'manufacturing' | 'marketing' | 'other';

export interface Variable {
  id: string;
  projectId: string;
  name: string;
  type: VariableType;
  min: number;
  max: number;
  mostLikely: number;
  weight: number;
  unit: string;
  createdAt: string;
}

export interface TemplateVariable {
  name: string;
  type: VariableType;
  min: number;
  max: number;
  mostLikely: number;
  weight: number;
  unit: string;
}

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  variables: TemplateVariable[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectWithVariables extends Project {
  variables: Variable[];
}

export interface Percentiles {
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
}

export interface HistogramBin {
  start: number;
  end: number;
  count: number;
}

export interface Histogram {
  bins: HistogramBin[];
}

export interface SensitivityItem {
  variableId: string;
  variableName: string;
  correlation: number;
  contribution: number;
}

export interface SimulationResult {
  id: string;
  projectId: string;
  runName: string;
  iterations: number;
  timestamp: string;
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  percentiles: Percentiles;
  lossProbability: number;
  var95: number;
  threshold: number;
  histogram: Histogram;
  sensitivity: SensitivityItem[];
  samples?: number[];
  variableSamples?: Record<string, number[]>;
}

export interface CompareRecord {
  id: string;
  projectId: string;
  name: string;
  simulationIds: string[];
  createdAt: string;
}

export interface CreateProjectDto {
  name: string;
  description: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
}

export interface CreateVariableDto {
  name: string;
  type: VariableType;
  min: number;
  max: number;
  mostLikely: number;
  weight: number;
  unit: string;
}

export interface UpdateVariableDto {
  name?: string;
  type?: VariableType;
  min?: number;
  max?: number;
  mostLikely?: number;
  weight?: number;
  unit?: string;
}

export interface RunSimulationDto {
  iterations: number;
  threshold: number;
  runName?: string;
}

export interface CreateCompareDto {
  name: string;
  simulationIds: string[];
}

export interface CreateTemplateDto {
  name: string;
  category: TemplateCategory;
  description: string;
  variables: TemplateVariable[];
}

export interface UpdateTemplateDto {
  name?: string;
  category?: TemplateCategory;
  description?: string;
  variables?: TemplateVariable[];
}

export interface CreateProjectFromTemplateDto {
  name: string;
  description: string;
  templateId: string;
}
