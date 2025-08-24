import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

const router = express.Router();

// GET /api/agents - List all available agents from ~/.claude/agents directory
router.get('/', async (req, res) => {
  try {
    const agentsDir = path.join(os.homedir(), '.claude', 'agents');
    
    // Check if agents directory exists
    try {
      await fs.access(agentsDir);
    } catch (error) {
      return res.json({ agents: [] });
    }

    const agents = [];
    const entries = await fs.readdir(agentsDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const categoryPath = path.join(agentsDir, entry.name);
        const categoryFiles = await fs.readdir(categoryPath);
        
        for (const file of categoryFiles) {
          if (file.endsWith('.md')) {
            const agentPath = path.join(categoryPath, file);
            const content = await fs.readFile(agentPath, 'utf8');
            
            // Parse frontmatter
            const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
            let metadata = {};
            
            if (frontmatterMatch) {
              const frontmatter = frontmatterMatch[1];
              const lines = frontmatter.split('\n');
              
              for (const line of lines) {
                const colonIndex = line.indexOf(':');
                if (colonIndex > 0) {
                  const key = line.substring(0, colonIndex).trim();
                  const value = line.substring(colonIndex + 1).trim();
                  metadata[key] = value;
                }
              }
            }
            
            agents.push({
              id: file.replace('.md', ''),
              name: metadata.name || file.replace('.md', ''),
              description: metadata.description || '',
              category: entry.name,
              color: metadata.color || 'gray',
              tools: metadata.tools ? metadata.tools.split(', ').map(t => t.trim()) : [],
              path: agentPath
            });
          }
        }
      }
    }
    
    // Sort agents by category then by name
    agents.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });
    
    res.json({ agents });
  } catch (error) {
    console.error('Error listing agents:', error);
    res.status(500).json({ error: 'Failed to list agents', details: error.message });
  }
});

export default router;