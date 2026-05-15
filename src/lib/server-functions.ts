import { createServerFn } from "@tanstack/react-start";
import { DatabaseService } from "./services/db.service";

export const getLeads = createServerFn({ method: 'GET' })
  .handler(async ({ context }) => {
    try {
      console.log('getLeads handler started');
      
      // @ts-ignore
      const env = context?.cloudflare?.env || context?.env || (globalThis as any).env || process.env;
      // @ts-ignore
      const dbInstance = env.DB || (globalThis as any).DB || env.ggailabs_leadflow;
      
      if (!dbInstance) {
         console.error('DATABASE NOT FOUND IN HANDLER. Available env keys:', Object.keys(env || {}));
         return []; // Return empty instead of crashing
      }

      const db = new DatabaseService(dbInstance);
      return db.getContacts();
    } catch (error: any) {
      console.error('Error in getLeads server function:', error.message);
      return [];
    }
  });

export const getMessages = createServerFn({ method: 'GET' })
  .inputValidator((jid: string) => jid)
  .handler(async ({ data: jid, context }) => {
    try {
      // @ts-ignore
      const env = context?.cloudflare?.env || context?.env || (globalThis as any).env || process.env;
      // @ts-ignore
      const dbInstance = env.DB || (globalThis as any).DB || env.ggailabs_leadflow;
      
      if (!dbInstance) return [];
      
      const db = new DatabaseService(dbInstance);
      return db.getMessages(jid);
    } catch (error: any) {
      console.error('Error in getMessages:', error.message);
      return [];
    }
  });

export const getInstances = createServerFn({ method: 'GET' })
  .handler(async ({ context }) => {
    try {
      // @ts-ignore
      const env = context?.cloudflare?.env || context?.env || (globalThis as any).env || process.env;
      // @ts-ignore
      const dbInstance = env.DB || (globalThis as any).DB || env.ggailabs_leadflow;
      
      if (!dbInstance) return [];
      
      const db = new DatabaseService(dbInstance);
      return db.getInstances();
    } catch (error: any) {
      console.error('Error in getInstances:', error.message);
      return [];
    }
  });

export const getContact = createServerFn({ method: 'GET' })
  .inputValidator((jid: string) => jid)
  .handler(async ({ data: jid, context }) => {
    try {
      // @ts-ignore
      const env = context?.cloudflare?.env || context?.env || (globalThis as any).env || process.env;
      // @ts-ignore
      const dbInstance = env.DB || (globalThis as any).DB || env.ggailabs_leadflow;
      
      if (!dbInstance) return null;
      
      console.log(`[getContact] Searching for JID: ${jid}`);
      const db = new DatabaseService(dbInstance);
      const contact = await db.getContact(jid);
      console.log(`[getContact] Found contact:`, !!contact);
      return contact;
    } catch (error: any) {
      console.error('Error in getContact:', error.message);
      return null;
    }
  });

export const updateContact = createServerFn({ method: 'POST' })
  .inputValidator((data: { jid: string, updates: any }) => data)
  .handler(async ({ data, context }) => {
    try {
      // @ts-ignore
      const env = context?.cloudflare?.env || context?.env || (globalThis as any).env || process.env;
      // @ts-ignore
      const dbInstance = env.DB || (globalThis as any).DB || env.ggailabs_leadflow;
      
      if (!dbInstance) return { ok: false, error: 'no_db' };
      
      const db = new DatabaseService(dbInstance);
      return db.updateContact(data.jid, data.updates);
    } catch (error: any) {
      console.error('Error in updateContact:', error.message);
      return { ok: false, error: error.message };
    }
  });

export const getAnalyticsMetrics = createServerFn({ method: 'GET' })
  .handler(async ({ context }) => {
    try {
      // @ts-ignore
      const env = context?.cloudflare?.env || context?.env || (globalThis as any).env || process.env;
      // @ts-ignore
      const dbInstance = env.DB || (globalThis as any).DB || env.ggailabs_leadflow;
      
      if (!dbInstance) return {
        totalContacts: 0, newToday: 0, inNegotiation: 0,
        avgResponseMs: 0, conversionRate: 0, aiAutomations: 0,
        weeklyQualified: []
      };
      
      const db = new DatabaseService(dbInstance);
      return db.getAnalyticsMetrics();
    } catch (error: any) {
      console.error('Error in getAnalyticsMetrics:', error.message);
      return {
        totalContacts: 0, newToday: 0, inNegotiation: 0,
        avgResponseMs: 0, conversionRate: 0, aiAutomations: 0,
        weeklyQualified: []
      };
    }
  });

export const getPrompts = createServerFn({ method: 'GET' })
  .handler(async ({ context }) => {
    try {
      // @ts-ignore
      const env = context?.cloudflare?.env || context?.env || (globalThis as any).env || process.env;
      // @ts-ignore
      const dbInstance = env.DB || (globalThis as any).DB || env.ggailabs_leadflow;
      
      if (!dbInstance) return [];
      
      const db = new DatabaseService(dbInstance);
      return db.getPrompts();
    } catch (error: any) {
      console.error('Error in getPrompts:', error.message);
      return [];
    }
  });

export const savePrompt = createServerFn({ method: 'POST' })
  .inputValidator((data: { id?: string; name: string; content: string; category?: string }) => data)
  .handler(async ({ data, context }) => {
    try {
      // @ts-ignore
      const env = context?.cloudflare?.env || context?.env || (globalThis as any).env || process.env;
      // @ts-ignore
      const dbInstance = env.DB || (globalThis as any).DB || env.ggailabs_leadflow;
      
      if (!dbInstance) return { ok: false, error: 'no_db' };
      
      const db = new DatabaseService(dbInstance);
      return db.savePrompt(data);
    } catch (error: any) {
      console.error('Error in savePrompt:', error.message);
      return { ok: false, error: error.message };
    }
  });

export const updateLeadStatus = createServerFn({ method: 'POST' })
  .inputValidator((data: { jid: string; status: string }) => data)
  .handler(async ({ data, context }) => {
    try {
      // @ts-ignore
      const env = context?.cloudflare?.env || context?.env || (globalThis as any).env || process.env;
      // @ts-ignore
      const dbInstance = env.DB || (globalThis as any).DB || env.ggailabs_leadflow;
      
      if (!dbInstance) return { ok: false, error: 'no_db' };
      
      const db = new DatabaseService(dbInstance);
      return db.updateContactStatus(data.jid, data.status);
    } catch (error: any) {
      console.error('Error in updateLeadStatus:', error.message);
      return { ok: false, error: error.message };
    }
  });
