import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import * as opentelemetry from '@opentelemetry/sdk-node';

import { ServerConfig } from '../../../config/server.config';

class TracerInitialization {
  sdk: opentelemetry.NodeSDK | null = null;

  init() {
    if (!ServerConfig.ENABLE_TRACING || !ServerConfig.COMMERCIAL_KEY) {
      return;
    }

    this.#verifyRequiredEnvVars();

    const serviceName = this.#getServiceName();

    const traceExporter = new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    });

    this.sdk = new opentelemetry.NodeSDK({
      traceExporter,
      instrumentations: [getNodeAutoInstrumentations()],
      resource: new Resource({
        'service.name': serviceName,
      }),
    });

    console.info('Tracing initialized');

    return this;
  }

  start() {
    if (!ServerConfig.ENABLE_TRACING || !ServerConfig.COMMERCIAL_KEY) {
      return;
    }

    if (!this.sdk) {
      throw new Error('Tracer must be initialized before starting');
    }

    console.info('Tracing started');

    return this.sdk.start();
  }

  shutdown() {
    if (this.sdk) {
      this.sdk
        .shutdown()
        .then(() => console.info('Tracing terminated'))
        .catch((error) => console.error('Error terminating tracing', error));
    }
  }

  #verifyRequiredEnvVars() {
    if (!process.env.OTEL_EXPORTER_OTLP_HEADERS) {
      throw new Error(
        'OTEL_EXPORTER_OTLP_HEADERS environment variable is required to enable tracing.',
      );
    } else if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
      throw new Error(
        'OTEL_EXPORTER_OTLP_ENDPOINT environment variable is required to enable tracing.',
      );
    }
  }

  #getServiceName() {
    let serviceName = process.env.OTEL_SERVICE_NAME;

    if (!serviceName) {
      serviceName =
        process.env.ENVIRONMENT === 'production'
          ? `${ServerConfig.PLATFORM_NAME} Production Server`
          : `${ServerConfig.PLATFORM_NAME} Development Server`;
    }

    return serviceName;
  }
}

export const tracerInitialization = new TracerInitialization();
