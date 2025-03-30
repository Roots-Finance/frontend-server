// lib/knot_client.ts


import { EventEmitter } from 'events';
import KnotapiJS from 'knotapi-js';

/**
 * Event types emitted by KnotApiClient
 */
export enum KnotApiEvent {
  SUCCESS = 'success',
  ERROR = 'error',
  EVENT = 'event',
  EXIT = 'exit'
}

/**
 * KnotAPI configuration interface based on their type definition
 */
export interface KnotApiConfig {
  sessionId?: string;
  primaryColor?: string;
  textColor?: string;
  companyName?: string;
  environment: 'production' | 'sandbox' | 'development';
  product: 'card_switcher' | 'transaction_link';
  card_id?: string;
  clientId: string;
  merchantIds?: number[];
  useCategories?: boolean;
  entryPoint?: string;
  logo?: string;
  useSelection?: boolean;
  useSearch?: boolean;
  useSingleFlow?: boolean;
  platform?: string;
  mode?: 'headless' | 'ui';
  slug?: string;
}

/**
 * KnotApiClient: A wrapper around the KnotAPI SDK with event emitter capabilities
 */
export class KnotApiClient extends EventEmitter {
  private knotApi: KnotapiJS;

  /**
   * Creates a new KnotApiClient instance and initializes the SDK
   */
  constructor() {
    super();
    this.knotApi = new KnotapiJS();
  }

  override emit<K>(eventName: string | symbol, ...args: any[]): boolean {
      console.log(`Event emitted: ${String(eventName)}, ...args: ${args}`);
      return super.emit(eventName, ...args);
  }

  /**
   * Opens the KnotAPI product (card_switcher or transaction_link)
   * @param config KnotAPI configuration options
   */
  open(config: KnotApiConfig): void {
    try {
      // Create a combined config with our event handlers
      const completeConfig = {
        ...config,
        
        // Success event handler
        onSuccess: (product: string, merchant: string) => {
          const data = { product, merchant };
          this.emit(KnotApiEvent.SUCCESS, data);
        },
        
        // Error event handler
        onError: (product: string, errorCode: string, message: string, payload: any) => {
          const error = { product, errorCode, message, payload };
          this.emit(KnotApiEvent.ERROR, error);
        },
        
        // Generic event handler
        onEvent: (product: string, event: string, merchant: string, payload?: Record<string, unknown>, taskId?: string) => {
          const eventData = { product, event, merchant, payload, taskId };
          this.emit(KnotApiEvent.EVENT, eventData);
          
          // Also emit the specific event type for convenience
          this.emit(event, eventData);
        },
        
        // Exit event handler
        onExit: (product: string) => {
          this.emit(KnotApiEvent.EXIT, { product });
        }
      };
      
      // Call the KnotAPI open method
      this.knotApi.open(completeConfig);
      
    } catch (error) {
      // Emit error event if something goes wrong
      this.emit(KnotApiEvent.ERROR, {
        product: config.product,
        errorCode: 'CLIENT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to open KnotAPI product',
        payload: error
      });
      
      // Also throw the error for immediate handling
      throw error;
    }
  }
}
