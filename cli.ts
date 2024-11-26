#!/usr/bin/env bun
import { program } from 'commander';
import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'yaml';

async function createSiteStructure(siteName: string) {
    const siteDir = path.join(process.cwd(), siteName);
    const templateDir = path.join(import.meta.dir, 'examples', 'defaultsite');
    
    // Copy example site structure
    await fs.cp(templateDir, siteDir, { recursive: true });
    
    // Create subdirectories
    const dirs = [
        'pages',
        'pages/blog',
        'assets',
        'assets/templates',
        'assets/css',
        'assets/components',
        'assets/images',
        'dist'
    ];
    
    for (const dir of dirs) {
        await fs.mkdir(path.join(siteDir, dir), { recursive: true });
    }
    
    // Create site.yaml
    const siteConfig = {
        url: `${siteName}.com`,
        title: siteName,
        description: `${siteName} website`,
        author: 'Your Name',
        language: 'en'
    };
    
    await fs.writeFile(
        path.join(siteDir, 'site.yaml'),
        yaml.stringify(siteConfig)
    );
    
    // Create default pages
    const indexContent = `---
title: Welcome to ${siteName}
template: default
---
# Welcome to ${siteName}

This is your new website built with AbsurdSite.`;
    
    const aboutContent = `---
title: About
template: default
---
# About ${siteName}

Tell your visitors about your site.`;
    
    await fs.writeFile(path.join(siteDir, 'pages', 'index.md'), indexContent);
    await fs.writeFile(path.join(siteDir, 'pages', 'about.md'), aboutContent);
    
    // Create blog meta.yaml
    const blogMeta = {
        template: 'blog',
        listTemplate: 'blog-list'
    };
    
    await fs.writeFile(
        path.join(siteDir, 'pages', 'blog', 'meta.yaml'),
        yaml.stringify(blogMeta)
    );
    
    console.log(`Created new site: ${siteName}`);
    console.log(`\nNext steps:`);
    console.log(`  cd ${siteName}`);
    console.log(`  absurd serve   # Start development server`);
}

program
    .name('absurd')
    .description('CLI for creating and managing AbsurdSite static websites')
    .version('1.0.0');

program
    .command('new')
    .argument('<sitename>', 'Name of the new site')
    .description('Create a new static site')
    .action(createSiteStructure);

program
    .command('build')
    .description('Build the static site')
    .action(async () => {
        console.log('Building site...');
        
        // Create necessary directories
        const dirs = [
            'content',
            'content/blog',
            'scripts',
            'dist',
            'dist/styles',
            'templates',
            'public',
            'assets',
            'assets/components',
            'assets/templates'
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }

        // Initialize the database
        const db = new Database('dist/site.db');
        
        // Create required tables
        db.exec(`
            CREATE TABLE IF NOT EXISTS pages (
                slug TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                template TEXT NOT NULL,
                metadata TEXT
            );
            
            CREATE TABLE IF NOT EXISTS templates (
                name TEXT PRIMARY KEY,
                content TEXT NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS assets (
                path TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                type TEXT NOT NULL
            );
        `);
        
        // Process content directory
        await processDirectory('content');
        
        // Generate HTML files
        await renderPages(db, TemplateComponent);
        
        console.log('Content processed and static files generated');
    });

program
    .command('serve')
    .description('Start development server')
    .action(() => {
        console.log('Starting development server...');
        // Import and run the serve process
        import('./serve.ts').then(module => module.default());
    });

program.parse();
