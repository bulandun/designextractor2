import { IngestedSource, InputType } from '../pipeline/types';

export interface IngestRequest {
  inputType: InputType;
  inputPathOrUrl: string;
  referenceDocxPath?: string;
}

export interface Ingestor {
  supports(type: InputType): boolean;
  run(request: IngestRequest): Promise<IngestedSource>;
}
