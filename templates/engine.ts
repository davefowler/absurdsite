import { Database } from 'bun:sqlite';

export class TemplateEngine {
    constructor(private db: Database) {}

    registerTemplate(name: string, content: string) {
        this.db.prepare('INSERT OR REPLACE INTO templates (name, content) VALUES (?, ?)')
            .run(name, content);
    }

    render(templateName: string, data: any) {
        const template = this.db.prepare('SELECT content FROM templates WHERE name = ?')
            .get(templateName);
            
        if (!template) {
            throw new Error(`Template ${templateName} not found`);
        }

        // Basic template rendering
        return template.content.replace(/\${([^}]+)}/g, (_, expr) => {
            try {
                return eval(`with(data) { ${expr} }`);
            } catch (err) {
                console.error(`Template rendering error:`, err);
                return '';
            }
        });
    }
}