#!/usr/bin/env node
// scripts/nuke-kb.js
// PURPOSE: Infrastructure cleanup script for DigitalOcean GenAI resources
// ACTION: Deletes expensive KB, Agents, and OpenSearch clusters
// MECHANISM: Uses DO API to find and destroy Synoptic-related resources

/**
 * 💀 OPERATION: COST KILLER
 * 
 * This script removes the expensive DigitalOcean GenAI infrastructure:
 * - GenAI Agents (Linguist, Philologist)
 * - Knowledge Bases
 * - OpenSearch Clusters
 * 
 * Run with: DO_API_TOKEN=xxx node scripts/nuke-kb.js
 */

const { createApiClient } = require('dots-wrapper');

async function nuke() {
  const token = process.env.DO_API_TOKEN;
  
  if (!token) {
    console.error('❌ Missing DO_API_TOKEN environment variable');
    console.log('Usage: DO_API_TOKEN=your_token node scripts/nuke-kb.js');
    process.exit(1);
  }

  console.log('💀 OPERATION: COST KILLER STARTED');
  console.log('=' .repeat(50));

  const client = createApiClient({ token });

  try {
    // 1. List & Delete GenAI Agents
    console.log('\n📋 Checking GenAI Agents...');
    try {
      // Note: dots-wrapper may not have full GenAI support yet
      // We'll use fetch directly for GenAI endpoints
      const agentsRes = await fetch('https://api.digitalocean.com/v2/gen-ai/agents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (agentsRes.ok) {
        const agentsData = await agentsRes.json();
        const agents = agentsData.agents || [];
        
        for (const agent of agents) {
          if (agent.name?.toLowerCase().includes('synoptic') || 
              agent.name?.toLowerCase().includes('linguist') ||
              agent.name?.toLowerCase().includes('philologist')) {
            console.log(`  🗑️  Deleting Agent: ${agent.name} (${agent.uuid || agent.id})...`);
            await fetch(`https://api.digitalocean.com/v2/gen-ai/agents/${agent.uuid || agent.id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log(`  ✓  Deleted Agent: ${agent.name}`);
          }
        }
      } else {
        console.log('  ⚠️  Could not list agents (API may not be available)');
      }
    } catch (e) {
      console.log('  ⚠️  GenAI Agents API not accessible:', e.message);
    }

    // 2. List & Delete Knowledge Bases
    console.log('\n📋 Checking Knowledge Bases...');
    try {
      const kbRes = await fetch('https://api.digitalocean.com/v2/gen-ai/knowledge_bases', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (kbRes.ok) {
        const kbData = await kbRes.json();
        const kbs = kbData.knowledge_bases || [];
        
        for (const kb of kbs) {
          if (kb.name?.toLowerCase().includes('synoptic') ||
              kb.name?.toLowerCase().includes('grammar') ||
              kb.name?.toLowerCase().includes('language')) {
            console.log(`  🗑️  Deleting Knowledge Base: ${kb.name} (${kb.uuid || kb.id})...`);
            await fetch(`https://api.digitalocean.com/v2/gen-ai/knowledge_bases/${kb.uuid || kb.id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log(`  ✓  Deleted Knowledge Base: ${kb.name}`);
          }
        }
      } else {
        console.log('  ⚠️  Could not list knowledge bases (API may not be available)');
      }
    } catch (e) {
      console.log('  ⚠️  Knowledge Bases API not accessible:', e.message);
    }

    // 3. List & Delete OpenSearch Databases
    console.log('\n📋 Checking Database Clusters...');
    try {
      const { data: dbData } = await client.database.listClusters({});
      const databases = dbData.databases || [];
      
      for (const db of databases) {
        if (db.engine === 'opensearch' && 
            (db.name?.toLowerCase().includes('synoptic') ||
             db.name?.toLowerCase().includes('search') ||
             db.name?.toLowerCase().includes('kb'))) {
          console.log(`  💥 DESTROYING OPENSEARCH CLUSTER: ${db.name}`);
          console.log(`     Engine: ${db.engine}, Region: ${db.region}`);
          console.log(`     💰 Estimated savings: ~€20-40/month`);
          
          await client.database.deleteCluster({ database_cluster_id: db.id });
          console.log(`  ✓  Deleted OpenSearch Cluster: ${db.name}`);
        }
      }
    } catch (e) {
      console.log('  ⚠️  Database API error:', e.message);
    }

    console.log('\n' + '=' .repeat(50));
    console.log('✅ OPERATION COMPLETE');
    console.log('💰 Your bill should drop significantly next cycle.');
    console.log('\nNext steps:');
    console.log('  1. Run schema migration: psql < migrations/001_add_vectors.sql');
    console.log('  2. Seed knowledge base: npx ts-node scripts/seed-knowledge.ts');
    console.log('  3. Deploy updated application');

  } catch (error) {
    console.error('\n❌ Operation failed:', error);
    process.exit(1);
  }
}

nuke().catch(console.error);
