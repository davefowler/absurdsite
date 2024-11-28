import { expect, test, beforeEach, afterEach, mock, describe } from "bun:test";
import { mkdtemp, rm, readFile, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import createSite from '../src/cli/new';
import buildSite from '../src/cli/build';
import startServer from '../src/cli/serve';

describe('CLI Commands', () => {
    let tempDir: string;

    beforeEach(async () => {
        tempDir = await mkdtemp(join(tmpdir(), 'baked-test-'));
    });

    afterEach(async () => {
        await rm(tempDir, { recursive: true, force: true });
    });

    describe('new/starter command', () => {
        test('creates correct directory structure', async () => {
            await createSite(tempDir);
            
            // Check core directories exist
            const dirs = ['pages', 'assets', 'assets/templates', 'assets/css'];
            for (const dir of dirs) {
                const exists = await exists(join(tempDir, dir));
                expect(exists).toBe(true);
            }
        });

        test('sets site configuration from prompts', async () => {
            // Mock prompt responses
            global.prompt = mock((message: string) => {
                switch(message) {
                    case 'Site name:': return 'Test Site';
                    case 'Site URL:': return 'test.com';
                    default: return '';
                }
            });

            await createSite(tempDir);
            
            const siteYaml = await readFile(join(tempDir, 'site.yaml'), 'utf8');
            expect(siteYaml).toContain('name: Test Site');
            expect(siteYaml).toContain('url: test.com');
        });
    });

    describe('build/oven command', () => {
        beforeEach(async () => {
            // Setup test site
            await createSite(tempDir);
            await writeFile(join(tempDir, 'pages/test.md'), 
                '---\ntitle: Test\n---\nTest content');
        });

        test('builds site with default options', async () => {
            await buildSite(false); // no drafts
            
            const distDb = join(tempDir, 'dist/site.db');
            expect(await exists(distDb)).toBe(true);
            
            const db = new Database(distDb);
            const page = db.prepare('SELECT * FROM pages WHERE slug = ?')
                          .get('test');
            expect(page).toBeDefined();
            expect(page.title).toBe('Test');
        });

        test('handles draft pages correctly', async () => {
            await writeFile(join(tempDir, 'pages/draft.md'),
                '---\ntitle: Draft\nisDraft: true\n---\nDraft content');
            
            // Build without drafts
            await buildSite(false);
            let db = new Database(join(tempDir, 'dist/site.db'));
            let draft = db.prepare('SELECT * FROM pages WHERE slug = ?')
                         .get('draft');
            expect(draft).toBeUndefined();
            
            // Build with drafts
            await buildSite(true);
            db = new Database(join(tempDir, 'dist/site.db'));
            draft = db.prepare('SELECT * FROM pages WHERE slug = ?')
                     .get('draft');
            expect(draft).toBeDefined();
        });
    });

    describe('serve command', () => {
        let server;
        
        afterEach(() => {
            if (server) server.stop();
        });

        test('serves static files correctly', async () => {
            server = await startServer();
            
            const res = await fetch('http://localhost:4242/');
            expect(res.status).toBe(200);
            
            const notFound = await fetch('http://localhost:4242/notfound');
            expect(notFound.status).toBe(404);
        });
    });
});

// Helper functions
async function exists(path: string): Promise<boolean> {
    try {
        await stat(path);
        return true;
    } catch {
        return false;
    }
}
