import mqtt from 'mqtt';
import type { MqttClient, IClientOptions } from 'mqtt';

export const useMqtt = () => {
  const config = useRuntimeConfig();
  const client = ref<MqttClient | null>(null);
  const isConnected = ref(false);
  const error = ref<string | null>(null);
  const mqttTopicAccessLog = 'aj/barrier-gate/access-log'

  const connect = (options: Partial<IClientOptions> = {}) => {
    if (client.value?.connected) return;

    const brokerUrl = config.public.mqttUrl as string;
    const defaultOptions: IClientOptions = {
      username: config.public.mqttUsername as string,
      password: config.public.mqttPassword as string,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
      ...options,
    };

    try {
      client.value = mqtt.connect(brokerUrl, defaultOptions);

      client.value.on('connect', () => {
        isConnected.value = true;
        error.value = null;
        console.log('MQTT Connected to:', brokerUrl);
      });

      client.value.on('error', (err) => {
        isConnected.value = false;
        error.value = err.message;
        console.error('MQTT Error:', err);
      });

      client.value.on('close', () => {
        isConnected.value = false;
        console.log('MQTT Connection closed');
      });

      client.value.on('reconnect', () => {
          console.log('MQTT Reconnecting...');
      });

    } catch (e: any) {
      error.value = e.message;
      console.error('MQTT Connection Failure:', e);
    }
  };

  const subscribe = (topic: string, callback: (topic: string, message: any) => void) => {
    if (!client.value) {
      console.warn('MQTT client not initialized. Call connect() first.');
      return;
    }

    client.value.subscribe(topic, (err) => {
      if (err) {
        console.error(`MQTT Subscription error for topic ${topic}:`, err);
      } else {
        console.log(`MQTT Subscribed to ${topic}`);
      }
    });

    const messageHandler = (t: string, m: Buffer) => {
      if (t === topic) {
        try {
          const payload = JSON.parse(m.toString());
          callback(t, payload);
        } catch (e) {
          // If not JSON, return as string
          callback(t, m.toString());
        }
      }
    };

    client.value.on('message', messageHandler);

    return () => {
      if (client.value) {
        client.value.unsubscribe(topic);
        client.value.off('message', messageHandler);
      }
    };
  };

  const publish = (topic: string, message: string | object, options: mqtt.IClientPublishOptions = {}) => {
    if (!client.value) {
      console.warn('MQTT client not initialized. Call connect() first.');
      return;
    }

    const payload = typeof message === 'object' ? JSON.stringify(message) : message;
    client.value.publish(topic, payload, options, (err) => {
      if (err) {
        console.error(`MQTT Publish error for topic ${topic}:`, err);
      } else {
        console.log(`MQTT Published to ${topic}:`, payload);
      }
    });
  };

  const disconnect = () => {
    if (client.value) {
      client.value.end();
      client.value = null;
      isConnected.value = false;
    }
  };

  // Auto-cleanup on component unmount
  onUnmounted(() => {
    // We don't necessarily want to disconnect globally if it's shared, 
    // but for local use in a page, it's good practice.
    // However, the user asked for a "service" which might imply global state.
    // For now, let's keep it flexible.
  });

  return {
    connect,
    subscribe,
    publish,
    disconnect,
    isConnected,
    error,
    mqttTopicAccessLog: mqttTopicAccessLog,
  };
};
